const CONFIG = {
  MOVE_DELAY_NORMAL: 500,
  MOVE_DELAY_FAST: 60
}

class Pieces {
  static SQUARE = {
    Shape: [[1,1],[1,1]],  // Square,
    Color: '#F0E68C'
  }
  static LINE = {
    Shape: [[1,1,1,1]],    // Line,
    Color: '#87CEEB'
  }
  static T = {
    Shape: [[1,1,1],[0,1,0]],  // T,
    Color: '#BA55D3'
  }
  static L = {
    Shape: [[1,1,1],[1,0,0]],  // L,
    Color: '#FFA07A'
  }
  static J = {
    Shape: [[1,1,1],[0,0,1]],  // J,
    Color: '#ADD8E6'
  }
  static S = {
    Shape: [[1,1,0],[0,1,1]],  // S,
    Color: '#90EE90'
  }
  static Z = {
    Shape: [[0,1,1],[1,1,0]],   // Z,
    Color: '#FFB6C1'
  }

  static Random() {
    const pool = [
      Pieces.SQUARE,  // Square
      Pieces.LINE,    // Line
      Pieces.T,  // T
      Pieces.L,  // L
      Pieces.J,  // J
      Pieces.S,  // S
      Pieces.Z   // Z
    ]
    return pool[Math.floor(Math.random() * pool.length)]
  }
}

class Tetris {
  constructor(canvas, previewCanvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.previewCanvas = previewCanvas;
    this.previewCtx = previewCanvas.getContext('2d');
    this.width = 10;
    this.height = 20;
    this.blockSize = 28;
    this.blockSizePreview = 8;
    this.grid = Array(this.height).fill().map(() => Array(this.width).fill(0));
    this.gridColors = Array(this.height).fill().map(() => Array(this.width).fill('blue'));
    this.currentPiece = null;
    this.nextPieces = [];
    this.gameOver = false;
    this.lastMoveTime = 0;
    this.score = 0
    this.moveDelay = CONFIG.MOVE_DELAY_NORMAL;

    this.blockSize = 28;
    this.ghostBlockSize = 28;  // 新增：预测方块的大小
    this.initializeGame();
    this.bindControls();
    this.gameLoop();
  }

  initializeGame() {
    for (let i = 0; i < 5; i++) {
      this.nextPieces.push(this.randomPiece());
    }
    this.spawnPiece();
  }

  recalculateBlockSize() {
    
  }

  randomPiece() {
    return Pieces.Random()
  }

  spawnPiece() {
    const curr = this.nextPieces.shift()
    this.currentPiece = {
      shape: curr.Shape,
      color: curr.Color,
      x: Math.floor(this.width / 2) - 1,
      y: 0
    };
    this.nextPieces.push(this.randomPiece());
    if (this.checkCollision()) {
      this.gameOver = true;
    }
  }

