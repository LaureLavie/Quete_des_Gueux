import { showMap } from './map.js';

window.showMap = showMap;

export class MazeGenerator {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.maze = [];
    this.treasurePos = null;
    this.waypoints = [];
    this.optimalPath = [];
    this.exitPos = null;
    this.init();
  }

  init() {
    this.maze = Array(this.height)
      .fill()
      .map(
        () =>
          Array(this.width)
            .fill()
            .map(() => ({ type: "wall", visited: false }))
      );
  }

  generate() {
    const stack = [];
    const startX = 1;
    const startY = 1;

    this.maze[startY][startX] = { type: "path", visited: true };
    stack.push([startX, startY]);

    while (stack.length > 0) {
      const [x, y] = stack[stack.length - 1];
      const neighbors = this.getUnvisitedNeighbors(x, y);

      if (neighbors.length > 0) {
        const [nx, ny] =
          neighbors[Math.floor(Math.random() * neighbors.length)];
        const wallX = x + (nx - x) / 2;
        const wallY = y + (ny - y) / 2;

        this.maze[ny][nx] = { type: "path", visited: true };
        this.maze[wallY][wallX] = { type: "path", visited: true };
        stack.push([nx, ny]);
      } else {
        stack.pop();
      }
    }

    this.addSpecialElements();
    this.calculateOptimalPath();
  }

  getUnvisitedNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      [0, -2],
      [2, 0],
      [0, 2],
      [-2, 0],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        nx > 0 &&
        nx < this.width - 1 &&
        ny > 0 &&
        ny < this.height - 1 &&
        !this.maze[ny][nx].visited
      ) {
        neighbors.push([nx, ny]);
      }
    }
    return neighbors;
  }

  addSpecialElements() {
    const pathCells = [];

    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.maze[y][x].type === "path") {
          pathCells.push([x, y]);
        }
      }
    }

    if (pathCells.length < 5) return;

    const start = [1, 1];
    let treasurePos = null;
    let maxDist = 0;
    
    for (const cell of pathCells) {
      const dist = Math.abs(cell[0] - start[0]) + Math.abs(cell[1] - start[1]);
      if (dist > maxDist) {
        maxDist = dist;
        treasurePos = cell;
      }
    }

    this.treasurePos = treasurePos;
    this.maze[treasurePos[1]][treasurePos[0]].type = "treasure-hidden";

    const exitCandidates = [];
    for (let y = Math.max(1, this.height - 6); y < this.height - 1; y++) {
      for (let x = Math.max(1, this.width - 6); x < this.width - 1; x++) {
        if (this.maze[y][x].type === "path") {
          exitCandidates.push([x, y]);
        }
      }
    }
    
    if (exitCandidates.length > 0) {
      let bestExit = exitCandidates[0];
      let minDistToCorner =
        this.width - 1 - bestExit[0] + (this.height - 1 - bestExit[1]);

      for (const candidate of exitCandidates) {
        const distToCorner =
          this.width - 1 - candidate[0] + (this.height - 1 - candidate[1]);
        if (distToCorner < minDistToCorner) {
          minDistToCorner = distToCorner;
          bestExit = candidate;
        }
      }

      this.exitPos = bestExit;
      this.maze[bestExit[1]][bestExit[0]].type = "exit";
    }

    this.maze[1][1].type = "start";
  }

  calculateOptimalPath() {
    const solver = new AStar(this.maze);
    const start = [1, 1];
    const treasure = this.treasurePos;

    const pathToTreasure = solver.findPath(start, treasure);
    const pathToExit = solver.findPath(treasure, this.exitPos);

    if (pathToTreasure && pathToExit) {
      const fullPath = pathToTreasure.concat(pathToExit.slice(1));
      this.optimalPath = fullPath;
      this.placeGoodwaypoints(fullPath);
      this.placeBadwaypoints(fullPath);
    }
  }

  placeGoodwaypoints(fullPath) {
    const pathLength = fullPath.length;
    const waypointPositions = [];

    for (let i = 1; i <= 3; i++) {
      const index = Math.floor((pathLength * i) / 4);
      if (index < pathLength && index > 0) {
        waypointPositions.push(index);
      }
    }

    for (let i = 0; i < waypointPositions.length; i++) {
      const index = waypointPositions[i];
      const [x, y] = fullPath[index];

      if (this.maze[y][x].type === "path") {
        this.maze[y][x].type = "waypoint";

        let hint = this.getGoodDirectionHint();

        this.waypoints.push({
          pos: [x, y],
          hint: hint,
          used: false,
          isGood: true,
        });
      }
    }
  }

  placeBadwaypoints(fullPath) {
    const pathCells = [];
    for (let y = 1; y < this.height - 1; y++) {
      for (let x = 1; x < this.width - 1; x++) {
        if (this.maze[y][x].type === "path") {
          const isOnOptimalPath = fullPath.some(
            (pos) => pos[0] === x && pos[1] === y
          );
          if (!isOnOptimalPath) {
            pathCells.push([x, y]);
          }
        }
      }
    }

    for (let i = 0; i < 2 && pathCells.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * pathCells.length);
      const [x, y] = pathCells[randomIndex];
      pathCells.splice(randomIndex, 1);

      this.maze[y][x].type = "waypoint";

      let badHint = this.getBadDirectionHint();

      this.waypoints.push({
        pos: [x, y],
        hint: badHint,
        used: false,
        isGood: false,
      });
    }
  }

  getGoodDirectionHint() {
    const goodHints = [
      "Morbleu ! Même un bourrin irait par là, continue !",
      "Par ma barbe crasseuse ! Ton instinct de bouseux ne ment pas !",
      "Le trésor roupille pas loin, marche donc, maraudeur !",
      "Ma foi ! T'es sur le bon fumier, vas-y avant qu'ça refroidisse !",
      "Ventrebleu ! Mes orteils moisis tressaillent, le trésor n'est plus loin !"
    ];
    return goodHints[Math.floor(Math.random() * goodHints.length)];
  }

  getBadDirectionHint() {
    const badHints = [
      "Brillant. Tu t'engouffres dans un cul-de-sac avec toute la grâce d'une chèvre ivre.",
      "Ce chemin ? Oui, parfait… si tu voulais mourir idiot et oublié.",
      "Ah, l'art de se tromper avec assurance. Magnifique démonstration.",
      "Par là ? Certainement, si tu rêves de contempler des murs.",
      "Ce passage ne mène nulle part. Comme tes ambitions."
    ];
    return badHints[Math.floor(Math.random() * badHints.length)];
  }

  getMaze() {
    return this.maze;
  }
}

