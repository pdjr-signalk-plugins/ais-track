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
    append(position) {
        if ((this._positions.length == 0) || !((this._positions[this._positions.length - 1].latitude == position.latitude) && (this._positions[this._positions.length - 1].longitude == position.longitude))) {
            if (this._app)
                this._app.debug(`Positions: saving position #${this.length() + 1} [ ${position.longitude}, ${position.latitude} ]`);
            this._positions.push(position);
            this._consecutiveRepeats = 0;
        }
        else {
            if (this._app)
                this._app.debug(`Positions: discarding duplicate position`);
            this._consecutiveRepeats++;
        }
    }
}
exports.Track = Track;
