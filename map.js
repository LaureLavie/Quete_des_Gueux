import { generateMaze } from "./script.js";

const royaume = {
  features: [
    { name: "Kaamelott", hexes: ["q10_r10"], coords: [200, 200] },
    { name: "castle of the villain", hexes: ["q12_r21"], coords: [400, 450] },
    { name: "Lost", hexes: ["q15_r14"], coords: [500, 300] },
    { name: "Bourgade des Gueux", hexes: ["q14_r18"], coords: [450, 380] },
    { name: "Stonehedge", hexes: ["q13_r12"], coords: [420, 280] },
    { name: "Taverne", hexes: ["q10_r15"], coords: [320, 350] },
    { name: "Merlin'Dolmen", hexes: ["q15_r9"], coords: [520, 220] },
    { name: "Land of the Broutche", hexes: ["q11_r16"], coords: [350, 360] },
  ],
};

let selectedWaypoints = [];
let visitedWaypoints = 0;
let waypointMarkers = [];

const goodHints = [
  "Le tavernier, la chope levée, t'assure : « Oui, vaillant gueux ! »",
  "Un berger, la laine au vent, hoche la tête : « Oui, brave maraud. »",
  "Par la barbe du roi soyeuse et poussiéreuse, c'est oui !",
  "Morbleu ! Même un bourrin irait par là, continue !",
  "Le trésor roupille pas loin, marche donc, maraudeur !",
];

const badHints = [
  "C'est l'entrée de la Taverne ici, Poivrot, pas l'entrée de Maze'Lott !",
  "Une vieille, le regard perçant, te souffle : « Non pas ici, noble maraudeur. »",
  "Le forgeron, marteau en main, gronde : « Non, va donc ferrer tes bottes ailleurs ! »",
  "Ce chemin ? Oui, parfait… si tu voulais mourir idiot et oublié.",
  "Brillant. Tu t'engouffres dans un cul-de-sac avec toute la grâce d'une chèvre ivre.",
];

// Fonction pour afficher la carte
export function showMap() {
  document.getElementById("intro-screen").style.display = "none";
  document.getElementById("map-screen").style.display = "flex";
  initializeMap();
}

// Fonction pour initialiser la carte avec les waypoints
export function initializeMap() {
  const mapDiv = document.getElementById("mapDiv");

  // Nettoyer les anciens marqueurs
  const oldMarkers = mapDiv.querySelectorAll(
    ".waypoint-marker, .entrance-marker"
  );
  oldMarkers.forEach((marker) => marker.remove());

  visitedWaypoints = 0;
  document.getElementById("waypoints-found").textContent = visitedWaypoints;

  // Sélectionner 3 lieux aléatoires (exclus Kaamelott)
  const availableFeatures = royaume.features.filter(
    (f) => f.name !== "Kaamelott"
  );
  selectedWaypoints = [];

  const shuffled = [...availableFeatures].sort(() => 0.5 - Math.random());
  selectedWaypoints = shuffled.slice(0, 3);

  // Créer les marqueurs pour chaque waypoint
  selectedWaypoints.forEach((feature, index) => {
    const marker = document.createElement("div");
    marker.className = "waypoint-marker";
    marker.style.left = feature.coords[0] + "px";
    marker.style.top = feature.coords[1] + "px";
    marker.textContent = "🛡️";
    marker.title = feature.name;
    marker.dataset.index = index;
    marker.dataset.visited = "false";

    // 50% de chance d'avoir un bon indice
    const isGoodHint = Math.random() < 0.5;
    marker.dataset.isGood = isGoodHint;

    marker.addEventListener("click", () =>
      handleWaypointClick(marker, feature, isGoodHint)
    );
    mapDiv.appendChild(marker);
    waypointMarkers.push(marker);
  });

  // Ajouter le marqueur d'entrée du labyrinthe (caché au début)
  const entranceMarker = document.createElement("div");
  entranceMarker.id = "maze-entrance";
  entranceMarker.className = "entrance-marker";
  entranceMarker.style.left = "500px";
  entranceMarker.style.top = "200px";
  entranceMarker.textContent = "🏰";
  entranceMarker.title = "Entrée du Maze'Lott";
  entranceMarker.style.display = "none";
  entranceMarker.addEventListener("click", startMazeGame);
  mapDiv.appendChild(entranceMarker);
}

export function handleWaypointClick(marker, feature, isGoodHint) {
  if (marker.dataset.visited === "true") return;

  marker.dataset.visited = "true";
  marker.classList.add("visited");
  visitedWaypoints++;

  const message = isGoodHint
    ? goodHints[Math.floor(Math.random() * goodHints.length)]
    : badHints[Math.floor(Math.random() * badHints.length)];

  showMessage(`${feature.name}: ${message}`);
  document.getElementById("waypoints-found").textContent = visitedWaypoints;

  if (visitedWaypoints >= 3) {
    // On affiche d'abord le message, puis l'entrée après le délai du message
    showMessage(
      "🎉 L'entrée du légendaire Maze'Lott est maintenant accessible ! Cliquez dessus pour entrer !"
    );
    setTimeout(() => {
      document.getElementById("maze-entrance").style.display = "flex";
    }, 1500); // 1500ms = durée d'affichage du message
  }
}

export function showMessage(message) {
  const popup = document.getElementById("messagePopup");
  popup.textContent = message;
  popup.style.display = "block";
  setTimeout(() => {
    popup.style.display = "none";
  }, 4000);
}

export function startMazeGame() {
  document.getElementById("map-screen").style.display = "none";
  document.body.classList.add("game-active");
  generateMaze();
}
