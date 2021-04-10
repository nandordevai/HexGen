const sketch = new p5((p) => {
    const size = 25;
    const rowHeight = Math.cos(Math.PI / 6) * size;
    const width = window.innerWidth;
    const height = window.innerHeight;
    const rows = Math.floor(height / (rowHeight * 2) - 2);
    const columns = Math.floor(width / (size * 1.6));
    const hexes = [];

    p.setup = () => {
        p.randomSeed(setSeed());
        p.createCanvas(width, height);
        p.colorMode(p.HSB, 360, 100, 100);
        for (let y = 0; y < rows; y++) {
            const row = [];
            for (let x = 0; x < columns; x++) {
                row.push(new Hex(x, y));
            }
            hexes.push(row);
        }
    };

    p.draw = () => {
        p.noLoop();
        let x = Math.floor(randint(columns / 2) + columns / 4) - 1;
        let y = Math.floor(randint(rows / 2) + rows / 4) - 1;
        for (let i = 0; i < 14000; i++) {
            x += randint(2) - 1;
            if (x >= columns || x < 1) x = Math.floor(randint(columns / 2) + columns / 4) - 1;
            y += randint(2) - 1;
            if (y >= rows || y < 1) y = Math.floor(randint(rows / 2) + rows / 4) - 1;
            const h = hexes[y][x];
            h.raise();
        }
        hexes.forEach(row => row.forEach(hex => hex.draw()));
    };

    randint = (i) => {
        return Math.floor(p.random(i + 1));
    };

    setSeed = () => {
        let seed = localStorage.getItem('hexgenSeed');
        if (seed === null) {
            seed = randint(10000);
            localStorage.setItem('hexgenSeed', seed);
        }
        return seed;
    };

    class Hex {
        constructor(x, y, altitude = 0) {
            this.x = x;
            this.y = y;
            this.altitude = altitude;
            this.setFillColor();
        }

        setFillColor() {
            const colors = {
                sea: p.color(220, 50, 100),
                plains: p.color(120, 40, 60),
                hills: p.color(30, 40, 55),
                mountains: p.color(30, 40, 35),
                highMountains: p.color(0, 0, 100),
            };
            this.color = colors[Object.keys(colors)[Math.floor(this.altitude)]];
        }

        raise() {
            if (this.altitude < 4) {
                this.altitude += 0.1;
                this.setFillColor();
            }
        }

        draw() {
            const sx = ((1.5 * this.x) + 1) * size;
            let sy = (this.y + .5) * rowHeight * 2;
            if (this.x % 2 === 0) {
                sy += rowHeight;
            }
            p.push();
            p.translate(sx, sy);
            p.stroke(0, 0, 30);
            p.strokeWeight(.5);
            p.fill(this.color);
            p.beginShape();
            for (let i = 0; i < 6; i++) {
                const v = new p5.Vector.fromAngle(i * (Math.PI / 3), size);
                p.vertex(v.x, v.y);
            }
            p.endShape(p.CLOSE);
            p.noStroke();
            if (this.altitude === 3) {
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
