async function setupCommon(scene) {
  var config = createJuniperConfig();
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
  setCameraOrtho(camera, scene);
  camera.lowerBetaLimit = camera.beta;
  camera.upperBetaLimit = camera.beta;
  camera.lowerAlphaLimit = camera.alpha;
  camera.upperAlphaLimit = camera.alpha;
  camera.attachControl(canvas, true);
  scene.activeCamera = camera;
  scene.getEngine().onResizeObservable.add(function () {
    setCameraOrtho(camera, scene);
  });

  var sunLight = new BABYLON.PointLight("sunLight", new BABYLON.Vector3(0, 8, 0), scene);
  sunLight.intensity = 1.5;
  var fillLight = new BABYLON.HemisphericLight("softFill", new BABYLON.Vector3(0, 1, 0), scene);
  fillLight.intensity = 0.55;

  var materials = {
    sun: makeMat(scene, "sunMat", new BABYLON.Color3(1, 0.78, 0.08), true),
    sunRing: makeMat(scene, "sunOrbitRingMat", new BABYLON.Color3(1, 0.82, 0.08), true, 0.85),
    satellite: makeMat(scene, "satelliteMat", new BABYLON.Color3(0.9, 0.95, 1), true),
    ring: makeMat(scene, "orbitRingMat", new BABYLON.Color3(0.05, 0.08, 0.18), false, 0.28),
    upgradeRing: makeMat(scene, "upgradeOrbitRingMat", new BABYLON.Color3(1, 1, 1), true, 0.95),
    jump: makeMat(scene, "jumpMat", new BABYLON.Color3(0.2, 0.9, 1), true),
    stars: makeMat(scene, "starMat", new BABYLON.Color3(1, 1, 1), true),
    asteroid: makeMat(scene, "asteroidMat", new BABYLON.Color3(0.46, 0.43, 0.38), false),
    sentry: makeMat(scene, "sentryMat", new BABYLON.Color3(1, 0.05, 0.03), true),
    sentryRing: makeMat(scene, "sentryRingMat", new BABYLON.Color3(1, 0.04, 0.03), false, 0.54),
    hitParticle: makeMat(scene, "hitParticleMat", new BABYLON.Color3(0.96, 0.86, 0.58), true, 0.95),
    bladeUpgrade: makeMat(scene, "bladeUpgradeMat", new BABYLON.Color3(0.18, 1, 0.92), true, 0.9),
    bladeCore: makeMat(scene, "bladeCoreMat", new BABYLON.Color3(0.88, 1, 1), true, 1),
    bladeGlow: makeMat(scene, "bladeGlowMat", new BABYLON.Color3(0.12, 0.9, 1), true, 0.38)
  };
  materials.hitParticle.disableLighting = true;
  materials.bladeUpgrade.disableLighting = true;
  materials.bladeCore.disableLighting = true;
  materials.bladeGlow.disableLighting = true;

  makeStarField(scene, materials.stars);

  var orbitPlaneY = config.orbitPlaneY;
  var sunOrbitRadius = config.sunOrbitRadius;
  var sun = BABYLON.MeshBuilder.CreateSphere("sun", { diameter: 2.15, segments: 32 }, scene);
  sun.material = materials.sun;
  sun.position.y = orbitPlaneY;
  var sunOrbitRing = createCircleLines("sunOrbitRing", sunOrbitRadius, materials.sunRing, scene);
  sunOrbitRing.position.y = orbitPlaneY;

  var orbitSpecs = config.orbitSpecs;
  var outerReturnRingRadius = config.outerReturnRingRadius;
  var outerReturnRing = createCircleLines("outerReturnRing", outerReturnRingRadius, materials.sunRing, scene);
  outerReturnRing.position.y = orbitPlaneY;
  var planets = makePlanetsForOrbits(orbitSpecs);
  var cubeSentrySpecs = config.cubeSentrySpecs;

  await BABYLON.SceneLoader.ImportMeshAsync(
    "",
    "common/",
    "face.glb",
    scene
  )

  let facePlaneNotAttachedMaterial = scene.getMeshByName("planetFace").material;
  facePlaneNotAttachedMaterial.albedoTexture.coordinatesIndex = 0;

  let facePlaneAttachedMaterial = facePlaneNotAttachedMaterial.clone();
  facePlaneAttachedMaterial.albedoTexture.coordinatesIndex = 1;

  sun.face = scene.getMeshByName("planetFace").clone("sunFace");
  sun.face.parent = sun;
  sun.face.scaling.setAll(2.15 * 0.42);
  sun.face.position.y = 2.15 * 0.5 + 0.02;
  sun.face.rotationQuaternion = null;
  sun.face.rotation.y = Math.PI * .75;

  planets.forEach(async function (planet) {
    planet.material = makeMat(scene, planet.name + "Mat", planet.color, false);
    planet.spinSpeed = randomPlanetSpinSpeed();
    planet.root = new BABYLON.TransformNode(planet.name + "Root", scene);
    planet.mesh = BABYLON.MeshBuilder.CreateSphere(planet.name, {
      diameter: planet.size,
      segments: 24
    }, scene);
    planet.mesh.material = planet.material;
    planet.mesh.parent = planet.root;
    planet.mesh.position.y = orbitPlaneY;
    planet.hasBladeUpgrade = shouldSpawnBladeUpgrade(planet);

    if (planet.showOrbitPath) {
      planet.path = createCircleLines(planet.name + "SolarOrbit", planet.solarRadius, materials.ring, scene);
      planet.path.position.y = orbitPlaneY;
    }
    planet.captureRing = createCircleLines(
      planet.name + "CaptureOrbit",
      planet.satelliteOrbit,
      planet.hasBladeUpgrade ? materials.upgradeRing : materials.ring,
      scene
    );
    planet.captureRing.parent = planet.root;
    planet.captureRing.position.y = orbitPlaneY;
    if (planet.hasBladeUpgrade && planet.orbitIndex !== 0) {
      planet.bladeUpgrade = createBladeUpgrade(planet, scene);
    }

    planet.face = scene.getMeshByName("planetFace").clone(planet.name + "Face");
    planet.face.parent = planet.root;
    planet.face.scaling.setAll(planet.size * 0.42);
    planet.face.position.y = orbitPlaneY + planet.size * 0.5 + 0.02;
    planet.face.rotationQuaternion = null;
    planet.face.rotation.y = Math.PI * .75;
    
  });

  var satelliteRoot = new BABYLON.TransformNode("satelliteRoot", scene);
  var satelliteMeshes = await loadSatelliteModel(satelliteRoot);
  var aimSight = createAimSight(scene);
  aimSight.parent = satelliteRoot;

  var state = {
    mode: "orbiting",
    currentOrbitKind: "planet",
    currentPlanet: 0,
    currentSentry: null,
    escapedPlanet: null,
    escapedSun: false,
    escapedSentry: null,
    missedLaunches: 0,
    satelliteAngle: 0.2,
    minBladeLength: 0.22,
    displayedBladeLength: 2.25,
    maxBladeLength: 2.25,
    superBladeLength: 4.8,
    superBladeThickness: 2.6,
    superBladeTime: 0,
    superBladeDuration: 8,
    furthestPlanetReached: 0,
    velocity: BABYLON.Vector3.Zero(),
    captureTransition: null,
    cubeSentries: [],
    sentryRespawns: [],
    lasers: [],
    deathTimer: 0,
    shipHealth: 100,
    maxShipHealth: 100,
    sentryDamagePerHit: 5,
    sentryHitCooldown: 0,
    difficultyTime: 0,
    damageFlashTime: 0,
    damageFlashDuration: 0.18,
    satelliteFlashMaterials: captureFlashMaterials(satelliteMeshes),
    returnFlipTime: 0,
    returnFlipDuration: 0.24,
    returnFlipStartRotation: 0,
    returnFlipTargetRotation: 0,
    cameraTarget: BABYLON.Vector3.Zero(),
    desiredCameraTarget: BABYLON.Vector3.Zero(),
    asteroids: [],
    initialAsteroidCount: config.initialAsteroidCount,
    initialReachableAsteroidCount: config.initialReachableAsteroidCount,
    particles: [],
    score: 0,
    scoreLabel: createScoreLabel(),
    enemyScore: 0,
    enemyScoreLabel: createEnemyScoreLabel(),
    healthBar: createHealthBar(),
    shakeTime: 0,
    shakeDuration: 0.18,
    shakeStrength: 0
  };
  setBladeVisual(state.maxBladeLength, 1);
  updateHealthBar();

  createCubeSentries();

  var asteroidClusterAngle = Math.random() * Math.PI * 2;
  for (var reachableAsteroidIndex = 0; reachableAsteroidIndex < state.initialReachableAsteroidCount; reachableAsteroidIndex += 1) {
    spawnAsteroid({
      orbit: makeReachableEllipticalOrbit(reachableAsteroidIndex)
    });
  }

  var outerClusterCount = state.initialAsteroidCount - state.initialReachableAsteroidCount;
  for (var asteroidIndex = 0; asteroidIndex < outerClusterCount; asteroidIndex += 1) {
    spawnAsteroid({
      orbit: makeOuterClusterOrbit(asteroidIndex, outerClusterCount, asteroidClusterAngle)
    });
  }

  var game = {
    scene: scene,
    canvas: canvas,
    camera: camera,
    config: config,
    materials: materials,
    state: state,
    planets: planets,
    sun: sun,
    satelliteRoot: satelliteRoot,
    aimSight: aimSight,
    getOrbitPlaneY: function () {
      return orbitPlaneY;
    },
    spawnAsteroid: spawnAsteroid,
    createParticleBurst: createParticleBurst,
    startCameraShake: startCameraShake
  };
  JuniperJam._setGame(game);

  window.addEventListener("keydown", function (event) {
    if (event.code !== "Space" || event.repeat || state.mode !== "orbiting") return;
    event.preventDefault();
    launchIfOrbiting();
  });

  canvas.addEventListener("pointerup", function (event) {
    if (event.pointerType !== "touch") return;
    event.preventDefault();
    launchIfOrbiting();
  });

  scene.onBeforeRenderObservable.add(function () {
    var dt = Math.min(scene.getEngine().getDeltaTime() / 1000, 0.05);
    if (state.mode !== "destroyed") {
      state.difficultyTime += dt;
    }
    updatePlanets(dt);
    updateCubeSentries(dt);
    updateCubeSentryRespawns(dt);
    updateShipHealthTimers(dt);
    updateShipDamageFlash(dt);

    if (state.mode === "orbiting") {
      updateSatelliteOrbit(dt);
    } else if (state.mode === "capturing") {
      updateSatelliteCapture(dt);
    } else if (state.mode === "destroyed") {
      updateShipDestroyed(dt);
    } else {
      updateSatelliteJump(dt);
    }
    updateReturnFlip(dt);

    updateBlade(dt);
    if (state.mode !== "destroyed") {
      checkCubeSentryThreat();
    }
    updateAsteroids(dt);
    updateParticles(dt);
    updateLasers(dt);
    updateCameraShake(dt);
    updateCameraTarget(dt);
    JuniperJam._runUpdate(dt);
  });

  function makePlanetsForOrbits(orbits) {
    var planetsForOrbits = [];
    orbits.forEach(function (orbit, orbitIndex) {
      var planetsInOrbit = getPlanetCountForRadius(orbit.solarRadius);
      var orbitSpeed = alternatingPlanetSpeed(orbitIndex, orbit.solarRadius);

      for (var i = 0; i < planetsInOrbit; i += 1) {
        var angle = orbit.angle + (Math.PI * 2 * i) / planetsInOrbit;
        var suffix = i === 0 ? "" : String(i + 1);
        planetsForOrbits.push(planetSpec(
          orbit.name + suffix,
          orbit.solarRadius,
          angle,
          orbitSpeed,
          orbit.satelliteOrbit,
          orbit.color,
          orbitIndex,
          i === 0
        ));
      }
    });
    return planetsForOrbits;
  }

  function getPlanetCountForRadius(radius) {
    return Math.max(1, Math.floor(radius / 5));
  }

  function planetSpec(name, solarRadius, angle, speed, satelliteOrbit, color, orbitIndex, showOrbitPath) {
    var size = makePlanetSize(satelliteOrbit, orbitIndex);
    return {
      name: name,
      solarRadius: solarRadius,
      angle: angle,
      speed: speed,
      satelliteOrbit: Math.max(satelliteOrbit, size * 0.92 + 0.42),
      color: color,
      size: size,
      orbitIndex: orbitIndex,
      showOrbitPath: showOrbitPath
    };
  }

  function makePlanetSize(satelliteOrbit, orbitIndex) {
    var baseSize = 0.56 + satelliteOrbit * 0.22;
    var sizeVariation = 0.72 + Math.random() * 0.95;
    var occasionalGiant = Math.random() < 0.18 + orbitIndex * 0.012 ? 1.18 + Math.random() * 0.42 : 1;
    return Math.min(2.35, baseSize * sizeVariation * occasionalGiant);
  }

  function shouldSpawnBladeUpgrade(planet) {
    return planet.orbitIndex > 0
      && planet.showOrbitPath
      && planet.orbitIndex % 3 === 1;
  }

  function alternatingPlanetSpeed(index, radius) {
    var normalSpeed = 0.42;
    var distanceScale = Math.max(0.28, 1 - radius / 42);
    var variation = 0.94 + Math.random() * 0.12;
    return normalSpeed * (index % 2 === 0 ? 2 : 1) * distanceScale * variation;
  }

  function randomPlanetSpinSpeed() {
    return Math.random() < 0.35
      ? 2.4 + Math.random() * 2.2
      : 0.55 + Math.random() * 0.9;
  }

  function createBladeUpgrade(planet, scene) {
    var points = [];
    var radius = planet.size * 0.72;
    for (var i = 0; i <= 5; i += 1) {
      var angle = -Math.PI / 2 + (i / 5) * Math.PI * 2;
      points.push(new BABYLON.Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      ));
    }

    var upgrade = BABYLON.MeshBuilder.CreateTube(planet.name + "BladeUpgrade", {
      path: points,
      radius: 0.045,
      tessellation: 8,
      cap: BABYLON.Mesh.CAP_ALL
    }, scene);
    upgrade.parent = planet.root;
    upgrade.position.y = orbitPlaneY;
    upgrade.material = materials.bladeUpgrade;
    upgrade.isPickable = false;
    return upgrade;
  }

  async function loadSatelliteModel(parent) {
    var result = await BABYLON.SceneLoader.ImportMeshAsync(
      "",
      "common/",
      "satellite.glb",
      scene
    );
    var modelRoot = new BABYLON.TransformNode("satelliteModelRoot", scene);
    modelRoot.parent = parent;

    var importedMeshes = result.meshes.filter(function (mesh) {
      return mesh instanceof BABYLON.AbstractMesh;
    });
    var importedMeshSet = new Set(importedMeshes);

    importedMeshes.forEach(function (mesh) {
      mesh.isPickable = false;
    });

    importedMeshes.forEach(function (mesh) {
      if (!mesh.parent || !importedMeshSet.has(mesh.parent)) {
        mesh.parent = modelRoot;
      }
    });

    var bounds = modelRoot.getHierarchyBoundingVectors(true);
    var size = bounds.max.subtract(bounds.min);
    var largestSide = Math.max(size.x, size.y, size.z);
    var modelScale = largestSide > 0 ? 1.05 / largestSide : 0.16;
    var center = bounds.min.add(size.scale(0.5));

    modelRoot.scaling.setAll(modelScale);
    modelRoot.position.x = -center.x * modelScale;
    modelRoot.position.y = -bounds.min.y * modelScale + 0.18;
    modelRoot.position.z = -center.z * modelScale;
    //modelRoot.rotation.x = Math.PI * 0.08;
    modelRoot.rotation.y = Math.PI * 0.5;
    modelRoot.rotation.z = Math.PI * 0.08;

    parent.rotationQuaternion = null;
    return importedMeshes; 
  }

  function updatePlanets(dt) {
    planets.forEach(function (planet) {
      planet.angle += planet.speed * dt;
      planet.root.position.x = Math.cos(planet.angle) * planet.solarRadius;
      planet.root.position.z = Math.sin(planet.angle) * planet.solarRadius;
      planet.mesh.rotation.y += dt * planet.spinSpeed;
      if (planet.bladeUpgrade) {
        planet.bladeUpgrade.rotation.y += dt * 7.5;
      }
      updatePlanetBladeUpgradeRespawn(planet, dt);

      var currentPlanet = state.currentOrbitKind === "planet" ? planets[state.currentPlanet] : null;
      if (planet == currentPlanet) {
        //change the expression
        planet.face.material = facePlaneAttachedMaterial;
      } else {
        //set to default expression
        planet.face.material = facePlaneNotAttachedMaterial;
      }
    });
    sun.face.material = state.currentOrbitKind === "sun"
      ? facePlaneAttachedMaterial
      : facePlaneNotAttachedMaterial;
  }

  function createCubeSentries() {
    cubeSentrySpecs.forEach(function (spec, index) {
      spawnCubeSentry(spec, index);
    });
  }

  function spawnCubeSentry(spec, index) {
    var root = new BABYLON.TransformNode("cubeSentryRoot" + index, scene);
    var size = spec.size || 1;
    var baseFireRadius = getBaseSentryFireRadius(size);
    var cube = BABYLON.MeshBuilder.CreatePolyhedron("cubeSentry" + index, {
      type: 0,
      size: size
    }, scene);
    cube.parent = root;
    cube.material = materials.sentry.clone("sentryMatInstance" + index);
    cube.material.emissiveColor = cube.material.diffuseColor.scale(0.28);
    cube.material.specularColor = new BABYLON.Color3(0.7, 0.18, 0.14);
    cube.material.alpha = 0;
    cube.rotation.x = Math.PI * 0.16;
    cube.rotation.y = Math.PI * 0.25;
    cube.rotation.z = Math.PI * 0.08;
    cube.isPickable = false;

    var dangerRing = createCircleLines("cubeSentryDangerOrbit" + index, baseFireRadius, materials.sentryRing, scene);
    dangerRing.parent = root;
    dangerRing.position.y = orbitPlaneY;
    dangerRing.alpha = 0;

    var sentry = {
      root: root,
      cube: cube,
      dangerRing: dangerRing,
      radius: spec.radius,
      angle: spec.angle,
      size: size,
      baseFireRadius: baseFireRadius,
      fireRadius: baseFireRadius,
      baseChaseSpeed: config.sentryBaseChaseSpeed,
      chaseSpeed: config.sentryBaseChaseSpeed,
      isChasing: false,
      specIndex: index,
      spawnFade: 0,
      spawnFadeDuration: 0.7,
      laser: null
    };
    updateCubeSentryDifficulty(sentry);
    state.cubeSentries.push(sentry);
    placeCubeSentry(sentry);
  }

  function getBaseSentryFireRadius(size) {
    return 2.5 + size * size * 1.35;
  }

  function updateCubeSentries(dt) {
    state.cubeSentries.forEach(function (sentry) {
      updateCubeSentryDifficulty(sentry);
      if (sentry.spawnFade < sentry.spawnFadeDuration) {
        sentry.spawnFade = Math.min(sentry.spawnFadeDuration, sentry.spawnFade + dt);
        updateCubeSentryFade(sentry);
      }
      sentry.cube.rotation.x = Math.PI * 0.16;
      sentry.cube.rotation.y += dt * 1.45;
      sentry.cube.rotation.z = Math.PI * 0.08;
      updateCubeSentryChase(sentry, dt);
    });
  }

  function updateCubeSentryDifficulty(sentry) {
    sentry.fireRadius = sentry.baseFireRadius;
    sentry.chaseSpeed = sentry.baseChaseSpeed * JuniperDifficulty.sentrySpeedMultiplier(state, config);
    sentry.dangerRing.scaling.x = 1;
    sentry.dangerRing.scaling.z = 1;
  }

  function getAsteroidHealAmount() {
    return JuniperDifficulty.asteroidHealAmount(state, config);
  }

  function getAsteroidFragmentCount() {
    return JuniperDifficulty.asteroidFragmentCount(state, config);
  }

  function updateCubeSentryChase(sentry, dt) {
    var toSatellite = satelliteRoot.position.subtract(sentry.root.position);
    toSatellite.y = 0;
    var distance = toSatellite.length();
    if (distance <= sentry.fireRadius) {
      sentry.isChasing = true;
    }

    if (!sentry.isChasing || distance < 0.05) return;

    toSatellite.normalize();
    sentry.root.position.addInPlace(toSatellite.scale(sentry.chaseSpeed * dt));
    sentry.root.position.y = orbitPlaneY;
  }

  function updateCubeSentryFade(sentry) {
    var progress = sentry.spawnFade / sentry.spawnFadeDuration;
    var alpha = easeInOut(progress);
    sentry.cube.material.alpha = alpha;
    sentry.dangerRing.alpha = 0.54 * alpha;
  }

  function updateCubeSentryRespawns(dt) {
    for (var i = state.sentryRespawns.length - 1; i >= 0; i -= 1) {
      var respawn = state.sentryRespawns[i];
      respawn.time -= dt;
      if (respawn.time <= 0) {
        spawnCubeSentry(cubeSentrySpecs[respawn.specIndex], respawn.specIndex);
        state.sentryRespawns.splice(i, 1);
      }
    }
  }

  function placeCubeSentry(sentry) {
    sentry.root.position.x = Math.cos(sentry.angle) * sentry.radius;
    sentry.root.position.y = orbitPlaneY;
    sentry.root.position.z = Math.sin(sentry.angle) * sentry.radius;
  }

  function disposeCubeSentry(sentry) {
    if (sentry.laser) {
      var laserIndex = state.lasers.indexOf(sentry.laser);
      if (laserIndex !== -1) {
        state.lasers.splice(laserIndex, 1);
      }
      sentry.laser.mesh.dispose();
      sentry.laser = null;
    }
    sentry.dangerRing.dispose();
    sentry.cube.material.dispose();
    sentry.cube.dispose();
    sentry.root.dispose();
  }

  function getCurrentOrbitAnchor() {
    if (state.currentOrbitKind === "sun") {
      return getOrbitAnchor("sun", null);
    }
    if (state.currentOrbitKind === "sentry" && state.currentSentry !== null) {
      return getOrbitAnchor("sentry", state.currentSentry);
    }
    return getOrbitAnchor("planet", state.currentPlanet);
  }

  function getOrbitAnchor(kind, index) {
    if (kind === "sun") {
      return {
        root: sun,
        orbitRadius: sunOrbitRadius
      };
    }

    if (kind === "sentry") {
      var sentry = state.cubeSentries[index];
      return {
        root: sentry.root,
        orbitRadius: sentry.fireRadius
      };
    }

    var planet = planets[index];
    return {
      root: planet.root,
      orbitRadius: planet.satelliteOrbit
    };
  }

  function updateSatelliteOrbit(dt) {
    var anchor = getCurrentOrbitAnchor();
    state.satelliteAngle += getCurrentSatelliteOrbitSpeed() * dt;
    var offset = new BABYLON.Vector3(
      Math.cos(state.satelliteAngle) * anchor.orbitRadius,
      0,
      Math.sin(state.satelliteAngle) * anchor.orbitRadius
    );
    satelliteRoot.position.copyFrom(anchor.root.position.add(offset));
    if (state.currentOrbitKind === "sentry") {
      satelliteRoot.rotation.y -= dt * 10.5;
    } else {
      pointSatelliteInDirection(offset);
    }
    
  }

  function getCurrentSatelliteOrbitSpeed() {
    var baseSpeed = state.currentOrbitKind === "sentry" ? 0.72 : 2.45;
    return state.superBladeTime > 0 ? baseSpeed * 2.35 : baseSpeed;
  }

  function updateSatelliteCapture(dt) {
    var transition = state.captureTransition;
    if (!transition) {
      state.mode = "orbiting";
      return;
    }

    var anchor = getOrbitAnchor(transition.targetKind, transition.targetIndex);
    transition.elapsed += dt;

    var progress = Math.min(transition.elapsed / transition.duration, 1);
    var easedProgress = easeInOut(progress);
    var targetAngle = transition.targetAngle;
    var angle = transition.startAngle;
    var radius = lerpValue(transition.startRadius, anchor.orbitRadius, easedProgress);
    var offset = new BABYLON.Vector3(
      Math.cos(angle) * radius,
      0,
      Math.sin(angle) * radius
    );
    var targetRotation = Math.atan2(offset.x, offset.z);

    satelliteRoot.position.copyFrom(anchor.root.position.add(offset));
    satelliteRoot.rotation.y = lerpCounterClockwiseAngle(transition.startRotation, targetRotation, easedProgress);

    if (progress >= 1) {
      state.satelliteAngle = targetAngle;
      state.captureTransition = null;
      state.mode = "orbiting";
      pointSatelliteInDirection(offset);
    }
  }

  function updateCameraTarget(dt) {
    state.desiredCameraTarget.copyFrom(getCameraFocusPosition());
    state.desiredCameraTarget.y = 0;
    state.desiredCameraTarget.addInPlace(state.shakeOffset || BABYLON.Vector3.Zero());
    BABYLON.Vector3.LerpToRef(
      state.cameraTarget,
      state.desiredCameraTarget,
      Math.min(dt * 7.5, 1),
      state.cameraTarget
    );
    camera.setTarget(state.cameraTarget);
  }

  function getCameraFocusPosition() {
    if (state.mode === "orbiting") {
      return getCurrentOrbitAnchor().root.position;
    }
    if (state.mode === "capturing" && state.captureTransition) {
      return getOrbitAnchor(state.captureTransition.targetKind, state.captureTransition.targetIndex).root.position;
    }
    return satelliteRoot.position;
  }

  function launchSatellite() {
    var direction = state.currentOrbitKind === "sentry"
      ? getDirectionAwayFromCurrentSentry()
      : getOutwardDirection();
    pointSatelliteInDirection(direction);

    state.mode = "jumping";
    state.escapedPlanet = state.currentOrbitKind === "planet" ? state.currentPlanet : null;
    state.escapedSun = state.currentOrbitKind === "sun";
    state.escapedSentry = state.currentOrbitKind === "sentry" ? state.currentSentry : null;
    state.velocity = direction.scale(9.5);
  }

  function launchIfOrbiting() {
    if (state.mode !== "orbiting") return;

    launchSatellite();
  }

  function updateBlade(dt) {
    updateBladeLengthVisual(dt);

    if (state.mode === "orbiting" || state.mode === "jumping" || state.mode === "capturing") {
      checkBladeHitsAsteroids();
    }
  }

  function updateBladeLengthVisual(dt) {
    state.superBladeTime = Math.max(0, state.superBladeTime - dt);
    var targetLength = getTargetBladeLength();
    var bladeThickness = state.superBladeTime > 0 ? state.superBladeThickness : 1;
    state.displayedBladeLength = targetLength;
    setBladeVisual(state.displayedBladeLength, bladeThickness);
  }

  function getTargetBladeLength() {
    var healthBladeLength = getHealthBladeLength();
    return state.superBladeTime > 0
      ? Math.max(healthBladeLength, state.superBladeLength)
      : healthBladeLength;
  }

  function getHealthBladeLength() {
    var healthPercent = state.maxShipHealth > 0 ? state.shipHealth / state.maxShipHealth : 0;
    healthPercent = Math.max(0, Math.min(1, healthPercent));
    return lerpValue(state.minBladeLength, state.maxBladeLength, healthPercent);
  }

  function spawnAsteroid(options) {
    options = options || {};
    var breakLevel = options.breakLevel || 0;
    var radius = options.radius || (0.72 + Math.random() * 0.28);
    var orbit = options.orbit || makeRandomAsteroidOrbit();

    var root = new BABYLON.TransformNode("asteroidRoot", scene);
    var rock = createChunkyAsteroid("asteroid", radius, scene);
    rock.parent = root;
    rock.material = materials.asteroid;
    rock.scaling = new BABYLON.Vector3(
      1 + Math.random() * 0.8,
      0.7 + Math.random() * 0.6,
      0.8 + Math.random() * 0.7
    );
    rock.isPickable = false;

    var asteroid = {
      root: root,
      rock: rock,
      angle: orbit.angle,
      speed: (0.16 + Math.random() * 0.22) * (1 + breakLevel * 0.25),
      majorRadius: orbit.majorRadius,
      minorRadius: orbit.minorRadius,
      orbitRotation: orbit.orbitRotation,
      breakLevel: breakLevel,
      radius: radius * 1.5,
      age: 0
    };
    if (orbit.speed) {
      asteroid.speed = orbit.speed;
    }
    state.asteroids.push(asteroid);
    placeAsteroid(asteroid);
  }

  function updateAsteroids(dt) {
    for (var i = state.asteroids.length - 1; i >= 0; i -= 1) {
      var asteroid = state.asteroids[i];
      asteroid.age += dt;
      asteroid.rock.rotation.x += dt * 1.3;
      asteroid.rock.rotation.y += dt * 0.9;
      asteroid.angle += asteroid.speed * dt;
      placeAsteroid(asteroid);
    }
  }

  function createChunkyAsteroid(name, radius, scene) {
    var rock = BABYLON.MeshBuilder.CreateIcoSphere(name, {
      radius: radius,
      subdivisions: 1,
      flat: true
    }, scene);
    var positions = rock.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    var vertexScales = {};

    for (var i = 0; i < positions.length; i += 3) {
      var key = positions[i].toFixed(3) + "," + positions[i + 1].toFixed(3) + "," + positions[i + 2].toFixed(3);
      if (!vertexScales[key]) {
        vertexScales[key] = 0.72 + Math.random() * 0.52;
      }
      positions[i] *= vertexScales[key];
      positions[i + 1] *= vertexScales[key];
      positions[i + 2] *= vertexScales[key];
    }

    var indices = rock.getIndices();
    var normals = [];
    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    rock.setVerticesData(BABYLON.VertexBuffer.PositionKind, positions);
    rock.setVerticesData(BABYLON.VertexBuffer.NormalKind, normals);
    return rock;
  }

  function placeAsteroid(asteroid) {
    var cosAngle = Math.cos(asteroid.angle);
    var sinAngle = Math.sin(asteroid.angle);
    var cosRotation = Math.cos(asteroid.orbitRotation);
    var sinRotation = Math.sin(asteroid.orbitRotation);
    var x = cosAngle * asteroid.majorRadius;
    var z = sinAngle * asteroid.minorRadius;

    asteroid.root.position.x = x * cosRotation - z * sinRotation;
    asteroid.root.position.y = orbitPlaneY;
    asteroid.root.position.z = x * sinRotation + z * cosRotation;
  }

  function checkBladeHitsAsteroids() {
    var bladeStart = getBladePoint(0.52);
    var bladeEnd = getBladePoint(0.52 + getTargetBladeLength());

    for (var sentryIndex = state.cubeSentries.length - 1; sentryIndex >= 0; sentryIndex -= 1) {
      var sentry = state.cubeSentries[sentryIndex];
      var sentryPosition = sentry.root.position;
      var sentryHitDistance = getSentryBladeHitRadius(sentry);

      if (distancePointToSegmentSquared(sentryPosition, bladeStart, bladeEnd) <= sentryHitDistance * sentryHitDistance) {
        hitCubeSentry(sentry, sentryIndex);
        return;
      }
    }

    for (var i = state.asteroids.length - 1; i >= 0; i -= 1) {
      var asteroid = state.asteroids[i];
      var asteroidPosition = asteroid.root.position;
      var hitDistance = asteroid.radius + 0.18;

      if (distancePointToSegmentSquared(asteroidPosition, bladeStart, bladeEnd) <= hitDistance * hitDistance) {
        hitAsteroid(asteroid, i);
        return;
      }
    }
  }

  function getSentryBladeHitRadius(sentry) {
    return Math.max(1.15, sentry.size * 0.95 + 0.55);
  }

  function hitCubeSentry(sentry, sentryIndex) {
    state.enemyScore += 1;
    updateEnemyScoreLabel();
    startCameraShake(0.42);
    createParticleBurst(sentry.root.position, 1.2);
    state.cubeSentries.splice(sentryIndex, 1);
    state.sentryRespawns.push({
      specIndex: sentry.specIndex,
      time: 5.5 + Math.random() * 2.5
    });
    disposeCubeSentry(sentry);
  }

  function disposeAsteroid(asteroid) {
    asteroid.rock.dispose();
    asteroid.root.dispose();
  }

  function hitAsteroid(asteroid, asteroidIndex) {
    state.score += 1;
    updateScoreLabel();
    healShipFromAsteroidSlice();
    startCameraShake(0.3);
    createParticleBurst(asteroid.root.position, asteroid.radius);
    state.asteroids.splice(asteroidIndex, 1);
    breakAsteroid(asteroid);
  }

  function healShipFromAsteroidSlice() {
    if (state.shipHealth >= state.maxShipHealth) return;

    state.shipHealth = Math.min(state.maxShipHealth, state.shipHealth + getAsteroidHealAmount());
    updateHealthBar();
  }

  function startCameraShake(strength) {
    state.shakeTime = state.shakeDuration;
    state.shakeStrength = strength;
    state.shakeOffset = state.shakeOffset || BABYLON.Vector3.Zero();
  }

  function updateCameraShake(dt) {
    state.shakeOffset = state.shakeOffset || BABYLON.Vector3.Zero();
    if (state.shakeTime <= 0) {
      state.shakeOffset.copyFromFloats(0, 0, 0);
      return;
    }

    state.shakeTime = Math.max(0, state.shakeTime - dt);
    var fade = state.shakeTime / state.shakeDuration;
    state.shakeOffset.x = (Math.random() - 0.5) * state.shakeStrength * fade;
    state.shakeOffset.y = 0;
    state.shakeOffset.z = (Math.random() - 0.5) * state.shakeStrength * fade;
  }

  function createParticleBurst(position, radius) {
    var count = 10 + Math.floor(Math.random() * 5);
    for (var i = 0; i < count; i += 1) {
      var particle = BABYLON.MeshBuilder.CreatePlane("hitParticle", {
        size: 0.12 + Math.random() * 0.08
      }, scene);
      var angle = Math.random() * Math.PI * 2;
      var speed = 2.4 + Math.random() * 1.8;
      particle.position.copyFrom(position);
      particle.position.y = orbitPlaneY + (Math.random() - 0.5) * 0.3;
      particle.rotation.x = Math.PI / 2;
      particle.rotation.z = Math.random() * Math.PI;
      particle.material = makeSparkMaterial("hitParticleMatInstance", new BABYLON.Color3(1, 1, 1), 0.95);
      particle.isPickable = false;

      state.particles.push({
        mesh: particle,
        velocity: new BABYLON.Vector3(
          Math.cos(angle) * speed,
          (Math.random() - 0.5) * 2.5,
          Math.sin(angle) * speed
        ),
        age: 0,
        lifetime: 0.45 + Math.random() * 0.16,
        startScale: 0.7 + radius * 0.2
      });
    }
  }

  function updateParticles(dt) {
    for (var i = state.particles.length - 1; i >= 0; i -= 1) {
      var particle = state.particles[i];
      particle.age += dt;
      particle.mesh.position.addInPlace(particle.velocity.scale(dt));

      var progress = particle.age / particle.lifetime;
      var colorProgress = Math.max(0, (progress - 0.18) / 0.55);
      var sparkColor = BABYLON.Color3.Lerp(
        new BABYLON.Color3(1, 1, 1),
        new BABYLON.Color3(1, 0.78, 0.08),
        Math.min(colorProgress, 1)
      );
      particle.mesh.scaling.setAll(particle.startScale * (1 + progress * 1.4));
      setSparkMaterialColor(particle.mesh.material, sparkColor);
      particle.mesh.material.alpha = progress < 0.72 ? 0.95 : Math.max(0, 0.95 * (1 - progress) / 0.28);

      if (particle.age >= particle.lifetime) {
        particle.mesh.material.dispose();
        particle.mesh.dispose();
        state.particles.splice(i, 1);
      }
    }
  }

  function createLaserBurst(sentry) {
    if (sentry.laser) {
      sentry.laser.age = 0;
      return;
    }

    var points = getLockedLaserPoints(sentry);
    var laser = BABYLON.MeshBuilder.CreateLines("sentryLaser", {
      points: points,
      updatable: true
    }, scene);
    laser.color = new BABYLON.Color3(1, 0.05, 0.03);
    laser.alpha = 1;
    laser.isPickable = false;

    sentry.laser = {
      mesh: laser,
      sentry: sentry,
      age: 0,
      lifetime: 0.22
    };
    state.lasers.push(sentry.laser);
  }

  function updateLasers(dt) {
    for (var i = state.lasers.length - 1; i >= 0; i -= 1) {
      var laser = state.lasers[i];
      laser.age += dt;

      var progress = laser.age / laser.lifetime;
      var points = getLockedLaserPoints(laser.sentry);
      BABYLON.MeshBuilder.CreateLines("sentryLaser", {
        points: points,
        instance: laser.mesh
      }, scene);

      var flash = Math.sin(laser.age * 95) > 0 ? 1 : 0;
      laser.mesh.color = flash
        ? new BABYLON.Color3(1, 0.94, 0.45)
        : new BABYLON.Color3(1, 0.05, 0.03);
      laser.mesh.alpha = Math.max(0, 1 - progress * 0.55);

      if (laser.age >= laser.lifetime) {
        laser.mesh.dispose();
        laser.sentry.laser = null;
        state.lasers.splice(i, 1);
      }
    }
  }

  function getLockedLaserPoints(sentry) {
    var start = sentry.root.position;
    var end = satelliteRoot.position;
    return [
      new BABYLON.Vector3(
        start.x,
        orbitPlaneY + 0.32,
        start.z
      ),
      new BABYLON.Vector3(
        end.x,
        orbitPlaneY + 0.04,
        end.z
      )
    ];
  }
  function makeSparkMaterial(name, color, alpha) {
    var material = new BABYLON.StandardMaterial(name, scene);
    material.disableLighting = true;
    material.backFaceCulling = false;
    material.specularColor = BABYLON.Color3.Black();
    material.alpha = alpha;
    material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
    setSparkMaterialColor(material, color);
    return material;
  }

  function setSparkMaterialColor(material, color) {
    material.diffuseColor = color;
    material.emissiveColor = color;
    material.ambientColor = color;
  }

  function createScoreLabel() {
    return createHudLabel("Asteroids: 0", 14);
  }

  function updateScoreLabel() {
    state.scoreLabel.textContent = "Asteroids: " + state.score;
  }

  function createEnemyScoreLabel() {
    return createHudLabel("Enemies: 0", 38);
  }

  function updateEnemyScoreLabel() {
    state.enemyScoreLabel.textContent = "Enemies: " + state.enemyScore;
  }

  function createHudLabel(text, top) {
    var label = document.createElement("div");
    label.style.position = "fixed";
    label.style.left = "16px";
    label.style.top = top + "px";
    label.style.color = "white";
    label.style.font = "600 18px Arial, sans-serif";
    label.style.letterSpacing = "0";
    label.style.pointerEvents = "none";
    label.style.zIndex = "11";
    label.textContent = text;
    document.body.appendChild(label);
    return label;
  }

  function createHealthBar() {
    var frame = document.createElement("div");
    frame.style.position = "fixed";
    frame.style.left = "16px";
    frame.style.top = "64px";
    frame.style.width = "170px";
    frame.style.height = "10px";
    frame.style.border = "1px solid rgba(255,255,255,0.75)";
    frame.style.background = "rgba(18, 10, 18, 0.72)";
    frame.style.pointerEvents = "none";
    frame.style.zIndex = "11";

    var fill = document.createElement("div");
    fill.style.width = "100%";
    fill.style.height = "100%";
    fill.style.background = "rgb(255, 50, 35)";
    frame.appendChild(fill);
    document.body.appendChild(frame);

    return {
      frame: frame,
      fill: fill
    };
  }

  function updateHealthBar() {
    var healthPercent = state.maxShipHealth > 0 ? state.shipHealth / state.maxShipHealth : 0;
    state.healthBar.fill.style.width = Math.max(0, Math.min(1, healthPercent)) * 100 + "%";
  }

  function updateShipHealthTimers(dt) {
    state.sentryHitCooldown = Math.max(0, state.sentryHitCooldown - dt);
  }

  function captureFlashMaterials(meshes) {
    return meshes
      .filter(function (mesh) {
        return mesh.material;
      })
      .map(function (mesh) {
        return {
          material: mesh.material,
          diffuse: mesh.material.diffuseColor ? mesh.material.diffuseColor.clone() : null,
          emissive: mesh.material.emissiveColor ? mesh.material.emissiveColor.clone() : null,
          ambient: mesh.material.ambientColor ? mesh.material.ambientColor.clone() : null
        };
      });
  }

  function startShipDamageFlash() {
    state.damageFlashTime = state.damageFlashDuration;
    applyShipDamageFlash(1);
  }

  function updateShipDamageFlash(dt) {
    if (state.damageFlashTime <= 0) return;

    state.damageFlashTime = Math.max(0, state.damageFlashTime - dt);
    var flashAmount = state.damageFlashTime / state.damageFlashDuration;
    applyShipDamageFlash(flashAmount);
  }

  function applyShipDamageFlash(amount) {
    var white = new BABYLON.Color3(1, 1, 1);
    state.satelliteFlashMaterials.forEach(function (entry) {
      if (entry.diffuse && entry.material.diffuseColor) {
        entry.material.diffuseColor = BABYLON.Color3.Lerp(entry.diffuse, white, amount);
      }
      if (entry.emissive && entry.material.emissiveColor) {
        entry.material.emissiveColor = BABYLON.Color3.Lerp(entry.emissive, white, amount);
      }
      if (entry.ambient && entry.material.ambientColor) {
        entry.material.ambientColor = BABYLON.Color3.Lerp(entry.ambient, white, amount);
      }
    });
  }

  function breakAsteroid(asteroid) {
    var breakPosition = asteroid.root.position.clone();
    var nextBreakLevel = asteroid.breakLevel + 1;

    disposeAsteroid(asteroid);
    if (asteroid.breakLevel >= 2) return;

    var fragmentCount = getAsteroidFragmentCount();
    for (var i = 0; i < fragmentCount; i += 1) {
      var fragmentOptions = {
        breakLevel: nextBreakLevel,
        radius: asteroid.radius * 0.38,
        orbit: makeFragmentAsteroidOrbit(breakPosition, i, nextBreakLevel)
      };

      spawnAsteroid(fragmentOptions);
    }
  }

  function makeRandomAsteroidOrbit() {
    return makeOuterClusterOrbit(0, 1, Math.random() * Math.PI * 2);
  }

  function makeOuterClusterOrbit(index, count, clusterAngle) {
    var outerPlanet = planets[planets.length - 1];
    var radius = outerPlanet.solarRadius - 0.9 - Math.random() * 1.2;
    var clusterSpread = 0.9;
    var angleOffset = count > 1 ? (index / Math.max(1, count - 1) - 0.5) * clusterSpread : 0;

    return {
      majorRadius: radius,
      minorRadius: radius,
      orbitRotation: Math.random() * Math.PI * 2,
      angle: clusterAngle + angleOffset + (Math.random() - 0.5) * 0.12,
      speed: makeAsteroidSpeed(radius, 0)
    };
  }

  function makeReachableEllipticalOrbit(index) {
    var planet = planets[index % Math.min(4, planets.length)];
    var outerLimit = planets[planets.length - 1].solarRadius - 0.7;
    var majorRadius = Math.min(outerLimit, planet.solarRadius + planet.satelliteOrbit + 1.1 + Math.random() * 3.1);
    var minorRadius = Math.max(1.6, majorRadius * (0.32 + Math.random() * 0.25));

    return {
      majorRadius: majorRadius,
      minorRadius: minorRadius,
      orbitRotation: Math.random() * Math.PI * 2,
      angle: Math.random() * Math.PI * 2,
      speed: makeAsteroidSpeed(majorRadius, 0) * 1.15
    };
  }

  function makeFragmentAsteroidOrbit(position, fragmentIndex, breakLevel) {
    var innerPlanetLimit = Math.max(1, planets.length - 2);
    var planet = planets[Math.floor(Math.random() * innerPlanetLimit)];
    var outerLimit = planets[planets.length - 1].solarRadius - 0.7;
    var laneRadius = Math.min(outerLimit, planet.solarRadius + planet.satelliteOrbit + 0.45 + Math.random() * 0.9);
    var angle = Math.atan2(position.z, position.x) + (fragmentIndex - 1) * 0.28 + (Math.random() - 0.5) * 0.24;

    return {
      majorRadius: laneRadius,
      minorRadius: laneRadius,
      orbitRotation: 0,
      angle: angle,
      speed: makeAsteroidSpeed(laneRadius, breakLevel)
    };
  }

  function makeAsteroidSpeed(radius, breakLevel) {
    var direction = Math.random() < 0.5 ? -1 : 1;
    var distanceFactor = Math.max(0.45, 1.25 - radius / 28);
    return direction * (0.14 + Math.random() * 0.22 + breakLevel * 0.08) * distanceFactor;
  }

  function updateSatelliteJump(dt) {
    satelliteRoot.position.addInPlace(state.velocity.scale(dt));
    pointSatelliteInDirection(state.velocity);

    var escaped = planets[state.escapedPlanet];
    if (escaped) {
      var oldDistance = BABYLON.Vector3.Distance(satelliteRoot.position, escaped.root.position);
      if (oldDistance > escaped.satelliteOrbit + 0.55) {
        state.escapedPlanet = null;
      }
    }

    var escapedSentry = state.escapedSentry !== null ? state.cubeSentries[state.escapedSentry] : null;
    if (escapedSentry) {
      var oldSentryDistance = BABYLON.Vector3.Distance(satelliteRoot.position, escapedSentry.root.position);
      if (oldSentryDistance > escapedSentry.fireRadius + 0.55) {
        state.escapedSentry = null;
      }
    }

    var insideSentryRadius = isShipInsideAnySentryRadius();
    var toSun = satelliteRoot.position.subtract(sun.position);
    toSun.y = 0;
    var sunDistance = toSun.length();
    if (state.escapedSun && sunDistance > sunOrbitRadius + 0.55) {
      state.escapedSun = false;
    }

    if (!insideSentryRadius && !state.escapedSun && Math.abs(sunDistance - sunOrbitRadius) < 0.34) {
      captureSun(toSun);
      return;
    }

    if (redirectShipFromOuterReturnRing()) {
      return;
    }

    for (var i = 0; i < planets.length; i += 1) {
      if (state.escapedPlanet === i) continue;

      var planet = planets[i];
      var toSatellite = satelliteRoot.position.subtract(planet.root.position);
      toSatellite.y = 0;
      var distance = toSatellite.length();
      var hitOrbit = Math.abs(distance - planet.satelliteOrbit) < 0.34;

      if (!insideSentryRadius && hitOrbit) {
        capturePlanet(i, toSatellite);
        return;
      }
    }

  }

  function isShipInsideAnySentryRadius() {
    for (var i = 0; i < state.cubeSentries.length; i += 1) {
      var sentry = state.cubeSentries[i];
      var toSatellite = satelliteRoot.position.subtract(sentry.root.position);
      toSatellite.y = 0;
      if (toSatellite.length() <= sentry.fireRadius) {
        return true;
      }
    }

    return false;
  }

  function redirectShipFromOuterReturnRing() {
    var fromSun = satelliteRoot.position.subtract(sun.position);
    fromSun.y = 0;
    var distance = fromSun.length();
    if (distance < outerReturnRingRadius) {
      return false;
    }

    var outwardSpeed = BABYLON.Vector3.Dot(fromSun, state.velocity);
    if (outwardSpeed <= 0) {
      return false;
    }

    fromSun.normalize();
    satelliteRoot.position.copyFrom(sun.position.add(fromSun.scale(outerReturnRingRadius)));
    var inwardDirection = fromSun.scale(-1);
    var launchSpeed = Math.max(9.5, state.velocity.length());
    state.velocity = inwardDirection.scale(launchSpeed);
    startReturnFlip(inwardDirection);
    state.escapedPlanet = null;
    state.escapedSun = false;
    state.escapedSentry = null;
    return true;
  }

  function startReturnFlip(direction) {
    state.returnFlipStartRotation = satelliteRoot.rotation.y;
    state.returnFlipTargetRotation = Math.atan2(direction.x, direction.z);
    state.returnFlipTime = state.returnFlipDuration;
  }

  function updateReturnFlip(dt) {
    if (state.returnFlipTime <= 0) return;

    state.returnFlipTime = Math.max(0, state.returnFlipTime - dt);
    var progress = 1 - state.returnFlipTime / state.returnFlipDuration;
    var easedProgress = easeInOut(progress);
    satelliteRoot.rotation.y = state.returnFlipStartRotation
      + shortestAngleDelta(state.returnFlipStartRotation, state.returnFlipTargetRotation) * easedProgress;

    if (state.returnFlipTime <= 0) {
      satelliteRoot.rotation.y = state.returnFlipTargetRotation;
    }
  }

  function checkCubeSentryThreat() {
    for (var i = 0; i < state.cubeSentries.length; i += 1) {
      var sentry = state.cubeSentries[i];
      var toSatellite = satelliteRoot.position.subtract(sentry.root.position);
      toSatellite.y = 0;
      var distance = toSatellite.length();

      if (distance <= sentry.fireRadius) {
        damageShipWithSentry(sentry);
        return true;
      }
    }

    return false;
  }

  function damageShipWithSentry(sentry) {
    if (state.sentryHitCooldown > 0) return;

    createLaserBurst(sentry);
    createParticleBurst(satelliteRoot.position, 0.75);
    startCameraShake(0.25);
    startShipDamageFlash();
    state.shipHealth = Math.max(0, state.shipHealth - state.sentryDamagePerHit);
    state.sentryHitCooldown = 0.55;
    updateHealthBar();

    if (state.shipHealth <= 0) {
      destroyShipWithSentry();
    }
  }

  function destroyShipWithSentry() {
    createParticleBurst(satelliteRoot.position, 1.4);
    startCameraShake(0.75);
    handleShipDeathCounters();
    state.velocity.copyFromFloats(0, 0, 0);
    state.captureTransition = null;
    state.deathTimer = 0.42;
    state.mode = "destroyed";
    state.escapedPlanet = null;
    state.escapedSun = false;
    satelliteRoot.setEnabled(false);
  }

  function handleShipDeathCounters() {
    state.score = 0;
    state.enemyScore = 0;
    state.difficultyTime = 0;
    updateScoreLabel();
    updateEnemyScoreLabel();
  }

  function updateShipDestroyed(dt) {
    state.deathTimer -= dt;
    if (state.deathTimer <= 0) {
      respawnAtCurrentPlanet();
    }
  }

  function respawnAtCurrentPlanet() {
    state.currentPlanet = 0;
    var planet = planets[state.currentPlanet];
    state.currentOrbitKind = "planet";
    state.currentSentry = null;
    state.satelliteAngle = 0;
    var offset = new BABYLON.Vector3(
      Math.cos(state.satelliteAngle) * planet.satelliteOrbit,
      0,
      Math.sin(state.satelliteAngle) * planet.satelliteOrbit
    );

    satelliteRoot.setEnabled(true);
    satelliteRoot.position.copyFrom(planet.root.position.add(offset));
    pointSatelliteInDirection(offset);
    state.deathTimer = 0;
    state.damageFlashTime = 0;
    applyShipDamageFlash(0);
    state.shipHealth = state.maxShipHealth;
    updateHealthBar();
    state.velocity.copyFromFloats(0, 0, 0);
    state.mode = "orbiting";
  }

  function capturePlanet(index, offset) {
    var planet = planets[index];
    var captureAngle = Math.atan2(offset.z, offset.x);
    state.currentOrbitKind = "planet";
    state.currentPlanet = index;
    state.currentSentry = null;
    state.velocity.copyFromFloats(0, 0, 0);
    state.missedLaunches = 0;
    collectPlanetBladeUpgrade(planet);
    state.captureTransition = {
      targetKind: "planet",
      targetIndex: index,
      elapsed: 0,
      duration: 0.65,
      startAngle: captureAngle,
      targetAngle: captureAngle,
      startRadius: Math.max(0.01, offset.length()),
      startRotation: satelliteRoot.rotation.y
    };
    state.mode = "capturing";
    state.escapedPlanet = null;
    state.escapedSun = false;
    state.escapedSentry = null;
  }

  function captureSun(offset) {
    var captureAngle = Math.atan2(offset.z, offset.x);
    state.currentOrbitKind = "sun";
    state.currentSentry = null;
    state.velocity.copyFromFloats(0, 0, 0);
    state.missedLaunches = 0;
    state.captureTransition = {
      targetKind: "sun",
      targetIndex: null,
      elapsed: 0,
      duration: 0.65,
      startAngle: captureAngle,
      targetAngle: captureAngle,
      startRadius: Math.max(0.01, offset.length()),
      startRotation: satelliteRoot.rotation.y
    };
    state.mode = "capturing";
    state.escapedPlanet = null;
    state.escapedSun = false;
    state.escapedSentry = null;
  }

  function collectPlanetBladeUpgrade(planet) {
    if (!planet.bladeUpgrade) return;

    createParticleBurst(planet.root.position, 0.85);
    planet.bladeUpgrade.dispose();
    planet.bladeUpgrade = null;
    planet.mesh.setEnabled(true);
    planet.captureRing.color = materials.ring.diffuseColor;
    planet.captureRing.alpha = materials.ring.alpha || 1;
    planet.bladeUpgradeRespawnTime = 18 + Math.random() * 10;
    startSuperBladePowerup();
    startCameraShake(0.18);
  }

  function updatePlanetBladeUpgradeRespawn(planet, dt) {
    if (!planet.hasBladeUpgrade || planet.bladeUpgrade || !planet.bladeUpgradeRespawnTime) return;

    planet.bladeUpgradeRespawnTime = Math.max(0, planet.bladeUpgradeRespawnTime - dt);
    if (planet.bladeUpgradeRespawnTime > 0) return;
    if (isCurrentAttachedPlanet(planet)) return;

    planet.bladeUpgradeRespawnTime = 0;
    planet.bladeUpgrade = createBladeUpgrade(planet, scene);
    planet.captureRing.color = materials.upgradeRing.diffuseColor;
    planet.captureRing.alpha = materials.upgradeRing.alpha || 1;
  }

  function isCurrentAttachedPlanet(planet) {
    return state.mode === "orbiting"
      && state.currentOrbitKind === "planet"
      && planets[state.currentPlanet] === planet;
  }

  function startSuperBladePowerup() {
    state.superBladeTime = state.superBladeDuration;
  }

  function captureSentry(index, offset) {
    var captureAngle = Math.atan2(offset.z, offset.x);
    var sentry = state.cubeSentries[index];
    state.currentOrbitKind = "sentry";
    state.currentSentry = index;
    state.satelliteAngle = captureAngle;
    state.velocity.copyFromFloats(0, 0, 0);
    state.missedLaunches = 0;
    satelliteRoot.position.copyFrom(sentry.root.position.add(new BABYLON.Vector3(
      Math.cos(state.satelliteAngle) * sentry.fireRadius,
      0,
      Math.sin(state.satelliteAngle) * sentry.fireRadius
    )));
    state.captureTransition = null;
    state.mode = "orbiting";
    state.escapedPlanet = null;
    state.escapedSentry = null;
  }

  function handleMissedLaunch() {
    state.missedLaunches += 1;
    if (state.missedLaunches >= 3) {
      state.currentPlanet = 0;
      state.currentOrbitKind = "planet";
      state.currentSentry = null;
      state.satelliteAngle = 0;
      state.missedLaunches = 0;
      state.furthestPlanetReached = 0;
    }

    state.velocity.copyFromFloats(0, 0, 0);
    state.captureTransition = null;
    state.mode = "orbiting";
    state.escapedPlanet = null;
    state.escapedSentry = null;
  }

  function makeStarField(scene, material) {
    for (var i = 0; i < 220; i += 1) {
      var star = BABYLON.MeshBuilder.CreateSphere("star" + i, { diameter: 0.035 + Math.random() * 0.05 }, scene);
      star.material = material;
      star.position = new BABYLON.Vector3(
        (Math.random() - 0.5) * 58,
        -0.05,
        (Math.random() - 0.5) * 46
      );
      star.isPickable = false;
    }
  }

  function createAimSight(scene) {
    var sight = new BABYLON.TransformNode("satelliteBladeSight", scene);
    var bladeCore = BABYLON.MeshBuilder.CreateCylinder("bladeCore", {
      height: 1,
      diameter: 0.075,
      tessellation: 16
    }, scene);
    bladeCore.parent = sight;
    bladeCore.position.y = 0.58;
    bladeCore.position.z = 1.21;
    bladeCore.rotation.x = Math.PI / 2;
    bladeCore.material = materials.bladeCore;
    bladeCore.isPickable = false;

    var bladeGlow = BABYLON.MeshBuilder.CreateCylinder("bladeGlow", {
      height: 1,
      diameter: 0.18,
      tessellation: 16
    }, scene);
    bladeGlow.parent = sight;
    bladeGlow.position.y = 0.58;
    bladeGlow.position.z = 1.21;
    bladeGlow.rotation.x = Math.PI / 2;
    bladeGlow.material = materials.bladeGlow;
    bladeGlow.isPickable = false;

    sight.bladeCore = bladeCore;
    sight.bladeGlow = bladeGlow;
    sight.bladeBaseZ = 0.52;
    return sight;
  }

  function setBladeVisual(length, thickness) {
    var visualLength = Math.max(0.12, length);
    var centerZ = aimSight.bladeBaseZ + visualLength * 0.5;
    var visualThickness = Math.max(1, thickness);
    aimSight.bladeCore.scaling.y = visualLength;
    aimSight.bladeGlow.scaling.y = visualLength * 1.04;
    aimSight.bladeCore.scaling.x = visualThickness;
    aimSight.bladeCore.scaling.z = visualThickness;
    aimSight.bladeGlow.scaling.x = visualThickness;
    aimSight.bladeGlow.scaling.z = visualThickness;
    aimSight.bladeCore.position.z = centerZ;
    aimSight.bladeGlow.position.z = centerZ;
  }

  function pointSatelliteInDirection(direction) {
    var flatDirection = direction.clone();
    flatDirection.y = 0;
    if (flatDirection.lengthSquared() < 0.0001) return;
    flatDirection.normalize();
    satelliteRoot.rotation.y = Math.atan2(flatDirection.x, flatDirection.z);
  }

  function getBladePoint(distance) {
    var direction = getOutwardDirection();
    return new BABYLON.Vector3(
      satelliteRoot.position.x + direction.x * distance,
      orbitPlaneY,
      satelliteRoot.position.z + direction.z * distance
    );
  }

  function getOutwardDirection() {
    var anchor = getCurrentOrbitAnchor();
    var direction = satelliteRoot.position.subtract(anchor.root.position);
    direction.y = 0;
    if (direction.lengthSquared() < 0.0001) {
      direction = new BABYLON.Vector3(0, 0, 1);
    }
    direction.normalize();
    return direction;
  }

  function getDirectionAwayFromCurrentSentry() {
    var sentry = state.cubeSentries[state.currentSentry];
    var direction = satelliteRoot.position.subtract(sentry.root.position);
    direction.y = 0;
    if (direction.lengthSquared() < 0.0001) {
      direction = new BABYLON.Vector3(0, 0, 1);
    }
    direction.normalize();
    return direction;
  }

} // <---- DO NOT ERASE THE BRACKET

if (typeof module !== "undefined") {
  module.exports = { setupCommon: setupCommon };
}
