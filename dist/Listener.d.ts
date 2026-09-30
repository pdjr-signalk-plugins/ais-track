import { Socket } from 'dgram';
import { Positions } from './Positions';
export declare class Listener {
    port: number;
    resetInterval: number;
    positionAccuracy: number;
    udpSocket: Socket;
    timestamp: number;
    resourceName: string | null;
    positions: Positions;
    constructor(option: any, options: any, defaults: any);
    startListening(): void;
    stopListening(): void;
    saveResource(): void;
}
