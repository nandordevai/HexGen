import { Hex } from './hex.js';

window.HEXSIZE = 12.5;
window.ROWHEIGHT = Math.cos(Math.PI / 6) * HEXSIZE;

const width = 1920;
const height = 1080;
const rows = 46;
const columns = 100;
const hexes = [];
const keyPointsNum = 8;
// wind direction to:
// 0 = north, 1 = northeast, 2 = southeast, 3 = south, 4 = southwest, 5 = northwest
const wind = 5;
let keyPoints = [];
let startKeyPoint;
let globalElevation;
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
    load(7665, 59198).then((data) => {
        background(0, 0, 100, 1);
        data.forEach((row, y) => {
            row.forEach((hex, x) => {
                hexes[y][x].setElevationTo(hex[0]);
            });
        });
        hexes.forEach(row => row.forEach(hex => { hex.draw(); }));
    });
    document.querySelector('#seed').value = 7665;
    document.querySelector('#elevation').value = 59198;
    document.querySelector('#elevation-input').value = 59198;
};

window.draw = () => {
    hexes.forEach(row => row.forEach(hex => { hex.reset(); }));
    background(0, 0, 100, 1);
    let [x, y] = keyPoints[startKeyPoint];
    for (let i = 0; i < globalElevation; i++) {
        x += randint(2) - 1;
        y += randint(2) - 1;
        if ((x >= columns - 2 || x < 1) || (y >= rows - 2 || y < 1)) {
            [x, y] = random(keyPoints);
        }
        const h = hexes[y][x];
        h.raise();
    }
    removeLakes();
    calculatePrecipitation();
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
};

function initRandom() {
    randomSeed(seed);
    setKeyPoints();
    startKeyPoint = Math.floor(random(keyPointsNum));
};

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
};

function removeLakes() {
    if (hexes[0][0].isOcean === null) {
        addToOcean(hexes[0][0]);
    }
    hexes.forEach(row => row.forEach((hex) => {
        if (!hex.isOcean && hex.elevation < 1) {
            hex.setElevationTo(1);
        }
    }));
};

function setKeyPoints() {
    for (let i = 1; i <= keyPointsNum; i++) {
        let x = Math.floor(randint(columns / 2)) + (columns / 2) * (i % 2);
        let y = Math.floor(randint(rows / 2)) + (rows / 2) * (i % 2);
        x = Math.min(columns - 2, Math.max(x, 1));
        y = Math.min(rows - 2, Math.max(y, 1));
        keyPoints.push([x, y]);
    }
};

function loadValues() {
    globalElevation = getStoredValue('hexgen-elevation', 15000);
    document.querySelector('#elevation-input').value = globalElevation;
    seed = getStoredValue('hexgen-seed', randint(10000));
    document.querySelector('#seed').value = seed;
};

function setHandlers() {
    document.querySelector('#elevation').addEventListener('input', (e) => {
        globalElevation = e.target.value;
        document.querySelector('#elevation-input').value = e.target.value;
        localStorage.setItem('hexgen-elevation', e.target.value);
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

    document.querySelector('#elevation-input').addEventListener('change', (e) => {
        localStorage.setItem('hexgen-elevation', e.target.value);
        document.querySelector('#elevation').value = e.target.value;
        setDefaults();
        redraw();
    });

    document.querySelector('#load-default').addEventListener('click', () => {
        loadSaved();
    });

    document.querySelector('#save').addEventListener('click', () => {
        save();
    });
};

function randint(i) {
    return Math.floor(random(i + 1));
};

function getStoredValue(key, defaultValue) {
    let v = localStorage.getItem(key);
    if (v === null) {
        v = defaultValue;
        localStorage.setItem(key, defaultValue);
    }
    return v;
};

function save() {
    const mapData = {
        seed,
        elevation: globalElevation,
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

async function load(seed, elevation) {
    const response = await fetch(`/load/${seed}/${elevation}`);
    const json = await response.json();
    return json;
}
