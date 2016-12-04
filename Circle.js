
// Define the Circle constructor
function Circle(id, color, x, y, radius, circlesInRow, render) {

      // Custom id of object which describes position in matrix of Circles
      this.id = id;

      this.tickStart = 0;

      this.DEFAULT_MAX_SCALE = 1.8;
      this.DEFAULT_TICK_SCALE_CHANGE = 0.075;

      this.render = render;

      // Array of id of connected circles
      this.connected = [];

      // Create array of neighbour circles
      this.neighbours = [];
      if(id >= circlesInRow) { this.neighbours.push(id - circlesInRow) };
      if((id % circlesInRow) != 0) { this.neighbours.push(id - 1) };
      if(((id + 1) % circlesInRow) != 0) { this.neighbours.push(id + 1) };
      if(id < ((circlesInRow - 1) * circlesInRow)) { this.neighbours.push(id + circlesInRow) };

      // Call the PIXI.Graphics constructor
      PIXI.Graphics.call(this);

      // Make Circle listen to events
      this.interactive = true;

      // Finally create circle shaped object with defined values
      this.lineStyle(1, 0x000000)
      this.beginFill(0xffffff);
      this.drawCircle(0, 0, radius);
      this.endFill();
      this.x = x;
      this.y = y;
}

// Create a Circle.prototype object that inherits from PIXI.Graphics.prototype
Circle.prototype = Object.create(PIXI.Graphics.prototype);

// Set the "constructor" property to refer to Circle
Circle.prototype.constructor = Circle;

Circle.prototype.isNeighbour = function Circle_isNeighbour(id) {
    return (this.neighbours.indexOf(id) !== -1);
}

Circle.prototype.conncectedTo = function Circle_conncectedTo(id) {
    return (this.connected.indexOf(id) !== -1);
}

Circle.prototype.unconnect = function Circle_unconnect(value) {
    this.connected.splice(this.connected.indexOf(value), 1);
}

Circle.prototype.getScale = function Circle_getScale(scale) {
    return (this.scale.x + this.scale.y) / 2;
}

Circle.prototype.setScale = function Circle_setScale(scale) {
    this.scale.x = scale;
    this.scale.y = scale;
}

Circle.prototype.redraw = function Circle_redraw() {
    if(this.render != null) {
        this.render.call();
    } else {
      logger.log("Warning | Circle_redraw: - There is no render function, so it is imposible to redraw circle");
    }
}

Circle.prototype.grow = function Circle_grow() {
    if(this.getScale() >= this.DEFAULT_MAX_SCALE) {
      PIXI.ticker.shared.remove(this.grow ,this);
      this.tickStart = 1;
      this.setScale(this.DEFAULT_MAX_SCALE);
    } else {
      this.setScale(1 + ((this.DEFAULT_MAX_SCALE-1) *  Easing.Cubic.Out(this.tickStart)));
      this.tickStart += this.DEFAULT_TICK_SCALE_CHANGE;

    }
    this.redraw();
}

Circle.prototype.shrink = function Circle_shrink() {
    if(this.tickStart <= 0) {
      PIXI.ticker.shared.remove(this.shrink ,this);
      this.tickStart = 0;
      this.setScale(1);
    } else {
      this.setScale(1 + ((this.DEFAULT_MAX_SCALE-1) *  Easing.Cubic.In(this.tickStart)));
      this.tickStart -= this.DEFAULT_TICK_SCALE_CHANGE;
    }
    this.redraw();
}

Circle.prototype.animateScale = function Circle_animateScale(grow = true) {
    if(grow) {
        PIXI.ticker.shared.remove(this.shrink ,this);
        PIXI.ticker.shared.add(this.grow ,this);
    } else {
        PIXI.ticker.shared.remove(this.grow ,this);
        PIXI.ticker.shared.add(this.shrink ,this);
    }
}
