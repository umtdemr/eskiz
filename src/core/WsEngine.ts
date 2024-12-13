import Pako from 'pako';
import {Emitter} from "@/core/emitter/Emitter.ts";
import {nanoid} from "nanoid";
import {WsCommand, WsResponse} from "../types/Websocket.ts";

type WsEngineStatus = 'idle' | 'open' | 'error' | 'closed';

type WsEngineEventMap = {
    'statusChange': WsEngineStatus
}

type MsgCallback<T extends WsCommand> = {
    timeout: boolean,
    data: WsResponse<T>
}

export class WsEngine extends Emitter<WsEngineEventMap> {
    private websocket: WebSocket
    private _status: 'idle' | 'open' | 'error' | 'closed' = 'idle';
    private _wsConnectTimeout = 5000;
    private _boardSlugId: string;
    private messageCallbacks= new Map<string, (data: MsgCallback) => void>();
    private msgTimeoutDuration = 10_000;

    constructor(url: string, slugId: string) {
        super()
        this._boardSlugId = slugId
        this.websocket = new WebSocket(url)
        this.websocket.binaryType = 'arraybuffer'
        this.websocket.onerror = this.onError.bind(this)
        this.websocket.onmessage = this.onMessage.bind(this)
        this.websocket.onopen = this.onOpen.bind(this)
        this.websocket.onclose = this.onClose.bind(this)
    }
    
    private onError(err){
        this.status = 'error';
    }

    private onOpen(){
        this.status = 'open';
    }

    private onClose() {
        this.status = 'closed';
    }

    private async onMessage(message: MessageEvent) {
        const data = JSON.parse(Pako.inflate(message.data, { to: 'string', encoding: 'utf8' }))
        if (this.messageCallbacks.has(data.reply_to)) {
            this.messageCallbacks.get(data.reply_to)!(data)
        }
    }
    
    async initialize() {
        if (this._status === 'open') {
            return Promise.resolve(true)
        }
        if (this._status === 'idle') {
            return new Promise((resolve, reject) => {
                setTimeout(() => {
                    cleanup()
                    reject('connection timeout')
                }, this._wsConnectTimeout)
                
                const handleStatusChange = (newStatus: WsEngineStatus) => {
                    if (newStatus === 'open') {
                        cleanup()
                        resolve(true)
                    } else if (newStatus === 'error') {
                        reject('failed to connect')
                    }
                }
                
                const cleanup = () => {
                    this.off('statusChange', handleStatusChange);
                }
                
                this.on('statusChange', handleStatusChange);
            })
        }
    }
    
    dispose() {
        this.websocket.close()
        this.messageCallbacks.clear();
    }
    
    sendMessage<T>(data, cb?: (data: MsgCallback<T>) => void) {
        const sendingData = {
            ...data,
            id: nanoid()
        }
        if (cb) {
            this.messageCallbacks.set(sendingData.id, cb!)
        }
        const compressed = Pako.deflate(JSON.stringify(sendingData))
        this.websocket.send(compressed)
    }
    
    // sends message using sendMessage. But this method returns a promise. Useful when relying on callbacks
    async sendAsyncMessage<T>(data): Promise<WsResponse<T>> {
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
    
    async connect(userAuthToken: string) {
        const data = await this.sendAsyncMessage<"join">({
            type: 'join',
            data: {
                board_slug_id: this._boardSlugId,
                user_auth_token: userAuthToken,
            },
        });
        return !data.error;
    }
    
    set status(newStatus: WsEngineStatus){
        this._status = newStatus;
        this.emit('statusChange', newStatus)
    }
}