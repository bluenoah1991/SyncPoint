'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _redis = require('redis');

var _redis2 = _interopRequireDefault(_redis);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_bluebird2.default.promisifyAll(_redis2.default.RedisClient.prototype);
_bluebird2.default.promisifyAll(_redis2.default.Multi.prototype);
class Database {
    constructor(options) {
        if (options == undefined) {
            options = {};
        }
        this.key = options['dbkey'] || 'points';
        this.client = _redis2.default.createClient(options);
    }

    addPoint(uid, point) {
        let data = JSON.stringify(point['data']);
        return this.client.zaddAsync(`${this.key}:${uid}`, point['syncNumber'], data);
    }

    addPoints(uid, points) {
        let multi = this.client.multi();
        _lodash2.default.forEach(points, function (point) {
            let data = JSON.stringify(point['data']);
            multi.zadd(`${this.key}:${uid}`, point['syncNumber'], data);
        }.bind(this));
        return multi.execAsync();
    }

    maxSyncNumber(uid) {
        return this.client.zrevrangeAsync(`${this.key}:${uid}`, 0, 0, 'withscores').then(function (members) {
            if (members != undefined) {
                return members[1];
            }
            return 0;
        });
    }

    pointsAtRange(uid, minValue, maxValue) {
        return this.client.zrangebyscoreAsync(`${this.key}:${uid}`, minValue, maxValue, 'withscores').then(function (members) {
            let pointTuples = _lodash2.default.chunk(members, 2);
            let points = _lodash2.default.map(pointTuples, function (tuple) {
                return {
                    'syncNumber': tuple[1],
                    'data': JSON.parse(tuple[0])
                };
            });
            return points;
        });
    }
}
exports.default = Database;
//# sourceMappingURL=database.js.map