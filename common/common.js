async function setupCamera(scene) {
    scene.clearColor = new BABYLON.Color4(0.01, 0.01, 0.035, 1);
    scene.gravity = BABYLON.Vector3.Zero();
    scene.collisionsEnabled = false;

    if (scene.activeCamera) {
        scene.activeCamera.detachControl();
        scene.removeCamera(scene.activeCamera);
    }

    var canvas = scene.getEngine().getRenderingCanvas();
    var camera = new BABYLON.ArcRotateCamera(
        "isometricCamera",
        -Math.PI / 4,
        0.001,
        44,
        BABYLON.Vector3.Zero(),
        scene
    );
    camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
    setCameraOrtho(camera);

    camera.lowerBetaLimit = camera.beta;
    camera.upperBetaLimit = camera.beta;
    camera.lowerAlphaLimit = camera.alpha;
    camera.upperAlphaLimit = camera.alpha;
    camera.attachControl(canvas, true);
    scene.activeCamera = camera;
    
    scene.getEngine().onResizeObservable.add(function () {
        setCameraOrtho(camera);
    });

    function setCameraOrtho(camera) {
        var engine = scene.getEngine();
        var aspect = engine.getRenderWidth() / engine.getRenderHeight();
        var verticalSize = 12;
        camera.orthoTop = verticalSize * 0.5;
        camera.orthoBottom = verticalSize * -0.5;
        camera.orthoLeft = verticalSize * aspect * -0.5;
        camera.orthoRight = verticalSize * aspect * 0.5;
    }
}