"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Positions = void 0;
class Positions {
    constructor(app) {
        this._app = undefined;
        this._positions = [];
        this._consecutiveRepeats = 0;
        this._app = (app || undefined);
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
                this._app.debug(`Positions: append: saving new position [ ${position.longitude}, ${position.latitude} ]`);
            this._positions.push(position);
            this._consecutiveRepeats = 0;
        }
        else {
            if (this._app)
                this._app.debug(`Positions: append: discarding duplicate position`);
            this._consecutiveRepeats++;
        }
    }
}
exports.Positions = Positions;
