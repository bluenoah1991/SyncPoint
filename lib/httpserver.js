'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _koa = require('koa');

var _koa2 = _interopRequireDefault(_koa);

var _koaRouter = require('koa-router');

var _koaRouter2 = _interopRequireDefault(_koaRouter);

var _kcors = require('kcors');

var _kcors2 = _interopRequireDefault(_kcors);

var _koaBetterBody = require('koa-better-body');

var _koaBetterBody2 = _interopRequireDefault(_koaBetterBody);

var _httppackServer = require('httppack-server');

var _longpolling = require('./longpolling');

var _longpolling2 = _interopRequireDefault(_longpolling);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class HttpServer {
    constructor(options) {
        if (options == undefined) {
            options = {};
        }
        this.options = options;
        this.longPollings = {};
        this.httpPack = new _httppackServer.HttpPack(options);
        this.server = new _koa2.default();
        this.router = new _koaRouter2.default();
        this.installRoute();

        this.syncCallback = function () {};

        this.server.use((0, _kcors2.default)()).use((0, _koaBetterBody2.default)({ buffer: true })).use(this.router.routes()).use(this.router.allowedMethods());
    }

    listen() {
        this.server.listen(this.options['httpport'] || 3000);
    }

    installRoute() {
        this.router.post(this.options['outgoing_address'] || '/outgoing', this.outgoingHandle.bind(this));
        this.router.post(this.options['incoming_address'] || '/incoming', this.incomingHandle.bind(this));
    }

    registerSyncCallback(cb) {
        this.syncCallback = cb;
    }

    notifyNewNumberOfSegment(uid, number) {
        let notifyData = {
            "newNumberOfSegment": number
        };
        let respondBody = JSON.stringify(notifyData);
        let scopes = this.scopesForUser(uid);
        _lodash2.default.forEach(scopes, function (scope) {
            this.httpPack.commit(scope, new Buffer(respondBody, 'utf-8'), 0);
        }.bind(this));
    }

    scopesForUser(uid) {
        let longPollingsForUser = this.longPollings[uid];
        if (longPollingsForUser == undefined) {
            longPollingsForUser = {};
            this.longPollings[uid] = longPollingsForUser;
        }
        let longPollings = _lodash2.default.values(longPollingsForUser);
        longPollings = _lodash2.default.filter(longPollings, function (lp) {
            return !lp.isDestroyed;
        });
        let scopes = _lodash2.default.map(longPollings, function (lp) {
            return lp.scope;
        });
        return scopes;
    }

    authenticate(ctx) {
        let scope = ctx.headers['syncpoint-scope'];
        if (scope == undefined || scope.length == 0) {
            return [scope, null, null];
        }
        let index = scope.indexOf(':');
        if (index == -1) {
            ctx.throw(401);
        }
        let username = scope.substr(0, index);
        let node = scope.substr(index + 1);
        if (scope == undefined || scope.length == 0) {
            ctx.throw(401);
        } else if (username == undefined || username.length == 0) {
            ctx.throw(401);
        } else if (node == undefined || node.length == 0) {
            ctx.throw(401);
        }
        return [scope, username, node];
    }

    outgoingHandle(ctx, next) {
        let [scope, uid, node] = this.authenticate(ctx);

        // disable timeout
        ctx.req.setTimeout(0);

        let longPollingsForUser = this.longPollings[uid];
        if (longPollingsForUser == undefined) {
            longPollingsForUser = {};
            this.longPollings[uid] = longPollingsForUser;
        }
        let longPolling = longPollingsForUser[node];
        if (longPolling != undefined) {
            longPolling.stop();
        }
        longPolling = new _longpolling2.default(this.httpPack, scope);
        longPollingsForUser[node] = longPolling;
        longPolling.start(ctx);
        return next();
    }

    incomingHandle(ctx, next) {
        let [scope, uid, node] = this.authenticate(ctx);

        return ctx.request.buffer().then(function (body) {
            return this.httpPack.parseBody(scope, body, function (scope, payload) {
                let syncData = JSON.parse(payload);
                if (syncData != undefined) {
                    let syncId = syncData['id'];
                    let clientNumberOfSegment = syncData['clientNumberOfSegment'];
                    let newPoints = syncData['newPoints'];
                    let respondSyncData = this.syncCallback(uid, syncId, clientNumberOfSegment, newPoints);
                    respondSyncData.then(function (data) {
                        if (data != undefined) {
                            let respondBody = JSON.stringify(data);
                            this.httpPack.commit(scope, new Buffer(respondBody, 'utf-8'), 2);
                        }
                    }.bind(this));
                }
            }.bind(this)).then(function () {
                ctx.body = null;
                return next();
            }.bind(this));
        }.bind(this));
    }
}
exports.default = HttpServer;
//# sourceMappingURL=httpserver.js.map