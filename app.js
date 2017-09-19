const SyncPoint = require('./index');

var opts = {
    'resolvingConflicts': function(serverPoints, newPoints, numberOfSegment){
        var conflictsPoints = [];
        for(var i in serverPoints){
            var serverPoint = serverPoints[i];
            var isConflicts = false;
            for(var j in newPoints){
                var newPoint = newPoints[j];
                if(newPoint.data.id == serverPoint.data.id){
                    isConflicts = true;
                    break;
                }
            }
            if(!isConflicts){
                conflictsPoints.push(serverPoint);
            }
        }
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