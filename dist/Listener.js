"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Listener = void 0;
class Listener {
    constructor(option, options, defaults) {
        this.port = 0;
        this.resourceName = '';
        this.positionAccuracy = 4;
        this.positionCount = 0;
        if (!option.port)
            throw new Error('missing \'port\' property');
        this.port = option.port;
        this.positionAccuracy = getOption([option, options], 'positionAccuracy', defaults.POSITION_ACCURACY);
        this.udpSocket = null;
        this.resourceName = '';
        this.positionCount = 0;
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
        function getOptionArray(objects, name, fallback) {
            if (objects.length == 0) {
                return (fallback);
            }
            else {
                if (objects[0][name] !== undefined) {
                    return ((Array.isArray(objects[0][name])) ? objects[0][name] : [objects[0][name]]);
                }
                else {
                    return (getOptionArray(objects.slice(1), name, fallback));
                }
            }
        }
    }
    bump() {
        this.positionCount++;
    }
}
exports.Listener = Listener;
