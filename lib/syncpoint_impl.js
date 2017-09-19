'use strict';

Object.defineProperty(exports, "__esModule", {
    value: true
});

var _syncpoint = require('./syncpoint');

var _syncpoint2 = _interopRequireDefault(_syncpoint);

var _database = require('./database');

var _database2 = _interopRequireDefault(_database);

var _httpserver = require('./httpserver');

var _httpserver2 = _interopRequireDefault(_httpserver);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class SyncPointImpl extends _syncpoint2.default {
    constructor(options) {
        super();
        if (options == undefined) {
            options = {};
        }
        this.database = new _database2.default(options);
        this.httpserver = new _httpserver2.default(options);
        this.httpserver.registerSyncCallback(this.sync.bind(this));
        this.resolvingConflicts_ = options['resolvingConflicts'];
    }

    start() {
        this.httpserver.listen();
    }

    maxNumber(uid) {
        return this.database.maxSyncNumber(uid);
    }

    pointsAtRange(uid, minNumber, maxNumber) {
        return this.database.pointsAtRange(uid, minNumber, maxNumber - 1);
    }

    savePoints(uid, points) {
        return this.database.addPoints(uid, points);
    }

    resolvingConflicts(serverPoints, clientPoints, numberOfSegment) {
        if (this.resolvingConflicts_ != undefined) {
            return this.resolvingConflicts_(serverPoints, clientPoints, numberOfSegment);
        } else {
            return [];
        }
    }

    notifyNewNumberOfSegment(uid, number) {
        this.httpserver.notifyNewNumberOfSegment(uid, number);
    }
}
exports.default = SyncPointImpl;
//# sourceMappingURL=syncpoint_impl.js.map