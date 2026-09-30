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
    add(position) {
        if ((this.positions.length == 0) || !((this.positions[this.positions.length - 1].latitude == position.latitude) && (this.positions[this.positions.length - 1].longitude == position.longitude))) {
            this.app.debug(`Positions: pushing new location: ${JSON.stringify(position)}`);
            this.positions.push(position);
        }
    }
}
exports.Positions = Positions;
