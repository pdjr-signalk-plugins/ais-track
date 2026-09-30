"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
class Position {
    constructor(latitude, longitude) {
        this.latitude = 0;
        this.longitude = 0;
        this.latitude = Number(latitude.toFixed(Position.decimals));
        this.longitude = Number(longitude.toFixed(Position.decimals));
    }
    static setDecimals(decimals) {
        Position.decimals = decimals;
    }
}
exports.Position = Position;
Position.decimals = 4;
