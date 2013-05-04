var http = require('http');


function Attendance(mixer, grid, sources) {
  this.mixer = mixer;
  this.grid = grid;
  this.source_registry = sources;
  this.attendance = 0;
}

Attendance.prototype.run = function() {
  var self = this;
  setInterval(function() {
    self.update();
  }, 30000);
};

Attendance.prototype.update = function() {
  var self = this;

  // Record previous attendance
  var previous_attendance = this.attendance;

  // Get latest attendance numbers
  //var url = 'http://ideafablabs.com/api/attendance';
  var url = 'http://192.168.1.6:8888/attendance';
  http.get(url, function(response) {
    var output = '';
    response.on('data', function(chunk) {
      output += chunk;
    });

    response.on('end', function() {
      console.log("queried for attendance, got " + output);
      var num = Number(output);
      if (!isNaN(num)) {
        self.attendance = num;
      }

      if (previous_attendance == this.attendance) {
        console.log("attendance hasn't changed, skipping this cycle");
      } else {
        self.add_layer();
      }
    });
  });
};

Attendance.prototype.add_layer = function() {
  // Record active state of layers, and deactivate them all
  var active = [];
  for (var i = 0; i < this.mixer.layers.length; i++) {
    active.push(this.mixer.layers[i].source.active);
    this.mixer.layers[i].source.deactivate();
  }

  // Choose a new source for a temporary layer
  var source = this.choose_source(previous_attendance, this.attendance);
  console.log("chose source " + source.name);

  // Add a new layer
  var layer = this.mixer.add_layer('Ding! Ding! Ding!', source);
  console.log("adding layer");

  // Let some time elapse and then revert
  setTimeout(function() {
    // Remove our temporary layer
    console.log("removing our layer");
    this.mixer.remove_layer(layer.id);

    // Restore active bit for other layers
    for (var i = 0; i < this.mixer.layers.length; i++) {
      if (active[i]) {
        this.mixer.layers[i].source.activate();
      }
    }
  }, 5000);
};

// Put the logic for choosing a source based on attendance number here
// given previous and current attendance numbers
Attendance.prototype.choose_source = function(previous, current) {
  // The list of good choices for this demo
  var choices = ['color_wheel', 'color_wipe', 'pulse_brightness', 'runner', 'sparkle', 'throb'];
  
  var choice = null;
  if (current - previous >= 2) {
    // If attendance number jumped by a significant amount, run sparkle
    choice = 'sparkle';
  }
  else {
    // Choose at random
    choice = choices[Math.floor(Math.random(choices.length-1))];
  }

  // Instantiate and return new source
  return new this.source_registry.find(choice);
};

// Expose constructor directly
module.exports = Attendance;

