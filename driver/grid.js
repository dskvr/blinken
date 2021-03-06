// The grid object maps the 2D logical space to the 1D physical space
// and handles device operations
var spi = require('spi');

function Grid(device, num_panels_x, num_panels_y, num_pixels_per_panel_x, num_pixels_per_panel_y) {
  // Store dimensions for later
  this.num_panels_x = num_panels_x;
  this.num_panels_y = num_panels_y;
  this.num_pixels_per_panel_x = num_pixels_per_panel_x;
  this.num_pixels_per_panel_y = num_pixels_per_panel_y;

  // Figure out overall dimensions
  this.num_pixels_x = num_panels_x * num_pixels_per_panel_x;
  this.num_pixels_y = num_panels_y * num_pixels_per_panel_y;
  this.num_pixels = this.num_pixels_x * this.num_pixels_y;

  // Setup data structures for pixels
  this.pixel_map = new Array(this.num_pixels_x * this.num_pixels_y); // Maps logical index to strand index
  this.pixels = new Buffer(this.num_pixels_x * this.num_pixels_y * 3); // 3 octets per pixel, stores color values

  // Setup list of listeners
  this.listeners = [];

	//Setup Layout Indexes
	this.bottom_indices = 0;
	this.top_indices = this.num_pixels/2;
	this.even_odd = this.num_pixels%2;
	
	//Framerate calculation;
	this.timing = {};

  // Instantiate pixels. Loop through in logical order, and then
  // calculate the strand index.
  var i, j, k, l, x, y, panel_index, strand_index;
  panel_index = strand_index = x = y = 0;
  for (i = 0; i < this.num_panels_x; i++) {
    for (j = 0; j < this.num_panels_y; j++) {
      for (k = 0; k < this.num_pixels_per_panel_x; k++) {
        for (l = 0; l < this.num_pixels_per_panel_y; l++) {
          // Figure out where we are in the logical grid.
          x = (i * this.num_pixels_per_panel_x) + k;
          y = (j * this.num_pixels_per_panel_y) + l;

          // Figure out where we are in the strand. See the wiring diagrams
          // in the docs folder for details on the wiring layouthis.timing. We start by
          // figuring out for the given position how many panels came before us.
          panel_index = (i*this.num_panels_y);
          panel_index += (i % 2 == 0) ? Math.floor(y / this.num_pixels_per_panel_y) : Math.floor((this.num_pixels_y - y - 1) / this.num_pixels_per_panel_y);
          strand_index = panel_index * this.num_pixels_per_panel_x * this.num_pixels_per_panel_y;

          // Now just worry about the index within the current panel. Note that the
          // wiring is reversed on odd-numbered columns.
          if (i % 2 == 0) {
            strand_index += (l * this.num_pixels_per_panel_x);
            strand_index += (l % 2 == 1) ? k : (this.num_pixels_per_panel_x - k - 1);
          } else {
            strand_index += ((this.num_pixels_per_panel_y - l - 1) * this.num_pixels_per_panel_x);
            strand_index += (l % 2 == 1) ? k : (this.num_pixels_per_panel_x - k - 1);
          }

          this.pixel_map[(this.num_pixels_x * y) + x] = strand_index;
        }
      }
    }
  }

  // Instantiate SPI device
  this.device = new spi.Spi(device, {
    "mode": spi.MODE['MODE_0'],
    "chipSelect": spi.CS['none'],
    "maxSpeed": 500000
  }, function(d) { d.open(); });

  // Clear the display
  this.off();
}

Grid.prototype.calculateFramerate = function(){
	
	var interval = 2000;
	
	var this.timing.current = (new Date()).getTime();
	
  if (this.timing.started == 0) this.timing.started = this.timing.current;

  if(this.timing.current - this.timing.lastRendered < interval) {
		this.timing.refreshes++;
		return true;
	}

  this.timing.lastRendered = this.timing.current;

	this.timing.frame_rate = this.timing.current * 0.9 + this.timing.lastRendered * 0.1;
	
	// time * 0.9 + last_frame * 0.1 	
	
	// return this.timing.frame_rate
	
}

Grid.prototype.getParentPanelIndex = function(data) {
	if(data.xy) data.index = this.getStrandIndex(data.xy.x, data.xy.y);
	
}

Grid.prototype.getStrandIndex = function(x, y) {
  if (x < 0 || y < 0 || x >= this.num_pixels_x || y >= this.num_pixels_y) {
    return null;
  }

  return this.pixel_map[(y*this.num_pixels_x)+x];
};

