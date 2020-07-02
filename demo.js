function solveSudoku(inputBoard, stats) {

    stats = stats || {};
    stats['easy'] = true;
    let board = JSON.parse(JSON.stringify(inputBoard));
    let possibilities = [[], [], [], [], [], [], [], [], []];

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            possibilities[i][j] = [false, true, true, true, true, true, true, true, true, true];
        }
    }

    let solved = false;
    let impossible = false;
    let mutated = false;
    let needCheckFreedoms = false;
    let loopCount = 0;

    outerLoop: while (!solved && !impossible) {
        solved = true;
        mutated = false;
        loopCount++;

        let leastFree = [];
        let leastRemaining = 9;

        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {

                if (board[i][j] === 0) {

                    solved = false;
                    let currentPos = possibilities[i][j];

                    let zoneRow;
                    let zoneCol;

                    if (loopCount === 1) {
                        zoneRow = getZone(i) * 3;
                        zoneCol = getZone(j) * 3;
                        currentPos[10] = zoneRow;
                        currentPos[11] = zoneCol;
                    } else {
                        zoneRow = currentPos[10];
                        zoneCol = currentPos[11];
                    }

                    let wasMutated = reducePossibilities(board, i, j, currentPos, zoneRow, zoneCol);

                    if (wasMutated) {
                        mutated = true;
                    }

                    let remaining = 0;
                    let lastDigit = 0;

                    for (let k = 1; k <= 9; k++) {
                        if (currentPos[k]) {
                            remaining++;
                            lastDigit = k;
                        }
                    }

                    if (remaining === 0) {
                        impossible = true;
                        break outerLoop;
                    } else if (remaining === 1) {
                        board[i][j] = lastDigit;
                        mutated = true;
                        continue;
                    }

                    if (needCheckFreedoms) {
                        let solution = checkFreedoms(board, i, j, possibilities, zoneRow, zoneCol);

                        if (solution !== 0) {

                            board[i][j] = solution;
                            mutated = true;
                            continue;
                        }

                        if (remaining === leastRemaining) {
                            leastFree.push([i, j]);
                        } else if (remaining < leastRemaining) {
                            leastRemaining = remaining;
                            leastFree = [[i, j]];
                        }
                    }

                }
            }
        }

        if (mutated === false && solved === false) {

            // time to break out freedom checking
            if (needCheckFreedoms === false) {
                needCheckFreedoms = true;
                stats['medium'] = true;
                continue;
            }

            // we're stuck, time to start guessing
            return solveByGuessing(board, possibilities, leastFree, stats);

        }
    }

    if (impossible) {
        //window.console && console.log("board is impossible");
        return null;
    } else {
        return board;
    }
}

function getZone(i) {
    if (i < 3) {
        return 0;
    } else if (i < 6) {
        return 1;
    } else {
        return 2;
    }
}


function reducePossibilities(board, row, column, currentPos, zoneRow, zoneCol) {

    let mutated = false;

    //eliminate items already taken in the column and row
    for (let k = 0; k < 9; k++) {
        if (currentPos[board[row][k]] || currentPos[board[k][column]]) {
            mutated = true;
        }
        currentPos[board[row][k]] = false;
        currentPos[board[k][column]] = false;
    }

    //eliminate items already taken in the region
    for (let x = zoneRow; x <= (zoneRow + 2); x++) {
        for (let y = zoneCol; y <= (zoneCol + 2); y++) {
            let zoneDigit = board[x][y];

            if (currentPos[zoneDigit]) {
                mutated = true;
            }

            currentPos[zoneDigit] = false;
        }
    }

    return mutated;
}

