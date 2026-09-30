"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const dgram_1 = require("dgram");
const ggencoder_1 = require("ggencoder");
const Positions_1 = require("./Positions");
const Position_1 = require("./Position");
class Listener {
    constructor(options) {
        this.timestamp = 0;
        this.resourceName = null;
        this.positions = null;
        if (!options[0].port)
            throw new Error('missing \'port\' property');
        this.port = options[0].port;
        this.resetInterval = getOption(options, 'resetInterval');
        this.positionAccuracy = getOption(options, 'positionAccuracy');
        this.udpSocket = (0, dgram_1.createSocket)('udp4');
        this.udpSocket.on('message', (msg, rinfo) => {
            if ((this.timestamp != 0) && ((this.timestamp + (this.resetInterval * 1000)) < Date.now())) {
                this.saveResource();
                this.timestamp = 0;
            }
            if (this.timestamp == 0) {
                this.resourceName = (new Date()).toISOString();
                this.positions = new Positions_1.Positions();
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
    }
    startListening() {
        this.udpSocket.bind(this.port);
    }
    stopListening() {
        this.udpSocket.close();
        this.saveResource();
    }
    saveResource() {
        console.log(`saving resource: ${(this.positions) ? this.positions.length() : 0} to ${this.resourceName}`);
    }
}
exports.Listener = Listener;
