# Juniper Jam File Ownership

Use this split to avoid merge conflicts:

- `common/config.js`: shared tuning numbers, orbit specs, sentry specs, difficulty values.
- `common/math.js`: pure math helpers.
- `common/rendering.js`: shared rendering helpers such as materials, camera sizing, and circle lines.
- `common/difficulty.js`: difficulty scaling rules.
- `common/student-api.js`: safe hooks for student-owned files.
- `common/common.js`: core game coordinator and legacy systems that have not been split yet.
- `studentA/studentA.js`: Student A feature work.
- `studentB/studentB.js`: Student B feature work.
- `studentC/studentC.js`: Student C feature work.
- `studentD/studentD.js`: Student D feature work.

Prefer adding student work through hooks:

```js
JuniperJam.onSetup(function (game) {
  // Create meshes, labels, or feature state here.
});

JuniperJam.onUpdate(function (game, dt) {
  // Run per-frame feature logic here.
});
```

Avoid editing `common/common.js` unless the feature truly changes shared core behavior.
