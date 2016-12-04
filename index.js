
const CIRCLE_COUNT = 4;
const CIRCLE_DISTANCE = 150;

var Graphics = PIXI.Graphics,
    Container = PIXI.Container;

let player = 1;
let score = [0,0];



// Create the renderer
var renderer = PIXI.autoDetectRenderer(0, 0, {antialias: false, transparent: false, resolution: 1 });
renderer.backgroundColor = 0xffffff;
renderer.view.style.position = "absolute";
renderer.view.style.display = "block";
renderer.view.style.boxSizing = "border-box";
renderer.autoResize = true;
renderer.resize(window.innerWidth, window.innerHeight);

// Add the canvas to the HTML document
document.body.appendChild(renderer.view);

// Main container
var root = new Container();

// Container for squares
var squaresContainer = new Container();
root.addChild(squaresContainer);

// Container for lines
var linesContainer = new Container();
root.addChild(linesContainer);

// Container for user drawn line
var userLineContainer = new Container();
root.addChild(userLineContainer);

// Container for circleContainer ( z-value of circleContainer is higher then z-value of lines, so circleContainer are over lines )
var circleContainer = new Container();
circleContainer.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight, 1);
circleContainer.interactive = true;
root.addChild(circleContainer);

var from = null,
    line = null,
    circle = null,
    circle2 = null,
    circles = [];
    lines = [];
    squares = [];

function findCycle() {

    // Array of all nodes, initialize all as non visited
    var visited = new Array(CIRCLE_COUNT * CIRCLE_COUNT).fill(false);

    var cycleCompleted = false;

    var cycle = function(id, parentId) {

      // Set actual circle as visited
      visited[id] = true;

      // For all connected circles
      for (var i = 0; i < circles[id].connected.length; i++) {

          // If connected circle has not been visited yet
          if(!visited[circles[id].connected[i]]) {

            // Recurrent call of cycle check function
            var cycleArray = cycle(circles[id].connected[i], id);

            if(cycleArray.length > 0) {
              // Check if cycle is already in array
              if(cycleArray[0] == circles[id].connected[i]){
                cycleCompleted = true;
              }

              if(cycleCompleted) {
                // If cycle is already in array and remaining circles are just tail of cycle
                return cycleArray;
              } else {
                return cycleArray.concat(circles[id].connected[i]);
              }
            }
          } else if(circles[id].connected[i] != parentId) {

              // If actual node and another visited are going to create cycle and that another is not parent
              // If it is parent, we are talking about cycle with two members
              return [circles[id].connected[i]];
          }
      }

      // If there are no connection from this circle
      return [];
    }

    // Check all circles for cycles
    for(var i = 0; i < visited.length; i++) {
      circles[i].connected.sort();
    }

    let result = [];
    // Check all circles for cycles
    for(var i = 0; i < visited.length; i++) {
      if(visited[i] === false) {
          result = cycle(i, -1);
          if(result.length > 0){
            break;
          }
        }
    }

    if(result.length > 0) {
        for(var v = 1; v <= result.length; v++) {
          eraseLine(result[v - 1], result[v % result.length]);
        }

        // TODO If not only one square cycled, detect all squares to show
        let toShowSquare = lines[Line.getLineId(result[0], result[1])].squares.filter(function(n) {
            return lines[Line.getLineId(result[1], result[2])].squares.indexOf(n) != -1;
        });

        var value = squares[toShowSquare].set(player);
        score[player-1] += value;
        console.log(score[0] + " : " + score[1]);
    }
}

// Update line weight
function updateSquareLinesWeight(squareId) {
    let squareWeight = squares[squareId].weight;
    for (let j = 0; j < squares[squareId].lines.length; j++) {
        let lineId =  squares[squareId].lines[j];
        lines[lineId].weight = 0;
        if(lines[lineId].hidden) {
            if(squareWeight == squares[squareId].lines.length - 1) {
                lines[lineId].weight += CIRCLE_COUNT * CIRCLE_COUNT * 4;
            } else if(squareWeight == squares[squareId].lines.length - 2) {
                lines[lineId].weight -= CIRCLE_COUNT * CIRCLE_COUNT * 4;
            } else if(squareWeight != squares[squareId].lines.length) {
                lines[lineId].weight += squareWeight;
            }
        }
    }
}


// Create new connection and line, add this connection to circle with lower id
// Also update weights of squares adjacent to new line and weights of lines adjacent to this updated squares
function drawLine(from, to, id = null) {
    from.connected.push(to.id);
    to.connected.push(from.id);

    if(!id) id = Line.getLineId(from.id, to.id);
    lines[id].show();

    for (let i = 0; i < lines[id].squares.length; i++) {

        // Update square weight
        let squareId = lines[id].squares[i];
        squares[squareId].weight++;

        // Update line weight
        updateSquareLinesWeight(squareId);
    }

    showLineWeights();
}

// Remove connections and line
// Also decrease weight of adjecent squares, change of weights
function eraseLine(from, to){
    circles[from].unconnect(to);
    circles[to].unconnect(from);

    let id = Line.getLineId(from, to);
    lines[id].hide();

    for (let i = 0; i < lines[id].squares.length; i++) {

        // Update square weight
        let squareId = lines[id].squares[i];
        squares[squareId].weight--;

        // Update line weight
        updateSquareLinesWeight(squareId);
    }
}


