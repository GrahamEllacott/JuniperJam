
/////////////////////////
// https://tgfwars.github.io/bjsenv/v5
////////////////////////

function addPickAction(mesh, action) {
  scene = mesh.getScene();
  mesh.actionManager = mesh.actionManager || new BABYLON.ActionManager(scene);
  mesh.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnPickTrigger, function(){
    action(mesh);
  }));
  return mesh;
}


function addPhysics(mesh, settings) {
    let item = (typeof mesh === 'string') ? scene.getNodeByName(mesh) : mesh;
    item.physicsAggregate = new BABYLON.PhysicsAggregate(item, BABYLON.PhysicsShapeType.MESH, settings);
    return item; //this lets us store in a variable too
}

function makePushable(mesh, strength = 3) { // pass in a string or a variable with the mesh selected
    let scene = mesh.getScene();
    addPickAction(mesh, function(){
        var impulseDirection = scene.activeCamera.getForwardRay().direction; //new BABYLON.Vector3(1, 0, 0);
        var contactLocalRefPoint = BABYLON.Vector3.Zero();
        mesh.physicsAggregate.body.applyImpulse(
            impulseDirection.scale(strength),
            mesh.getAbsolutePosition().add(contactLocalRefPoint)
        )
    });
}


//This allows chaining. eg. playAnim(a.womanPunch).wait(500).etc
// requires playAnimationGroup and $() 
function playAnim(nextAnimationGroup, {blendSpeed = 0.05, loop = true, onEnd = null} = {}) {
    let node = nextAnimationGroup.targetedAnimations[0].target;
    let core = $(node); // select a node to extract core which contains methods like .do .wait .select etc.
    let result = playAnimationGroup(nextAnimationGroup, {blendSpeed, loop, onEnd});
    if (!loop) return result;
    return core; 
}

function makeNodeObject(scene) {
  let nodes = {};
  scene.transformNodes.forEach(node => {
    nodes[node.name] = node;
  });
  scene.meshes.forEach(mesh => {
    nodes[mesh.name] = mesh;
  });
  scene.lights.forEach(light => {
    nodes[light.name] = light;
  });
  scene.cameras.forEach(camera => {
    nodes[camera.name] = camera;
  });
  return nodes;
}
// usage: let n = makeNodeSelector(scene);

function makeAnimationGroupObject(scene) {
  let animations = {};
  scene.animationGroups.forEach((animationGroup) => {
    animations[animationGroup.name] = animationGroup;
    // animationGroup.stop();
  });
  return animations;
}
// usage: let a = makeAnimationGroupObject(scene)





function preventPointerHoverChangeWhenBlockedByMesh(scene) {
  scene.pointerMovePredicate = function(mesh) {
    return mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.isEnabled();
  }
}

// needs moveObjectTo, rotateToFace, playAnim, isBabylonNode to work.
function $(selectedNode) {
    if (!isBabylonNode(selectedNode)) return;
    // let currentObject = scene.getNodeByName(selectedNode);
    let currentObject = selectedNode; 
    let queue = Promise.resolve();
    console.log("selected node", selectedNode)
    let scene = currentObject.getScene();

    let core = {
        select(newObject) {
           queue = queue.then(() => new Promise(resolve => {
                currentObject = newObject;
                console.log("new object selected", currentObject.id);
                resolve();
            }));
            return core;
        },
        wait(timeMs) {  
            queue = queue.then(()=> new Promise(resolve =>{
                bjsSetTimeout(()=>{
                    resolve();
                }, timeMs);
            }));
            return core;
        },
        do(myAction) {
            queue = queue.then(() => new Promise(resolve => {
                myAction(currentObject);
                resolve();
            }));
            return core;
        },
        doForPlayAnimOnce(myAction) { //Internal use only. Helper for playAnim
            queue = queue.then(() => new Promise(resolve => {
                myAction(currentObject, resolve);
                // resolve();
            }));
            return core;
        },
        rotateTo(destination, speed) {
            if (!currentObject) return core;
            queue = queue.then(() => {
                return rotateToFace(currentObject, destination, speed);
            });
            return core;
        },
        moveTo(destination, speed) {
            if (!currentObject) return core;
            queue = queue.then(() => new Promise(resolve => {
                moveObjectTo(currentObject, destination, speed).then(() => {
                    resolve();
                });
            }));
            return core;
        },

        //unused
        loopAnim: function(nextAnimationGroup, {blendSpeed = 0.05, loop = true, onEnd = null} = {}) {
            this.do(()=>{
                playAnim(nextAnimationGroup, {blendSpeed, loop, onEnd});
            })
            return core;
        },

        playAnim: function(nextAnimationGroup, {blendSpeed = 0.05, loop = true, onEnd = null} = {}) {

            if (loop) {
                this.do(()=>{
                    playAnim(nextAnimationGroup, {blendSpeed, loop, onEnd});
                })
            } else {
                this.doForPlayAnimOnce((currentObject, resolve)=>{
                    playAnim(nextAnimationGroup, {blendSpeed, loop, onEnd: function(){
                        if (onEnd !== null) onEnd();
                        resolve();
                    }});
                })
            }
            return core;
        },
        getQueue() {
            console.log("this is queue")
            return queue;
        }
    }
    return core;
    function bjsSetTimeout(action,delay) {
        BABYLON.setAndStartTimer({
            timeout: delay,
            contextObservable: scene.onBeforeRenderObservable,
            onEnded: action 
        });
    }
}


