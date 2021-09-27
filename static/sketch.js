import { Hex } from './hex.js';

window.HEXSIZE = 12.5;
window.ROWHEIGHT = Math.cos(Math.PI / 6) * HEXSIZE;

const width = 1920;
const height = 1080;
const rows = 46;
const columns = 100;
const hexes = [];
const keyPointsUpNum = 8;
const keyPointsDownNum = 4;
const defaultSeed = 7665;
const defaultElevationUp = 59198;
const defaultElevationDown = 6500;
// wind direction (to):
// 0 = north, 1 = northeast, 2 = southeast, 3 = south, 4 = southwest, 5 = northwest
let keyPointsUp = [];
let keyPointsDown = [];
let startKeyPointUp;
let startKeyPointDown;
let globalElevationUp;
let globalElevationDown;
let seed;

window.setup = () => {
    noLoop();
    createCanvas(width, height);
    colorMode(HSB, 360, 100, 100);
    for (let y = 0; y < rows; y++) {
        const row = [];
        for (let x = 0; x < columns; x++) {
            row.push(new Hex(x, y));
        }
        hexes.push(row);
    }
    setDefaults();
    setHandlers();
};

function loadSaved() {
    load(defaultSeed, defaultElevationUp, defaultElevationDown).then((data) => {
        background(0, 0, 100, 1);
        data.forEach((row, y) => {
            row.forEach((hex, x) => {
                hexes[y][x].setElevationTo(hex[0]);
            });
        });
        hexes.forEach(row => row.forEach(hex => { hex.draw(); }));
    });
    document.querySelector('#seed').value = defaultSeed;
    document.querySelector('#elevation-up').value = defaultElevationUp;
    document.querySelector('#elevation-input-up').value = defaultElevationUp;
    document.querySelector('#elevation-down').value = defaultElevationDown;
    document.querySelector('#elevation-input-down').value = defaultElevationDown;
}

window.draw = () => {
    hexes.forEach(row => row.forEach(hex => { hex.reset(); }));
    background(0, 0, 100, 1);
    let [x, y] = keyPointsUp[startKeyPointUp];
    for (let i = 0; i < globalElevationUp; i++) {
        x += randint(2) - 1;
        y += randint(2) - 1;
        if ((x >= columns - 2 || x < 1) || (y >= rows - 2 || y < 1)) {
            [x, y] = random(keyPointsUp);
        }
        hexes[y][x].raise();
    }
    [x, y] = keyPointsDown[startKeyPointDown];
    for (let i = 0; i < globalElevationDown; i++) {
        x += randint(2) - 1;
        y += randint(2) - 1;
        if ((x >= columns - 2 || x < 1) || (y >= rows - 2 || y < 1)) {
            [x, y] = random(keyPointsDown);
        }
        hexes[y][x].lower();
    }
    removeLakes();
    decimateIslands();
    // calculatePrecipitation();
    hexes.forEach(row => row.forEach(hex => { hex.draw(); }));
};

function calculatePrecipitation2(startAt, endAt) {
    let incrementor = [];
    if (startAt[0] === endAt[0]) {
        incrementor = [0, 1];
    } else {
        incrementor = [1, 0];
    }
    let position = startAt;
    while (position[0] <= endAt[0] && position[1] <= endAt[1]) {
        position[0] += incrementor[0];
        position[1] += incrementor[1];
    }
}

function calculatePrecipitation() {
    const defaultPrecipitation = 55;

    const calculateArea = (hex) => {
        let prevElevation = hex.elevation;
        let precipitation = defaultPrecipitation;
        while (hex.x >= 0 && hex.y >= 0) {
            hex.setPrecipitation(precipitation);
            hex = getHexNeighbours(hex)[wind];
            if (hex === null) break;
            if (hex.elevation < 1) {
                // reset on sea
                precipitation = defaultPrecipitation;
            } else if (prevElevation < hex.elevation) {
                // decrease precipitation on upward slopes
                precipitation = Math.max(0, precipitation - Math.floor(hex.elevation));
            } else {
                if (precipitation === 0) {
                    hex.setBiome('desert');
                }
            }
            prevElevation = hex.elevation;
        }
    };

    for (let x = columns - 1; x > 0; x--) {
        let hex = hexes[rows - 1][x];
        calculateArea(hex);
    }

    for (let y = rows - 1; y > 0; y--) {
        let hex = hexes[y][columns - 1];
        calculateArea(hex);
    }
}

function setDefaults() {
    loadValues();
    initRandom();
}

function initRandom() {
    randomSeed(seed);
    setKeyPoints();
    startKeyPointUp = Math.floor(random(keyPointsUpNum));
    startKeyPointDown = Math.floor(random(keyPointsDownNum));
}

function getHexNeighbours(hex) {
    let top = null;
    let topright = null;
    let bottomright = null;
    let bottom = null;
    let bottomleft = null;
    let topleft = null;
    if (hex.y > 0) {
        top = hexes[hex.y - 1][hex.x];
    }
    if (hex.y < rows - 1) {
        bottom = hexes[hex.y + 1][hex.x];
    }
    if (hex.x % 2) {
        if (hex.y > 0 && hex.x > 1) {
            topleft = hexes[hex.y - 1][hex.x - 1];
        }
        if (hex.y > 0 && hex.x < columns - 1) {
            topright = hexes[hex.y - 1][hex.x + 1];
        }
        if (hex.y < rows - 1 && hex.x > 0) {
            bottomleft = hexes[hex.y][hex.x - 1];
        }
        if (hex.y < rows - 1 && hex.x < columns - 1) {
            bottomright = hexes[hex.y][hex.x + 1];
        }
    } else {
        if (hex.x > 1) {
            topleft = hexes[hex.y][hex.x - 1];
        }
        if (hex.x < columns - 1) {
            topright = hexes[hex.y][hex.x + 1];
        }
        if (hex.y < rows - 2 && hex.x > 0) {
            bottomleft = hexes[hex.y + 1][hex.x - 1];
        }
        if (hex.y < rows - 2 && hex.x < columns - 1) {
            bottomright = hexes[hex.y + 1][hex.x + 1];
        }
    }
    return [top, topright, bottomright, bottom, bottomleft, topleft];
}

