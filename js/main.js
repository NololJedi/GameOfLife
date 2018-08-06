'use strict';

/*Constants*/
const CELL_SIZE = 10;
const PREDATOR_COLOR = "red";
const VICTIM_COLOR = "black";
const MAX_SIZE_VALUE = 700;
const MIN_SIZE_VALUE = 100;
const MIN_ITERATIONS_COUNT = 20;
const MAX_ITERATIONS_COUNT = 1000;
const MAX_COUNT_OF_LIFE_OBJECTS = 300;
const MIN_COUNT_OF_LIFE_OBJECTS = 10;
const MAX_DENSITY = 10;
const MIN_DENSITY = 1;
const MIN_PREDATORS_LIFE_PERIOD = 1;
const MAX_PREDATORS_LIFE_PERIOD = 1000;
const MAX_REPRODUCTIVE_PERIOD = 1000;
const MIN_REPRODUCTIVE_PERIOD = 2;
const SIZE_MESSAGE_ID = "sizeMessage";
const ITERATIONS_MESSAGE_ID = "iterationsMessage";
const LIFE_OBJECTS_MESSAGE_ID = "lifeObjectsMessage";
const DENSITY_MESSAGE_ID = "densityMessage";
const PREDATORS_LIFE_MESSAGE_ID = "predatorsMessage";
const REPRODUCTIVE_MESSAGE_ID = "reproductiveMessage";

/*Global variables*/
let size;
let iterations;
let density;
let count;
let predatorLifePeriod;
let reproductivePeriod;
let gameField;

/*Validation fields*/
let isSizeValid = true;
let isIterationsCountValid = true;
let isLifeObjectsCount = true;
let isDensityValid = true;
let isPredatorLifePeriodValid = true;
let isReproductivePeriodValid = true;

/*Inputs*/
let sizeInput = document.getElementById("size");
let iterationsInput = document.getElementById("iterations");
let countInput = document.getElementById("count");
let densityInput = document.getElementById("density");
let predatorLifePeriodInput = document.getElementById("predatorLifePeriod");
let reproductivePeriodInput = document.getElementById("reproductivePeriod");

let startButton = document.getElementById("start");
let messageViewer = document.getElementById("message");

/*Game objects*/
let predators;
let victims;
let notEnabledCells = [];

/*Messages*/
let PREDATORS_DEAD_MESSAGE = "All predators are dead";
let VICTIMS_DEAD_MESSAGE = "All victims are dead";
let ITERATIONS_FINISHED_MESSAGE = "Iterations end";
let SIZE_NOT_VALID_MESSAGE = `Check size. Max - ${MAX_SIZE_VALUE}, min - ${MIN_SIZE_VALUE}`;
let ITERATIONS_NOT_VALID_MESSAGE = `Check iterations count. Max - ${MAX_ITERATIONS_COUNT}, min - ${MIN_ITERATIONS_COUNT}`;
let LIFE_OBJECTS_COUNT_NOT_VALID_MESSAGE = `Check life objects count. Max - ${MAX_COUNT_OF_LIFE_OBJECTS}, min - ${MIN_COUNT_OF_LIFE_OBJECTS}`;
let DENSITY_NOT_VALID_MESSAGE = `Check density. Max - ${MAX_DENSITY}, min - ${MIN_DENSITY}`;
let PREDATORS_LIFE_PERIOD_NOT_VALID_MESSAGE = `Check predators life period. Max - ${MAX_PREDATORS_LIFE_PERIOD}, min - ${MIN_PREDATORS_LIFE_PERIOD}`;
let REPRODUCTIVE_PERIOD_NOT_VALID_MESSAGE = `Check reproductive period. Max - ${MAX_REPRODUCTIVE_PERIOD}, min - ${MIN_REPRODUCTIVE_PERIOD}`;

/*Constructors*/
function GameField(interval) {
    this.canvas = document.createElement("canvas");
    this.id = 0;
    this.interval = function () {
        return window.setInterval(updateField, interval);
    };
    this.render = function (size) {
        this.canvas.id = "canvas";
        this.canvas.width = size;
        this.canvas.height = size;
        this.context = this.canvas.getContext("2d");
        document.getElementById("field").appendChild(this.canvas);
        this.id = this.interval();
    };
    this.clear = function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    };
    this.message = function (message) {
        this.context.fillStyle = "white";
        this.context.font = size / 12 + "px Arial";
        if (ITERATIONS_FINISHED_MESSAGE === message) {
            this.context.fillText(message, size / 5, size / 2);
        } else {
            this.context.fillText(message, 10, size / 2);
        }
    }
}

function Cell(xCoordinate, yCoordinate, color) {
    this.xCoordinate = xCoordinate;
    this.yCoordinate = yCoordinate;
    this.color = color;
    this.update = function () {
        let context = gameField.context;
        context.fillStyle = this.color;
        context.fillRect(this.xCoordinate, this.yCoordinate, CELL_SIZE, CELL_SIZE);
    };
}

