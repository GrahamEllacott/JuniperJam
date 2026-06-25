var JuniperDifficulty = {
  pressure: function (state, config) {
    return Math.min(
      1,
      state.difficultyTime / config.difficultySecondsToMax
        + state.enemyScore / config.difficultyKillsToMax
    );
  },

  sentrySpeedMultiplier: function (state, config) {
    return 1 + JuniperDifficulty.pressure(state, config) * config.sentrySpeedDifficultyBoost;
  },

  asteroidHealAmount: function (state, config) {
    return lerpValue(
      config.asteroidHealStart,
      config.asteroidHealEnd,
      JuniperDifficulty.pressure(state, config)
    );
  },

  asteroidFragmentCount: function (state, config) {
    var pressure = JuniperDifficulty.pressure(state, config);
    var span = config.asteroidFragmentStart - config.asteroidFragmentEnd;
    return Math.max(
      config.asteroidFragmentEnd,
      config.asteroidFragmentStart - Math.floor(pressure * (span + 0.99))
    );
  }
};
