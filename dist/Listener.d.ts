import { Socket } from 'dgram';
import { Positions } from './Positions';
export declare class Listener {
    app: any | null;
    port: number;
    resetInterval: number;
    positionAccuracy: number;
    putUrl: string;
    udpSocket: Socket;
    timestamp: number;
    resourceName: string | null;
    positions: Positions | null;
    constructor(options: any[], app: any);
    startListening(): void;
    stopListening(): void;
    openResource(name: string): void;
    closeResource(): Promise<void>;
}