// Classe A* pour le pathfinding
export class AStar {
  constructor(maze) {
    this.maze = maze;
    this.width = maze[0].length;
    this.height = maze.length;
  }

  heuristic(a, b) {
    return Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
  }

  getNeighbors(x, y) {
    const neighbors = [];
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];

    for (const [dx, dy] of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        nx >= 0 &&
        nx < this.width &&
        ny >= 0 &&
        ny < this.height
      ) {
        const cellType = this.maze[ny][nx].type;
        if (
          cellType === "path" ||
          cellType === "start" ||
          cellType === "treasure-hidden" ||
          cellType === "waypoint" ||
          cellType === "exit"
        ) {
          neighbors.push([nx, ny]);
        }
      }
    }
    return neighbors;
  }

  findPath(start, goal) {
    const openSet = [start];
    const cameFrom = new Map();
    const gScore = new Map();
    const fScore = new Map();
    const key = (pos) => `${pos[0]},${pos[1]}`;

    gScore.set(key(start), 0);
    fScore.set(key(start), this.heuristic(start, goal));

    while (openSet.length > 0) {
      let current = openSet[0];
      let currentIndex = 0;

      for (let i = 1; i < openSet.length; i++) {
        if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
          current = openSet[i];
          currentIndex = i;
        }
      }

      if (current[0] === goal[0] && current[1] === goal[1]) {
        const path = [];
        let temp = current;

        while (temp) {
          path.unshift(temp);
          temp = cameFrom.get(key(temp));
        }

        return path;
      }

      openSet.splice(currentIndex, 1);
      const neighbors = this.getNeighbors(current[0], current[1]);

      for (const neighbor of neighbors) {
        const tentativeGScore = gScore.get(key(current)) + 1;

        if (
          !gScore.has(key(neighbor)) ||
          tentativeGScore < gScore.get(key(neighbor))
        ) {
          cameFrom.set(key(neighbor), current);
          gScore.set(key(neighbor), tentativeGScore);
          fScore.set(
            key(neighbor),
            tentativeGScore + this.heuristic(neighbor, goal)
          );

          if (
            !openSet.some(
              (pos) => pos[0] === neighbor[0] && pos[1] === neighbor[1]
            )
          ) {
            openSet.push(neighbor);
          }
        }
      }
    }

    return null;
  }
}

