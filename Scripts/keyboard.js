window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

var Key = {
  _pressed: {},


  SPACE: 32,
  // l = 37,
  // U = 38,
  // r = 39, 
  // d = 40,
  A: 65,
  W: 87,
  D: 68,
  S: 83,
  P: 80,

  LEFTARROW: 37,
  UPARROW: 38,
  RIGHTARROW: 39,
  DOWNARROW: 40,
  
  
  isDown: function(keyCode) {
      return this._pressed[keyCode];
  },
  
  onKeydown: function(event) {
    if(event.keyCode==80){
      delete this._pressed[event];
    }
      this._pressed[event.keyCode] = true;
  },
  
  onKeyup: function(event) {
    delete this._pressed[event.keyCode];
  }
};


