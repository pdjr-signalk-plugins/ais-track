export declare class Position {
    static decimals: number;
    latitude: number;
    longitude: number;
    constructor(latitude: number, longitude: number);
    static setDecimals(decimals: number): void;
}
