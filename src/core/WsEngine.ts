import {Emitter} from "@/core/emitter/Emitter.ts";

type WsEngineStatus = 'idle' | 'open' | 'error' | 'closed';

type WsEngineEventMap = {
    'statusChange': WsEngineStatus
}

export class WsEngine extends Emitter<WsEngineEventMap> {
    private websocket: WebSocket
    private _status: 'idle' | 'open' | 'error' | 'closed' = 'idle';
    private _wsConnectTimeout = 5000;
    private _boardSlugId: string;

    constructor(url: string, slugId: string) {
        super()
        this._boardSlugId = slugId
        this.websocket = new WebSocket(url)
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

    private onMessage(data) {
    }
    
    async initialize() {
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
    }
    
    sendMessage(data) {
        this.websocket.send(JSON.stringify(data))
    }
    
    connect() {
        this.sendMessage({
            type: 'join',
            data: {
                board: this._boardSlugId,
            }
        })
    }
    
    set status(newStatus: WsEngineStatus){
        this._status = newStatus;
        this.emit('statusChange', newStatus)
    }
}