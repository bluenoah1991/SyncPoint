const SyncPoint = require('./index');

var opts = {
    'resolvingConflicts': function(serverPoints, newPoints, numberOfSegment){
        var conflictsPoints = [];
        for(var i in newPoints){
            var point = newPoints[i];
            point.syncNumber = ++numberOfSegment;
            conflictsPoints.push(point);
        }
        return conflictsPoints;
    },
    'httpport': 8080
};

var syncPoint = new SyncPoint(opts);
syncPoint.start();