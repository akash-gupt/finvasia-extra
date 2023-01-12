/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from 'events';
import WS from 'ws';
declare class WebSocket extends EventEmitter {
    static webSocketURL: string;
    static readTimeout: number;
    static heartBeatTimeout: number;
    userId: string | undefined;
    accountId: string | undefined;
    accessToken: string | undefined;
    debug: boolean;
    socket: WS | undefined;
    readTimer: NodeJS.Timer | undefined;
    heartBeatTimer: NodeJS.Timer | undefined;
    lastReadTimestamp: number;
    logger: {
        info: (p: any) => void;
        error: (p: any) => void;
        debug: (p: any) => void;
    };
    connectTimer: NodeJS.Timeout | undefined;
    constructor(options: {
        userId: string | undefined;
        accessToken: string | undefined;
        debug: boolean;
    });
    setUserId(userId: string): void;
    setAccessToken(accessToken: string): void;
    connect(): void;
    subscribeOrderUpdates(): void;
    disconnect(): void;
    triggerDisconnect(): void;
}
export default WebSocket;
