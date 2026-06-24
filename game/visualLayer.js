let planets = {};

async function setupGalaxyVisual(scene) {
    var orbitPlaneY = 0.7;

    materials = {
        sun: new BABYLON.StandardMaterial("sunMaterial", scene),
    };
    materials.sun.emissiveColor = new BABYLON.Color3(1, 0.9, 0.6);
    materials.sun.specularColor = new BABYLON.Color3(0, 0, 0);
    materials.sun.diffuseColor = new BABYLON.Color3(0, 0, 0);

    // Sun setup
    var sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 2.15, segments: 32 }, scene);
    sun.material = materials.sun;
    sun.position.y = orbitPlaneY;

    var sunLight = new BABYLON.PointLight("sunLight", new BABYLON.Vector3(0, 8, 0), scene);
    sunLight.intensity = 1.5;
    var fillLight = new BABYLON.HemisphericLight("softFill", new BABYLON.Vector3(0, 1, 0), scene);
    fillLight.intensity = 0.55;

    // Planet setup
    for (let id in planetData) {
        let data = planetData[id];
        let planet = BABYLON.MeshBuilder.CreateSphere(data.name, { diameter: data.size, segments: 32 }, scene);
        planet.position.x = data.distance;
        planet.position.y = orbitPlaneY;
        planet.material = new BABYLON.StandardMaterial(data.name + "Material", scene);
        planet.material.diffuseColor = new BABYLON.Color3(data.color[0], data.color[1], data.color[2]);
        planets[data.name] = planet;
    }
}

async function updateGalaxyVisual() {
    for (let id in planetData) {
        let data = planetData[id];
        let planet = planets[data.name];
        let angle = (Date.now() * 0.0001 * data.orbitSpeed) % (2 * Math.PI);
        planet.position.x = data.distance * Math.cos(angle);
        planet.position.z = data.distance * Math.sin(angle);
    }
}
