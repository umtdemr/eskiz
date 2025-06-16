import Pako from 'pako';
import {Emitter} from "@/core/emitter/Emitter.ts";
import {nanoid} from "nanoid";
import {WsCommand, WsEvents, WsPayload, WsResponse} from "../types/Websocket.ts";
import {Signal} from "@/core/signal/Signal.ts";

type WsEngineStatus = 'idle' | 'open' | 'error' | 'closed' | 'reconnecting' | 'connecting';

type WsEngineEventMap = {
    'statusChange': WsEngineStatus,
}

type MsgCallback<T extends WsCommand> = {
    timeout: boolean,
    data: WsResponse<T>
}

export class WsEngine extends Emitter<WsEngineEventMap> {
    private websocket: WebSocket | null = null;
    private _status: WsEngineStatus = 'idle';
    private _wsConnectTimeout = 5000;
    private _boardSlugId: string;
    private messageCallbacks= new Map<string, (data: MsgCallback<WsCommand>) => void>();
    private msgTimeoutDuration = 10_000;
    private url: string;

    // Reconnection variables
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private baseReconnectDelay = 1000; // 1 second
    private maxReconnectDelay = 30000; // 30 seconds
    private _networkStatus: 'online' | 'offline' = 'online';
    private _isSuccessfullyJoined = false;

    // Ping/Pong (Heartbeat) variables
    private serverPingTimeoutId: ReturnType<typeof setTimeout> | null = null;
    private serverPingInterval = 10000; // Expected server ping interval
    private serverPingTolerance = 5000; // Extra time before considering unresponsive

    eventReceived = new Signal<WsEvents>()
    reconnected = new Signal();

    constructor(url: string, slugId: string) {
        super()
        this.url = url;
        this._boardSlugId = slugId
        this.status = 'idle';
        this.setupNetworkStatusListeners();
    }

    private setupNetworkStatusListeners() {
        window.addEventListener('online', this.onNetworkOnline.bind(this));
        window.addEventListener('offline', this.onNetworkOffline.bind(this));
    }

    private removeNetworkStatusListeners() {
        window.removeEventListener('online', this.onNetworkOnline.bind(this));
        window.removeEventListener('offline', this.onNetworkOffline.bind(this));
    }

    private onNetworkOnline() {
        this._networkStatus = 'online';
        console.log('Browser is online. Checking WebSocket connection...');
        if (this.websocket?.readyState !== WebSocket.OPEN) {
            console.log('Network back online, attempting WebSocket reconnection...');
            this.handleDisconnection(true)
        }
        // If it was already open, great. If not, handleDisconnection will take care of it.
    }