function checkFreedoms(board, i, j, possibilities, zoneRow, zoneCol) {

    let answer = 0;
    let currentPos = possibilities[i][j];
    //see if only one square can realize a possibility

    let uniquePosRow = currentPos.slice(0);
    let uniquePosCol = currentPos.slice(0);
    let uniquePosCube = currentPos.slice(0);

    for (let k = 0; k < 9; k++) {
        for (let l = 1; l <= 9; l++) {
            if (board[i][k] === 0 && possibilities[i][k][l] && k !== j) {
                uniquePosRow[l] = false;
            }
            if (board[k][j] === 0 && possibilities[k][j][l] && k !== i) {
                uniquePosCol[l] = false;
            }
        }
    }

    let remainingRow = 0;
    let remainingCol = 0;
    let lastDigitRow = 0;
    let lastDigitCol = 0;

    for (let k = 1; k <= 9; k++) {
        if (uniquePosRow[k]) {
            remainingRow++;
            lastDigitRow = k;
        }
        if (uniquePosCol[k]) {
            remainingCol++;
            lastDigitCol = k;
        }
    }

    if (remainingRow === 1) {
        answer = lastDigitRow;
        return answer;
    }

    if (remainingCol === 1) {
        answer = lastDigitCol;
        return answer;
    }

    for (let x = zoneRow; x <= (zoneRow + 2); x++) {
        for (let y = zoneCol; y <= (zoneCol + 2); y++) {
            for (let l = 1; l <= 9; l++) {
                if (board[x][y] === 0 && possibilities[x][y][l] && (x !== i || y !== j)) {
                    uniquePosCube[l] = false;
                }
            }
        }
    }

    let remainingCube = 0;
    let lastDigitCube = 0;

    for (let k = 1; k <= 9; k++) {
        if (uniquePosCube[k]) {
            remainingCube++;
            lastDigitCube = k;
        }
    }

    if (remainingCube === 1) {
        answer = lastDigitCube;
    }

    return answer;

}

function solveByGuessing(board, possibilities, leastFree, stats) {
    if (leastFree.length < 1) {
        return null;
    }

    if ('hard' in stats) {
        stats['vhard'] = true;
    } else {
        stats['hard'] = true;
    }

    let randIndex = getRandom(leastFree.length);
    let randSpot = leastFree[randIndex];

    let guesses = [];
    let currentPos = possibilities[randSpot[0]][randSpot[1]];

    for (let i = 1; i <= 9; i++) {
        if (currentPos[i]) {
            guesses.push(i);
        }
    }

    shuffleArray(guesses);

    for (let i = 0; i < guesses.length; i++) {
        board[randSpot[0]][randSpot[1]] = guesses[i];
        let result = solveSudoku(board, stats);
        if (result != null) {
            return result;
        }
    }

    return null;
}


function getRandom(limit) {
    return Math.floor(Math.random() * limit);
}

function shuffleArray(array) {
    let i = array.length;

    if (i !== 0) {
        while (--i) {
            let j = Math.floor(Math.random() * (i + 1));
            let temp = array[i];
            array[i] = array[j];
            array[j] = temp;
        }
    }
}

(function () {

    let last = 31337;
    let randomBackup = Math.random;

    let fakeRandom = function () {
        let a = 214013;
        let c = 2531011;
        let m = 4294967296;

        let next = (a * last + c) % m;

        last = next;
        return next / m;
    }

    Math.enableFakeRandom = function () {
        Math.random = fakeRandom;
    }

    Math.disableFakeRandom = function () {
        Math.random = randomBackup;
    }

    Math.fakeRandomSeed = function (seed) {
        last = seed;
    }

})();


function generatePuzzle(difficulty) {

    if (difficulty !== 1 && difficulty !== 2 &&
        difficulty !== 3 && difficulty !== 4 &&
        difficulty !== 5) {

        difficulty = 1;
    }

    let solvedPuzzle = solveSudoku(emptyPuzzle);

    let indexes = new Array(81);

    for (let i = 0; i < 81; i++) {
        indexes[i] = i;
    }

    shuffleArray(indexes);

    let knownCount = 81;

    for (let i = 0; i < 81; i++) {

        if (knownCount <= 25) {
            break;
        }

        if (difficulty === 1 && knownCount <= 35) {
            break;
        }

        let index = indexes[i];

        let row = Math.floor(index / 9);
        let col = index % 9;
        let currentValue = solvedPuzzle[row][col];
        let state = {};
        solvedPuzzle[row][col] = 0;
        let resolvedPuzzle = solveSudoku(solvedPuzzle, state);

        let undo = false;
        if (difficulty <= 2 && state.medium) {
            undo = true;
        } else if (difficulty <= 3 && state.hard) {
            undo = true;
        } else if (difficulty <= 4 && state.vhard) {
            undo = true;
        }

        if (undo) {
            solvedPuzzle[row][col] = currentValue;
        } else {
            knownCount--;
        }
    }

    return solvedPuzzle;

}


