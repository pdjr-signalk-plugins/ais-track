"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Position = void 0;
class Position {
    constructor(latitude, longitude, decimals) {
        this.latitude = 0;
        this.longitude = 0;
        this.latitude = Number((decimals) ? latitude.toFixed(decimals) : latitude);
        this.longitude = Number((decimals) ? longitude.toFixed(decimals) : longitude);
    }
}
exports.Position = Position;
