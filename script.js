const refreshBtn = document.getElementById("refresh");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "black";

let image = new Image();
const new_width = 400;

const pieces = new Map();
const cols = 3;
const rows = 5;

let tile_w;
let tile_h;
let img_w;
let img_h;

function loadImage() {
    fetch("https://nekos.best/api/v2/waifu").then(res => res.json()).then(res => {
        image.src = res['results'][0]['url'];
    });
}

loadImage();

function chooseRandomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

class Tile {
    constructor(i, j) {
        this.init_i = i;
        this.init_j = j;
        this.is_hollow = false;

        this.i = i;
        this.j = j;
    }

    changePosTo(key) {
        const values = key.split(",");
        this.i = Number(values[0]);
        this.j = Number(values[1]);
    }

    drawAtCurrentPos() {
        if(this.is_hollow) {
            ctx.fillRect(this.j*tile_w, this.i*tile_h, tile_w, tile_h);
        } else {
            ctx.drawImage(image, this.init_j*img_w, this.init_i*img_h, img_w, img_h, this.j*tile_w, this.i*tile_h, tile_w, tile_h);
        }
    }
}

image.onload = () => {
    const ratio = image.height/image.width;
    const new_height = new_width*ratio
    ctx.canvas.width = new_width;
    ctx.canvas.height = new_height;

    tile_w = new_width/cols;
    tile_h = new_height/rows;
    img_w = image.width/cols;
    img_h = image.height/rows;

    ctx.fillRect(0, 0, new_width, new_height);

    divide();
};

function divide() {
    function detectTile(x, y) {
        const i = Math.ceil(x/tile_w)-1;
        const j = Math.ceil(y/tile_h)-1;
        return String([
            j == rows ? j-1 : j,
            i == cols ? i-1 : i
        ]);
    }
    
    for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
            const key = String([i,j]);
            pieces.set(key, new Tile(i, j));
            pieces.get(key).drawAtCurrentPos();
        }
    }

    let hollowKey = String([rows-1, cols-1]);
    const hollow = pieces.get(hollowKey);
    hollow.is_hollow = true;
    hollow.drawAtCurrentPos();

    function availableToSwitch() {
        const res = [];
        const toCheck = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        toCheck.forEach(fieldMod => {
            const other_i = hollow.i + fieldMod[0];
            const other_j = hollow.j + fieldMod[1];

            if(other_i > -1 && other_j > -1 && other_i < rows && other_j < cols)
            res.push(String([other_i, other_j]));
        });

        return res;
    }

    function switchTiles(chosenTileKey) {
        const chosenTile = pieces.get(chosenTileKey);
        chosenTile.changePosTo(hollowKey);
        hollow.changePosTo(chosenTileKey);

        pieces.set(hollowKey, chosenTile);
        pieces.set(chosenTileKey, hollow);

        hollowKey = chosenTileKey;

        hollow.drawAtCurrentPos();
        chosenTile.drawAtCurrentPos();
    }

    for(let i = 0; i < 100; i++) {
        switchTiles(chooseRandomElement(availableToSwitch()));
    }

    function mouseClickSwitch(e) {
        const chosenTileKey = detectTile(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);

        if(availableToSwitch().includes(chosenTileKey)) {
            switchTiles(chosenTileKey);
        }
    }

    canvas.addEventListener("click", mouseClickSwitch);

    refreshBtn.addEventListener("click", () => {
        canvas.removeEventListener("click", mouseClickSwitch);
        loadImage();
    });
}
