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
        this.app = null;
        this.timestamp = 0;
        this.resourceName = null;
        this.positions = null;
        if (!options[0].hasOwnProperty('port'))
            throw new Error('missing \'port\' property');
        this.app = app;
        this.port = options[0].port;
        this.resetInterval = getOption(options, 'resetInterval');
        this.positionAccuracy = getOption(options, 'positionAccuracy');
        this.putUrl = getOption(options, 'putUrl');
        this.udpSocket = (0, dgram_1.createSocket)('udp4');
        this.udpSocket.on('message', (msg, rinfo) => {
            this.app.debug(`Listener: position report received on port ${this.port}`);
            if ((this.timestamp != 0) && ((this.timestamp + (this.resetInterval * 60000)) < Date.now())) {
                this.app.debug(`Listener: saving current track "${this.resourceName}"`);
                this.saveResource();
                this.timestamp = 0;
            }
            if (this.timestamp == 0) {
                this.resourceName = (new Date()).toISOString();
                this.app.debug(`Listener: starting new track "${this.resourceName}"`);
                this.positions = new Positions_1.Positions(this.app);
            }
            this.timestamp = Date.now();
            var ais = new ggencoder_1.AisDecode('' + msg);
            if (this.positions)
                this.positions.add(new Position_1.Position(ais.lat || 0, ais.lon || 0));
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
        this.app.debug(`Listener complete`);
    }
    startListening() {
        this.udpSocket.bind(this.port);
    }
    stopListening() {
        this.udpSocket.close();
        this.saveResource();
    }
    async saveResource() {
        console.log(`saving resource: ${(this.positions) ? this.positions.length() : 0} to ${this.resourceName}`);
        if ((this.positions) && (this.positions.length() > 1)) {
            var json = {
                name: this.resourceName,
                feature: {
                    type: "Feature",
                    geometry: {
                        type: "LineString",
                        coordinates: [this.positions.positions.map((p) => { return ([p.longitude, p.latitude]); })]
                    }
                }
            };
            try {
                var res = await (0, axios_1.default)(this.putUrl, json);
                this.app.debug(`Listener: PUT response = ${res.status}`);
            }
            catch (e) {
                this.app.debug(`Listener: PUT failed`);
            }
        }
    }
}
exports.Listener = Listener;
