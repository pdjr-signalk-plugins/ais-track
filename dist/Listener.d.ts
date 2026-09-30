import { Socket } from 'dgram';
import { Positions } from './Positions';
export declare class Listener {
    app: any | null;
    port: number;
    resetInterval: number;
    positionAccuracy: number;
    udpSocket: Socket;
    timestamp: number;
    resourceName: string | null;
    positions: Positions | null;
    constructor(options: any[], app: any);
    startListening(): void;
    stopListening(): void;
    saveResource(): void;
}