// Classe de gestion du jeu
export class MazeGame {
  constructor() {
    this.maze = null;
    this.generator = null;
    this.playerPos = [1, 1];
    this.steps = 0;
    this.waypointsCrossed = 0;
    this.hasTreasure = false;
    this.gameWon = false;
    this.visitedCells = new Set();
  }

  generateMaze() {
    const width = parseInt(document.getElementById("width").value);
    const height = parseInt(document.getElementById("height").value);

    const actualWidth = width % 2 === 0 ? width + 1 : width;
    const actualHeight = height % 2 === 0 ? height + 1 : height;

    this.generator = new MazeGenerator(actualWidth, actualHeight);
    this.generator.generate();
    this.maze = this.generator.getMaze();

    this.resetGame();
    this.renderMaze();
    this.updateStats();
  }

  updateStats() {
    const posEl = document.getElementById("position");
    if (posEl)
      posEl.textContent = `(${this.playerPos[0]}, ${this.playerPos[1]})`;
    const stepsEl = document.getElementById("steps");
    if (stepsEl) stepsEl.textContent = this.steps;
    const waypointsEl = document.getElementById("waypoints");
    if (waypointsEl) waypointsEl.textContent = this.waypointsCrossed;
    document.getElementById("treasure-status").textContent = this.hasTreasure
      ? "Récupéré, par ma foi !"
      : "Butin toujours planqué";
    document.getElementById("status").textContent = this.gameWon
      ? "Mission accomplie !"
      : "En galère";
  }

  renderMaze() {
    const mazeDiv = document.getElementById("maze");
    mazeDiv.innerHTML = "";
    mazeDiv.style.gridTemplateColumns = `repeat(${this.maze[0].length}, 25px)`;

    for (let y = 0; y < this.maze.length; y++) {
      for (let x = 0; x < this.maze[0].length; x++) {
        const cell = document.createElement("div");
        cell.className = `cell ${this.maze[y][x].type}`;
        cell.dataset.x = x;
        cell.dataset.y = y;

        if (this.maze[y][x].type === "start") {
          cell.textContent = "🏰";
        } else if (this.maze[y][x].type === "exit") {
          cell.textContent = "🚪";
        } else if (this.maze[y][x].type === "treasure-found") {
          cell.textContent = "💰";
        }

        if (x === this.playerPos[0] && y === this.playerPos[1]) {
          cell.classList.add("player");
          cell.textContent = "👑";
        }

        if (this.visitedCells.has(`${x},${y}`)) {
          cell.classList.add("visited");
        }

        cell.addEventListener("click", () => this.movePlayer(x, y));
        mazeDiv.appendChild(cell);
      }
    }
  }

  movePlayer(targetX, targetY) {
    const dx = Math.abs(targetX - this.playerPos[0]);
    const dy = Math.abs(targetY - this.playerPos[1]);

    if ((dx === 1 && dy === 0) || (dx === 0 && dy === 1)) {
      this.attemptMove(targetX, targetY);
    }
  }

  attemptMove(x, y) {
    const cellType = this.maze[y][x].type;

    if (cellType === "wall") {
      return;
    }

    this.playerPos = [x, y];
    this.steps++;
    this.visitedCells.add(`${x},${y}`);

    if (cellType === "waypoint") {
      const waypoint = this.generator.waypoints.find(
        (b) => b.pos[0] === x && b.pos[1] === y && !b.used
      );

      if (waypoint) {
        waypoint.used = true;
        this.waypointsCrossed++;
        this.showMessage(waypoint.hint);
      }
    }

    if (cellType === "treasure-hidden" && !this.hasTreasure) {
      this.showTreasureFound(x, y);
      return;
    }

    if (cellType === "exit" && this.hasTreasure) {
      this.gameWon = true;
      this.showExitMessage();
      return;
    }

    this.renderMaze();
    this.updateStats();
  }