function LifeObject(color, cell) {
    this.cell = cell;
    this.reproductiveIndex = reproductivePeriod;
    this.color = color;
    this.reproductiveItSelf = function () {
        if (this.reproductiveIndex === 0) {
            let newCell = createNewCell(this.cell, this.color);
            if (PREDATOR_COLOR === color) {
                let predator = new Predator(newCell);
                predator.predatorLifePeriod = Math.round(predatorLifePeriod / 2);
                predators.push(predator);
            }
            if (VICTIM_COLOR === color) {
                victims.push(new LifeObject(VICTIM_COLOR, newCell));
            }
            this.reproductiveIndex = reproductivePeriod;
        }
        this.reproductiveIndex--;
    };
    this.move = function () {
        this.cell = chooseDirection(this.cell);
    };
    this.updateObject = function () {
        this.cell.update();
    };
}

function Predator(cell) {
    LifeObject.call(this, PREDATOR_COLOR, cell);
    this.predatorLifePeriod = predatorLifePeriod;
    this.eat = function () {
        //Loop all victims
        for (let victimsIndex = 0; victimsIndex < victims.length; victimsIndex++) {
            let victimCell = victims[victimsIndex].cell;
            //Check for crossing cells
            if (isCellEquals(this.cell, victimCell)) {
                //Remove the eaten victim
                victims.splice(victimsIndex, 1);
                //Reload predator's life period
                this.predatorLifePeriod = predatorLifePeriod;
            }
        }
    };
    this.die = function (index) {
        this.predatorLifePeriod--;
        if (this.predatorLifePeriod === 0) {
            predators.splice(index, 1);
        }
    };
    this.lifeCycle = function (index) {
        this.reproductiveItSelf();
        this.move();
        this.eat();
        this.die(index);
    }
}

/*Set listeners*/
startButton.onclick = startGame;

sizeInput.oninput = function (event) {
    isSizeValid = validateInput(MIN_SIZE_VALUE,
        MAX_SIZE_VALUE,
        sizeInput.value,
        SIZE_NOT_VALID_MESSAGE,
        SIZE_MESSAGE_ID);
    checkStartButton();
};

iterationsInput.oninput = function (event) {
    isIterationsCountValid = validateInput(MIN_ITERATIONS_COUNT,
        MAX_ITERATIONS_COUNT,
        iterationsInput.value,
        ITERATIONS_NOT_VALID_MESSAGE,
        ITERATIONS_MESSAGE_ID);
    checkStartButton();
};

countInput.oninput = function (event) {
    isLifeObjectsCount = validateInput(MIN_COUNT_OF_LIFE_OBJECTS,
        MAX_COUNT_OF_LIFE_OBJECTS,
        countInput.value,
        LIFE_OBJECTS_COUNT_NOT_VALID_MESSAGE,
        LIFE_OBJECTS_MESSAGE_ID);
    checkStartButton();
};

densityInput.oninput = function (event) {
    isDensityValid = validateInput(MIN_DENSITY,
        MAX_DENSITY,
        densityInput.value,
        DENSITY_NOT_VALID_MESSAGE,
        DENSITY_MESSAGE_ID);
    checkStartButton();
};

predatorLifePeriodInput.oninput = function (event) {
    isPredatorLifePeriodValid = validateInput(MIN_PREDATORS_LIFE_PERIOD,
        MAX_PREDATORS_LIFE_PERIOD,
        predatorLifePeriodInput.value,
        PREDATORS_LIFE_PERIOD_NOT_VALID_MESSAGE,
        PREDATORS_LIFE_MESSAGE_ID);
    checkStartButton();
};

reproductivePeriodInput.oninput = function (event) {
    isReproductivePeriodValid = validateInput(MIN_REPRODUCTIVE_PERIOD,
        MAX_REPRODUCTIVE_PERIOD,
        reproductivePeriodInput.value,
        REPRODUCTIVE_PERIOD_NOT_VALID_MESSAGE,
        REPRODUCTIVE_MESSAGE_ID);
    checkStartButton();
};

/*Game main function*/
function startGame(event) {
    event.preventDefault();

    if (gameField) {
        window.clearInterval(gameField.id);
    }
    gameField = null;
    document.getElementById("canvas").remove();
    predators = [];
    victims = [];
    notEnabledCells = [];
    size = +sizeInput.value;
    iterations = +iterationsInput.value;
    count = +countInput.value;
    density = +densityInput.value;
    predatorLifePeriod = +predatorLifePeriodInput.value;
    reproductivePeriod = +reproductivePeriodInput.value;

    let predatorsCount = Math.round(count / (1 + density));
    let victimsCount = count - predatorsCount;
    predators = initializePredators(predatorsCount, size);
    victims = initializeVictims(victimsCount, size);

    gameField = new GameField(500);
    gameField.render(size);
}

/*Rendering*/
function predatorsLifeCycle() {
    for (let index = 0; index < predators.length; index++) {
        predators[index].lifeCycle(index);
    }
}

