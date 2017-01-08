/**
 * Define the Square constructor
 * @param {Number} id
 * @param {Array} colors
 * @param {Object} startPosition
 * @param {Number} circlesInRow
 * @param {Number} circleDistance
 */
function Square(id, colors, startPosition, circlesInRow, circleDistance) {

    this.id = id;

    this.player = 0;

    this.colors = colors;

    this.value = 1;

    this.weight = 0;

    this.size = circleDistance;

    this.squaresInRow = circlesInRow - 1;

    // Array of id of square lines
    this.lines = this.composeLines();

    // Call the PIXI.Graphics constructor
    PIXI.Graphics.call(this);

    this.text = new PIXI.Text("", {fontFamily : 'Arial', fontSize: 60, fill: 'white'});
    this.addChild(this.text);

    this.x = startPosition.x + this.id % this.squaresInRow * this.size;
    this.y = startPosition.y + Math.floor(this.id / this.squaresInRow) * this.size;
    this.draw();
}

/**
 * Create a Square.prototype object that inherits from PIXI.Graphics.prototype
 */
Square.prototype = Object.create(PIXI.Graphics.prototype);

/**
 * Set the "constructor" property to refer to Square
 */
Square.prototype.constructor = Line;

/**
 * Create Array of adjacent lines
 */
Square.prototype.composeLines = function() {
    let n = this.id + (Math.floor(this.id / (this.squaresInRow)) * (this.squaresInRow + 1));
    return [n, n + this.squaresInRow, n + this.squaresInRow + 1, n + (this.squaresInRow * 2) + 1];
}

/**
 * Draw line into Graphics
 */
Square.prototype.draw = function () {
    this.beginFill(this.colors[this.player]);
    this.drawRect(0, 0, this.size, this.size);
    if(this.value > 1) {
        this.text.x = this.size / 2 - (this.value.toString().length * 15);
        this.text.y = this.size / 2 - 30;
        this.text.text = this.value.toString();
    }
    this.endFill();
};

/**
 * Assign this square to player and set value of square
 * @param {Number} player 
 */
Square.prototype.set = function (player) {
    if(this.player == player) {
        this.value *= 2;
    } else {
        this.player = player;
        this.value = 2;
    }
    this.draw();

    return this.value;
};
