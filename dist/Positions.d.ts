import { Position } from './Position';
export declare class Positions {
    private _app;
    private _positions;
    private _consecutiveRepeats;
    constructor(app?: any);
    positions(): Position[];
    length(): number;
    consecutiveRepeats(): number;
    append(position: Position): void;
}