function rotateToFace(object, destination, turnSpeed = 10) {
    destination = destination instanceof BABYLON.Vector3 ? destination : destination.getAbsolutePosition();
    const scene = object.getScene();
    if (!object.rotation) object.rotation = new BABYLON.Vector3(0, 0, 0);
    const token = cancelLocomotion(object);
    const locomotion = getLocomotionState(object);

    return new Promise(resolve => {
        const rotating = scene.onBeforeRenderObservable.add(() => {
            if (locomotion.token !== token) {
                if (locomotion.rotateObserver === rotating) locomotion.rotateObserver = null;
                resolve({ object, cancelled: true });
                return;
            }

            const currentPosition = object.getAbsolutePosition();
            const dir = destination.subtract(currentPosition);
            dir.y = 0;

            // If the target is basically on top of us, there is nothing useful to rotate toward.
            if (dir.lengthSquared() < 0.0001) {
                scene.onBeforeRenderObservable.remove(rotating);
                if (locomotion.rotateObserver === rotating) locomotion.rotateObserver = null;
                resolve({ object, cancelled: false });
                return;
            }

            const desiredYaw = Math.atan2(dir.x, dir.z);
            let deltaYaw = desiredYaw - object.rotation.y;
            deltaYaw = Math.atan2(Math.sin(deltaYaw), Math.cos(deltaYaw));

            if (!scene.deltaTime) {
                return;
            }

            const turnStep = turnSpeed * scene.deltaTime / 1000;

            if (Math.abs(deltaYaw) <= turnStep) {
                object.rotation.y = desiredYaw;
                scene.onBeforeRenderObservable.remove(rotating);
                if (locomotion.rotateObserver === rotating) locomotion.rotateObserver = null;
                resolve({ object, cancelled: false });
                return;
            }

            object.rotation.y += Math.sign(deltaYaw) * turnStep;
        });
        locomotion.rotateObserver = rotating;
    });
}


function moveObjectTo(object, destination, speed) {
    destination = destination instanceof BABYLON.Vector3 ? destination : destination.getAbsolutePosition();
    let onComplete;
    let scene = object.getScene();
    let moving = scene.onBeforeRenderObservable.add(() => {
        // Ensure deltaTime is correctly initialized

        // Get the absolute position of the object
        const currentPosition = object.getAbsolutePosition();

        // Compute the direction vector from the current position to the destination
        const direction = destination.subtract(currentPosition).normalize();

        // Calculate the distance to move based on the speed and delta time

        if (!scene.deltaTime) {
            return;
        }
        const distanceToMove = speed * scene.deltaTime / 1000;
        // console.log("distance to move", distanceToMove)
        // Move the object towards the destination
        const distance = BABYLON.Vector3.Distance(currentPosition, destination);
        if (distance > distanceToMove) {
            object.setAbsolutePosition(currentPosition.add(direction.scale(distanceToMove)));
        } else {
            // object.setAbsolutePosition(destination);
            scene.onBeforeRenderObservable.remove(moving);
            if (onComplete) {
                onComplete();
            }
        }
    });

    return new Promise(resolve =>{
        onComplete = ()=>{
            resolve(object);
        }
    });
    // return {
    //     after(doAfterDone) {
    //         onComplete = doAfterDone;
    //     }
    // }
}


