export default class SyncPoint{
    _numberOfSegment(number){
        let segmentNumber = number >> 16;
        return segmentNumber << 16;
    }

    _numberOfNextSegment(number){
         let newSegmentNumber = (number >> 16) + 1;
         return newSegmentNumber << 16;
    }   

    maxNumberOfSegment(uid){
        // Number Format: segmentNumber << 16 | serialNumber
        return this.maxNumber(uid).then(function(maxNumber){
            if(maxNumber > 0){
                return this._numberOfNextSegment(maxNumber);
            }
            return 0 << 16;
        }.bind(this));
    }

    maxNumber(uid){
        // Override it (e.g. load maximum segment number from database)
        // Return Promise
    }

    pointsAtRange(uid, minNumber, maxNumber){
        // Override it, exclusive maxNumber (e.g. query from database)
        // Return Promise
    }

    notifyNewNumberOfSegment(uid, number){
        // Override it (e.g. push message to client)
    }

    resolvingConflicts(serverPoints, clientPoints, numberOfSegment){
        // Override it, calculate resolve conflicts points, and set syncNumber
    }

    savePoints(uid, points){
        // Override it (e.g. save to database)
        // Return Promise
    }

    // Important! Serial execution
    sync(uid, syncId, clientNumberOfSegment, newPoints){
        return this.maxNumberOfSegment(uid).then(function(numberOfSegment){
            if(clientNumberOfSegment < numberOfSegment){
                return this.pointsAtRange(uid, clientNumberOfSegment, numberOfSegment).then(function(serverPoints){
                    if(newPoints == undefined || newPoints.length == 0){
                        return {
                            "id": ++syncId,
                            "points": serverPoints,
                            "numberOfSegment": numberOfSegment
                        };
                    } else {
                        let conflictsPoints = this.resolvingConflicts(serverPoints, newPoints, numberOfSegment);
                        return this.savePoints(uid, conflictsPoints).then(function(){
                            let numberOfNextSegment = this._numberOfNextSegment(numberOfSegment);
                            this.notifyNewNumberOfSegment(uid, numberOfNextSegment);
                            return {
                                "id": ++syncId,
                                "points": serverPoints.concat(conflictsPoints),
                                "numberOfSegment": numberOfNextSegment
                            };
                        }.bind(this));
                    }
                }.bind(this));
            } else { // clientNumberOfSegment == numberOfSegment
                if(newPoints == undefined || newPoints.length == 0){
                    return {
                        "id": ++syncId,
                        "points": [],
                        "numberOfSegment": numberOfSegment
                    };
                } else {
                    return this.savePoints(uid, newPoints).then(function(){
                        let numberOfNextSegment = this._numberOfNextSegment(numberOfSegment);
                        this.notifyNewNumberOfSegment(uid, numberOfNextSegment);
                        return {
                            "id": ++syncId,
                            "points": [],
                            "numberOfSegment": numberOfNextSegment
                        };
                    }.bind(this));
                }
            }
        }.bind(this));
    }
}

/**
 * Point Duck Type
 * syncNumber: Number
 * data: String
 */