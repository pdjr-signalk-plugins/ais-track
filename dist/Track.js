"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Track = void 0;
class Track {
    constructor(timestamp, app) {
        this._timestamp = 0;
        this._app = undefined;
        this._positions = [];
        this._consecutiveRepeats = 0;
        this._timestamp = timestamp;
        this._app = (app || undefined);
    }
    timestamp() {
        return (this._timestamp);
    }
    positions() {
        return (this._positions);
    }
    length() {
        return (this._positions.length);
    }
    consecutiveRepeats() {
        return (this._consecutiveRepeats);
    }
    append(position, obj) {
        if ((this._positions.length == 0) || !((this._positions[this._positions.length - 1].latitude == position.latitude) && (this._positions[this._positions.length - 1].longitude == position.longitude))) {
            this._positions.push(position);
            this._consecutiveRepeats = 0;
            if (obj)
                obj.msg = `saving position #${this.length()} [ ${position.longitude}, ${position.latitude} ]`;
            return (true);
        }
        else {
            this._consecutiveRepeats++;
            if (obj)
                obj.msg = `discarding duplicate position`;
            return (false);
        }
    }
}
exports.Track = Track;
