import _ from 'lodash';

import Koa from 'koa';
import Router from 'koa-router';
import cors from 'kcors';
import body from 'koa-better-body';
import {HttpPack} from 'httppack-server';

import LongPolling from './longpolling';

export default class HttpServer{
    constructor(options){
        if(options == undefined){
            options = {};
        }
        this.options = options;
        this.longPollings = {};
        this.httpPack = new HttpPack(options);
        this.server = new Koa();
        this.router = new Router();
        this.installRoute();

        this.syncCallback = function(){};

        this.server
            .use(cors())
            .use(body({ buffer: true }))
            .use(this.router.routes())
            .use(this.router.allowedMethods());
    }

    listen(){
        this.server.listen(this.options['httpport'] || 3000);
    }

    installRoute(){
        this.router.post(this.options['outgoing_address'] || '/outgoing', this.outgoingHandle.bind(this));
        this.router.post(this.options['incoming_address'] || '/incoming', this.incomingHandle.bind(this));
    }

    registerSyncCallback(cb){
        this.syncCallback = cb;
    }

    notifyNewNumberOfSegment(uid, number){
        let notifyData = {
            "newNumberOfSegment": number
        };
        let respondBody = JSON.stringify(notifyData);
        let scopes = this.scopesForUser(uid);
        _.forEach(scopes, function(scope){
            this.httpPack.commit(scope, new Buffer(respondBody, 'utf-8'), 0);
        }.bind(this));
    }

    scopesForUser(uid){
        let longPollingsForUser = this.longPollings[uid];
        if(longPollingsForUser == undefined){
            longPollingsForUser = {};
            this.longPollings[uid] = longPollingsForUser;
        }
        let longPollings = _.values(longPollingsForUser);
        longPollings = _.filter(longPollings, function(lp){
            return !lp.isDestroyed;
        });
        let scopes = _.map(longPollings, function(lp){
            return lp.scope;
        });
        return scopes;
    }

    authenticate(ctx){
        let scope = ctx.headers['syncpoint-scope'];
        if(scope == undefined || scope.length == 0){
            return [scope, null, null];
        }
        let index = scope.indexOf(':');
        if(index == -1){
            ctx.throw(401);
        }
        let username = scope.substr(0, index);
        let node = scope.substr(index + 1);
        if(scope == undefined || scope.length == 0){
            ctx.throw(401);
        } else if(username == undefined || username.length == 0){
            ctx.throw(401);
        } else if(node == undefined || node.length == 0){
            ctx.throw(401);
        }
        return [scope, username, node];
    }

    outgoingHandle(ctx, next){
        let [scope, uid, node] = this.authenticate(ctx);

        // disable timeout
        ctx.req.setTimeout(0);

        let longPollingsForUser = this.longPollings[uid];
        if(longPollingsForUser == undefined){
            longPollingsForUser = {};
            this.longPollings[uid] = longPollingsForUser;
        }
        let longPolling = longPollingsForUser[node];
        if(longPolling != undefined){
            longPolling.stop();
        }
        longPolling = new LongPolling(this.httpPack, scope);
        longPollingsForUser[node] = longPolling;
        longPolling.start(ctx);
        return next();
    }

    incomingHandle(ctx, next){
        let [scope, uid, node] = this.authenticate(ctx);

        return ctx.request.buffer().then(function(body){
            return this.httpPack.parseBody(scope, body, function(scope, payload){
                let syncData = JSON.parse(payload);
                if(syncData != undefined){
                    let syncId = syncData['id'];
                    let clientNumberOfSegment = syncData['clientNumberOfSegment'];
                    let newPoints = syncData['newPoints'];
                    let respondSyncData = this.syncCallback(
                        uid, syncId, clientNumberOfSegment, newPoints);
                    respondSyncData.then(function(data){
                        if(data != undefined){
                            let respondBody = JSON.stringify(data);
                            this.httpPack.commit(scope , new Buffer(respondBody, 'utf-8'), 2);
                        }
                    }.bind(this));
                }
            }.bind(this)).then(function(){
                ctx.body = null;
                return next();
            }.bind(this));
        }.bind(this));
    }
}