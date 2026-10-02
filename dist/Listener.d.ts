import { Socket } from 'dgram';
import { Positions } from './Positions';
export declare class Listener {
    accessToken: string | undefined;
    app: any;
    name: string;
    port: number;
    positionAccuracy: number;
    postUrl: string;
    resetInterval: number;
    resetRepeat: number | undefined;
    udpSocket: Socket;
    timestamp: number;
    resourceName: string | null;
    positions: Positions | null;
    constructor(options: any[], app?: any);
    dump(): void;
    startListening(): void;
    stopListening(): void;
    openResource(name: string): void;
    closeResource(): Promise<void>;
}