    private onNetworkOffline() {
        this._networkStatus = 'offline';
        console.warn('Browser is offline. WebSocket connection likely affected.');
        if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
            console.log('Force closing WebSocket due to offline event.');
            this.websocket.close(1000, 'Browser offline');
        } else if (this.websocket?.readyState === WebSocket.CONNECTING) {
            this.status = 'error';
        }
        // todo: emit disconnected
    }

    private createWebsocket() {
        if (this.websocket) {
            this.websocket.onopen = null;
            this.websocket.onclose = null;
            this.websocket.onerror = null;
            this.websocket.onmessage = null;
            this.websocket.close(); // Ensure any old connection is truly closed
        }

        this.status = this.reconnectAttempts > 0 ? 'reconnecting' : 'connecting';
        this.websocket = new WebSocket(this.url);
        this.websocket.binaryType = 'arraybuffer';
        this.websocket.onerror = this.onError.bind(this);
        this.websocket.onmessage = this.onMessage.bind(this);
        this.websocket.onopen = this.onOpen.bind(this);
        this.websocket.onclose = this.onClose.bind(this);
    }

    private onError(err){
        console.log('err', err)
        this.status = 'error';
    }

    private onOpen(){
        this.status = 'open';
        this.reconnectAttempts = 0; // reset attempts
        this.clearReconnectTimeout();
        this.resetServerPingTimeout(); // Start ping timeout monitoring

        if (this._isSuccessfullyJoined) {
            this.reconnected.dispatch();
        }
    }

    private onClose(event: CloseEvent) {
        console.log('closed', this._status)
        this.status = 'closed';
        this.clearServerPingTimeout();
        if (event?.code === 1000) {
            console.log('Clean disconnection. No reconnection attempt.');
            return;
        }
        this.handleDisconnection(); // Attempt reconnection
    }

    private async onMessage(message: MessageEvent) {
        this.resetServerPingTimeout(); // Reset ping timeout on ANY message from server

        const data = JSON.parse(Pako.inflate(message.data, { to: 'string', encoding: 'utf8' }))
        console.log('message', data)
        if (data.reply_to) {
            if (this.messageCallbacks.has(data.reply_to)) {
                this.messageCallbacks.get(data.reply_to)!(data)
            }
        }

        if (data.event) {
            this.eventReceived.dispatch(data)
        }
    }

    // todo: force immediate
    private handleDisconnection(forceImmediate = false) {
        if (this._networkStatus === 'offline') {
            return
        }

        if (this._status !== 'closed' && this._status !== 'error' && this._status !== 'reconnecting') {
            return
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = forceImmediate ? 0 : Math.min(this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts - 1), this.maxReconnectDelay);
            console.log(`Attempting to reconnect in ${delay / 1000} seconds (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

            this.clearReconnectTimeout(); // Clear any existing timeout
            this.reconnectTimeoutId = setTimeout(() => {
                this.createWebsocket();
            }, delay);
        } else {
            console.warn('Max reconnection attempts reached. Giving up.');
            this.status = 'closed'; // Permanently closed
            this.clearReconnectTimeout();
            this.clearServerPingTimeout();
            // todo: emit event
        }
    }

    private resetServerPingTimeout() {
        this.clearServerPingTimeout();
        this.serverPingTimeoutId = setTimeout(() => {
            console.warn('Server heartbeat timeout: No messages received from server.');
            if (this.websocket && this.websocket.readyState === WebSocket.OPEN) {
                this.websocket.close(1000, 'Server heartbeat timeout');
            } else {
                this.handleDisconnection();
            }
        }, this.serverPingInterval + this.serverPingTolerance);
    }

    private clearServerPingTimeout() {
        if (this.serverPingTimeoutId) {
            clearTimeout(this.serverPingTimeoutId);
            this.serverPingTimeoutId = null;
        }
    }

    private clearReconnectTimeout() {
        if (this.reconnectTimeoutId) {
            clearTimeout(this.reconnectTimeoutId);
            this.reconnectTimeoutId = null;
        }
    }

    async initialize() {
        if (this._status === 'open') {
            return Promise.resolve(true)
        }
        if (this._status === 'idle' || this._status === 'closed' || this._status === 'error') {
            this.createWebsocket();

            return new Promise((resolve, reject) => {
                const connectTimeout = setTimeout(() => {
                    cleanup()
                    if (this.websocket && this.websocket.readyState === WebSocket.CONNECTING) {
                        this.websocket.close(); // force close if still connecting after timeout
                    }
                    this.status = 'error';
                    reject('connection timeout')
                }, this._wsConnectTimeout)

                const handleStatusChange = (newStatus: WsEngineStatus) => {
                    if (newStatus === 'open') {
                        cleanup()
                        clearTimeout(connectTimeout)
                        resolve(true)
                    } else if (newStatus === 'error') {
                        cleanup()
                        clearTimeout(connectTimeout)
                        reject('failed to connect')
                    } else if (newStatus === 'closed') {
                        cleanup()
                        clearTimeout(connectTimeout)
                        reject('connection closed prematurely')
                    }
                }

                const cleanup = () => {
                    this.off('statusChange', handleStatusChange);
                }

                this.on('statusChange', handleStatusChange);
            })
        }
        return Promise.resolve(false)
    }

    dispose() {
        this.clearReconnectTimeout();
        this.clearServerPingTimeout();
        this.removeNetworkStatusListeners()
        if (this.websocket) {
            this.websocket.close(1000, 'Client disposed'); // Clean close
            this.websocket = null;
        }
        this.messageCallbacks.clear();
    }

    sendMessage<T extends WsCommand>(data: WsPayload<T>, cb?: (data: MsgCallback<T>) => void) {
        const sendingData = {
            ...data,
            id: nanoid()
        }
        if (cb) {
            this.messageCallbacks.set(sendingData.id, cb!)
        }
        const compressed = Pako.deflate(JSON.stringify(sendingData))
        this.websocket!.send(compressed)
    }

    // sends message using sendMessage. But this method returns a promise. Useful when relying on callbacks
    async sendAsyncMessage<T extends WsCommand>(data: WsPayload<T>): Promise<WsResponse<T>> {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject('timeout')
            }, this.msgTimeoutDuration)
            this.sendMessage(
                data,
                (respData: MsgCallback<T>) => {
                    clearTimeout(timeout);
                    resolve(respData.data)
                }
            )
        }) as Promise<WsResponse<T>>
    }

    async connect(userAuthToken: string): Promise<WsResponse<"join">>{
        const connectResp = await this.sendAsyncMessage<"join">({
            type: 'join',
            data: {
                board_slug_id: this._boardSlugId,
                user_auth_token: userAuthToken,
            },
        });

        this._isSuccessfullyJoined = !connectResp.error;
        return connectResp;
    }

    set status(newStatus: WsEngineStatus){
        this._status = newStatus;
        this.emit('statusChange', newStatus)
    }
}