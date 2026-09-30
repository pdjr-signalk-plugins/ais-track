import { Position } from './Position';
export declare class Positions {
    app: any;
    positions: Position[];
    constructor(app: any);
    length(): number;
    add(position: Position): void;
}
