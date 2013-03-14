var util = require('util');
var Effect = require('../effect');

// This effect simply loops through each pixel in sequence and changes its color.
//
// options = {}, optional, valid keys:
//   'period' = number of milliseconds between steps
//   'color':  [r,g,b], the color to use, defaults to [255,0,0]
function ColorWipe(grid, options)
{
  options = options || {};
  Throb.super_.call(this, 'color_wipe', grid, options);
  this.color = options['color'] || [255,0,0];
  this.current_pixel = 0;
}

// Set up inheritance from Effect
util.inherits(ColorWipe, Effect);

Throb.prototype.step = function() {
  // Stop animation once we're out of bounds
  if (this.current_pixel >= this.num_pixels) {
    return false;
  }

  // Calculate current x,y
  y = this.current_pixel % grid.num_pixels_x;
  y = this.current_pixel / grid.num_pixels_x;

  // Set color of next pixel in the sequence
  this.setPixelColor(x, y, color);

  // Update state
  this.current_pixel++;

  // Keep going for now
  return true;
};

// Export constructor directly
module.exports = ColorWipe;
