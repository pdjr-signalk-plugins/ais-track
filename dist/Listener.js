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
        this.accessToken = undefined;
        this.app = undefined;
        this.resetRepeat = undefined;
        this.timestamp = 0;
        this.resourceName = null;
        this.positions = null;
        if (!options[0].hasOwnProperty('port'))
            throw new Error('missing \'port\' property');
        console.log(`>>> ${JSON.stringify(options, null, 2)}`);
        this.accessToken = getOption(options, 'accessToken');
        this.app = (app || undefined);
        this.name = (options[0].hasOwnProperty('name')) ? options[0].name : options[0].port;
        this.port = options[0].port;
        this.positionAccuracy = getOption(options, 'positionAccuracy');
        this.postUrl = getOption(options, 'postUrl');
        this.resetInterval = getOption(options, 'resetInterval');
        this.resetRepeat = getOption(options, 'resetRepeat');
        this.udpSocket = (0, dgram_1.createSocket)('udp4');
        this.udpSocket.on('message', (msg, rinfo) => {
            this.app.debug(`Listener: position report received on port ${this.port}`);
            if (this.timestamp != 0) {
                if (((this.timestamp + (this.resetInterval * 60000)) < Date.now()) || (this.resetRepeat && this.positions && (this.positions.consecutiveRepeats() > this.resetRepeat))) {
                    this.closeResource();
                    this.timestamp = 0;
                }
            }
            if (this.timestamp == 0) {
                this.openResource((new Date()).toISOString());
            }
            this.timestamp = Date.now();
            var ais = new ggencoder_1.AisDecode('' + msg);
            if (this.positions)
                this.positions.append(new Position_1.Position(ais.lat || 0, ais.lon || 0, this.positionAccuracy));
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
    startListening() {
        this.app.debug(`Listener: startListening: listening on port ${this.port}`);
        this.udpSocket.bind(this.port);
    }
    stopListening() {
        this.app.debug(`Listener: stopListening:`);
        this.udpSocket.close();
        this.closeResource();
    }
    openResource(name) {
        this.app.debug(`Listener: openResource: starting new track "${name}"`);
        this.resourceName = name;
        this.positions = new Positions_1.Positions(this.app);
    }
    async closeResource() {
        this.app.debug(`Listener: closeResource: saving resource: ${(this.positions) ? this.positions.length() : 0} to ${this.resourceName}`);
        if ((this.positions) && (this.positions.length() > 1)) {
            const formData = new FormData();
            const jsonData = { name: this.resourceName, feature: { type: "Feature", geometry: { type: "LineString", coordinates: [this.positions.positions().map((p) => { return ([p.longitude, p.latitude]); })] } } };
            const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
            formData.append('file', blob, 'data.json');
            try {
                const response = await axios_1.default.post(this.postUrl, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });
                this.app.debug(`Listener: closeResource: response: ${response.data}`);
            }
            catch (error) {
                this.app.debug(`Listener: closeResource: error: ${error.response?.data || error.message}`);
            }
        }
        else {
            this.app.debug(`Listener: closeResource: refusing to save an empty track`);
        }
    }
}
exports.Listener = Listener;
