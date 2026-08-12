// ===== CAR DATA & PERSISTENCE =====
const CARS = [
    { id: "classic", name: "Blaze", nameKey: "car_classic_name", price: 0, speedBonus: 0, model: "cars/car1.glb", modelScale: 1.5, modelRotY: -Math.PI / 2, bodyColor: "#4CAF50", cabinColor: "#388E3C", desc: "A true street legend", descKey: "car_classic_desc" },
    { id: "crimson", name: "Bolt", nameKey: "car_crimson_name", price: 150, speedBonus: 0, model: "cars/car2.glb", modelScale: 1.5, modelRotY: -Math.PI / 2, bodyColor: "#e74c3c", cabinColor: "#c0392b", desc: "Quick as lightning", descKey: "car_crimson_desc" },
    { id: "ocean", name: "Razor", nameKey: "car_ocean_name", price: 750, speedBonus: 0, model: "cars/car3.glb", modelScale: 1.5, modelRotY: -Math.PI / 2, bodyColor: "#3498db", cabinColor: "#2980b9", desc: "Cuts through the wind", descKey: "car_ocean_desc" },
    { id: "sunset", name: "Phoenix", nameKey: "car_sunset_name", price: 1500, speedBonus: 0, model: "cars/car4.glb", modelScale: 1.5, modelRotY: -Math.PI / 2, bodyColor: "#f39c12", cabinColor: "#e67e22", desc: "Rise with fury", descKey: "car_sunset_desc" },
];

// localStorage helpers
function loadTotalCoins() {
    return parseInt(localStorage.getItem("driftBossCoins") || "0", 10);
}

function saveTotalCoins(val) {
    localStorage.setItem("driftBossCoins", val.toString());
}

function loadHighScore() {
    return parseInt(localStorage.getItem("driftBossHighScore") || "0", 10);
}

function saveHighScore(val) {
    localStorage.setItem("driftBossHighScore", val.toString());
}

function loadUnlockedCars() {
    try {
        const data = JSON.parse(localStorage.getItem("driftBossUnlocked") || '["classic"]');
        return Array.isArray(data) ? data : ["classic"];
    } catch {
        return ["classic"];
    }
}

function saveUnlockedCars(arr) {
    localStorage.setItem("driftBossUnlocked", JSON.stringify(arr));
}

function loadSelectedCar() {
    return localStorage.getItem("driftBossSelectedCar") || "classic";
}

function saveSelectedCar(id) {
    localStorage.setItem("driftBossSelectedCar", id);
}

function isCarUnlocked(id) {
    return loadUnlockedCars().includes(id);
}

function unlockCar(id) {
    const unlocked = loadUnlockedCars();
    if (!unlocked.includes(id)) {
        unlocked.push(id);
        saveUnlockedCars(unlocked);
    }
}

function getSelectedCarConfig() {
    const id = loadSelectedCar();
    return CARS.find(c => c.id === id) || CARS[0];
}