function victimsLifeCycle() {
    for (let index = 0; index < victims.length; index++) {
        let victim = victims[index];
        victim.reproductiveItSelf();
        victim.move();
    }
}

function updateLifeObjects(lifeObjects) {
    for (let index = 0; index < lifeObjects.length; index++) {
        let lifeObject = lifeObjects[index];
        lifeObject.updateObject();
    }
}

function updateField() {
    gameField.clear();
    let condition = checkGameCondition();
    if (condition === "") {
        iterations--;
        predatorsLifeCycle();
        victimsLifeCycle();
        updateLifeObjects(predators);
        updateLifeObjects(victims);
    } else {
        gameField.message(condition);
    }
}

function checkGameCondition() {
    if (predators.length === 0) {
        return PREDATORS_DEAD_MESSAGE;
    }
    if (victims.length === 0) {
        return VICTIMS_DEAD_MESSAGE;
    }
    if (iterations === 0) {
        return ITERATIONS_FINISHED_MESSAGE;
    }
    return "";
}

/*Utils*/
function createNewCell(cell, color) {
    let newCell = new Cell(cell.xCoordinate, cell.yCoordinate, color);
    newCell = chooseDirection(newCell);
    return newCell;
}

function isCellEquals(first, second) {
    return first.xCoordinate === second.xCoordinate
        && first.yCoordinate === second.yCoordinate;
}

function chooseDirection(cell) {
    let direction = getRandomIntFromRange(0, 8);
    let newCell = new Cell(cell.xCoordinate, cell.yCoordinate, cell.color);
    switch (direction) {
        case 1: {
            newCell.xCoordinate -= CELL_SIZE;
            newCell.yCoordinate -= CELL_SIZE;
            break;
        }
        case 2: {
            newCell.xCoordinate -= CELL_SIZE;
            break;
        }
        case 3: {
            newCell.xCoordinate -= CELL_SIZE;
            newCell.yCoordinate += CELL_SIZE;
            break;
        }
        case 4: {
            newCell.yCoordinate += CELL_SIZE;
            break;
        }
        case 5: {
            newCell.xCoordinate += CELL_SIZE;
            newCell.yCoordinate += CELL_SIZE;
            break;
        }
        case 6: {
            newCell.xCoordinate += CELL_SIZE;
            break;
        }
        case 7: {
            newCell.xCoordinate += CELL_SIZE;
            newCell.yCoordinate -= CELL_SIZE;
            break;
        }
        case 8: {
            newCell.yCoordinate -= CELL_SIZE;
            break;
        }
    }

    let currentX = newCell.xCoordinate;
    let currentY = newCell.yCoordinate;
    let sizeBorder = size - CELL_SIZE;

    if (currentX >= 0
        && currentX <= sizeBorder
        && currentY >= 0
        && currentY <= sizeBorder) {
        return newCell;
    } else {
        return chooseDirection(cell);
    }
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

function getRandomIntFromRange(min, max) {
    let number = Math.floor(Math.random() * Math.floor(max + 1));
    if (number === min) {
        return getRandomIntFromRange(min, max);
    } else {
        return number;
    }
}

function initializePredators(count, size) {
    let predators = [];
    for (let index = 0; index < count; index++) {
        let predator = new Predator(generateCell(size, PREDATOR_COLOR));
        predators.push(predator);
    }
    return predators;
}

function initializeVictims(count, size) {
    let victims = [];
    for (let index = 0; index < count; index++) {
        victims.push(new LifeObject(VICTIM_COLOR, generateCell(size, VICTIM_COLOR)));
    }
    return victims;
}

function generateCell(size, color) {
    let xCoordinate = Math.round(getRandomInt(size - CELL_SIZE) / 10) * 10;
    let yCoordinate = Math.round(getRandomInt(size - CELL_SIZE) / 10) * 10;
    let cell = new Cell(xCoordinate, yCoordinate, color);

    let isCreationAvailable = true;
    for (let index = 0; index < notEnabledCells.length; index++) {
        if (isCellEquals(cell, notEnabledCells[index])) {
            isCreationAvailable = false;
        }
    }

    if (isCreationAvailable) {
        notEnabledCells.push(cell);
        return cell;
    } else {
        return generateCell(size, color);
    }
}

function validateInput(min, max, value, message, id) {
    if (value < min || value > max) {
        let li = document.getElementById(id);
        if (!li) {
            let li = document.createElement("li");
            li.id = id;
            li.textContent = message;
            messageViewer.appendChild(li);
        }
        return false;
    } else {
        let li = document.getElementById(id);
        if (li) {
            li.remove();
        }
        return true;
    }
}

function checkStartButton() {
    startButton.disabled = !(isSizeValid
        && isReproductivePeriodValid
        && isPredatorLifePeriodValid
        && isDensityValid
        && isIterationsCountValid
        && isLifeObjectsCount);
}