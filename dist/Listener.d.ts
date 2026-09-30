export declare class Listener {
    port: number;
    udpSocket: Socket;
    resourceName: string;
    positionAccuracy: number;
    positionCount: number;
    constructor(option: any, options: any, defaults: any);
    bump(): void;
}
