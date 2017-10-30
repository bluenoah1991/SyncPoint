const SyncPoint = require('./index');

var opts = {
    'resolvingConflicts': function(serverPoints, newPoints, numberOfSegment){
        var conflictsPoints = [];
        var reversePoints = [];
        for(var i in newPoints){
            var point = newPoints[i];
            point.syncNumber = ++numberOfSegment;
            conflictsPoints.push(point);
        }
        for(var i in serverPoints){
            var serverPoint = serverPoints[i];
            reversePoints.push(serverPoint);
        }
        return [conflictsPoints, reversePoints];
    },
    'httpport': 8080
};

var syncPoint = new SyncPoint(opts);
syncPoint.start();