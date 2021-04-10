// 3165, 24282

const sketch = new p5((p) => {
    const size = 25;
    const rowHeight = Math.cos(Math.PI / 6) * size;
    const width = 2560;
    const height = 1440;
    const rows = 30;
    const columns = 60;
    const hexes = [];
    let elevation; // TODO: find better name
    let seed;

    p.setup = () => {
        p.noLoop();
        loadValues();
        p.randomSeed(seed);
        p.createCanvas(width, height);
        p.colorMode(p.HSB, 360, 100, 100);
        for (let y = 0; y < rows; y++) {
            const row = [];
            for (let x = 0; x < columns; x++) {
                row.push(new Hex(x, y));
            }
            hexes.push(row);
        }
        setHandlers();
    };

    p.draw = () => {
        const keyPoints = getKeyPoints();
        hexes.forEach(row => row.forEach(hex => hex.elevation = 0));
        p.background(0, 0, 100, 1);
        let [x, y] = keyPoints[0];
        for (let i = 0; i < elevation; i++) {
            x += randint(2) - 1;
            y += randint(2) - 1;
            if ((x >= columns - 2 || x < 1) || (y >= rows - 2 || y < 1)) {
                [x, y] = p.random(keyPoints);
            }
            const h = hexes[y][x];
            h.raise();
        }
        removeLakes();
        hexes.forEach(row => row.forEach(hex => hex.draw()));
        console.log(hexes[1][19].neighbours().map(_ => [_.x, _.y]));
    };

    addToOcean = (hex) => {
        if (hex.isOcean !== null) return;
        hex.isOcean = true;
        hex.neighbours()
            .filter(_ => _.isOcean === null)
            .forEach((neighbour) => {
                if (neighbour.elevation < 1) {
                    addToOcean(neighbour);
                } else {
                    neighbour.isOcean = false;
                }
            });
    };

    removeLakes = () => {
        addToOcean(hexes[0][0]);
        hexes.forEach(row => row.forEach((hex) => {
            if (!hex.isOcean && hex.elevation < 1) {
                hex.raiseTo(1);
            }
        }));
    };

    getKeyPoints = () => {
        const keyPoints = [];
        for (let i = 1; i <= 4; i++) {
            let x = Math.floor(randint(columns / 2)) + (columns / 2) * (i % 2);
            let y = Math.floor(randint(rows / 2)) + (rows / 2) * (i % 2);
            x = Math.min(columns - 2, Math.max(x, 1));
            y = Math.min(rows - 2, Math.max(y, 1));
            keyPoints.push([x, y]);
        }
        return keyPoints;
    };

    loadValues = () => {
        elevation = getStoredValue('hexgen-elevation', 15000);
        document.querySelector('#elevation-label').innerHTML = elevation;
        seed = getStoredValue('hexgen-seed', randint(10000));
        document.querySelector('#seed').value = seed;
    };

    setHandlers = () => {
        document.querySelector('#elevation').addEventListener('input', (e) => {
            elevation = e.target.value;
            document.querySelector('#elevation-label').innerHTML = e.target.value;
            localStorage.setItem('hexgen-elevation', e.target.value);
            p.redraw();
        });

        document.querySelector('#regenerate-seed').addEventListener('click', () => {
            const newSeed = randint(10000);
            localStorage.setItem('hexgen-seed', newSeed);
            document.querySelector('#seed').value = newSeed;
            p.redraw();
        });
    };

    randint = (i) => {
        return Math.floor(p.random(i + 1));
    };

    getStoredValue = (key, defaultValue) => {
        let v = localStorage.getItem(key);
        if (v === null) {
            v = defaultValue;
            localStorage.setItem(key, defaultValue);
        }
        return v;
    };

    class Hex {
        constructor(x, y, elevation = 0) {
            this.x = x;
            this.y = y;
            this.isOcean = null;
            this.elevation = elevation;
            this.setFillColor();
        }

        neighbours() {
            const neighbours = [];
            // above
            if (this.y > 0) {
                neighbours.push(hexes[this.y - 1][this.x]);
            }
            // beyond
            if (this.y < rows - 1) {
                neighbours.push(hexes[this.y + 1][this.x]);
            }
            if (this.x % 2) {
                // odd row, up is y - 1, down is y
                // up left
                if (this.y > 0 && this.x > 1) {
                    neighbours.push(hexes[this.y - 1][this.x - 1]);
                }
                // up right
                if (this.y > 0 && this.x < columns - 1) {
                    neighbours.push(hexes[this.y - 1][this.x + 1]);
                }
                // down left
                if (this.y < rows - 1 && this.x > 0) {
                    neighbours.push(hexes[this.y][this.x - 1]);
                }
                // down right
                if (this.y < rows - 1 && this.x < columns - 1) {
                    neighbours.push(hexes[this.y][this.x + 1]);
                }
            } else {
                // even row, up is y, down is y + 1
                // up left
                if (this.x > 1) {
                    neighbours.push(hexes[this.y][this.x - 1]);
                }
                // up right
                if (this.x < columns - 1) {
                    neighbours.push(hexes[this.y][this.x + 1]);
                }
                // down left
                if (this.y < rows - 2 && this.x > 0) {
                    neighbours.push(hexes[this.y + 1][this.x - 1]);
                }
                // down right
                if (this.y < rows - 2 && this.x < columns - 1) {
                    neighbours.push(hexes[this.y + 1][this.x + 1]);
                }
            }
            return neighbours;
        }

        setFillColor() {
            const colors = {
                sea: p.color(220, 50, 100),
                plains: p.color(120, 40, 60),
                hills: p.color(30, 40, 55),
                mountains: p.color(30, 40, 35),
                highMountains: p.color(0, 0, 100),
            };
            this.color = colors[Object.keys(colors)[Math.floor(this.elevation)]];
        }

        raise() {
            if (this.elevation === 0) {
                this.elevation += 0.5;
            } else if (this.elevation < 4) {
                this.elevation += 0.2 * (1 / (this.elevation + 1));
            }
            this.setFillColor();
        }

        raiseTo(elevation) {
            this.elevation = elevation;
            this.setFillColor();
        }

        draw() {
            const sx = ((1.5 * this.x) + 1) * size;
            let sy = (this.y + .5) * rowHeight * 2;
            if (this.x % 2 === 0) {
                sy += rowHeight;
            }
            p.push();
            p.translate(sx, sy);
            p.stroke(0, 0, 40);
            p.strokeWeight(.5);
            p.fill(this.color);
            p.beginShape();
            for (let i = 0; i < 6; i++) {
                const v = new p5.Vector.fromAngle(i * (Math.PI / 3), size);
                p.vertex(v.x, v.y);
            }
            p.endShape(p.CLOSE);
            p.noStroke();
            if (this.elevation === 3) {
                p.fill(0, 0, 100);
            } else {
                p.fill(0, 0, 0);
            }
            p.textFont('Helvetica Neue Light', 10);
            p.textStyle(p5.NORMAL);
            p.text(`${this.x}, ${this.y}`, -13, -6);
            p.pop();
        }
    }
}, 'sketch');
