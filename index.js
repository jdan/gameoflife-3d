"use strict";

const Canvas = require("canvas");
const fs = require("fs");
const GIFEncoder = require("gifencoder");
const Isomer = require("isomer");

const Shape = Isomer.Shape;
const Point = Isomer.Point;
const Color = Isomer.Color;

const canvas = new Canvas(800, 800);
var ctx = canvas.getContext("2d");
const encoder = new GIFEncoder(800, 800);

const filename = "animated.gif";

// stream the results as they are available into myanimated.gif
encoder.createReadStream().pipe(fs.createWriteStream(filename));

encoder.start();
encoder.setRepeat(0);   // 0 for repeat, -1 for no-repeat
encoder.setDelay(33);   // frame delay in ms
encoder.setQuality(10); // image quality. 10 is default.

const iso = new Isomer(canvas);

const blue = new Color(56, 149, 179);

const cellSize = 0.04;

function emptyGrid(width, height) {
    return makeGrid(width, height, _ => 0);
}

function makeGrid(width, height, getValue) {
    const grid = [];
    for (let i = 0; i < width; i++) {
        const row = [];
        for (let j = 0; j < height; j++) {
            row.push(getValue(i, j));
        }
        grid.push(row);
    }

    return grid;
}

function cellToInt(grid, x, y) {
    const row = grid[x];
    if (!row) {
        return 0;
    } else {
        return +!!row[y];
    }
}

function getNeighbors(grid, x, y) {
    return [
        cellToInt(grid, x-1, y-1),
        cellToInt(grid, x  , y-1),
        cellToInt(grid, x+1, y-1),

        cellToInt(grid, x-1, y  ),
        // skip x, y
        cellToInt(grid, x+1, y  ),

        cellToInt(grid, x-1, y+1),
        cellToInt(grid, x  , y+1),
        cellToInt(grid, x+1, y+1),
    ].filter(i => i).length;
}

function nextGrid(oldGrid) {
    const width = oldGrid.length;
    const height = oldGrid[0].length;

    const grid = emptyGrid(width, height);

    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            const neighbors = getNeighbors(oldGrid, x, y);
            grid[x][y] = oldGrid[x][y];

            if (oldGrid[x][y]) {
                if (neighbors < 2) {
                    // Death by underpopulation
                    grid[x][y] = 0;
                } else if (neighbors > 3) {
                    // Death by overpopulation
                    grid[x][y] = 0;
                }
            } else {
                if (neighbors === 3) {
                    // Life is created!
                    grid[x][y] = 1;
                }
            }
        }
    }

    return grid;
}

function drawGrid(grid, offsetZ) {
    const width = grid.length;
    const height = grid[0].length;

    // Draw from back
    for (let x = width - 1; x >= 0; x--) {
        for (let y = height - 1; y >= 0; y--) {
            if (grid[x][y]) {
                iso.add(
                    Shape.Prism(
                        new Point(x*cellSize, y*cellSize, offsetZ*cellSize),
                        cellSize*0.8,
                        cellSize*0.8,
                        cellSize*0.8
                    ),
                    blue
                );
            }
        }
    }
}

function drawSnapshots(snapshots) {
    // draw 'em backwards
    for (let i = 0; i < snapshots.length; i++) {
        drawGrid(snapshots[snapshots.length - i - 1], i);
    }
}

// Main
const width = 40;
const height = 40;
const frames = 200;

let grid = makeGrid(width, height, _ => +(Math.random() > 0.8));
let snapshots = [];

for (let i = 0; i < frames; i++) {
    // Clear the canvas
    iso.canvas.clear();

    // Snapshot the grid
    snapshots.push(grid);

    // Draw all the snapshots
    drawSnapshots(snapshots);
    encoder.addFrame(ctx);

    // Make a new grid
    grid = nextGrid(grid);

    console.log(`Rendering frame ${i+1} of ${frames}`);
}

encoder.finish();
console.log("Complete! Written to " + filename);

// console.log("Complete! Writing to " + filename);
// const out = fs.createWriteStream("output.png");
// canvas.pngStream().pipe(out);
