import { Position } from './Position';
export declare class Track {
    private _timestamp;
    private _app;
    private _positions;
    private _consecutiveRepeats;
    constructor(timestamp: number, app?: any);
    timestamp(): number;
    positions(): Position[];
    length(): number;
    consecutiveRepeats(): number;
    append(position: Position): void;
}
