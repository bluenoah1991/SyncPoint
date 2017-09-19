import redis from 'redis';
import bluebird from 'bluebird';
bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);
import _ from 'lodash';

export default class Database{
    constructor(options){
        if(options == undefined){
            options = {};
        }
        this.key = options['dbkey'] || 'points';
        this.client = redis.createClient(options);
    }

    addPoint(uid, point){
        let data = JSON.stringify(point['data']);
        return this.client.zaddAsync(`${this.key}:${uid}`, point['syncNumber'], data);
    }

    addPoints(uid, points){
        let multi = this.client.multi();
        _.forEach(points, function(point){
            let data = JSON.stringify(point['data']);
            multi.zadd(`${this.key}:${uid}`, point['syncNumber'], data);
        }.bind(this));
        return multi.execAsync();
    }

    maxSyncNumber(uid){
        return this.client.zrevrangeAsync(`${this.key}:${uid}`, 0, 0, 'withscores').then(function(members){
            if(members != undefined){
                return members[1];
            }
            return 0;
        });
    }

    pointsAtRange(uid, minValue, maxValue){
        return this.client.zrangebyscoreAsync(`${this.key}:${uid}`, minValue, maxValue, 'withscores').then(function(members){
            let pointTuples = _.chunk(members, 2);
            let points = _.map(pointTuples, function(tuple){
                return {
                    'syncNumber': tuple[1],
                    'data': JSON.parse(tuple[0])
                }
            });
            return points;
        });
    }
}