export class Hex {
    constructor(x, y, elevation = 0) {
        this.x = x;
        this.y = y;
        this.isOcean = null;
        this.biome = null;
        this.precipitation = null;
        this.setElevationTo(elevation);
    }

    reset() {
        this.setElevationTo(0);
        this.isOcean = null;
    }

    setFillColor() {
        if (this.biome === 'desert') {
            this.color = color(50, 30, 80);
            return;
        }
        const colors = {
            sea: color(220, 50, 100),
            plains: color(120, 40, 60),
            hills: color(30, 40, 55),
            mountains: color(30, 40, 35),
            highMountains: color(0, 0, 100),
        };
        this.color = colors[Object.keys(colors)[Math.floor(this.elevation)]];
    }

    setPrecipitation(precipitation) {
        this.precipitation = precipitation;
    }

    setBiome(biome) {
        this.biome = biome;
        this.setFillColor();
    }

    raise() {
        if (this.elevation === 0) {
            this.elevation += 0.5;
        } else if (this.elevation < 4) {
            this.elevation += 0.2 * (1 / (this.elevation + 1));
        }
        this.setFillColor();
    }

    setElevationTo(elevation) {
        this.elevation = elevation;
        this.setFillColor();
    }

    draw() {
        const sx = ((1.5 * this.x) + 1) * HEXSIZE;
        let sy = (this.y + .5) * ROWHEIGHT * 2;
        if (this.x % 2 === 0) {
            sy += ROWHEIGHT;
        }
        push();
        translate(sx, sy);
        stroke(0, 0, 40);
        strokeWeight(.5);
        fill(this.color);
        beginShape();
        for (let i = 0; i < 6; i++) {
            const v = new p5.Vector.fromAngle(i * (Math.PI / 3), HEXSIZE);
            vertex(v.x, v.y);
        }
        endShape(CLOSE);
        // noStroke();
        // if (this.elevation === 3) {
        //     fill(0, 0, 100);
        // } else {
        //     fill(0, 0, 0);
        // }
        // textFont('Helvetica Neue Light', 10);
        // textStyle(p5.NORMAL);
        // let biome;
        // switch (Math.floor(this.elevation)) {
        //     case 2:
        //         biome = '🌳';
        //         break;
        //     case 3:
        //         biome = '🌲';
        //         break;
        //     default:
        //         biome = '';
        //         break;
        // }
        // text(biome, -7, 3);
        pop();
    }
}