function verifySolution(board, onlyFullySolved) {

    let resp = {};
    resp['valid'] = false;

    if (board === null) {
        window.console && console.log("Not a board");
        resp['invalidBoard'] = "Board was null";
        return resp;
    }

    let rows = [];
    let cols = [];
    let cubes = [[[], [], []], [[], [], []], [[], [], []]];
    for (let i = 0; i < 9; i++) {
        rows.push([]);
        cols.push([]);
    }

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let digit = board[i][j];

            if (digit === 0) {
                if (onlyFullySolved) {
                    resp['notFullySolved'] = "Board still has unknowns";
                    return resp;
                } else {
                    continue;
                }
            }

            if (digit in rows[i]) {
                resp['badRow'] = i;
                return resp;
            } else {
                rows[i][digit] = true;
            }

            if (digit in cols[j]) {
                resp['badCol'] = j;
                return resp;
            } else {
                cols[j][digit] = true;
            }

            let cube = cubes[getZone(i)][getZone(j)];

            if (digit in cube) {
                resp['badCube'] = [getZone(i) * 3, getZone(j) * 3];
                return resp;
            } else {
                cube[digit] = true;
            }

        }
    }

    resp['valid'] = true;
    return resp;
}

let easyPuzzle = [
    [5, 3, 0, 0, 7, 0, 0, 0, 0],
    [6, 0, 0, 1, 9, 5, 0, 0, 0],
    [0, 9, 8, 0, 0, 0, 0, 6, 0],
    [8, 0, 0, 0, 6, 0, 0, 0, 3],
    [4, 0, 0, 8, 0, 3, 0, 0, 1],
    [7, 0, 0, 0, 2, 0, 0, 0, 6],
    [0, 6, 0, 0, 0, 0, 2, 8, 0],
    [0, 0, 0, 4, 1, 9, 0, 0, 5],
    [0, 0, 0, 0, 8, 0, 0, 7, 9]
];

let easyPuzzle2 = [
    [1, 6, 0, 0, 0, 3, 0, 0, 0],
    [2, 0, 0, 7, 0, 6, 0, 1, 4],
    [0, 4, 5, 0, 8, 1, 0, 0, 7],
    [5, 0, 8, 4, 0, 0, 0, 0, 0],
    [0, 0, 4, 3, 0, 8, 9, 0, 0],
    [0, 0, 0, 0, 0, 7, 2, 0, 8],
    [8, 0, 0, 6, 3, 0, 1, 9, 0],
    [6, 3, 0, 1, 0, 5, 0, 0, 2],
    [0, 0, 0, 8, 0, 0, 0, 3, 6]
];

let easyPuzzle3 = [
    [8, 1, 0, 0, 2, 9, 0, 0, 0],
    [4, 0, 6, 0, 7, 3, 0, 5, 1],
    [0, 7, 0, 0, 0, 0, 8, 0, 2],
    [0, 0, 4, 5, 0, 0, 0, 0, 6],
    [7, 6, 0, 0, 0, 0, 0, 1, 3],
    [1, 0, 0, 0, 0, 6, 2, 0, 0],
    [2, 0, 7, 0, 0, 0, 0, 8, 0],
    [6, 9, 0, 2, 8, 0, 3, 0, 5],
    [0, 0, 0, 9, 6, 0, 0, 2, 4]
];

let solvedPuzzle = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [2, 8, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

let invalidPuzzle = [
    [5, 3, 4, 6, 7, 8, 9, 1, 2],
    [6, 7, 2, 1, 9, 5, 3, 4, 8],
    [1, 9, 8, 3, 4, 2, 5, 6, 7],
    [8, 5, 9, 7, 6, 1, 4, 2, 3],
    [4, 2, 6, 8, 5, 3, 7, 9, 1],
    [7, 1, 3, 9, 2, 4, 8, 5, 6],
    [9, 6, 1, 5, 3, 7, 2, 8, 4],
    [8, 2, 7, 4, 1, 9, 6, 3, 5],
    [3, 4, 5, 2, 8, 6, 1, 7, 9]
];

let hardPuzzle = [
    [0, 0, 3, 0, 0, 8, 0, 0, 0],
    [0, 4, 0, 0, 0, 0, 0, 0, 0],
    [0, 8, 0, 3, 5, 0, 9, 0, 0],
    [8, 0, 5, 0, 0, 6, 0, 0, 0],
    [1, 0, 0, 7, 3, 2, 0, 0, 8],
    [0, 0, 0, 8, 0, 0, 3, 0, 1],
    [0, 0, 8, 0, 1, 4, 0, 7, 0],
    [0, 0, 0, 0, 0, 0, 0, 5, 0],
    [0, 0, 0, 9, 0, 0, 2, 0, 0]
];

let mediumPuzzle = [
    [0, 8, 3, 7, 0, 0, 0, 9, 0],
    [0, 0, 7, 0, 5, 0, 6, 4, 0],
    [0, 0, 0, 9, 0, 0, 0, 0, 3],
    [0, 0, 0, 1, 0, 0, 0, 0, 7],
    [0, 6, 9, 2, 0, 4, 3, 8, 0],
    [7, 0, 0, 0, 0, 9, 0, 0, 0],
    [9, 0, 0, 0, 0, 3, 0, 0, 0],
    [0, 5, 6, 0, 2, 0, 4, 0, 0],
    [0, 1, 0, 0, 0, 7, 5, 3, 0]
];

let emptyPuzzle = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
];

