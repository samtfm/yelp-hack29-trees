// A note on terminology:
// `Node` is the generalized term for all points
// `Target` is a Node representing the resource points towards which the tree joints are growing
//    - Although these also have `parent` property, they won't actually have a parent
// `Joint` is a Node representing points on the tree which are growing towards targets
class Node{ 
    constructor(x, y, z, parent){
        this.x = x;
        this.y = y;
        this.z = z;
        this.parentJoint = parent;
        this.closestDist = Number.MAX_VALUE;
        this.closestJoint = parent;
        if(this.parentJoint != null){
            this.parentJoint.childNodes.push(this);
        }
        this.childNodes = [];
    }

    distance(node){
        return Math.sqrt((node.x-this.x)**2 + (node.y-this.y)**2 + (node.z-this.z)**2);
    }

    parentDistance(){
        return this.parentJoint ? this.distance(this.parentJoint) : 4;
    }
}

function _getPullVector(joint, targets) {
    vector = {dx:0, dy:0, dz:0}
    targets.forEach(target => {
        dist = joint.distance(target)
        vector.dx += (target.x - joint.x)/(dist*dist)
        vector.dy += (target.y - joint.y)/(dist*dist)
        vector.dz += (target.z - joint.z)/(dist*dist)
    });
    return vector;
}

function generateChildJoint(joint, targets, branchLength) {
    pullVector = _getPullVector(joint, targets);
    magnitude = Math.sqrt((pullVector.dx)**2 + (pullVector.dy**2) + (pullVector.dz**2));
    normalizedVector = {
        dx: (pullVector.dx / magnitude) * branchLength,
        dy: (pullVector.dy / magnitude) * branchLength,
        dz: (pullVector.dz / magnitude) * branchLength,
    }
    point = { x: joint.x + normalizedVector.dx, y: joint.y + normalizedVector.dy, z: joint.z + normalizedVector.dz };
    return new Node(point.x, point.y, point.z, joint);
}

function getInfluencingTargets(joint, targets){
    influencingTargets = [];
    for (let target of targets){
        if(target.closestJoint === joint){
            influencingTargets.push(target);
        }
    }
    return influencingTargets;
}


class Tree{
    constructor(targets, startJoint, captureRadius, branchLength, numJoints){
        // this.targets = targets
        this.startJoint = startJoint
        this.captureRadius = captureRadius
        this.branchLength = branchLength
        this.numJoints = numJoints
        this.remainingTargets = new Set(targets); // Clone the array to edit it.
        this.currentJoint = startJoint
        this.counter = 0;
        this.growableJoints = [startJoint];
        this.allJointsList = [startJoint]
    }
    
    step(){
        if (this.counter > this.numJoints) { 
            return null; 
        }

        for (var target of this.remainingTargets) {
            const dist = target.distance(this.currentJoint);
            if (dist < this.captureRadius){
                // capture target
                this.remainingTargets.delete(target);
            } else if (dist < target.closestDist){
                // Update the closest target and associated distance in the array.
                target.closestDist = dist;
                target.closestJoint = this.currentJoint;
            }
        }

        // Break if this.remainingTargets is empty.
        if(this.remainingTargets.size == 0){
            return null;
        }

        let influencingTargets = [];
        while (this.growableJoints.length > 0){
            influencingTargets = getInfluencingTargets(this.growableJoints[0], this.remainingTargets)
            if (influencingTargets.length > 0){
                break;
            } else {
                this.growableJoints.shift();
            }
        }

        if (this.growableJoints.length === 0){
            return null;
        }

        // place new joint!
        this.currentJoint = generateChildJoint(this.growableJoints[0], influencingTargets, this.branchLength)
        this.growableJoints.push(this.currentJoint);
        this.allJointsList.push(this.currentJoint);
        this.counter++;
        return this.currentJoint;
    }

    grow(numSteps){
        var lastStep
        for (let i = 0; i < numSteps; i++){
            lastStep = this.step();
        }
        return lastStep
    }
}