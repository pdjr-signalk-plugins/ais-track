export declare class Listener {
    private _app;
    private _name;
    private _port;
    private _postUrl;
    private _accessToken;
    private _positionAccuracy;
    private _resetInterval;
    private _resetRepeat;
    private _udpSocket;
    private _timestamp;
    private _track;
    private _resourceId;
    constructor(options: any[], app: any);
    getName(): string;
    getPort(): number;
    startListening(): void;
    stopListening(): void;
    saveResource(): Promise<void>;
}
