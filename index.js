const CIRCLE_COUNT = 5;
const CIRCLE_DISTANCE = 100;

// Simplification of often used PIXI objects
let Graphics = PIXI.Graphics;
let Container = PIXI.Container;

// Player whose turn it is, first player = 1, second player (computer) = 2
let player = 1;

// Actual score of players
let score = [0,0];

window.onload = function(){

    let from = null;
    let line = null;
    let circles = [];
    let lines = [];
    let squares = [];
    let linesWeightContainer = null;

    // Get canvas DOM object
    let canvas = document.getElementById("canvas");

    // Create the renderer
    let renderer = PIXI.autoDetectRenderer( 0, 0, { view: canvas });
    renderer.backgroundColor = 0xffffff;
    renderer.view.style.position = "absolute";
    renderer.view.style.display = "block";
    renderer.view.style.boxSizing = "border-box";
    renderer.autoResize = true;
    renderer.resize(canvas.parentElement.clientWidth, canvas.parentElement.clientHeight);

    // Main container
    let root = new Container();

    // Container for squares
    let squaresContainer = new Container();
    root.addChild(squaresContainer);

    // Container for lines
    let linesContainer = new Container();
    root.addChild(linesContainer);

    // Container for user drawn line
    let userLineContainer = new Container();
    root.addChild(userLineContainer);

    // Container for circleContainer ( z-value of circleContainer is higher then z-value of lines, so circleContainer are over lines )
    let circleContainer = new Container();
    circleContainer.hitArea = new PIXI.Rectangle(0, 0, window.innerWidth, window.innerHeight, 1);
    circleContainer.interactive = true;
    root.addChild(circleContainer);

    /**
     * Use DFS (Depth First Search) algorithm to detect and find out nodes of cycle
     */
    function findCycle() {

        // Array of all nodes, initialize all as non visited
        let visited = new Array(CIRCLE_COUNT * CIRCLE_COUNT).fill(false);

        let cycleCompleted = false;

        let cycle = function(id, parentId) {
            // Set actual circle as visited
            visited[id] = true;

            // For all connected circles
            for (let i = 0; i < circles[id].connected.length; i++) {

                // If connected circle has not been visited yet
                if(!visited[circles[id].connected[i]]) {

                    // Recurrent call of cycle check function
                    let cycleArray = cycle(circles[id].connected[i], id);

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

        // Sort all array of connected circles
        for(let i = 0; i < visited.length; i++) {
            circles[i].connected.sort();
        }

        let result = [];

        // Check all circles for cycles
        for(let i = 0; i < visited.length; i++) {
            if(visited[i] === false) {
                result = cycle(i, -1);
                if(result.length > 0){
                    break;
                }
            }
        }

        // If cycle is found
        if(result.length > 0) {

            let linesOfCycle = [];
            for(let v = 1; v <= result.length; v++) {

                // Compute from and to circle
                let a = result[v - 1];
                let b = result[v % result.length];

                // Remove line of cycle
                eraseLine(a,b);

                // Insert pseudo id of line into cycle lines array
                if(a < b) {
                    linesOfCycle.push(a + "-" + b);
                } else {
                    linesOfCycle.push(b + "-" + a);
                }
            }

            // To find out squares of cycle use coloring from one side to other side (Scan Line Algorithm)
            // 1. If there is line, start coloring of squares
            // 2. If there is line, stop coloring of squares
            // Repeat from 1. until end of row
            let value = 0;
            let color = false;
            for (let i = 0; i < CIRCLE_COUNT - 1; i++) {
                for (let j = 0; j < CIRCLE_COUNT - 1; j++) {
                    if(linesOfCycle.indexOf((i * CIRCLE_COUNT + j) + "-" + ((i + 1) * (CIRCLE_COUNT) + j)) != -1) {
                        color = !color;
                    }

                    if(color) { value += squares[i * (CIRCLE_COUNT-1) + j].set(player); }
                }

                color = false;
            }

            score[player-1] += value;

            updateSquaresLinesWeight();
            //showLinesWeight();
            console.log(score[0] + " : " + score[1]);
        }
    }

    /**
     * Update all lines weight of all squares
     */
    function updateSquaresLinesWeight() {

        // First reset weight of all lines
        for (let i = 0; i < lines.length; i++) {
            lines[i].weight = 0;
        }

        // Update line weights by squares
        for (let i = 0; i < squares.length; i++) {
            updateSquareLinesWeight(squares[i].id);
        }
    }

    /**
     * Update weight of all lines adjacent to picked square
     * @param {Number} squareId
     */
    function updateSquareLinesWeight(squareId) {
        for (let j = 0; j < squares[squareId].lines.length; j++) {
            let lineId =  squares[squareId].lines[j];
            if(lines[lineId].hidden) {

                // Put highest weight if only one line is missing - picking means immediate earning of square
                if(squares[squareId].weight == squares[squareId].lines.length - 1) {
                    lines[lineId].weight += CIRCLE_COUNT * squares[squareId].value * 10;

                // Put lowest weight if only two line are missing - picking means almost 100% surety that user will by next move claim this square
                } else if(squares[squareId].weight == squares[squareId].lines.length - 2) {
                    lines[lineId].weight -= CIRCLE_COUNT * squares[squareId].value;

                // Put weight based on weight and value of square
                } else if(squares[squareId].weight != squares[squareId].lines.length) {
                    let squareWeight = (squares[squareId].value > 1) ? (squares[squareId].weight + 1) : squares[squareId].weight;
                    lines[lineId].weight += squareWeight * squares[squareId].value;
                }
            }
        }
    }

    /**
     * Create new connection and line, add this connection to circle with lower id
     * Also update weights of squares adjacent to new line and weights of lines adjacent to this updated squares
     * @param {Number} from
     * @param {Number} to
     * @param {Number} id
     */
    function drawLine(from, to, id) {

        from.connected.push(to.id);
        to.connected.push(from.id);

        if(!id) id = Line.getLineId(from.id, to.id, CIRCLE_COUNT);
        lines[id].show();

        for (let i = 0; i < lines[id].squares.length; i++) {

            // Update square weight
            let squareId = lines[id].squares[i];
            squares[squareId].weight++;

            // Update line weight
            updateSquareLinesWeight(squareId);
        }
    }

    /**
     * Remove connections and line by from and to circles
     * Also decrease weight of adjecent squares and change weights
     * @param {Number} from
     * @param {Number} to
     */
    function eraseLine(from, to){
        circles[from].unconnect(to);
        circles[to].unconnect(from);

        let id = Line.getLineId(from, to, CIRCLE_COUNT);
        lines[id].hide();

        for (let i = 0; i < lines[id].squares.length; i++) {

            // Update square weight
            let squareId = lines[id].squares[i];
            squares[squareId].weight--;
        }

        updateSquaresLinesWeight();
    }

    /**
     * Draw lines weight into scene - helper function
     */
    function showLinesWeight() {

        if(linesWeightContainer) {
            linesWeightContainer.destroy();
            render()
        }

        // Container for lines
        linesWeightContainer = new Container();
        root.addChild(linesWeightContainer);

        // Interate over all lines
        for (let i = 0; i < lines.length; i++) {
            if(lines[i].hidden){
                let number = new PIXI.Text(lines[i].weight.toString(), {fontSize:"15px", fill:"black"});

                // Compute position where line weight should be placed
                let t = (CIRCLE_COUNT * 2) - 1;
                let f = i % t;
                if(f < CIRCLE_COUNT - 1) {
                    number.x = 95 + (f * CIRCLE_DISTANCE)
                    number.y = 45 + CIRCLE_DISTANCE * (Math.floor(i / t));
                } else {
                    number.x = 45 + ((f - CIRCLE_COUNT + 1) * CIRCLE_DISTANCE)
                    number.y = 95 + CIRCLE_DISTANCE * Math.floor(i / t);
                }
                linesWeightContainer.addChild(number);
            }
        }
    }

    /**
     * Handle mouse release in circle event - act only if target circle is next to initially clicked circle and line between them is hidden
     * 1. Check if user created cycle by his turn
     * 2. If yes, remove it and add earned points to user score
     * 3. Do computer move - pick the highest valued line
     * 4. Check if computer created cycle by his turn
     * 5. If yes, remove it and add earned points to computer score
     * @param {object} event
     */
    function handleCircleUp(event){

        // This move made user
        player = 1;

        let to = event.data.target;

        if(lines[Line.getLineId(from.id, to.id, CIRCLE_COUNT)].hidden && from.isNeighbour(to.id)) {

            circleContainer.off('mousemove', handleMove);
            circleContainer.off('mouseup', handleUp);

            for (let i = 0;  i < circles.length; i++) {
                circles[i].off('mouseup', handleCircleUp);
                circles[i].off('mouseover', handleCircleOver);
                circles[i].off('mouseout', handleCircleOut);
            }

            drawLine(from, to);
            findCycle();

            // This move is going to make computer
            player = 2;

            // AI pick line with the highest weight -> create array of weights and find index of the highest value
            let next = lines.map(function(line){

                // Check only hidden lines
                if(line.hidden) {
                    return line.weight;
                } else {
                    return Number.MIN_SAFE_INTEGER;
                }
            }).reduce((max, maxValue, index, weights) => maxValue > weights[max] ? index : max, 0);

            drawLine(circles[lines[next].circles.from.id], circles[lines[next].circles.to.id], next);
            findCycle();

            resetFrom();
            to.animateScale(false);
        } else {
            handleUp();
        }
    }

    /**
     * Handle mouse move into circle event - move user line endpoint to this circle (if this circle is next to from circle)
     * @param {object} event
     */
    function handleCircleOver(event){
        let to = event.data.target;
        if(lines[Line.getLineId(from.id, to.id, CIRCLE_COUNT)].hidden && from.isNeighbour(to.id)) {

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

    /**
     * Handle mouse down event on circle - start event of user line creation
     * @param {object} event
     */
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

    /**
     * Reset initially clicked circle - remove user line and shrink circle
     */
    function resetFrom() {
        line.clear();
        from.animateScale(false);
        from = null;
    }

    /**
     * Handle mouse up event after mouse button is released in initially clicked circle or outside any circle
     */
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

    /**
     * Handle mouse move out of circle
     * @param {object} event
     */
    function handleCircleOut(event){

        let to = event.currentTarget;
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

    /**
     * Handle mouse move after cursor is out of initially clicked circle
     * @param {object} event
     */
    function handleMove(event){

      // Redraw user line
      line.clear().lineStyle(3, 0x000000, 1);
      line.moveTo(from.x, from.y);
      line.lineTo(event.data.global.x, event.data.global.y);
      render();
    }

    /**
     * Init scene what means creation of circles, squares and lines
     */
    function initialize(){

        // Init user line
        line = new Graphics();
        userLineContainer.addChild(line);

        // Create circles
        for (let i = 0; i < CIRCLE_COUNT; i++) {
            for (let j = 0; j < CIRCLE_COUNT; j++) {
                let circle = new Circle((i * CIRCLE_COUNT + j), 0xffffff, 50 + j * CIRCLE_DISTANCE , 50 + i * CIRCLE_DISTANCE, 24, CIRCLE_COUNT, render);
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
                let square = new Square((i * (CIRCLE_COUNT - 1) + j), [0xffffff, 0xf1c40f, 0x9966FF], {'x' : 50, 'y' : 50}, CIRCLE_COUNT, CIRCLE_DISTANCE);
                squaresContainer.addChild(square);
                squares.push(square);
            }
        }
        //showLinesWeight();
        render();
    }

    /**
     * Render actual scene
     */
    function render(){
        renderer.render(root);
    }

    initialize();
}
