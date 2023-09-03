const jsConfetti = new JSConfetti();
const refreshBtn = document.getElementById("refresh");
const validateBtn = document.getElementById("validate");
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
ctx.fillStyle = "black";

let image = new Image();
const new_width = Math.min(400, screen.width-20);

const cols = 3;
const rows = 5;

let tile_w;
let tile_h;
let img_w;
let img_h;

function loadImage() {
    fetch("https://nekos.best/api/v2/waifu").then(res => res.json()).then(res => {
        image.src = res['results'][0]['url'];
    }).catch(e => console.log(e));
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

    isAtRightPlace() {
        return this.i == this.init_i && this.j == this.init_j;
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

    static getTileByCoords(x, y) {
        const i = Math.ceil(x/tile_w)-1;
        const j = Math.ceil(y/tile_h)-1;
        return String([
            j == rows ? j-1 : j,
            i == cols ? i-1 : i
        ]);
    }
}

class Tiles {
    constructor() {
        this.tiles = new Map();
        this.hollow = null;
        this.hollowKey = null;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const key = String([i,j]);
                const newTile = new Tile(i, j);
                this.tiles.set(key, newTile);
                newTile.drawAtCurrentPos();
            }
        }

        this.hollowKey = String([rows-1, cols-1]);
        this.hollow = this.tiles.get(this.hollowKey);
        this.hollow.is_hollow = true;
        this.hollow.drawAtCurrentPos();
    }

    isSolved() {
        let res = true;
        
        for(const tile of this.tiles.values()) {
            res = res && tile.isAtRightPlace();
        }

        return res;
    }

    availableToSwitch() {
        const res = [];
        const toCheck = [[1, 0], [-1, 0], [0, 1], [0, -1]];

        toCheck.forEach(fieldMod => {
            const other_i = this.hollow.i + fieldMod[0];
            const other_j = this.hollow.j + fieldMod[1];

            if(other_i > -1 && other_j > -1 && other_i < rows && other_j < cols)
            res.push(String([other_i, other_j]));
        });

        return res;
    }

    switchWithHollow(chosenTileKey) {
        const chosenTile = this.tiles.get(chosenTileKey);
        chosenTile.changePosTo(this.hollowKey);
        this.hollow.changePosTo(chosenTileKey);

        this.tiles.set(this.hollowKey, chosenTile);
        this.tiles.set(chosenTileKey, this.hollow);

        this.hollowKey = chosenTileKey;

        this.hollow.drawAtCurrentPos();
        chosenTile.drawAtCurrentPos();
    }

    randomize() {
        for(let i = 0; i < 100; i++) {
            this.switchWithHollow(chooseRandomElement(this.availableToSwitch()));
        }
    }
}

image.onload = () => {
    validateBtn.style.display = "block";
    const ratio = image.height/image.width;
    const new_height = new_width*ratio
    ctx.canvas.width = new_width;
    ctx.canvas.height = new_height;

    tile_w = new_width/cols;
    tile_h = new_height/rows;
    img_w = image.width/cols;
    img_h = image.height/rows;

    ctx.fillRect(0, 0, new_width, new_height);

    const tiles = new Tiles();

    tiles.randomize();

    function mouseClickSwitch(e) {
        const chosenTileKey = Tile.getTileByCoords(e.clientX - canvas.offsetLeft, e.clientY - canvas.offsetTop);

        if(tiles.availableToSwitch().includes(chosenTileKey)) {
            tiles.switchWithHollow(chosenTileKey);
        }
    }

    function launchConfettiOnSolve() {
        if(tiles.isSolved()) {
            jsConfetti.addConfetti();

            canvas.removeEventListener("click", mouseClickSwitch);

            validateBtn.style.display = "none";

            ctx.drawImage(image, 0, 0, image.width, image.height, 0, 0, new_width, new_height);
        }
    }

    canvas.addEventListener("click", mouseClickSwitch);
    validateBtn.addEventListener("click", launchConfettiOnSolve);

    refreshBtn.addEventListener("click", () => {
        validateBtn.removeEventListener("click", launchConfettiOnSolve);
        canvas.removeEventListener("click", mouseClickSwitch);
        loadImage();
    });
};