import Pako from 'pako';
import {Emitter} from "@/core/emitter/Emitter.ts";
import {nanoid} from "nanoid";

type WsEngineStatus = 'idle' | 'open' | 'error' | 'closed';

type WsEngineEventMap = {
    'statusChange': WsEngineStatus
}

export class WsEngine extends Emitter<WsEngineEventMap> {
    private websocket: WebSocket
    private _status: 'idle' | 'open' | 'error' | 'closed' = 'idle';
    private _wsConnectTimeout = 5000;
    private _boardSlugId: string;
    private messageCallbacks= new Map<string, () => void>();

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
    
    sendMessage(data, cb?: () => void) {
        const sendingData = {
            ...data,
            id: nanoid()
        }
        if (cb) {
            this.messageCallbacks.set(sendingData.id, cb)
        }
        const compressed = Pako.deflate(JSON.stringify(sendingData))
        this.websocket.send(compressed)
    }
    
    connect(userAuthToken: string) {
        this.sendMessage(
            {
                type: 'join',
                data: {
                    board_slug_id: this._boardSlugId,
                    user_auth_token: userAuthToken,
                }
            },
            () => {
                // handle reply here
            }
        )
    }
    
    set status(newStatus: WsEngineStatus){
        this._status = newStatus;
        this.emit('statusChange', newStatus)
    }
}