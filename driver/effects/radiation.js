//Ported from "FAST_SPI LED FX EXAMPLES"
//Designed for ws2801s
// teldredge ### www.funkboxing.com ### teldredge1979@gmail.com
// Ported by Basil Caprese 2013

var path = require('path');
var util = require('util');
var Effect = require('../effect');

var NAME = path.basename(__filename, '.js'); // Our unique name

var STEPS = 100;

var bouncedirection = 0, 
		idex = 0, 
		idex_offset = 0, 
		ihue = 0, 
		ibright = 0, 
		isat = 0, 
		tcount = 0.0, 
		lcount = 0;

function Radiation(grid, options)
{
  options = options || {};
  Radiation.super_.call(this, NAME, grid, options);
  this.current_pixel = 0;
  this.period = options['period'] || 1;
	this.hue = options['hue'] || 200;
	this.increment = options['increment'] || 0.2;
	
	// this.count = 0;
 	this.N3 = this.grid.num_pixels/3;
	this.N6 = this.grid.num_pixels/6;  
	this.N12 = this.grid.num_pixels/12;

	this.tcount = this.tcount + this.increment;
  if (this.tcount > 3.14) {this.tcount = 0.0;}
  this.ibright = Math.sin(this.tcount)*255;
}

// Set up inheritance from Effect
util.inherits(Radiation, Effect);

Radiation.prototype.step = function() {
	  //var N2 = this.grid.num_pixels/2);
	  var j0 = this.grid.xy((this.current_pixel + this.grid.num_pixels - this.N12) % this.grid.num_pixels);
	  var j1 = this.grid.xy((j0+this.N3) % this.grid.num_pixels);
	  var j2 = this.grid.xy((j1+this.N3) % this.grid.num_pixels);    
	  this.color = this.grid.HSVtoRGB(this.hue, 255, this.ibright);
		
		this.grid.setPixelColor(j0.x, j0.y, this.color);
		this.grid.setPixelColor(j1.x, j1.y, this.color);
		this.grid.setPixelColor(j2.x, j2.y, this.color);    
	
	  this.current_pixel++;
		this.current_pixel = this.current_pixel % this.N6;
		
		return true;
};

Radiation.options = Effect.options;

// Export public interface
exports.constructor = Radiation;
exports.name = NAME;