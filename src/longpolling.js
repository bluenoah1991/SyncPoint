import {Readable} from 'stream';

export default class LongPolling extends Readable{
    constructor(httpPack, scope){
        super();
        this.httpPack = httpPack;
        this.scope = scope;
        this._pushStream = this._pushStream.bind(this);
        this.isDestroyed = false;
    }

    _read(size){

    }

    _pushStream(){
        this.httpPack.generateBody(this.scope).then(function(respondBody){
            if(respondBody != undefined && respondBody.length > 0){
                this.push(respondBody);
            }
        }.bind(this)).then(function(){
            if(!this.isDestroyed){
                this.handle = setTimeout(this._pushStream, 1000);
            }
        }.bind(this));
    }

    start(ctx){
        if(this.isDestroyed){
            return;
        }
        ctx.body = this;
        this.handle = setTimeout(this._pushStream, 1000);
    }

    destroy(){
        this.isDestroyed = true;
        if(this.handle != undefined){
            clearTimeout(this.handle);
        }
    }
}