function stressTest() {

    let intervalCount = 0;
    let intervalId = window.setInterval(function () {
        intervalCount++;
        if (intervalCount > 500) {
            window.console && console.log("finished");
            window.clearInterval(intervalId);
        }
        let newPuzzle = solveSudoku(emptyPuzzle);
        let resp = verifySolution(newPuzzle);

        if (resp['valid'] === false) {
            window.console && console.log("Boo! " + intervalCount);
            printBoard(newPuzzle);
        }

    }, 1);

}

function cellInputHandler(event) {
    if (!this.value.match(/^[1-9]$/)) {
        this.value = "";
    }
}

function renderBoard(board) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let id = "" + i + j;
            let el = document.getElementById(id);
            let val = board[i][j];
            let child;
            let elClass;

            if (val === 0) {
                child = document.createElement("input");
                child.setAttribute('maxlength', 1);
                child.addEventListener('keyup', cellInputHandler, false);
                child.addEventListener('blur', cellInputHandler, false);
                elClass = "editValue";
            } else {
                child = document.createElement("span");
                child.textContent = val;
                elClass = "staticValue";
            }

            el.innerHTML = "";
            el.setAttribute("class", elClass);
            el.appendChild(child);
        }
    }
}

function renderSolvedBoard(board) {
    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            let id = "" + i + j;
            let el = document.getElementById(id);
            let val = board[i][j];
            let child = el.children[0];
            if (child.tagName === 'INPUT') {
                child.value = val;
            }
        }
    }
}

function getCurrentBoard() {

    let board = new Array(9);

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 9; j++) {
            if (j === 0) {
                board[i] = new Array(9);
            }
            let id = "" + i + j;
            let el = document.getElementById(id);
            let child = el.children[0];
            let value = "0";
            if (child.tagName === 'INPUT') {
                value = child.value;
            } else if (child.tagName === 'SPAN') {
                value = child.textContent;
            }
            if (value.match(/^[1-9]$/)) {
                value = parseInt(value);
            } else {
                value = 0;
            }
            board[i][j] = value;
        }
    }

    return board;
}

function printBoard(board) {
    for (let i = 0; i < 9; i++) {
        let line = "";
        for (let j = 0; j < 9; j++) {
            line += " " + board[i][j];
        }
        window.console && console.log(line);
    }
}

function solveTest(level, after) {

    let easyCount = 2000;
    let hardCount = 200;

    switch (level) {
        case 1:
            easyCount = 475;
            hardCount = 25;
            break;
        case 2:
            easyCount = 2375;
            hardCount = 125;
            break;
        case 3:
            easyCount = 4750;
            hardCount = 250;
            break;
    }

    Math.enableFakeRandom();
    Math.fakeRandomSeed(31337);

    renderBoard(easyPuzzle);

    let timeElapsed = 0;

    let tests = [];
    tests.push(function () {
        timeElapsed += solveTestHelper(easyPuzzle, easyCount);
    });
    tests.push(function () {
        timeElapsed += solveTestHelper(easyPuzzle2, easyCount);
    });
    tests.push(function () {
        timeElapsed += solveTestHelper(mediumPuzzle, hardCount);
    });
    tests.push(function () {
        timeElapsed += solveTestHelper(hardPuzzle, hardCount);
    });
    tests.push(function () {
        Math.disableFakeRandom();
        document.getElementById("timeFinished").textContent = timeElapsed.toFixed(3) + "s";
    });
    tests.push(after);

    let current = 0;

    let timeoutFunc = function () {
        if (current < tests.length) {
            tests[current]();
            current++;
            window.setTimeout(timeoutFunc, 300);
        }
    }

    window.setTimeout(timeoutFunc, 300);

}

function solveTestHelper(puzzle, iterations) {
    let solution = null;
    let start = new Date();
    for (let i = 0; i < iterations; i++) {
        solution = solveSudoku(puzzle);
    }
    let end = new Date();
    renderBoard(puzzle);
    renderSolvedBoard(solution);
    return (end.getTime() - start.getTime()) / 1000;
}

