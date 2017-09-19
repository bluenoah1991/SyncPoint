'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _stream = require('stream');

class LongPolling extends _stream.Readable {
    constructor(httpPack, scope) {
        super();
        this.httpPack = httpPack;
        this.scope = scope;
        this._pushStream = this._pushStream.bind(this);
        this.start = this.start.bind(this);
        this.stop = this.stop.bind(this);
        this.isDestroyed = false;
    }

    _read(size) {}

    _addSocketListener(socket) {
        this.socket = socket;
        socket.on('error', this.stop);
        socket.on('close', this.stop);
    }

    _pushStream() {
        this.httpPack.generateBody(this.scope).then(function (respondBody) {
            if (respondBody != undefined && respondBody.length > 0) {
                this.push(respondBody);
            }
        }.bind(this)).then(function () {
            if (!this.isDestroyed) {
                this.handle = setTimeout(this._pushStream, 100);
            }
        }.bind(this));
    }

    start(ctx) {
        if (this.isDestroyed) {
            return;
        }
        this._addSocketListener(ctx.socket);
        ctx.body = this;
        this.handle = setTimeout(this._pushStream, 100);
    }

    stop() {
        if (this.isDestroyed) {
            return;
        }
        this.isDestroyed = true;
        if (this.handle != undefined) {
            clearTimeout(this.handle);
        }
        if (this.socket != undefined) {
            this.socket.removeListener('error', this.stop);
            this.socket.removeListener('close', this.stop);
        }
    }
}
exports.default = LongPolling;
//# sourceMappingURL=longpolling.js.map