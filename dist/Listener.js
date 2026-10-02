"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const dgram_1 = require("dgram");
const ggencoder_1 = require("ggencoder");
const Positions_1 = require("./Positions");
const Position_1 = require("./Position");
const axios_1 = require("axios");
class Listener {
    constructor(options, app) {
        this._timestamp = 0;
        this._positions = undefined;
        this._resourceId = '';
        if (!options[0].hasOwnProperty('port'))
            throw new Error('missing \'port\' property');
        if (!options[0].hasOwnProperty('postUrl'))
            throw new Error('missing \'postUrl\' property');
        this._app = app;
        this._name = (options[0].hasOwnProperty('name')) ? options[0].name : options[0].port;
        this._port = options[0].port;
        this._postUrl = getOption(options, 'postUrl');
        this._accessToken = getOption(options, 'accessToken');
        this._positionAccuracy = getOption(options, 'positionAccuracy');
        this._resetInterval = getOption(options, 'resetInterval');
        this._resetRepeat = getOption(options, 'resetRepeat');
        this._udpSocket = (0, dgram_1.createSocket)('udp4');
        this._udpSocket.on('message', (msg, rinfo) => {
            this._app.debug(`Listener: position report received on port ${this._port}`);
            if (this._timestamp != 0) {
                if (((this._timestamp + (this._resetInterval * 60000)) < Date.now()) || (this._resetRepeat && this._positions && (this._positions.consecutiveRepeats() > this._resetRepeat))) {
                    this.closeResource();
                    this._timestamp = 0;
                }
            }
            if (this._timestamp == 0) {
                this.openResource((new Date()).toISOString());
            }
            this._timestamp = Date.now();
            var ais = new ggencoder_1.AisDecode('' + msg);
            if (this._positions)
                this._positions.append(new Position_1.Position(ais.lat || 0, ais.lon || 0, this._positionAccuracy));
        });
        /**
         *
         * @param objects - an array of arbitrary objects which may contain 'name'
         * @param name - the identifier of a property that may be contained in 'objects'
         * @param fallback - the value to be returned if 'name' is not found in any object.
         * @returns
         */
        function getOption(options, name) {
            var retval = undefined;
            options.reverse().forEach((opt) => {
                if (opt.hasOwnProperty(name))
                    retval = opt[name];
            });
            return (retval);
        }
    }
    getName() { return (this._name); }
    getPort() { return (this._port); }
    startListening() {
        this._app.debug(`Listener: startListening: listening on port ${this._port}`);
        this._udpSocket.bind(this._port);
    }
    stopListening() {
        this._app.debug(`Listener: stopListening:`);
        this._udpSocket.close();
        this.closeResource();
    }
    openResource(id) {
        this._app.debug(`Listener: openResource: starting new track`);
        this._resourceId = id;
        this._positions = new Positions_1.Positions(this._app);
    }
    async closeResource() {
        this._app.debug(`Listener: closeResource: saving resource with ${(this._positions) ? this._positions.length() : 0}`);
        if ((this._positions) && (this._positions.length() > 1)) {
            const formData = new FormData();
            const jsonData = { name: this._name, feature: { type: "Feature", geometry: { type: "LineString", coordinates: [this._positions.positions().map((p) => { return ([p.longitude, p.latitude]); })] } } };
            const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
            formData.append('file', blob, 'data.json');
            try {
                const response = await axios_1.default.post(this._postUrl, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                this._app.debug(`Listener: closeResource: response: ${response.data}`);
            }
            catch (error) {
                this._app.debug(`Listener: closeResource: error: ${error.response?.data || error.message}`);
            }
        }
        else {
            this._app.debug(`Listener: closeResource: refusing to save an empty track`);
        }
    }
}
exports.Listener = Listener;
