/**
 * Define the Line constructor
 * @param {Number} id
 * @param {Number} color
 * @param {Number} circlesInRow
 * @param {Object} startPosition
 * @param {Number} circleDistance
 */
function Line(id, color, circlesInRow, startPosition, circleDistance) {

    this.id = id;

    this.hidden = true;

    this.color = color;

    this.weight = 0;

    // Object of from and to circle ids and positions
    this.circles = this.composeFromToIds(circlesInRow, startPosition, circleDistance);

    // Array of id of adjacent squares
    this.squares = this.composeSquares(circlesInRow);

    // Call the PIXI.Graphics constructor
    PIXI.Graphics.call(this);
}

/**
 * Create a Line.prototype object that inherits from PIXI.Graphics.prototype
 */
Line.prototype = Object.create(PIXI.Graphics.prototype);

/**
 * Set the "constructor" property to refer to Line
 */
Line.prototype.constructor = Line;

/**
 * Redraw line into actual scene
 */
Line.prototype.show = function () {
    this.lineStyle(3, this.color, 1);
    this.moveTo(this.circles.from.x, this.circles.from.y);
    this.lineTo(this.circles.to.x, this.circles.to.y);
    this.hidden = false;
};

/**
 * Remove line from actual scene
 */
Line.prototype.hide = function () {
    this.clear();
    this.hidden = true;
};

/**
 * Create object of from and to circle ids and positions
 * @param {Number} circlesInRow
 * @param {Object} startPosition
 * @param {Number} circleDistance
 */
Line.prototype.composeFromToIds = function (circlesInRow, startPosition, circleDistance) {
    let from = -1;
    let to = -1;
    const linesInRow = 2 * circlesInRow - 1;

    // Convert id to first row id
    const n = this.id % linesInRow;

    // Compute row number of this line
    const row = Math.floor(this.id / linesInRow);

    // Compute id of from and to circles
    if(n < circlesInRow - 1) {
        from = n + (row * circlesInRow);
        to = from + 1;
    } else {
        from = n - circlesInRow + 1 + (row * circlesInRow);
        to = from + circlesInRow;
    }

    return {
        'from' : {
            'id' : from,
            'x' : startPosition.x + (from % circlesInRow) * circleDistance,
            'y' : startPosition.y + Math.floor(from / circlesInRow) * circleDistance
        },
        'to' : {
            'id' : to,
            'x' : startPosition.x + (to % circlesInRow) * circleDistance,
            'y' : startPosition.y + Math.floor(to / circlesInRow) * circleDistance
        }
    };
};

/**
 * Create array of id of adjacent squares
 * @param {Number} circlesInRow
 */
Line.prototype.composeSquares = function (circlesInRow) {
    let squaresInRow = circlesInRow - 1;
    let linesInRow = 2 * circlesInRow - 1;
    let squares = [];

    const n = this.id % linesInRow;

    // Compute row number of this line
    const row = Math.floor(this.id / linesInRow)

    if(n < circlesInRow - 1) {

        // Append square on above line
        if(this.id > circlesInRow - 1) squares.push(n - squaresInRow + (row * squaresInRow));

        // Append square on below line
        if(this.id < linesInRow * (circlesInRow - 1)) squares.push(n + (row * squaresInRow));
    } else {

        // Append square on lines left side
        if(n != circlesInRow - 1) squares.push(n - (circlesInRow) + (row * squaresInRow));

        // Append square on lines right side
        if(n != linesInRow  -1) squares.push(n - (circlesInRow - 1) + (row * squaresInRow));
    }

    return squares;
};

/**
 * Get id of line by from and to circle ids by followinf equation:
 * ((C - 1) * S / C + S) if circles are in horizontal position
 * ((C - 1) * B / C + S) if circles are in vertical position
 * Where S is smaller id of two connected circles, B is bigger id of two connected circles and C is count of circles in one line
 * @param {Number} id1
 * @param {Number} id2
 * @param {Number} circlesInRow
 */
Line.getLineId = function(id1, id2, circlesInRow) {
    if(Math.abs(id1 - id2) == 1) {
        var s = (id1 < id2) ? id1 : id2;
        return (circlesInRow - 1) * Math.floor(s / circlesInRow) + s;
    } else {
        var s = (id1 < id2) ? id1 : id2;
        var b = (id1 > id2) ? id1 : id2;
        return (circlesInRow - 1) * Math.floor(b / circlesInRow) + s;
    }
}