function addToOcean(hex) {
    if (hex.isOcean !== null) return;
    hex.isOcean = true;
    getHexNeighbours(hex)
        .filter(_ => _ !== null)
        .filter(_ => _.isOcean === null)
        .forEach((neighbour) => {
            if (neighbour.elevation < 1) {
                addToOcean(neighbour);
            } else {
                neighbour.isOcean = false;
            }
        });
}

function removeLakes() {
    if (hexes[0][0].isOcean === null) {
        addToOcean(hexes[0][0]);
    }
    hexes.forEach(row => row.forEach((hex) => {
        if (!hex.isOcean && hex.elevation < 1) {
            hex.setElevationTo(1);
        }
    }));
}

function decimateIslands() {
    hexes.forEach(row => row.forEach((hex) => {
        if (getHexNeighbours(hex).filter(_ => _ !== null && _.elevation > 1).length < 3) {
            hex.setElevationTo(0);
        }
    }));
}

function setKeyPoints() {
    for (let i = 1; i <= keyPointsUpNum; i++) {
        let { x, y } = getRandomPoint(i);
        keyPointsUp.push([x, y]);
    }
    for (let i = 1; i <= keyPointsDownNum; i++) {
        let { x, y } = getRandomPoint(i);
        keyPointsDown.push([x, y]);
    }
}

function getRandomPoint(i) {
    let x = Math.floor(randint(columns / 2)) + (columns / 2) * (i % 2);
    let y = Math.floor(randint(rows / 2)) + (rows / 2) * (i % 2);
    x = Math.min(columns - 2, Math.max(x, 1));
    y = Math.min(rows - 2, Math.max(y, 1));
    return { x, y };
}

function loadValues() {
    globalElevationUp = getStoredValue('hexgen-elevation-up', 15000);
    globalElevationDown = getStoredValue('hexgen-elevation-down', 1500);
    document.querySelector('#elevation-input-up').value = globalElevationUp;
    document.querySelector('#elevation-input-down').value = globalElevationDown;
    seed = getStoredValue('hexgen-seed', randint(10000));
    document.querySelector('#seed').value = seed;
    // wind = getStoredValue('hexgen-wind', 0);
}

function setHandlers() {
    document.querySelector('#elevation-up').addEventListener('input', (e) => {
        globalElevationUp = e.target.value;
        document.querySelector('#elevation-input-up').value = e.target.value;
        localStorage.setItem('hexgen-elevation-up', e.target.value);
        initRandom();
        redraw();
    });

    document.querySelector('#elevation-down').addEventListener('input', (e) => {
        globalElevationDown = e.target.value;
        document.querySelector('#elevation-input-down').value = e.target.value;
        localStorage.setItem('hexgen-elevation-down', e.target.value);
        initRandom();
        redraw();
    });

    document.querySelector('#regenerate-seed').addEventListener('click', () => {
        const newSeed = randint(10000);
        localStorage.setItem('hexgen-seed', newSeed);
        document.querySelector('#seed').value = newSeed;
        setDefaults();
        redraw();
    });

    document.querySelector('#seed').addEventListener('change', (e) => {
        localStorage.setItem('hexgen-seed', e.target.value);
        document.querySelector('#seed').value = e.target.value;
        setDefaults();
        redraw();
    });

    document.querySelector('#elevation-input-up').addEventListener('change', (e) => {
        localStorage.setItem('hexgen-elevation-up', e.target.value);
        document.querySelector('#elevation-up').value = e.target.value;
        setDefaults();
        redraw();
    });

    document.querySelector('#elevation-input-down').addEventListener('change', (e) => {
        localStorage.setItem('hexgen-elevation-down', e.target.value);
        document.querySelector('#elevation-down').value = e.target.value;
        setDefaults();
        redraw();
    });

    document.querySelector('#load-default').addEventListener('click', () => {
        loadSaved();
    });

    document.querySelector('#save').addEventListener('click', () => {
        save();
    });

    // document.querySelector('#wind').addEventListener('change', (e) => {
    //     localStorage.setItem('hexgen-wind', e.target.value);
    //     wind = e.target.value;
    //     redraw();
    // });
}

function randint(i) {
    return Math.floor(random(i + 1));
}

function getStoredValue(key, defaultValue) {
    let v = localStorage.getItem(key);
    if (v === null) {
        v = defaultValue;
        localStorage.setItem(key, defaultValue);
    }
    return v;
}

function save() {
    const mapData = {
        seed,
        elevationUp: globalElevationUp,
        elevationDown: globalElevationDown,
        data: hexes.map(row => row.map(hex => [hex.elevation])),
    };
    fetch('http://localhost:5000/save', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(mapData),
    });
}

async function load(seed, elevationUp, elevationDown) {
    const response = await fetch(`/load/${seed}/${elevationUp}/${elevationDown}`);
    const json = await response.json();
    return json;
}
