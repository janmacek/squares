// Define the Line constructor
function Line(id, color, circlesInRow, startPosition, circleDistance) {

    this.id = id;

    this.hidden = true;

    this.color = color;

    this.weight = 0;

    this.circles = this.composeFromToIds(circlesInRow, id, startPosition, circleDistance);

    // Array of id of adjacent squares
    this.squares = this.composeSquares(circlesInRow, id);

    // Call the PIXI.Graphics constructor
    PIXI.Graphics.call(this);
}

// Create a Line.prototype object that inherits from PIXI.Graphics.prototype
Line.prototype = Object.create(PIXI.Graphics.prototype);

// Set the "constructor" property to refer to Line
Line.prototype.constructor = Line;

Line.prototype.show = function () {
    this.lineStyle(1, this.color, 1);
    this.moveTo(this.circles.from.x, this.circles.from.y);
    this.lineTo(this.circles.to.x, this.circles.to.y);
    this.hidden = false;
};

Line.prototype.hide = function () {
    this.clear();
    this.hidden = true;
};

Line.prototype.composeFromToIds = function (circlesInRow, id, startPosition, circleDistance) {
    let from = -1;
    let to = -1;
    const linesInRow = 2 * circlesInRow - 1;

    // Convert id to first row id
    const n = id % linesInRow;

    // Compute row number of this line
    const row = Math.floor(id / linesInRow);

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

Line.prototype.composeSquares = function (circlesInRow, id) {
    let squaresInRow = circlesInRow - 1;
    let linesInRow = 2 * circlesInRow - 1;
    let squares = [];

    const n = id % linesInRow;

    // Compute row number of this line
    const row = Math.floor(id / linesInRow)

    if(n < circlesInRow - 1) {

        // Append square on above line
        if(id > circlesInRow - 1) squares.push(n - squaresInRow + (row * squaresInRow));

        // Append square on below line
        if(id < linesInRow * (circlesInRow - 1)) squares.push(n + (row * squaresInRow));
    } else {

        // Append square on lines left side
        if(n != circlesInRow - 1) squares.push(n - (circlesInRow) + (row * squaresInRow));

        // Append square on lines right side
        if(n != linesInRow  -1) squares.push(n - (circlesInRow - 1) + (row * squaresInRow));
    }

    return squares;
};

/* Line id can be count as:
 * ((C - 1) * S / C + S) if circles are in horizontal position
 * ((C - 1) * B / C + S) if circles are in vertical position
 * Where S is smaller id of two connected circles, B is bigger id of two connected circles and C is count of circles in one line
 */
Line.getLineId = function(id1, id2) {
    if(Math.abs(id1 - id2) == 1) {
        var s = (id1 < id2) ? id1 : id2;
        return (CIRCLE_COUNT - 1) * Math.floor(s / CIRCLE_COUNT) + s;
    } else {
        var s = (id1 < id2) ? id1 : id2;
        var b = (id1 > id2) ? id1 : id2;
        return (CIRCLE_COUNT - 1) * Math.floor(b / CIRCLE_COUNT) + s;
    }
}
