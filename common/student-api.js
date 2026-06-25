var JuniperJam = (function () {
  var game = null;
  var setupHooks = [];
  var updateHooks = [];

  function runSetupHook(fn) {
    if (!game) return;
    fn(game);
  }

  return {
    onSetup: function (fn) {
      setupHooks.push(fn);
      runSetupHook(fn);
    },

    onUpdate: function (fn) {
      updateHooks.push(fn);
    },

    getGame: function () {
      return game;
    },

    _setGame: function (nextGame) {
      game = nextGame;
      setupHooks.forEach(runSetupHook);
    },

    _runUpdate: function (dt) {
      if (!game) return;
      updateHooks.forEach(function (fn) {
        fn(game, dt);
      });
    }
  };
})();
