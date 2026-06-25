function createJuniperConfig() {
  return {
    orbitPlaneY: 0.7,
    sunOrbitRadius: 2,
    outerReturnRingRadius: 38.2,
    initialAsteroidCount: 30,
    initialReachableAsteroidCount: 10,
    difficultySecondsToMax: 150,
    difficultyKillsToMax: 25,
    sentryBaseChaseSpeed: 1.85,
    sentrySpeedDifficultyBoost: 1.2,
    asteroidHealStart: 4,
    asteroidHealEnd: 1.5,
    asteroidFragmentStart: 3,
    asteroidFragmentEnd: 1,
    orbitSpecs: [
      { name: "amber", solarRadius: 3.6, angle: 0.4, satelliteOrbit: 0.82, color: new BABYLON.Color3(0.95, 0.63, 0.32) },
      { name: "blue", solarRadius: 5.6, angle: 2.1, satelliteOrbit: 0.88, color: new BABYLON.Color3(0.12, 0.62, 1) },
      { name: "rose", solarRadius: 7.9, angle: 4.0, satelliteOrbit: 0.94, color: new BABYLON.Color3(1, 0.35, 0.32) },
      { name: "mint", solarRadius: 10.6, angle: 5.5, satelliteOrbit: 1.0, color: new BABYLON.Color3(0.35, 0.95, 0.86) },
      { name: "violet", solarRadius: 13.7, angle: 0.9, satelliteOrbit: 1.06, color: new BABYLON.Color3(0.67, 0.45, 1) },
      { name: "copper", solarRadius: 17.2, angle: 3.2, satelliteOrbit: 1.12, color: new BABYLON.Color3(0.95, 0.45, 0.18) },
      { name: "lime", solarRadius: 21.1, angle: 1.6, satelliteOrbit: 1.18, color: new BABYLON.Color3(0.63, 1, 0.32) },
      { name: "ice", solarRadius: 25.4, angle: 4.8, satelliteOrbit: 1.24, color: new BABYLON.Color3(0.62, 0.86, 1) },
      { name: "opal", solarRadius: 30.1, angle: 0.2, satelliteOrbit: 1.3, color: new BABYLON.Color3(0.88, 0.78, 1) }
    ],
    cubeSentrySpecs: [
      { radius: 9.2, angle: 1.05, size: 0.42 },
      { radius: 11.8, angle: 4.35, size: 1.05 },
      { radius: 14.7, angle: 2.45, size: 0.58 },
      { radius: 16.4, angle: 5.75, size: 1.85 },
      { radius: 19.2, angle: 0.55, size: 0.38 },
      { radius: 21.8, angle: 3.75, size: 2.15 },
      { radius: 24.0, angle: 1.85, size: 0.82 },
      { radius: 26.8, angle: 5.0, size: 2.45 },
      { radius: 29.0, angle: 2.9, size: 1.25 },
      { radius: 31.6, angle: 0.2, size: 1.95 }
    ]
  };
}