// Used for iteration, if you want to loop through entire grid
// in source order (left to right, top to bottom)
Grid.prototype.xy = function(i) {
  return {
    x: i % this.num_pixels_x,
    y: Math.floor(i / this.num_pixels_x)
  }
};

Grid.prototype.setPixelColor = function(x, y, rgb) {
  var index = this.getStrandIndex(x,y);
  if (index == null) {
    return;
  }

  // set pixel data
  this.pixels[index*3] = rgb[0];
  this.pixels[(index*3)+1] = rgb[1];
  this.pixels[(index*3)+2] = rgb[2];
};

//Set the color of an entire row
Grid.prototype.setRowColor = function(rownum, color){
	
	var total_per_row = this.num_pixels_x;
	for(var x = 0 ; x < total_per_row; x++){ //loop through row.
		// var i = this.getStrandIndex( // x, y=rownum ); //rownum is actually a y value.
		this.setPixelColor( x, y=rownum, color );
	}
	
}

//Set the color of an entire column
Grid.prototype.setColColor = function(colnum, color){
	
	for(var y=0;y<this.num_pixels_y;y++){
		// var i = this.getStrandIndex(x=colnum, y);
		this.setPixelColor(x=colnum, y, color, color);
	}
	
}

Grid.prototype.setColumnColor = function(colnum, color){ this.setColColor(colnum, color); }

//Set Color of grid
Grid.prototype.setGridColor = function(rgb) {
  for (var i = 0; i < this.num_pixels; i++) {
    this.pixels[i*3] = rgb[0];
    this.pixels[(i*3)+1] = rgb[1];
    this.pixels[(i*3)+2] = rgb[2];
  }
};

//Retrieve pixel color
Grid.prototype.getPixelColor = function(x, y) {
  var index = this.getStrandIndex(x,y);
  if (index == null) {
    return null;
  }

  return [
    this.pixels[index], 
    this.pixels[(index*3)+1], 
    this.pixels[(index*3)+2]
  ]; 
};

Grid.prototype.toJson = function() {
  var json = new Array(this.num_pixels_x * this.num_pixels_y);
  for (var y = 0; y < this.num_pixels_y; y++) {
    for (var x = 0; x < this.num_pixels_x; x++) {
      var index = (y*this.num_pixels_x)+x;
      var led = {};
      led['x'] = x;
      led['y'] = y;
      led['rgb'] = this.getPixelColor(x,y);
      if (led['rgb'] != null) {
        json[index] = led;
      }
    }
  }
  return json;
};

Grid.prototype.clear = function() {
  this.pixels.fill(0);
};

Grid.prototype.off = function() {
  this.clear();
  this.sync();
};

Grid.prototype.sync = function() {
  // Blast out updates
  this.device.write(this.pixels);

  // Notify listeners
  for (var i = 0; i < this.listeners.length; i++) {
    this.listeners[i]();
  }
};

Grid.prototype.addListener = function(listener) {
  if (typeof(listener) === 'function') {
    this.listeners.push(listener);
  }
};

//-FIND INDEX OF HORIZONAL OPPOSITE LED
Grid.prototype.horizontalIndex = function(i) {
  //-ONLY WORKS WITH INDEX < TOPINDEX
  if (i == this.bottom_indices) { return this.bottom_indices; }
  if (i == this.top_indices && this.even_odd == 1) {return this.top_indices + 1;}
  if (i == this.top_indices && this.even_odd == 0) {return this.top_indices;}
  return this.num_pixels - i;  
}


//-FIND INDEX OF ANTIPODAL OPPOSITE LED
Grid.prototype.antipodalIndex = function(i) {
  //int N2 = int(this.grid.num_pixels/2);
  var iN = i + this.top_indices;
  if (i >= this.top_indices) {iN = ( i + this.top_indices ) % this.num_pixels; }
  return iN;
}


//-FIND ADJACENT INDEX CLOCKWISE
Grid.prototype.adjacentCW = function(i) {
  var r;
  if (i < this.num_pixels - 1) {r = i + 1;}
  else {r = 0;}
  return r;
}


//-FIND ADJACENT INDEX COUNTER-CLOCKWISE
Grid.prototype.adjacentCCW = function(i) {
  var r;
  if (i > 0) {r = i - 1;}
  else {r = this.num_pixels - 1;}
  return r;
}

// Export constructor directly
module.exports = Grid;