  bindControls() {
    document.addEventListener('keydown', (e) => {
      if (this.gameOver) return;
      switch(e.key) {
        case 'ArrowLeft':
          this.movePiece(-1, 0);
          break;
        case 'ArrowRight':
          this.movePiece(1, 0);
          break;
        case 'ArrowUp':
          this.rotatePiece();
          break;
        case 'ArrowDown':
          this.placePiece();
          break;
        case 'Control':
          this.accelerate(true);
        default: console.log("key", e.key);
      }
    });
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Control') {
        this.accelerate(false)
      }
    })
  }

  movePiece(dx, dy) {
    this.currentPiece.x += dx;
    this.currentPiece.y += dy;
    if (this.checkCollision()) {
      this.currentPiece.x -= dx;
      this.currentPiece.y -= dy;
      return false;
    }
    return true;
  }

  rotatePiece() {
    const originalShape = this.currentPiece.shape;
    this.currentPiece.shape = this.currentPiece.shape[0].map((_, i) => 
      this.currentPiece.shape.map(row => row[i]).reverse()
    );
    if (this.checkCollision()) {
      this.currentPiece.shape = originalShape;
    }
  }

  accelerate(bool) {
    this.moveDelay = bool ? 
      CONFIG.MOVE_DELAY_FAST : CONFIG.MOVE_DELAY_NORMAL
  }

  checkCollision() {
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          const newX = this.currentPiece.x + x;
          const newY = this.currentPiece.y + y;
          if (newX < 0 || newX >= this.width || newY >= this.height ||
              (newY >= 0 && this.grid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  placePiece() {
      while (!this.checkCollision()) {
        this.currentPiece.y++;
      }
      this.currentPiece.y--;  // 回退一步,因为最后一次移动导致了碰撞
  
      for (let y = 0; y < this.currentPiece.shape.length; y++) {
        for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
          if (this.currentPiece.shape[y][x]) {
            const newY = this.currentPiece.y + y;
            if (newY < 0) {
              this.gameOver = true;
              return;
            }
            const newX = this.currentPiece.x + x
            this.gridColors[newY][newX] = this.currentPiece.color
            this.grid[newY][newX] = 1;
          }
        }
      }

      this.score += 10;
      this.clearLines();
      this.spawnPiece();
    }

  clearLines() {
    let linesCleared = 0;
    for (let y = this.height - 1; y >= 0; y--) {
      if (this.grid[y].every(cell => cell)) {
        this.grid.splice(y, 1);
        this.grid.unshift(Array(this.width).fill(0));
        linesCleared++;
      }
    }
    const scoreLadder = [0, 100, 300, 500, 800]
    this.score += scoreLadder[linesCleared]
  }

  getGhostPiecePosition() {
    let ghostY = this.currentPiece.y;
    while (!this.checkCollision(this.currentPiece.x, ghostY + 1, this.currentPiece.shape)) {
      ghostY++;
    }
    return { x: this.currentPiece.x, y: ghostY, color: this.currentPiece.color };
  }

  checkCollision(x = this.currentPiece.x, y = this.currentPiece.y, shape = this.currentPiece.shape) {
    for (let row = 0; row < shape.length; row++) {
      for (let col = 0; col < shape[row].length; col++) {
        if (shape[row][col]) {
          const newX = x + col;
          const newY = y + row;
          if (newX < 0 || newX >= this.width || newY >= this.height ||
              (newY >= 0 && this.grid[newY][newX])) {
            return true;
          }
        }
      }
    }
    return false;
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw grid
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x]) {
          this.drawBlock(x, y, this.gridColors[y][x]);
        }
      }
    }
    
    // Draw current piece
    for (let y = 0; y < this.currentPiece.shape.length; y++) {
      for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
        if (this.currentPiece.shape[y][x]) {
          this.drawBlock(this.currentPiece.x + x, this.currentPiece.y + y, this.currentPiece.color);
        }
      }
    }

    // 绘制落点预测
    this.drawGhostPiece();

    this.updateStatusPanel()
  }

  drawBlock(x, y, color = 'blue') {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
    this.ctx.strokeStyle = 'white';
    this.ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
  }

  updateStatusPanel() {
    this.previewCtx.clearRect(0, 0, this.previewCanvas.width, this.previewCanvas.height);
    this.drawScore()
    this.drawNextPieces()
  }

  drawScore() {
    this.ctx.font = "26px Microsoft-Yahei"
    this.ctx.fillStyle = '#66ccff'
    this.ctx.fillText(
      `${this.score}`.padStart('8', '0'),
      160,
      30,
      100
    )
    this.ctx.fillStyle = 'blue'
  }

  drawNextPieces() {
    
    let yOffset = 10;
    for (let i = 0; i < this.nextPieces.length; i++) {
      const piece = this.nextPieces[i].Shape;
      const pieceColor = this.nextPieces[i].Color
      const pieceHeight = piece.length * this.blockSizePreview;
      const pieceWidth = piece[0].length * this.blockSizePreview;
      const xOffset = (this.previewCanvas.width - pieceWidth) / 2;
      
      for (let y = 0; y < piece.length; y++) {
        for (let x = 0; x < piece[y].length; x++) {
          if (piece[y][x]) {
            this.previewCtx.fillStyle = pieceColor;
            this.previewCtx.fillRect(
              xOffset + x * this.blockSizePreview, 
              yOffset + y * this.blockSizePreview, 
              this.blockSizePreview, 
              this.blockSizePreview
            );
            this.previewCtx.strokeStyle = 'white';
            this.previewCtx.strokeRect(
              xOffset + x * this.blockSizePreview, 
              yOffset + y * this.blockSizePreview, 
              this.blockSizePreview, 
              this.blockSizePreview
            );
          }
        }
      }
      
      yOffset += pieceHeight + this.blockSizePreview; // 在每个方块之间添加一个方块的间距
    }
  }

  drawGhostPiece() {
    const ghost = this.getGhostPiecePosition();
    const { color } = ghost
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1;

    for (let row = 0; row < this.currentPiece.shape.length; row++) {
      for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
        if (this.currentPiece.shape[row][col]) {
          const x = (ghost.x + col) * this.blockSize + (this.blockSize - this.ghostBlockSize) / 2;
          const y = (ghost.y + row) * this.blockSize + (this.blockSize - this.ghostBlockSize) / 2;
          this.ctx.strokeRect(x, y, this.ghostBlockSize, this.ghostBlockSize);
        }
      }
    }
  }



  gameLoop(timestamp) {
    if (this.gameOver) {
      alert('Game Over!');
      $('#controls').style.display = 'none'
      $('#startButton').style.display = 'block'
      return;
    }

    if (timestamp - this.lastMoveTime > this.moveDelay) {
      if (!this.movePiece(0, 1)) {
        setTimeout(() => {
          if (!this.movePiece(0, 1)) {
            this.placePiece();
          }
        }, this.moveDelay);
      }
      this.lastMoveTime = timestamp;
    }

    this.draw();
    requestAnimationFrame(this.gameLoop.bind(this));
  }
}

const $ = s => document.querySelector(s)

const previewCanvas = document.getElementById('nextPiecesCanvas');
previewCanvas.width = 40;  // equal with canvas
previewCanvas.height = 560; // one row
 

const canvas = document.getElementById('tetrisCanvas');
canvas.width = 280;  // 10 * 28
canvas.height = 560; // 20 * 28
var game
var accelerateFn
var reduceFn

$('#startButton').addEventListener('click', (e) => {
  e.target.style.display = 'none'
  $('#controls').style.display = 'block'
  game = null
  game = new Tetris(canvas, previewCanvas);

  $('#btnUp').onclick = () => {
    game.rotatePiece();
  }
  $('#btnDown').onclick = () => {
    game.placePiece();
  }
  $('#btnLeft').onclick = () => {
    game.movePiece(-1, 0);
  }
  $('#btnRight').onclick = () => {
    game.movePiece(1, 0);
  }

  if (accelerateFn) {
    document.removeEventListener('touchstart', accelerateFn)
  }
  if (reduceFn) {
    document.removeEventListener('touchend', reduceFn)
  }
  accelerateFn = () => game.accelerate(true)
  reduceFn = () => game.accelerate(false)
  $('#btnDrop').addEventListener('touchstart', accelerateFn)
  $('#btnDrop').addEventListener('touchend', reduceFn)
})