function initialize() {

    let currentPuzzle = generatePuzzle();
    renderBoard(currentPuzzle);

    let amazeButton = document.getElementById('amazeButton');
    let calculatingDiv = document.getElementById('calculating');
    let finishedCalculatingDiv = document.getElementById('finishedCalculating');
    let winBlock = document.getElementById('youWon');
    let noErrorsSpan = document.getElementById('noErrors');
    let errorsFoundSpan = document.getElementById('errorsFound');
    let difficulty = document.getElementById('difficulty');
    let currentErrors = [];
    let amazing = false;

    let clearErrors = function () {

        errorsFoundSpan.style.display = 'none';
        noErrorsSpan.style.display = 'none';

        for (let i = 0; i < currentErrors.length; i++) {
            currentErrors[i].setAttribute('class', currentErrors[i].getAttribute('class').replace(" error", ''))
        }
        currentErrors = [];
    }

    amazeButton.addEventListener('click', function () {
        if (!amazing) {
            let level = parseInt(difficulty.options[difficulty.selectedIndex].value);
            amazing = true;
            clearErrors();
            finishedCalculatingDiv.style.display = 'none';
            calculatingDiv.style.display = 'block';

            solveTest(level, function () {
                finishedCalculatingDiv.style.display = 'block';
                calculatingDiv.style.display = 'none';
                amazing = false;
                currentPuzzle = hardPuzzle;
            });
        }
    }, false);

    let checkButton = document.getElementById('checkButton');

    checkButton.addEventListener('click', function () {

        clearErrors();

        let board = getCurrentBoard();
        let result = verifySolution(board);
        if (result['valid']) {

            let validMessages = ["看起来不错", "继续前进", "棒极了", "棒极了", "很好", "很可爱", "看起来不错"];

            if (verifySolution(board, true)['valid']) {
                winBlock.style.display = 'block';
            } else {
                let randIndex = getRandom(validMessages.length);
                noErrorsSpan.textContent = validMessages[randIndex];
                noErrorsSpan.style.display = 'block';
            }
        } else {
            if ('badRow' in result) {
                let row = result['badRow'];
                for (let i = 0; i < 9; i++) {
                    let id = "" + row + i;
                    let el = document.getElementById(id);
                    el.setAttribute("class", el.getAttribute('class') + " error");
                    currentErrors.push(el);
                }
            } else if ('badCol' in result) {
                let col = result['badCol'];
                for (let i = 0; i < 9; i++) {
                    let id = "" + i + col;
                    let el = document.getElementById(id);
                    el.setAttribute("class", el.getAttribute('class') + " error");
                    currentErrors.push(el);
                }
            } else if ('badCube' in result) {
                let cubeRow = result['badCube'][0];
                let cubeCol = result['badCube'][1];
                for (let x = cubeRow + 2; x >= cubeRow; x--) {
                    for (let y = cubeCol + 2; y >= cubeCol; y--) {
                        let id = "" + x + y;
                        let el = document.getElementById(id);
                        el.setAttribute("class", el.getAttribute('class') + " error");
                        currentErrors.push(el);
                    }
                }

            }
            errorsFoundSpan.style.display = 'block';
        }


    }, false);

    let winCloseButton = document.getElementById('winCloseButton');

    winCloseButton.addEventListener('click', function () {
        winBlock.style.display = 'none';
    }, false);

    let winNewGameButton = document.getElementById('winNewGameButton');

    winNewGameButton.addEventListener('click', function () {
        clearErrors();
        let value = parseInt(difficulty.options[difficulty.selectedIndex].value);
        currentPuzzle = generatePuzzle(value);
        renderBoard(currentPuzzle);
        winBlock.style.display = 'none';
    }, false);

    let newGameButton = document.getElementById('newGameButton');

    newGameButton.addEventListener('click', function () {
        clearErrors();
        let value = parseInt(difficulty.options[difficulty.selectedIndex].value);
        currentPuzzle = generatePuzzle(value);
        renderBoard(currentPuzzle);
    }, false);

    let solveButton = document.getElementById('solveButton');

    solveButton.addEventListener('click', function () {
        clearErrors();
        renderSolvedBoard(solveSudoku(currentPuzzle));
    }, false);

    addEventListener('mouseup', function (event) {
        if (UIEvent.which === 1) {
            noErrorsSpan.style.display = 'none';
        }
    }, false);

}

addEventListener('DOMContentLoaded', initialize, false);

