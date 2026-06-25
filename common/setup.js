
/////////////////////////
// https://tgfwars.github.io/bjsenv/v5
////////////////////////


async function setup(scene) {
  //////////////// START first person controls. Below is code for making first-person controls for non-vr control
  scene.gravity = new BABYLON.Vector3(0, -2, 0);   // x, y and z. Y is up/down so -2 creates gravity

  // good camera for First person walking controls
  let camera = new BABYLON.UniversalCamera("Camera", new BABYLON.Vector3(0, 1.7, 0), scene);
  // This targets the camera to scene origin. Makes the camera point in a particular spot. #edit

  // camera.setTarget(new BABYLON.Vector3(0, 3, -1));
  // This attaches the camera to the scene canvas
  const renderCanvas = scene.getEngine().getRenderingCanvas();
  camera.attachControl(renderCanvas, true);

  camera.minZ = 0;

  // Allow WASD in addition to arrow keys to move
  camera.keysUp.push(87);
  camera.keysDown.push(83);
  camera.keysLeft.push(65);
  camera.keysRight.push(68);

  // how fast the camera (aka player) moves
  scene.activeCamera.speed = .5;

  // this creates a collision shape attached to camera for collision-only movement
  camera.ellipsoid = new BABYLON.Vector3(.1, .7, .1);
  camera.checkCollisions = true;
  camera.applyGravity = true;
  camera._needMoveForGravity = false;

  // creates an invisible ground plane that user can stand on
  var hiddenGround = BABYLON.MeshBuilder.CreateGround("hiddenGround", { width: 1000, height: 1000 }, scene);
  hiddenGround.collisionsEnabled = true;
  hiddenGround.checkCollisions = true;
  hiddenGround.isVisible = false;

  let vrGround = [hiddenGround];
  ///////////// END first person controls
  try {
    ////////////// XR functionality Makes the scene VR Headset-friendly. Adds teleportation controls
    var xrHelper = await scene.createDefaultXRExperienceAsync({
      // define the floor meshes
      floorMeshes: [hiddenGround] //This is an array of meshes that the player can teleport to. #edit
    });

    const teleportation = xrHelper.teleportation; //creates a variable that allows for more customization of teleportation options.

    // If you want to add more meshes after the xrHelper has already been created
    //teleportation.addFloorMesh(ground2); //ground2 would be the name of another mesh you create.

    teleportation.parabolicRayEnabled = true; // False = cast a straight line for teleportation. True = It will cast an arc for telportation
    teleportation.parabolicCheckRadius = 10; // How far you can teleport #edit
    /////////////// END XR functionality
  } catch (error) {
    console.log(error);
  }

  preventPointerHoverChangeWhenBlockedByMesh(scene);
}
