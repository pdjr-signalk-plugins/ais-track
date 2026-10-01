"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
class Position {
    constructor(latitude, longitude, decimals = 4) {
        this.latitude = 0;
        this.longitude = 0;
        this.latitude = Number(latitude.toFixed(decimals));
        this.longitude = Number(longitude.toFixed(decimals));
    }
}
exports.Position = Position;
