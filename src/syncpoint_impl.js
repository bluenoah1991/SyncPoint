import SyncPoint from './syncpoint';

import Database from './database';
import HttpServer from './httpserver';

export default class SyncPointImpl extends SyncPoint{
    constructor(options){
        super();
        if(options == undefined){
            options = {};
        }
        this.database = new Database(options);
        this.httpserver = new HttpServer(options);
        this.httpserver.registerSyncCallback(this.sync.bind(this));
        this.resolvingConflicts_ = options['resolvingConflicts'];
    }

    start(){
        this.httpserver.listen();
    }

    maxNumber(uid){
        return this.database.maxSyncNumber(uid);
    }

    pointsAtRange(uid, minNumber, maxNumber){
        return this.database.pointsAtRange(uid, minNumber, maxNumber - 1);
    }

    savePoints(uid, points){
        return this.database.addPoints(uid, points);
    }

    resolvingConflicts(serverPoints, clientPoints, numberOfSegment){
        if(this.resolvingConflicts_ != undefined){
            return this.resolvingConflicts_(serverPoints, clientPoints, numberOfSegment);
        } else {
            return [];
        }
    }

    notifyNewNumberOfSegment(uid, number){
        this.httpserver.notifyNewNumberOfSegment(uid, number);
    }
}