var aiContainer = null;
function showLineWeights() {
    if(aiContainer) {
      aiContainer.destroy();
      render()
    }

    // Container for lines
    aiContainer = new Container();
    root.addChild(aiContainer);

    for (let i = 0; i < lines.length; i++) {
        if(lines[i].hidden){
        var number = new PIXI.Text(lines[i].weight.toString(), {fontSize:"15px", fill:"black"});
        var t = (CIRCLE_COUNT * 2) - 1;
        var f = i % t;
        if(f < 3) {
          number.x = 120 + (f * 150)
          number.y = 40 + 150 * (Math.floor(i / t));
        } else {
          number.x = 45 + ((f - 3) * 150)
          number.y = 120 + 150 * Math.floor(i / t);
        }
        aiContainer.addChild(number);
    }
    }
}

function handleCircleUp(event){

    // This move made user
    player = 1;

    var to = event.data.target;
    if(from.isNeighbour(to.id)) {

        circleContainer.off('mousemove', handleMove);
        circleContainer.off('mouseup', handleUp);

        for (let i = 0;  i < circles.length; i++) {
          circles[i].off('mouseup', handleCircleUp);
          circles[i].off('mouseover', handleCircleOver);
          circles[i].off('mouseout', handleCircleOut);
        }

        drawLine(from, to);
        findCycle();

        // AI pick line with the highest weight -> create array of weights and find index of the highest value
        var next = lines.map(function(line){
            // Chceck only hidden lines
            if(line.hidden) {
                return line.weight;
            } else {
                return Number.MIN_SAFE_INTEGER;
            }
        }).reduce((max, maxValue, index, weights) => maxValue > weights[max] ? index : max, 0);

        // This move is going to make AI
        player = 2;
        drawLine(circles[lines[next].circles.from.id], circles[lines[next].circles.to.id], next);
        findCycle();

        resetFrom();
        to.animateScale(false);
    } else {
        handleUp();
    }
}

function handleCircleOver(event){
    var to = event.data.target;
    if(lines[Line.getLineId(from.id, to.id)].hidden && from.isNeighbour(to.id)) {

        // Move line endpoint to centre of pointed circle
        line.clear().lineStyle(3, 0x000000, 1);
        line.moveTo(from.x, from.y);
        line.lineTo(to.x, to.y);

        if(to.id !== from.id) {

            // Function render() is not neccesary, because circle scaling will do renderation
            to.animateScale();
        }

        circleContainer.off('mousemove', handleMove);
        circleContainer.off('mouseup', handleUp);
    }
}

function onCircleMouseDown(event) {
    from = event.data.target;

    for (let i = 0;  i < circles.length; i++) {
        circles[i].on('mouseup', handleCircleUp);
        circles[i].on('mouseover', handleCircleOver);
        circles[i].on('mouseout', handleCircleOut);
    }

    // Function render() is not neccesary, because circle scaling will do renderation
    from.animateScale();
}

function resetFrom() {
    line.clear();
    from.animateScale(false);
    from = null;
}

function handleUp(){

    // Function render() is not neccesary, because circle scaling will do renderation
    resetFrom();

    // Hide user line
    line.clear();

    circleContainer.off('mousemove', handleMove);
    circleContainer.off('mouseup', handleUp);
    for (let i = 0;  i < circles.length; i++) {
      circles[i].off('mouseup', handleCircleUp);
      circles[i].off('mouseover', handleCircleOver);
      circles[i].off('mouseout', handleCircleOut);
    }
    render();
}

function handleCircleOut(event){

    var to = event.data.target;
    if(from.isNeighbour(to.id) || to.id === from.id) {

        // Move line endpoint to cursor position
        line.clear().lineStyle(1, 0x000000, 1);
        line.moveTo(from.x, from.y);
        line.lineTo(to.x, to.y);

        // Enlarge pointed circle
        if(to.id !== from.id) {

            // Function render() is not neccesary, because circle scaling will do renderation
            to.animateScale(false);
        } else {
            render();
        }

        circleContainer.on('mousemove', handleMove);
        circleContainer.on('mouseup', handleUp);
    }
}

function connected(id1, id2) {
  return id1.conncectedTo(id2) || id2.conncectedTo(id1);
}

function handleMove(event){

  // Redraw user line
  line.clear().lineStyle(3, 0x000000, 1);
  line.moveTo(from.x, from.y);
  line.lineTo(event.data.global.x, event.data.global.y);
  render();
}

function initialize(){

    // Init user line
    line = new Graphics();
    userLineContainer.addChild(line);

    // Create circles
    for (let i = 0; i < CIRCLE_COUNT; i++) {
        for (let j = 0; j < CIRCLE_COUNT; j++) {
            var circle = new Circle((i * CIRCLE_COUNT + j), 0x9966FF, 50 + j * CIRCLE_DISTANCE , 50 + i * CIRCLE_DISTANCE, 24, CIRCLE_COUNT, render);
            circle.on('mousedown', onCircleMouseDown);
            circleContainer.addChild(circle);
            circles.push(circle);
        }
    }

    // Create lines
    for (let i = 0; i < 2 * CIRCLE_COUNT * (CIRCLE_COUNT - 1); i++) {
        let line = new Line(i, 0x000000, CIRCLE_COUNT, {'x' : 50, 'y' : 50}, CIRCLE_DISTANCE);
        linesContainer.addChild(line);
        lines.push(line);
    }

    // Create squares
    for (let i = 0; i < CIRCLE_COUNT - 1; i++) {
        for (let j = 0; j < CIRCLE_COUNT - 1; j++) {
            var square = new Square((i * (CIRCLE_COUNT - 1) + j), [0xffffff, 0xf1c40f, 0x9966FF], {'x' : 50, 'y' : 50}, CIRCLE_COUNT, CIRCLE_DISTANCE);
            squaresContainer.addChild(square);
            squares.push(square);
        }
    }

    render();
}

function render(){
  renderer.render(root);
}

initialize()
