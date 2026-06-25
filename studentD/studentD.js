async function setupStudentD(scene) {

  // This is how you add models from a file:
  // await BABYLON.SceneLoader.AppendAsync("folder-name-if-file-in-folder", "filename.gltf");
  await BABYLON.SceneLoader.AppendAsync("", "studentD/studentD.glb");

  // make sure these appear AFTER loading the GLB it refers to
  let n = makeNodeObject(scene); // n holds meshes, empties/transformNodes, cameras and lights
  let a = makeAnimationGroupObject(scene);



} // DO NOT ERASE THIS