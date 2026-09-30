"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Positions = void 0;
class Positions {
    constructor() {
        this.positions = [];
    }
    length() {
        return (this.positions.length);
    }
    add(position) {
        if ((this.positions.length == 0) || !((this.positions[this.positions.length - 1].latitude == position.latitude) && (this.positions[this.positions.length - 1].longitude == position.longitude))) {
            this.positions.push(position);
        }
    }
}
exports.Positions = Positions;
