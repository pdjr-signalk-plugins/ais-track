"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
const dgram_1 = require("dgram");
const ggencoder_1 = require("ggencoder");
const Positions_1 = require("./Positions");
const Position_1 = require("./Position");
class Listener {
    constructor(option, options, defaults) {
        this.port = 0;
        this.resetInterval = 0;
        this.positionAccuracy = 4;
        this.timestamp = 0;
        this.resourceName = null;
        if (!option.port)
            throw new Error('missing \'port\' property');
        this.port = option.port;
        this.positionAccuracy = getOption([option, options], 'positionAccuracy', defaults.POSITION_ACCURACY);
        this.resetInterval = getOption([option, options], 'resetInterval', defaults.RESET_INTERVAL);
        this.positions = new Positions_1.Positions();
        this.udpSocket = (0, dgram_1.createSocket)('udp4');
        this.udpSocket.on('message', (msg, rinfo) => {
            if ((this.timestamp != 0) && ((this.timestamp + (this.resetInterval * 1000)) < Date.now())) {
                this.saveResource();
                this.timestamp = 0;
            }
            if (this.timestamp == 0) {
                this.resourceName = (new Date()).toISOString();
            }
            this.timestamp = Date.now();
            var ais = new ggencoder_1.AisDecode('' + msg);
            this.positions.add(new Position_1.Position(ais.lat || 0, ais.lon || 0));
        });
        /**
         *
         * @param objects - an array of arbitrary objects which may contain 'name'
         * @param name - the identifier of a property that may be contained in 'objects'
         * @param fallback - the value to be returned if 'name' is not found in any object.
         * @returns
         */
        function getOption(objects, name, fallback) {
            if (objects.length == 0) {
                return (fallback);
            }
            else {
                if (objects[0][name] !== undefined) {
                    return (objects[0][name]);
                }
                else {
                    return (getOption(objects.slice(1), name, fallback));
                }
            }
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
    }
}
exports.Listener = Listener;
