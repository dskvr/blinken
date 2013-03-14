// Keep track of all effects available in the system, for easy
// lookup and instantiation.
function EffectRegistry() {
  this.effects = {};

  // Loop through effects directory and add them to the registry
  require("fs").readdirSync("./effects").forEach(function(file) {
    var effect = require("./effects/" + file);
    this.effects[effect.name] = effect.constructor;
  });
}

EffectRegistry.prototype.find = function(name) {
  return this.effects[name] || null;
};

module.exports = new EffectRegistry();
