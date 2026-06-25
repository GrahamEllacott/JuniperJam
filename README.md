# Juniper Jam Collaboration Guide

This project is set up so multiple people can work without constantly editing the same file.

## Where To Work

- Edit `common/config.js` for shared tuning: planet orbits, sentry positions, asteroid counts, difficulty numbers, speeds.
- Edit `common/difficulty.js` for difficulty scaling rules.
- Edit `common/math.js` only for reusable math helpers.
- Edit `common/rendering.js` only for reusable render helpers.
- Avoid editing `common/common.js` unless you are changing core game behavior.
- Student feature work should usually happen in `studentA/studentA.js`, `studentB/studentB.js`, `studentC/studentC.js`, or `studentD/studentD.js`.

## Hooking Into The Game

Use `JuniperJam.onSetup` for one-time setup after the core game is created:

```js
JuniperJam.onSetup(function (game) {
  var scene = game.scene;
  var state = game.state;

  // Create meshes, labels, feature state, or setup values here.
});
```

Use `JuniperJam.onUpdate` for code that should run every frame:

```js
JuniperJam.onUpdate(function (game, dt) {
  var state = game.state;

  // dt is elapsed time in seconds since the last frame.
});
```

## Useful `game` Fields

The hook receives a `game` object with shared access:

```js
game.scene
game.canvas
game.camera
game.config
game.materials
game.state
game.planets
game.sun
game.satelliteRoot
game.aimSight
```

There are also helper methods:

```js
game.spawnAsteroid(options)
game.createParticleBurst(position, radius)
game.startCameraShake(strength)
game.getOrbitPlaneY()
```

## Example Student Feature

```js
JuniperJam.onSetup(function (game) {
  game.state.studentA = {
    timer: 0
  };
});

JuniperJam.onUpdate(function (game, dt) {
  game.state.studentA.timer += dt;

  if (game.state.studentA.timer > 5) {
    game.startCameraShake(0.1);
    game.state.studentA.timer = 0;
  }
});
```

## Collaboration Rules

1. Own one file or feature area when possible.
2. Prefer hooks over editing `common/common.js`.
3. Put shared numbers in `common/config.js`, not inside feature code.
4. Keep student-specific state under a unique name, such as `game.state.studentA`.
5. If two people need the same core behavior changed, talk before both editing `common/common.js`.

More file ownership notes live in `common/OWNERSHIP.md`.
