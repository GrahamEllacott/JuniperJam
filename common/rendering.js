function setCameraOrtho(camera, scene) {
  var engine = scene.getEngine();
  var aspect = engine.getRenderWidth() / engine.getRenderHeight();
  var verticalSize = 12;
  camera.orthoTop = verticalSize * 0.5;
  camera.orthoBottom = verticalSize * -0.5;
  camera.orthoLeft = verticalSize * aspect * -0.5;
  camera.orthoRight = verticalSize * aspect * 0.5;
}

function makeMat(scene, name, color, emissive, alpha) {
  var material = new BABYLON.StandardMaterial(name, scene);
  material.diffuseColor = color;
  material.emissiveColor = emissive ? color : color.scale(0.22);
  material.specularColor = new BABYLON.Color3(0.12, 0.12, 0.12);
  if (alpha !== undefined) {
    material.alpha = alpha;
  }
  return material;
}

function createCircleLines(name, radius, material, scene) {
  var points = [];
  var colors = [];
  var segments = 144;
  var alpha = material.alpha !== undefined ? material.alpha : 1;
  for (var i = 0; i <= segments; i += 1) {
    var angle = (i / segments) * Math.PI * 2;
    points.push(new BABYLON.Vector3(Math.cos(angle) * radius, 0, Math.sin(angle) * radius));
    colors.push(new BABYLON.Color4(
      material.diffuseColor.r,
      material.diffuseColor.g,
      material.diffuseColor.b,
      alpha
    ));
  }

  var lines = BABYLON.MeshBuilder.CreateLines(name, {
    points: points,
    colors: colors
  }, scene);
  lines.color = material.diffuseColor.clone();
  lines.alpha = alpha;
  lines.isPickable = false;
  return lines;
}
