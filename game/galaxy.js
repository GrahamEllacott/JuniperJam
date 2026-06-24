async function setupGalaxy(scene) {
    var orbitPlaneY = 0.7;

    materials = {
        sun: new BABYLON.StandardMaterial("sunMaterial", scene),
    };
    materials.sun.emissiveColor = new BABYLON.Color3(1, 0.9, 0.6);
    materials.sun.specularColor = new BABYLON.Color3(0, 0, 0);
    materials.sun.diffuseColor = new BABYLON.Color3(0, 0, 0);

    var sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 2.15, segments: 32 }, scene);
    sun.material = materials.sun;
    sun.position.y = orbitPlaneY;
}