  showTreasureFound(x, y) {
    this.maze[y][x].type = "treasure-found";
    this.renderMaze();

    if (
      confirm("💰 Par tous les Saints ! Le trésor ! Cliquez pour l'empocher, maroufle !")
    ) {
      this.hasTreasure = true;
      this.showMessage(
        "✅ Trésor empoché ! File vers la sortie avant qu'on te pende ! 🚪"
      );
      this.updateStats();
    }
  }

  showExitMessage() {
    this.showMessage(
      "🎉 Morbleu ! Vous avez échappé à ce labyrinthe ! Mission accomplie, maraud !"
    );
    setTimeout(() => {
      this.showGameOver();
    }, 1500);
  }

  showMessage(message) {
    const existingMsg = document.getElementById("temp-message");
    if (existingMsg) {
      existingMsg.remove();
    }

    const msgDiv = document.createElement("div");
    msgDiv.id = "temp-message";
    msgDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #3e2723, #654321, #8b4513);
      color: #d2b48c;
      padding: 15px 30px;
      border-radius: 15px;
      font-weight: bold;
      font-family: 'Cinzel', serif;
      z-index: 1000;
      box-shadow: 0 8px 25px rgba(0,0,0,0.7);
      border: 2px solid #8b4513;
      max-width: 80%;
      text-align: center;
      font-size: 1.2rem;
    `;
    msgDiv.textContent = message;
    document.body.appendChild(msgDiv);

    setTimeout(() => {
      if (msgDiv) msgDiv.remove();
    }, 4000);
  }

  handleKeyPress(event) {
    if (this.gameWon) return;

    let newX = this.playerPos[0];
    let newY = this.playerPos[1];

    switch (event.key) {
      case "ArrowUp":
        newY--;
        break;
      case "ArrowDown":
        newY++;
        break;
      case "ArrowLeft":
        newX--;
        break;
      case "ArrowRight":
        newX++;
        break;
      default:
        return;
    }

    event.preventDefault();

    if (
      newX >= 0 &&
      newX < this.maze[0].length &&
      newY >= 0 &&
      newY < this.maze.length
    ) {
      this.attemptMove(newX, newY);
    }
  }

  showOptimalPath() {
    if (!this.generator || !this.generator.optimalPath) return;

    const pathCells = document.querySelectorAll(".optimal-path");
    pathCells.forEach((cell) => cell.classList.remove("optimal-path"));

    this.generator.optimalPath.forEach((pos) => {
      const cell = document.querySelector(
        `[data-x="${pos[0]}"][data-y="${pos[1]}"]`
      );
      if (cell) {
        cell.style.background = "rgba(255, 105, 180, 0.6)";
      }
    });
  }

  resetGame() {
    this.playerPos = [1, 1];
    this.steps = 0;
    this.waypointsCrossed = 0;
    this.hasTreasure = false;
    this.gameWon = false;
    this.visitedCells.clear();

    const pathCells = document.querySelectorAll(".cell");
    pathCells.forEach((cell) => {
      cell.style.background = "";
      cell.classList.remove("optimal-path");
    });
  }

  showGameOver() {
    document.getElementById("final-steps").textContent = this.steps;
    const finalWaypoints = document.getElementById("final-waypoints");
    if (finalWaypoints) finalWaypoints.textContent = this.waypointsCrossed;
    document.getElementById("gameOver").style.display = "block";
  }

  closeGameOver() {
    document.getElementById("gameOver").style.display = "none";
  }
}

// Instance globale du jeu
const game = new MazeGame();

// Fonctions globales
export function generateMaze() {
  game.generateMaze();
}

export function showOptimalPath() {
  game.showOptimalPath();
}

export function resetGame() {
  game.resetGame();
  game.renderMaze();
  game.updateStats();
}

export function closeGameOver() {
  game.closeGameOver();
}

// Événements
document.addEventListener("keydown", (e) => game.handleKeyPress(e));

window.generateMaze = generateMaze;
window.showOptimalPath = showOptimalPath;
window.resetGame = resetGame;
window.closeGameOver = closeGameOver;

// Initialisation
document.addEventListener("DOMContentLoaded", function() {
  // Le jeu commence par l'écran d'introduction
});