function moveObjectToWithCollisions(object, destination, moveSpeed = 0.03, turnStep = 0.12, stopDistance = 0.2, gravityStep = -0.05) {
    destination = destination instanceof BABYLON.Vector3 ? destination : destination.getAbsolutePosition();

    const scene = object.getScene();
    if (!object.rotation) object.rotation = new BABYLON.Vector3(0, 0, 0);
    const token = cancelLocomotion(object);
    const locomotion = getLocomotionState(object);

    return new Promise(resolve => {
        const moving = scene.onBeforeRenderObservable.add(() => {
            if (locomotion.token !== token) {
                if (locomotion.moveObserver === moving) locomotion.moveObserver = null;
                resolve({ object, cancelled: true });
                return;
            }

            const currentPosition = object.getAbsolutePosition();
            const dir = destination.subtract(currentPosition);
            dir.y = 0;
            const distance = dir.length();

            if (distance < stopDistance) {
                scene.onBeforeRenderObservable.remove(moving);
                if (locomotion.moveObserver === moving) locomotion.moveObserver = null;
                resolve({ object, cancelled: false });
                return;
            }

            if (!scene.deltaTime) {
                object.moveWithCollisions(new BABYLON.Vector3(0, gravityStep, 0));
                return;
            }

            const desiredYaw = Math.atan2(dir.x, dir.z);
            let deltaYaw = desiredYaw - object.rotation.y;
            deltaYaw = Math.atan2(Math.sin(deltaYaw), Math.cos(deltaYaw));

            const clampedTurn = Math.max(-turnStep, Math.min(turnStep, deltaYaw));
            object.rotation.y += clampedTurn;

            let horizontalMove = BABYLON.Vector3.Zero();
            if (Math.abs(deltaYaw) <= 0.1) {
                const distanceToMove = Math.min(moveSpeed * scene.deltaTime / 1000, distance);
                horizontalMove = dir.normalize().scale(distanceToMove);
            }

            object.moveWithCollisions(new BABYLON.Vector3(horizontalMove.x, gravityStep, horizontalMove.z));
        });
        locomotion.moveObserver = moving;
    });
}


function isBabylonNode(item) {
    if (item instanceof BABYLON.Node) {
        if (item instanceof BABYLON.Mesh) {
            return 'Mesh';
        } else if (item instanceof BABYLON.Light) {
            return 'Light';
        } else if (item instanceof BABYLON.Camera) {
            return 'Camera';
        } else if (item instanceof BABYLON.TransformNode) {
            return 'TransformNode';
        } else {
            return 'Other Node';
        }
    } else {
        return 'Not a Babylon Node';
    }
}


//requires transitionAnimationGroup to work.
function playAnimationGroup(nextAnimationGroup, {blendSpeed = 0.05, loop = true, onEnd = null} = {}) {
    let mesh = nextAnimationGroup.targetedAnimations[0].target;
    let previousAnimationGroup = null;
    if (mesh.currentAnimationGroup === nextAnimationGroup) {
        return loop ? mesh : Promise.resolve(mesh);
    }
    if (mesh.currentAnimationGroup) previousAnimationGroup = mesh.currentAnimationGroup;

    let transitionResult = transitionAnimationGroup(previousAnimationGroup, nextAnimationGroup, blendSpeed, loop, onEnd);
    if (loop) mesh.currentAnimationGroup = nextAnimationGroup;
    return transitionResult;
}


function transitionAnimationGroup(previousAnimationGroup, nextAnimationGroup, blendingSpeed, loop, onEnd) {
    setAnimationGroupBlendingSpeed(nextAnimationGroup, blendingSpeed);
    let mesh = nextAnimationGroup.targetedAnimations[0].target;

    if (loop) {
        nextAnimationGroup.play(true);
        if (previousAnimationGroup) previousAnimationGroup.stop();
        return mesh;
    } else {
        if (previousAnimationGroup) setAnimationGroupBlendingSpeed(previousAnimationGroup, blendingSpeed);
        nextAnimationGroup.play(false);
        return new Promise(resolve => {
            let observable = nextAnimationGroup.onAnimationEndObservable.add(()=>{
                if (previousAnimationGroup) previousAnimationGroup.play(true);
                if (onEnd) onEnd();
                nextAnimationGroup.onAnimationEndObservable.remove(observable);
                resolve(mesh);
            })
        });
    }
    function setAnimationGroupBlendingSpeed(animationGroup, blendingSpeed) {
        animationGroup.targetedAnimations.forEach((targetedAnimation) => {
            const animation = targetedAnimation.animation;
            animation.enableBlending = true; 
            animation.blendingSpeed = blendingSpeed; 
        });
    }
}
