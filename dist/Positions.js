"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Positions = void 0;
class Positions {
    constructor(app) {
        this.positions = [];
        this.app = app;
    }
    length() {
        return (this.positions.length);
    }
    append(position) {
        if ((this.positions.length == 0) || !((this.positions[this.positions.length - 1].latitude == position.latitude) && (this.positions[this.positions.length - 1].longitude == position.longitude))) {
            this.app.debug(`Positions: append: saving new position [ ${position.longitude}, ${position.latitude} ]`);
            this.positions.push(position);
        }
        else {
            this.app.debug(`Positions: append: discarding duplicate position`);
        }
    }
}
exports.Positions = Positions;
