// ============ LEVELS.JS — Level System ============

// --- Seeded PRNG (mulberry32) ---
function seededRNG(seed) {
    return function() {
        seed |= 0; seed = seed + 0x6D2B79F5 | 0;
        var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

var levelRandom = null;

function gameRandom() {
    return levelRandom ? levelRandom() : Math.random();
}

// --- Worlds ---
var WORLDS = [
    { id: 0, name: "Level 1", icon: "city", colorFrom: "#2c3e50", colorTo: "#3498db", accentColor: "#3498db", unlockRequirement: 0 },
    { id: 1, name: "Level 2", icon: "city", colorFrom: "#2c3e50", colorTo: "#3498db", accentColor: "#3498db", unlockRequirement: 0 },
    { id: 2, name: "Level 3", icon: "city", colorFrom: "#2c3e50", colorTo: "#3498db", accentColor: "#3498db", unlockRequirement: 0 },
    { id: 3, name: "Level 4", icon: "city", colorFrom: "#2c3e50", colorTo: "#3498db", accentColor: "#3498db", unlockRequirement: 0 },
    { id: 4, name: "Level 5", icon: "city", colorFrom: "#1a3a2a", colorTo: "#27ae60", accentColor: "#27ae60", unlockRequirement: 0 },
    { id: 5, name: "Level 6", icon: "city", colorFrom: "#1a3a2a", colorTo: "#27ae60", accentColor: "#27ae60", unlockRequirement: 0 },
    { id: 6, name: "Level 7", icon: "city", colorFrom: "#1a3a2a", colorTo: "#27ae60", accentColor: "#27ae60", unlockRequirement: 0 },
    { id: 7, name: "Level 8", icon: "city", colorFrom: "#3a1a2a", colorTo: "#e74c3c", accentColor: "#e74c3c", unlockRequirement: 0 },
    { id: 8, name: "Level 9", icon: "city", colorFrom: "#3a1a2a", colorTo: "#e74c3c", accentColor: "#e74c3c", unlockRequirement: 0 },
    { id: 9, name: "Level 10", icon: "city", colorFrom: "#3a1a2a", colorTo: "#e74c3c", accentColor: "#e74c3c", unlockRequirement: 0 },
    { id: 10, name: "Level 11", icon: "city", colorFrom: "#2d1a4a", colorTo: "#8b5cf6", accentColor: "#8b5cf6", unlockRequirement: 0 },
    { id: 11, name: "Level 12", icon: "city", colorFrom: "#2d1a4a", colorTo: "#8b5cf6", accentColor: "#8b5cf6", unlockRequirement: 0 },
    { id: 12, name: "Level 13", icon: "city", colorFrom: "#2d1a4a", colorTo: "#8b5cf6", accentColor: "#8b5cf6", unlockRequirement: 0 },
    { id: 13, name: "Level 14", icon: "city", colorFrom: "#4a2a0a", colorTo: "#f59e0b", accentColor: "#f59e0b", unlockRequirement: 0 },
    { id: 14, name: "Level 15", icon: "city", colorFrom: "#4a2a0a", colorTo: "#f59e0b", accentColor: "#f59e0b", unlockRequirement: 0 },
    { id: 15, name: "Level 16", icon: "city", colorFrom: "#4a2a0a", colorTo: "#f59e0b", accentColor: "#f59e0b", unlockRequirement: 0 },
    { id: 16, name: "Level 17", icon: "city", colorFrom: "#0a3a3a", colorTo: "#06b6d4", accentColor: "#06b6d4", unlockRequirement: 0 },
    { id: 17, name: "Level 18", icon: "city", colorFrom: "#0a3a3a", colorTo: "#06b6d4", accentColor: "#06b6d4", unlockRequirement: 0 },
    { id: 18, name: "Level 19", icon: "city", colorFrom: "#0a3a3a", colorTo: "#06b6d4", accentColor: "#06b6d4", unlockRequirement: 0 },
    { id: 19, name: "Level 20", icon: "city", colorFrom: "#3a3a0a", colorTo: "#eab308", accentColor: "#eab308", unlockRequirement: 0 },
    { id: 20, name: "Level 21", icon: "city", colorFrom: "#3a0a0a", colorTo: "#dc2626", accentColor: "#dc2626", unlockRequirement: 0 },
    { id: 21, name: "Level 22", icon: "city", colorFrom: "#3a0a0a", colorTo: "#dc2626", accentColor: "#dc2626", unlockRequirement: 0 },
    { id: 22, name: "Level 23", icon: "city", colorFrom: "#3a0a0a", colorTo: "#dc2626", accentColor: "#dc2626", unlockRequirement: 0 },
    { id: 23, name: "Level 24", icon: "city", colorFrom: "#0a2a1a", colorTo: "#059669", accentColor: "#059669", unlockRequirement: 0 },
    { id: 24, name: "Level 25", icon: "city", colorFrom: "#0a2a1a", colorTo: "#059669", accentColor: "#059669", unlockRequirement: 0 },
    { id: 25, name: "Level 26", icon: "city", colorFrom: "#0a2a1a", colorTo: "#059669", accentColor: "#059669", unlockRequirement: 0 },
    { id: 26, name: "Level 27", icon: "city", colorFrom: "#1a1a3a", colorTo: "#4f46e5", accentColor: "#4f46e5", unlockRequirement: 0 },
    { id: 27, name: "Level 28", icon: "city", colorFrom: "#1a1a3a", colorTo: "#4f46e5", accentColor: "#4f46e5", unlockRequirement: 0 },
    { id: 28, name: "Level 29", icon: "city", colorFrom: "#1a1a3a", colorTo: "#4f46e5", accentColor: "#4f46e5", unlockRequirement: 0 },
    { id: 29, name: "Level 30", icon: "city", colorFrom: "#2a2a2a", colorTo: "#e2e8f0", accentColor: "#e2e8f0", unlockRequirement: 0 },
    { id: 30, name: "Level 31", icon: "city", colorFrom: "#3a1a3a", colorTo: "#d946ef", accentColor: "#d946ef", unlockRequirement: 0 },
    { id: 31, name: "Level 32", icon: "city", colorFrom: "#3a1a3a", colorTo: "#d946ef", accentColor: "#d946ef", unlockRequirement: 0 },
    { id: 32, name: "Level 33", icon: "city", colorFrom: "#3a1a3a", colorTo: "#d946ef", accentColor: "#d946ef", unlockRequirement: 0 },
    { id: 33, name: "Level 34", icon: "city", colorFrom: "#3a1a3a", colorTo: "#d946ef", accentColor: "#d946ef", unlockRequirement: 0 },
    { id: 34, name: "Level 35", icon: "city", colorFrom: "#3a1a3a", colorTo: "#d946ef", accentColor: "#d946ef", unlockRequirement: 0 },
    // Tier 6: Electric Blue (36-42)
    { id: 35, name: "Level 36", icon: "city", colorFrom: "#081535", colorTo: "#4a8af0", accentColor: "#4a8af0", unlockRequirement: 0 },
    { id: 36, name: "Level 37", icon: "city", colorFrom: "#081535", colorTo: "#4a8af0", accentColor: "#4a8af0", unlockRequirement: 0 },
    { id: 37, name: "Level 38", icon: "city", colorFrom: "#081535", colorTo: "#4a8af0", accentColor: "#4a8af0", unlockRequirement: 0 },
    { id: 38, name: "Level 39", icon: "city", colorFrom: "#081535", colorTo: "#4a8af0", accentColor: "#4a8af0", unlockRequirement: 0 },
    { id: 39, name: "Level 40", icon: "city", colorFrom: "#081535", colorTo: "#4a8af0", accentColor: "#4a8af0", unlockRequirement: 0 },
    { id: 40, name: "Level 41", icon: "city", colorFrom: "#081535", colorTo: "#4a8af0", accentColor: "#4a8af0", unlockRequirement: 0 },
    { id: 41, name: "Level 42", icon: "city", colorFrom: "#081535", colorTo: "#4a8af0", accentColor: "#4a8af0", unlockRequirement: 0 },
    // Tier 7: Volcanic (43-49)
    { id: 42, name: "Level 43", icon: "city", colorFrom: "#401205", colorTo: "#f06020", accentColor: "#f06020", unlockRequirement: 0 },
    { id: 43, name: "Level 44", icon: "city", colorFrom: "#401205", colorTo: "#f06020", accentColor: "#f06020", unlockRequirement: 0 },
    { id: 44, name: "Level 45", icon: "city", colorFrom: "#401205", colorTo: "#f06020", accentColor: "#f06020", unlockRequirement: 0 },
    { id: 45, name: "Level 46", icon: "city", colorFrom: "#401205", colorTo: "#f06020", accentColor: "#f06020", unlockRequirement: 0 },
    { id: 46, name: "Level 47", icon: "city", colorFrom: "#401205", colorTo: "#f06020", accentColor: "#f06020", unlockRequirement: 0 },
    { id: 47, name: "Level 48", icon: "city", colorFrom: "#401205", colorTo: "#f06020", accentColor: "#f06020", unlockRequirement: 0 },
    { id: 48, name: "Level 49", icon: "city", colorFrom: "#401205", colorTo: "#f06020", accentColor: "#f06020", unlockRequirement: 0 },
    // Tier 8: Desert (50-56)
    { id: 49, name: "Level 50", icon: "city", colorFrom: "#756545", colorTo: "#e0c870", accentColor: "#e0c870", unlockRequirement: 0 },
    { id: 50, name: "Level 51", icon: "city", colorFrom: "#756545", colorTo: "#e0c870", accentColor: "#e0c870", unlockRequirement: 0 },
    { id: 51, name: "Level 52", icon: "city", colorFrom: "#756545", colorTo: "#e0c870", accentColor: "#e0c870", unlockRequirement: 0 },
    { id: 52, name: "Level 53", icon: "city", colorFrom: "#756545", colorTo: "#e0c870", accentColor: "#e0c870", unlockRequirement: 0 },
    { id: 53, name: "Level 54", icon: "city", colorFrom: "#756545", colorTo: "#e0c870", accentColor: "#e0c870", unlockRequirement: 0 },
    { id: 54, name: "Level 55", icon: "city", colorFrom: "#756545", colorTo: "#e0c870", accentColor: "#e0c870", unlockRequirement: 0 },
    { id: 55, name: "Level 56", icon: "city", colorFrom: "#756545", colorTo: "#e0c870", accentColor: "#e0c870", unlockRequirement: 0 },
    // Tier 9: Steel (57-63)
    { id: 56, name: "Level 57", icon: "city", colorFrom: "#303032", colorTo: "#a0a0b0", accentColor: "#a0a0b0", unlockRequirement: 0 },
    { id: 57, name: "Level 58", icon: "city", colorFrom: "#303032", colorTo: "#a0a0b0", accentColor: "#a0a0b0", unlockRequirement: 0 },
    { id: 58, name: "Level 59", icon: "city", colorFrom: "#303032", colorTo: "#a0a0b0", accentColor: "#a0a0b0", unlockRequirement: 0 },
    { id: 59, name: "Level 60", icon: "city", colorFrom: "#303032", colorTo: "#a0a0b0", accentColor: "#a0a0b0", unlockRequirement: 0 },
    { id: 60, name: "Level 61", icon: "city", colorFrom: "#303032", colorTo: "#a0a0b0", accentColor: "#a0a0b0", unlockRequirement: 0 },
    { id: 61, name: "Level 62", icon: "city", colorFrom: "#303032", colorTo: "#a0a0b0", accentColor: "#a0a0b0", unlockRequirement: 0 },
    { id: 62, name: "Level 63", icon: "city", colorFrom: "#303032", colorTo: "#a0a0b0", accentColor: "#a0a0b0", unlockRequirement: 0 },
    // Tier 10: Void (64-70)
    { id: 63, name: "Level 64", icon: "city", colorFrom: "#100218", colorTo: "#8040d0", accentColor: "#8040d0", unlockRequirement: 0 },
    { id: 64, name: "Level 65", icon: "city", colorFrom: "#100218", colorTo: "#8040d0", accentColor: "#8040d0", unlockRequirement: 0 },
    { id: 65, name: "Level 66", icon: "city", colorFrom: "#100218", colorTo: "#8040d0", accentColor: "#8040d0", unlockRequirement: 0 },
    { id: 66, name: "Level 67", icon: "city", colorFrom: "#100218", colorTo: "#8040d0", accentColor: "#8040d0", unlockRequirement: 0 },
    { id: 67, name: "Level 68", icon: "city", colorFrom: "#100218", colorTo: "#8040d0", accentColor: "#8040d0", unlockRequirement: 0 },
    { id: 68, name: "Level 69", icon: "city", colorFrom: "#100218", colorTo: "#8040d0", accentColor: "#8040d0", unlockRequirement: 0 },
    { id: 69, name: "Level 70", icon: "city", colorFrom: "#100218", colorTo: "#8040d0", accentColor: "#8040d0", unlockRequirement: 0 }
];

// --- Level Configs ---
var LEVEL_CONFIGS = {
    1: { // Intro — long segments, easy zigzag
        segmentCount: 15,
        segmentLength: 18,
        rampChance: 0.08,
        coinDensity: 0.3,
    },
    2: { // Medium zigzag
        segmentCount: 20,
        segmentLength: 13,
        rampChance: 0.08,
        coinDensity: 0.3,
    },
    3: { // Tighter zigzag
        segmentCount: 25,
        segmentLength: 9,
        rampChance: 0.06,
        coinDensity: 0.25,
    },
    4: { // Rapid zigzag
        segmentCount: 30,
        segmentLength: 6,
        rampChance: 0.04,
        coinDensity: 0.25,
    },
    5: { // First barrier
        segmentCount: 16,
        segmentLength: 16,
        rampChance: 0.08,
        coinDensity: 0.3,
        barriers: [
            { segment: 8, side: "right" }
        ]
    },
    6: { // Single barrier left
        segmentCount: 18,
        segmentLength: 14,
        rampChance: 0.08,
        coinDensity: 0.3,
        barriers: [
            { segment: 10, side: "left" }
        ]
    },
    7: { // Single barrier right
        segmentCount: 20,
        segmentLength: 12,
        rampChance: 0.06,
        coinDensity: 0.28,
        barriers: [
            { segment: 9, side: "right" }
        ]
    },
    8: { // Triple barriers
        segmentCount: 22,
        segmentLength: 11,
        rampChance: 0.06,
        coinDensity: 0.28,
        barriers: [
            { segment: 7, side: "right" },
            { segment: 12, side: "left" },
            { segment: 17, side: "right" }
        ]
    },
    9: { // Four barriers alternating
        segmentCount: 25,
        segmentLength: 10,
        rampChance: 0.06,
        coinDensity: 0.25,
        barriers: [
            { segment: 6, side: "left" },
            { segment: 11, side: "right" },
            { segment: 16, side: "left" },
            { segment: 21, side: "right" }
        ]
    },
    10: { // Five barriers gauntlet
        segmentCount: 28,
        segmentLength: 8,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 10, side: "left" },
            { segment: 14, side: "right" },
            { segment: 19, side: "left" },
            { segment: 24, side: "right" }
        ]
    },
    11: { // Intro moving barriers — easy zigzag
        segmentCount: 20,
        segmentLength: 14,
        rampChance: 0.06,
        coinDensity: 0.3,
        barriers: [
            { segment: 6, side: "right" },
            { segment: 11, side: "left" },
            { segment: 15, side: "right", moving: true }
        ]
    },
    12: { // 2 static + 2 moving
        segmentCount: 22,
        segmentLength: 12,
        rampChance: 0.06,
        coinDensity: 0.28,
        barriers: [
            { segment: 5, side: "left" },
            { segment: 9, side: "right", moving: true },
            { segment: 14, side: "left", moving: true },
            { segment: 18, side: "right" }
        ]
    },
    13: { // 3 static + 2 moving
        segmentCount: 24,
        segmentLength: 11,
        rampChance: 0.05,
        coinDensity: 0.28,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 8, side: "left", moving: true },
            { segment: 12, side: "right" },
            { segment: 16, side: "left", moving: true },
            { segment: 20, side: "right" }
        ]
    },
    14: { // 3 static + 3 moving
        segmentCount: 26,
        segmentLength: 10,
        rampChance: 0.05,
        coinDensity: 0.25,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 7, side: "right", moving: true },
            { segment: 11, side: "left", moving: true },
            { segment: 15, side: "right" },
            { segment: 19, side: "left", moving: true },
            { segment: 23, side: "right" }
        ]
    },
    15: { // 4 static + 3 moving
        segmentCount: 28,
        segmentLength: 9,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 4, side: "right" },
            { segment: 7, side: "left", moving: true },
            { segment: 10, side: "right" },
            { segment: 14, side: "left", moving: true },
            { segment: 18, side: "right", moving: true },
            { segment: 22, side: "left" },
            { segment: 25, side: "right" }
        ]
    },
    16: { // 4 static + 4 moving
        segmentCount: 30,
        segmentLength: 8,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 7, side: "right", moving: true },
            { segment: 10, side: "left", moving: true },
            { segment: 14, side: "right" },
            { segment: 18, side: "left", moving: true },
            { segment: 22, side: "right" },
            { segment: 25, side: "left", moving: true },
            { segment: 28, side: "right" }
        ]
    },
    17: { // 5 static + 4 moving
        segmentCount: 32,
        segmentLength: 7,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 4, side: "right" },
            { segment: 7, side: "left", moving: true },
            { segment: 10, side: "right" },
            { segment: 13, side: "left", moving: true },
            { segment: 17, side: "right", moving: true },
            { segment: 20, side: "left" },
            { segment: 24, side: "right" },
            { segment: 27, side: "left", moving: true },
            { segment: 30, side: "right" }
        ]
    },
    18: { // 5 static + 5 moving
        segmentCount: 34,
        segmentLength: 6,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 7, side: "right", moving: true },
            { segment: 10, side: "left", moving: true },
            { segment: 13, side: "right" },
            { segment: 16, side: "left", moving: true },
            { segment: 20, side: "right" },
            { segment: 23, side: "left", moving: true },
            { segment: 26, side: "right" },
            { segment: 29, side: "left", moving: true },
            { segment: 32, side: "right" }
        ]
    },
    19: { // 6 static + 5 moving
        segmentCount: 36,
        segmentLength: 5,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, side: "left", moving: true },
            { segment: 9, side: "right" },
            { segment: 12, side: "left", moving: true },
            { segment: 15, side: "right", moving: true },
            { segment: 18, side: "left" },
            { segment: 21, side: "right" },
            { segment: 24, side: "left", moving: true },
            { segment: 28, side: "right", moving: true },
            { segment: 32, side: "left" },
            { segment: 34, side: "right" }
        ]
    },
    20: { // Final gauntlet — 6 static + 6 moving
        segmentCount: 40,
        segmentLength: 5,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, side: "right", moving: true },
            { segment: 9, side: "left", moving: true },
            { segment: 12, side: "right" },
            { segment: 15, side: "left", moving: true },
            { segment: 18, side: "right" },
            { segment: 21, side: "left", moving: true },
            { segment: 24, side: "right" },
            { segment: 27, side: "left", moving: true },
            { segment: 30, side: "right" },
            { segment: 34, side: "left", moving: true },
            { segment: 37, side: "right" }
        ]
    },
    21: { // Intro axes — easy zigzag, 2 static + 1 moving + 1 axe
        segmentCount: 22,
        segmentLength: 13,
        rampChance: 0.05,
        coinDensity: 0.28,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 9, side: "left", moving: true },
            { segment: 14, side: "right", axe: true },
            { segment: 18, side: "left" }
        ]
    },
    22: { // 2 static + 1 moving + 2 axes
        segmentCount: 24,
        segmentLength: 12,
        rampChance: 0.05,
        coinDensity: 0.28,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 8, side: "right", axe: true },
            { segment: 12, side: "left", moving: true },
            { segment: 16, side: "right", axe: true },
            { segment: 20, side: "left" }
        ]
    },
    23: { // 2 static + 2 moving + 2 axes
        segmentCount: 26,
        segmentLength: 11,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 4, side: "right" },
            { segment: 7, side: "left", axe: true },
            { segment: 11, side: "right", moving: true },
            { segment: 15, side: "left", axe: true },
            { segment: 19, side: "right", moving: true },
            { segment: 23, side: "left" }
        ]
    },
    24: { // 3 static + 2 moving + 2 axes
        segmentCount: 28,
        segmentLength: 10,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 7, side: "right", axe: true },
            { segment: 10, side: "left", moving: true },
            { segment: 14, side: "right" },
            { segment: 18, side: "left", axe: true },
            { segment: 22, side: "right", moving: true },
            { segment: 25, side: "left" }
        ]
    },
    25: { // 3 static + 2 moving + 3 axes
        segmentCount: 30,
        segmentLength: 9,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, side: "left", axe: true },
            { segment: 10, side: "right", moving: true },
            { segment: 13, side: "left", axe: true },
            { segment: 17, side: "right" },
            { segment: 21, side: "left", moving: true },
            { segment: 24, side: "right", axe: true },
            { segment: 27, side: "left" }
        ]
    },
    26: { // 3 static + 3 moving + 3 axes
        segmentCount: 32,
        segmentLength: 8,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, side: "right", axe: true },
            { segment: 9, side: "left", moving: true },
            { segment: 12, side: "right", axe: true },
            { segment: 16, side: "left" },
            { segment: 19, side: "right", moving: true },
            { segment: 22, side: "left", axe: true },
            { segment: 26, side: "right", moving: true },
            { segment: 29, side: "left" }
        ]
    },
    27: { // 3 static + 3 moving + 4 axes
        segmentCount: 34,
        segmentLength: 7,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, side: "left", axe: true },
            { segment: 9, side: "right", moving: true },
            { segment: 12, side: "left", axe: true },
            { segment: 15, side: "right" },
            { segment: 18, side: "left", axe: true },
            { segment: 21, side: "right", moving: true },
            { segment: 25, side: "left", moving: true },
            { segment: 28, side: "right", axe: true },
            { segment: 31, side: "left" }
        ]
    },
    28: { // 4 static + 3 moving + 4 axes
        segmentCount: 36,
        segmentLength: 6,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, side: "right", axe: true },
            { segment: 9, side: "left", moving: true },
            { segment: 12, side: "right", axe: true },
            { segment: 15, side: "left" },
            { segment: 18, side: "right", axe: true },
            { segment: 21, side: "left", moving: true },
            { segment: 24, side: "right" },
            { segment: 27, side: "left", axe: true },
            { segment: 30, side: "right", moving: true },
            { segment: 33, side: "left" }
        ]
    },
    29: { // 4 static + 4 moving + 4 axes
        segmentCount: 38,
        segmentLength: 5,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, side: "left", axe: true },
            { segment: 9, side: "right", moving: true },
            { segment: 12, side: "left", axe: true },
            { segment: 15, side: "right", moving: true },
            { segment: 18, side: "left" },
            { segment: 21, side: "right", axe: true },
            { segment: 24, side: "left", moving: true },
            { segment: 27, side: "right" },
            { segment: 30, side: "left", axe: true },
            { segment: 33, side: "right", moving: true },
            { segment: 36, side: "left" }
        ]
    },
    30: { // Ultimate gauntlet — 3 static + 3 moving + 3 axes
        segmentCount: 36,
        segmentLength: 6,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 8, side: "right", axe: true },
            { segment: 12, side: "left", moving: true },
            { segment: 16, side: "right" },
            { segment: 20, side: "left", axe: true },
            { segment: 24, side: "right", moving: true },
            { segment: 28, side: "left", axe: true },
            { segment: 32, side: "right", moving: true },
            { segment: 35, side: "left" }
        ]
    },
    31: { // Intro crushers — 2 static + 1 moving + 1 axe + 1 crusher
        segmentCount: 24,
        segmentLength: 12,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 9, side: "left", moving: true },
            { segment: 13, side: "right", axe: true },
            { segment: 17, crusher: true },
            { segment: 21, side: "left" }
        ]
    },
    32: { // 2 static + 2 moving + 1 axe + 1 crusher
        segmentCount: 26,
        segmentLength: 11,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 7, side: "right", moving: true },
            { segment: 11, side: "left", axe: true },
            { segment: 15, crusher: true },
            { segment: 19, side: "right", moving: true },
            { segment: 23, side: "left" }
        ]
    },
    33: { // 3 static + 2 moving + 1 axe + 2 crushers
        segmentCount: 28,
        segmentLength: 10,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 4, side: "right" },
            { segment: 7, crusher: true },
            { segment: 10, side: "left", moving: true },
            { segment: 13, side: "right" },
            { segment: 17, side: "left", axe: true },
            { segment: 20, side: "right", moving: true },
            { segment: 23, crusher: true },
            { segment: 26, side: "left" }
        ]
    },
    34: { // 3 static + 2 moving + 2 axes + 2 crushers
        segmentCount: 30,
        segmentLength: 9,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, side: "right", axe: true },
            { segment: 9, crusher: true },
            { segment: 12, side: "left", moving: true },
            { segment: 15, side: "right" },
            { segment: 18, crusher: true },
            { segment: 21, side: "left", axe: true },
            { segment: 24, side: "right", moving: true },
            { segment: 27, side: "left" }
        ]
    },
    35: { // Final crusher gauntlet — 3 static + 3 moving + 2 axes + 3 crushers
        segmentCount: 34,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, crusher: true },
            { segment: 9, side: "left", moving: true },
            { segment: 12, side: "right", axe: true },
            { segment: 15, crusher: true },
            { segment: 18, side: "left", moving: true },
            { segment: 21, side: "right" },
            { segment: 24, crusher: true },
            { segment: 27, side: "left", axe: true },
            { segment: 30, side: "right", moving: true },
            { segment: 33, side: "left" }
        ]
    },
    // ===== TIER 6: SPINNER (Levels 36-42) =====
    36: { // Intro spinner — 1 spinner + mixed
        segmentCount: 24,
        segmentLength: 12,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 9, side: "left", moving: true },
            { segment: 13, spinner: true, side: "right" },
            { segment: 17, side: "right", axe: true },
            { segment: 21, side: "left" }
        ]
    },
    37: { // 1 spinner + 5 mixed
        segmentCount: 26,
        segmentLength: 11,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 7, side: "right", moving: true },
            { segment: 11, spinner: true, side: "left" },
            { segment: 15, crusher: true },
            { segment: 19, side: "left", axe: true },
            { segment: 23, side: "right" }
        ]
    },
    38: { // 2 spinners + 5 mixed
        segmentCount: 28,
        segmentLength: 10,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 4, side: "right" },
            { segment: 7, spinner: true, side: "right" },
            { segment: 10, side: "left", moving: true },
            { segment: 14, side: "right", axe: true },
            { segment: 18, spinner: true, side: "left" },
            { segment: 22, crusher: true },
            { segment: 25, side: "left" }
        ]
    },
    39: { // 2 spinners + 6 mixed
        segmentCount: 30,
        segmentLength: 9,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, spinner: true, side: "right" },
            { segment: 9, side: "right", moving: true },
            { segment: 12, side: "left", axe: true },
            { segment: 16, crusher: true },
            { segment: 20, spinner: true, side: "left" },
            { segment: 24, side: "right", moving: true },
            { segment: 27, side: "left" }
        ]
    },
    40: { // 2 spinners + 7 mixed
        segmentCount: 32,
        segmentLength: 8,
        rampChance: 0.03,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, side: "left", moving: true },
            { segment: 9, spinner: true, side: "right" },
            { segment: 12, side: "right", axe: true },
            { segment: 16, crusher: true },
            { segment: 19, side: "left", moving: true },
            { segment: 22, spinner: true, side: "left" },
            { segment: 26, side: "right" },
            { segment: 29, side: "left" }
        ]
    },
    41: { // 3 spinners + 7 mixed + ICE ZONE INTRO
        segmentCount: 34,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, spinner: true, side: "right" },
            { segment: 9, side: "right", moving: true },
            { segment: 12, crusher: true },
            { segment: 15, side: "left", axe: true },
            { segment: 18, spinner: true, side: "left" },
            { segment: 22, side: "right", moving: true },
            { segment: 25, side: "left" },
            { segment: 28, spinner: true, side: "right" },
            { segment: 31, side: "right" }
        ],
        zones: [{ type: "ice", from: 15, to: 22 }]
    },
    42: { // 3 spinners + 8 mixed + ICE
        segmentCount: 36,
        segmentLength: 7,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, spinner: true, side: "left" },
            { segment: 9, side: "left", moving: true },
            { segment: 12, side: "right", axe: true },
            { segment: 15, spinner: true, side: "right" },
            { segment: 18, crusher: true },
            { segment: 21, side: "left", moving: true },
            { segment: 24, side: "right" },
            { segment: 27, spinner: true, side: "left" },
            { segment: 30, side: "left", axe: true },
            { segment: 33, side: "right" }
        ],
        zones: [{ type: "ice", from: 12, to: 24 }]
    },
    // ===== TIER 7: FLAME JET (Levels 43-49) =====
    43: { // Intro flame jet — 1 flame jet + mixed + ICE
        segmentCount: 26,
        segmentLength: 11,
        rampChance: 0.04,
        coinDensity: 0.25,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 8, side: "left", moving: true },
            { segment: 12, flameJet: true, side: "right" },
            { segment: 16, spinner: true, side: "right" },
            { segment: 20, side: "left", axe: true },
            { segment: 23, side: "right" }
        ],
        zones: [{ type: "ice", from: 8, to: 14 }]
    },
    44: { // 2 flame jets + 5 mixed + ICE
        segmentCount: 28,
        segmentLength: 10,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 4, side: "left" },
            { segment: 7, flameJet: true, side: "right" },
            { segment: 10, side: "right", moving: true },
            { segment: 14, spinner: true, side: "left" },
            { segment: 18, flameJet: true, side: "left" },
            { segment: 22, crusher: true },
            { segment: 25, side: "right" }
        ],
        zones: [{ type: "ice", from: 10, to: 18 }]
    },
    45: { // 2 flame jets + 6 mixed + 2 ICE ZONES
        segmentCount: 30,
        segmentLength: 10,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, flameJet: true, side: "left" },
            { segment: 9, side: "left", moving: true },
            { segment: 12, spinner: true, side: "right" },
            { segment: 16, side: "right", axe: true },
            { segment: 20, flameJet: true, side: "right" },
            { segment: 24, crusher: true },
            { segment: 27, side: "left" }
        ],
        zones: [{ type: "ice", from: 8, to: 16 }, { type: "ice", from: 20, to: 26 }]
    },
    46: { // 2 flame jets + 7 mixed + 2 ICE ZONES
        segmentCount: 32,
        segmentLength: 9,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, side: "right", moving: true },
            { segment: 9, flameJet: true, side: "left" },
            { segment: 12, spinner: true, side: "left" },
            { segment: 16, side: "right", axe: true },
            { segment: 19, crusher: true },
            { segment: 22, flameJet: true, side: "right" },
            { segment: 26, side: "left", moving: true },
            { segment: 29, side: "right" }
        ],
        zones: [{ type: "ice", from: 6, to: 14 }, { type: "ice", from: 20, to: 28 }]
    },
    47: { // 3 flame jets + 7 mixed + CRUMBLE INTRO
        segmentCount: 34,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, flameJet: true, side: "left" },
            { segment: 9, side: "left", moving: true },
            { segment: 12, spinner: true, side: "right" },
            { segment: 15, flameJet: true, side: "right" },
            { segment: 18, side: "right", axe: true },
            { segment: 22, crusher: true },
            { segment: 25, flameJet: true, side: "left" },
            { segment: 28, side: "left", moving: true },
            { segment: 31, side: "right" }
        ],
        zones: [{ type: "crumble", from: 10, to: 16 }]
    },
    48: { // 3 flame jets + 8 mixed + ICE + CRUMBLE
        segmentCount: 36,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, flameJet: true, side: "right" },
            { segment: 9, spinner: true, side: "left" },
            { segment: 12, side: "right", moving: true },
            { segment: 15, flameJet: true, side: "left" },
            { segment: 18, side: "left", axe: true },
            { segment: 21, crusher: true },
            { segment: 24, flameJet: true, side: "right" },
            { segment: 27, side: "right" },
            { segment: 30, side: "left", moving: true },
            { segment: 33, side: "right" }
        ],
        zones: [{ type: "ice", from: 8, to: 14 }, { type: "crumble", from: 20, to: 28 }]
    },
    49: { // 3 flame jets + 9 mixed + ICE + CRUMBLE
        segmentCount: 38,
        segmentLength: 7,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, flameJet: true, side: "left" },
            { segment: 9, side: "left", moving: true },
            { segment: 12, spinner: true, side: "right" },
            { segment: 15, flameJet: true, side: "right" },
            { segment: 18, crusher: true },
            { segment: 21, side: "right", axe: true },
            { segment: 24, flameJet: true, side: "left" },
            { segment: 27, side: "left", moving: true },
            { segment: 30, side: "right" },
            { segment: 34, side: "left" },
            { segment: 37, side: "right" }
        ],
        zones: [{ type: "ice", from: 10, to: 18 }, { type: "crumble", from: 24, to: 32 }]
    },
    // ===== TIER 8: BOULDER (Levels 50-56) =====
    50: { // Intro boulder — 1 boulder + mixed + CRUMBLE
        segmentCount: 28,
        segmentLength: 10,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 8, flameJet: true, side: "left" },
            { segment: 12, boulder: true },
            { segment: 16, spinner: true, side: "left" },
            { segment: 20, side: "left", axe: true },
            { segment: 24, side: "right" }
        ],
        zones: [{ type: "crumble", from: 8, to: 14 }]
    },
    51: { // 2 boulders + 6 mixed + ICE + CRUMBLE
        segmentCount: 30,
        segmentLength: 9,
        rampChance: 0.03,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, boulder: true },
            { segment: 9, side: "right", moving: true },
            { segment: 12, flameJet: true, side: "left" },
            { segment: 16, spinner: true, side: "right" },
            { segment: 20, boulder: true },
            { segment: 24, crusher: true },
            { segment: 27, side: "right" }
        ],
        zones: [{ type: "ice", from: 8, to: 14 }, { type: "crumble", from: 18, to: 24 }]
    },
    52: { // 2 boulders + 7 mixed + ICE + CRUMBLE
        segmentCount: 32,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, boulder: true },
            { segment: 9, side: "left", moving: true },
            { segment: 12, flameJet: true, side: "right" },
            { segment: 15, side: "right", axe: true },
            { segment: 19, spinner: true, side: "left" },
            { segment: 22, boulder: true },
            { segment: 26, crusher: true },
            { segment: 29, side: "left" }
        ],
        zones: [{ type: "ice", from: 6, to: 12 }, { type: "crumble", from: 18, to: 26 }]
    },
    53: { // 2 boulders + 8 mixed + WIND INTRO
        segmentCount: 34,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, boulder: true },
            { segment: 9, side: "right", moving: true },
            { segment: 12, spinner: true, side: "right" },
            { segment: 15, flameJet: true, side: "left" },
            { segment: 18, side: "left", axe: true },
            { segment: 22, boulder: true },
            { segment: 25, crusher: true },
            { segment: 28, side: "right", moving: true },
            { segment: 31, side: "left" }
        ],
        zones: [{ type: "wind", from: 10, to: 18, dir: "left" }]
    },
    54: { // 3 boulders + 8 mixed + ICE + WIND
        segmentCount: 36,
        segmentLength: 7,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, boulder: true },
            { segment: 9, flameJet: true, side: "left" },
            { segment: 12, side: "left", moving: true },
            { segment: 15, spinner: true, side: "left" },
            { segment: 18, boulder: true },
            { segment: 21, side: "right", axe: true },
            { segment: 24, crusher: true },
            { segment: 27, boulder: true },
            { segment: 30, side: "left", moving: true },
            { segment: 33, side: "right" }
        ],
        zones: [{ type: "ice", from: 8, to: 14 }, { type: "wind", from: 20, to: 28, dir: "right" }]
    },
    55: { // 3 boulders + 9 mixed + WIND + CRUMBLE
        segmentCount: 38,
        segmentLength: 7,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, boulder: true },
            { segment: 9, side: "right", moving: true },
            { segment: 12, flameJet: true, side: "right" },
            { segment: 15, spinner: true, side: "right" },
            { segment: 18, boulder: true },
            { segment: 21, crusher: true },
            { segment: 24, side: "left", axe: true },
            { segment: 27, boulder: true },
            { segment: 30, side: "right" },
            { segment: 33, side: "left", moving: true },
            { segment: 36, side: "right" }
        ],
        zones: [{ type: "wind", from: 8, to: 16, dir: "left" }, { type: "crumble", from: 22, to: 30 }]
    },
    56: { // 3 boulders + 10 mixed + ICE + WIND + CRUMBLE
        segmentCount: 40,
        segmentLength: 6,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, boulder: true },
            { segment: 9, flameJet: true, side: "left" },
            { segment: 12, side: "left", moving: true },
            { segment: 15, spinner: true, side: "left" },
            { segment: 18, boulder: true },
            { segment: 21, side: "right", axe: true },
            { segment: 24, crusher: true },
            { segment: 27, boulder: true },
            { segment: 30, side: "left", moving: true },
            { segment: 33, flameJet: true, side: "right" },
            { segment: 36, side: "right" },
            { segment: 39, side: "left" }
        ],
        zones: [{ type: "ice", from: 6, to: 12 }, { type: "wind", from: 18, to: 26, dir: "right" }, { type: "crumble", from: 30, to: 36 }]
    },
    // ===== TIER 9: PISTON (Levels 57-63) =====
    57: { // Intro piston + WIND
        segmentCount: 28,
        segmentLength: 10,
        rampChance: 0.03,
        coinDensity: 0.22,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 8, boulder: true },
            { segment: 12, piston: true },
            { segment: 16, flameJet: true, side: "left" },
            { segment: 20, spinner: true, side: "right" },
            { segment: 24, side: "left" }
        ],
        zones: [{ type: "wind", from: 8, to: 14, dir: "left" }]
    },
    58: { // 2 pistons + 6 mixed + WIND + CRUMBLE
        segmentCount: 30,
        segmentLength: 9,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, piston: true },
            { segment: 9, side: "right", moving: true },
            { segment: 12, boulder: true },
            { segment: 16, flameJet: true, side: "right" },
            { segment: 20, piston: true },
            { segment: 24, spinner: true, side: "left" },
            { segment: 27, side: "right" }
        ],
        zones: [{ type: "wind", from: 8, to: 14, dir: "right" }, { type: "crumble", from: 18, to: 24 }]
    },
    59: { // 2 pistons + 7 mixed + DARK INTRO
        segmentCount: 32,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, piston: true },
            { segment: 9, side: "left", moving: true },
            { segment: 12, boulder: true },
            { segment: 15, flameJet: true, side: "left" },
            { segment: 19, spinner: true, side: "right" },
            { segment: 22, piston: true },
            { segment: 26, side: "right", axe: true },
            { segment: 29, side: "left" }
        ],
        zones: []
    },
    60: { // 2 pistons + 9 mixed + DARK + ICE
        segmentCount: 34,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, piston: true },
            { segment: 9, boulder: true },
            { segment: 12, side: "right", moving: true },
            { segment: 15, flameJet: true, side: "right" },
            { segment: 18, spinner: true, side: "left" },
            { segment: 21, piston: true },
            { segment: 24, crusher: true },
            { segment: 27, side: "left", axe: true },
            { segment: 30, side: "right", moving: true },
            { segment: 33, side: "left" }
        ],
        zones: [{ type: "ice", from: 20, to: 28 }]
    },
    61: { // 3 pistons + 8 mixed + DARK + WIND
        segmentCount: 36,
        segmentLength: 7,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, piston: true },
            { segment: 9, boulder: true },
            { segment: 12, side: "left", moving: true },
            { segment: 15, flameJet: true, side: "left" },
            { segment: 18, piston: true },
            { segment: 21, spinner: true, side: "right" },
            { segment: 24, side: "right", axe: true },
            { segment: 27, piston: true },
            { segment: 30, crusher: true },
            { segment: 33, side: "left" }
        ],
        zones: [{ type: "wind", from: 20, to: 28, dir: "left" }]
    },
    62: { // 3 pistons + 9 mixed + DARK + CRUMBLE
        segmentCount: 38,
        segmentLength: 7,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, piston: true },
            { segment: 9, side: "right", moving: true },
            { segment: 12, boulder: true },
            { segment: 15, flameJet: true, side: "right" },
            { segment: 18, piston: true },
            { segment: 21, spinner: true, side: "left" },
            { segment: 24, side: "left", axe: true },
            { segment: 27, piston: true },
            { segment: 30, crusher: true },
            { segment: 33, side: "right", moving: true },
            { segment: 36, side: "left" }
        ],
        zones: [{ type: "crumble", from: 24, to: 32 }]
    },
    63: { // 3 pistons + 10 mixed + DARK + WIND + ICE
        segmentCount: 40,
        segmentLength: 6,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, piston: true },
            { segment: 9, boulder: true },
            { segment: 12, side: "left", moving: true },
            { segment: 15, flameJet: true, side: "left" },
            { segment: 18, piston: true },
            { segment: 21, spinner: true, side: "right" },
            { segment: 24, crusher: true },
            { segment: 27, piston: true },
            { segment: 30, side: "right", axe: true },
            { segment: 33, boulder: true },
            { segment: 36, side: "left", moving: true },
            { segment: 39, side: "right" }
        ],
        zones: [{ type: "wind", from: 22, to: 30, dir: "right" }, { type: "ice", from: 32, to: 38 }]
    },
    // ===== TIER 10: LASER (Levels 64-70) =====
    64: { // Intro laser + DARK + CRUMBLE
        segmentCount: 30,
        segmentLength: 9,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 5, side: "right" },
            { segment: 8, piston: true },
            { segment: 12, laser: true },
            { segment: 16, boulder: true },
            { segment: 20, flameJet: true, side: "left" },
            { segment: 24, spinner: true, side: "left" },
            { segment: 27, side: "left" }
        ],
        zones: [{ type: "crumble", from: 18, to: 24 }]
    },
    65: { // 2 lasers + 7 mixed + ROCKS INTRO
        segmentCount: 32,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.2,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, laser: true },
            { segment: 9, piston: true },
            { segment: 12, side: "right", moving: true },
            { segment: 15, boulder: true },
            { segment: 19, flameJet: true, side: "right" },
            { segment: 22, laser: true },
            { segment: 26, spinner: true, side: "right" },
            { segment: 29, side: "right" }
        ],
        zones: [{ type: "rocks", from: 10, to: 20 }]
    },
    66: { // 2 lasers + 9 mixed + ROCKS + ICE
        segmentCount: 34,
        segmentLength: 8,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, laser: true },
            { segment: 9, piston: true },
            { segment: 12, side: "left", moving: true },
            { segment: 15, boulder: true },
            { segment: 18, flameJet: true, side: "left" },
            { segment: 21, spinner: true, side: "left" },
            { segment: 24, laser: true },
            { segment: 27, crusher: true },
            { segment: 30, side: "right", axe: true },
            { segment: 33, side: "left" }
        ],
        zones: [{ type: "rocks", from: 8, to: 16 }, { type: "ice", from: 20, to: 28 }]
    },
    67: { // 2 lasers + 9 mixed + ROCKS + DARK
        segmentCount: 36,
        segmentLength: 7,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, laser: true },
            { segment: 9, boulder: true },
            { segment: 12, piston: true },
            { segment: 15, side: "right", moving: true },
            { segment: 18, flameJet: true, side: "right" },
            { segment: 21, spinner: true, side: "right" },
            { segment: 24, laser: true },
            { segment: 27, crusher: true },
            { segment: 30, side: "left", axe: true },
            { segment: 33, side: "right" }
        ],
        zones: [{ type: "rocks", from: 10, to: 18 }]
    },
    68: { // 3 lasers + 9 mixed + ROCKS + WIND + CRUMBLE
        segmentCount: 38,
        segmentLength: 6,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, laser: true },
            { segment: 9, piston: true },
            { segment: 12, side: "left", moving: true },
            { segment: 15, boulder: true },
            { segment: 18, laser: true },
            { segment: 21, flameJet: true, side: "left" },
            { segment: 24, spinner: true, side: "left" },
            { segment: 27, laser: true },
            { segment: 30, crusher: true },
            { segment: 33, side: "right", axe: true },
            { segment: 36, side: "left" }
        ],
        zones: [{ type: "rocks", from: 8, to: 16 }, { type: "wind", from: 20, to: 28, dir: "left" }, { type: "crumble", from: 30, to: 36 }]
    },
    69: { // 3 lasers + 10 mixed + DARK + ROCKS + ICE
        segmentCount: 40,
        segmentLength: 6,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "left" },
            { segment: 6, laser: true },
            { segment: 9, piston: true },
            { segment: 12, boulder: true },
            { segment: 15, side: "right", moving: true },
            { segment: 18, laser: true },
            { segment: 21, flameJet: true, side: "right" },
            { segment: 24, spinner: true, side: "right" },
            { segment: 27, crusher: true },
            { segment: 30, laser: true },
            { segment: 33, side: "left", axe: true },
            { segment: 36, side: "right", moving: true },
            { segment: 39, side: "left" }
        ],
        zones: [{ type: "rocks", from: 18, to: 28 }, { type: "ice", from: 30, to: 38 }]
    },
    70: { // GRAND FINALE — all obstacles + ALL 5 ZONES
        segmentCount: 48,
        segmentLength: 5,
        rampChance: 0.02,
        coinDensity: 0.18,
        barriers: [
            { segment: 3, side: "right" },
            { segment: 6, laser: true },
            { segment: 9, piston: true },
            { segment: 12, boulder: true },
            { segment: 15, side: "left", moving: true },
            { segment: 18, flameJet: true, side: "left" },
            { segment: 21, laser: true },
            { segment: 24, spinner: true, side: "left" },
            { segment: 27, crusher: true },
            { segment: 30, side: "right", axe: true },
            { segment: 33, laser: true },
            { segment: 36, piston: true },
            { segment: 39, boulder: true },
            { segment: 42, side: "left" },
            { segment: 45, side: "right" }
        ],
        zones: [
            { type: "ice", from: 6, to: 12 },
            { type: "crumble", from: 16, to: 22 },
            { type: "wind", from: 24, to: 30, dir: "left" },
            { type: "rocks", from: 38, to: 44 }
        ]
    }
};

// --- Level Config Generation ---
function generateLevelConfig(levelNum) {
    var world = WORLDS[Math.min(levelNum - 1, WORLDS.length - 1)];
    var lc = LEVEL_CONFIGS[levelNum] || LEVEL_CONFIGS[1];

    var worldIndex = levelNum <= 10 ? 0 : levelNum <= 13 ? 1 : levelNum <= 16 ? 2 : levelNum <= 19 ? 3 : levelNum <= 20 ? 4 : levelNum <= 23 ? 5 : levelNum <= 26 ? 6 : levelNum <= 29 ? 7 : levelNum <= 30 ? 8 : levelNum <= 35 ? 9 : levelNum <= 42 ? 10 : levelNum <= 49 ? 11 : levelNum <= 56 ? 12 : levelNum <= 63 ? 13 : 14;

    var config = {
        levelNum: levelNum,
        worldIndex: worldIndex,
        levelInWorld: levelNum,
        worldName: world.name,
        worldIcon: world.icon,
        seed: levelNum * 7919 + 42,
        carSpeed: 14,
        roadWidth: 8,
        segmentCount: lc.segmentCount || 20,
        segmentLength: lc.segmentLength || 14,
        obstacleChance: 0,
        rampChance: lc.rampChance || 0.08,
        rampHeight: 0.4,
        coinDensity: lc.coinDensity || 0.3,
        powerUpChance: 0.10,
        obstacleGracePeriod: 99,
        movingObstacles: false,
        slipperyPhysics: false,
        slipFactor: 1.0,
        timedBarriers: false,
        lowGravity: false,
        speedZones: false,
        barriers: lc.barriers || [],
        zones: lc.zones || [],
        elevation: lc.elevation || null
    };

    return config;
}

// --- Progress Persistence ---
var LEVEL_PROGRESS_KEY = "driftBossLevelProgress";

function loadLevelProgress() {
    try {
        var data = localStorage.getItem(LEVEL_PROGRESS_KEY);
        return data ? JSON.parse(data) : {};
    } catch(e) { return {}; }
}

function saveLevelProgress(levelNum, stars, coins) {
    var progress = loadLevelProgress();
    var key = "l" + levelNum;
    var existing = progress[key];
    if (!existing || stars > existing.stars) {
        progress[key] = { stars: stars, coins: coins };
    } else if (existing && coins > existing.coins) {
        progress[key].coins = coins;
    }
    try { localStorage.setItem(LEVEL_PROGRESS_KEY, JSON.stringify(progress)); } catch(e) {}
}

function getLevelStars(levelNum) {
    var progress = loadLevelProgress();
    var entry = progress["l" + levelNum];
    return entry ? entry.stars : 0;
}

function isLevelUnlocked(levelNum) {
    if (levelNum === 1) return true;
    return getLevelStars(levelNum - 1) >= 1;
}

function isWorldUnlocked(worldIndex) {
    return true;
}

function getWorldTotalStars(worldIndex) {
    var total = 0;
    for (var i = 1; i <= WORLDS.length; i++) {
        total += getLevelStars(i);
    }
    return total;
}

function getTotalStars() {
    var total = 0;
    for (var i = 1; i <= WORLDS.length; i++) {
        total += getLevelStars(i);
    }
    return total;
}

// --- Star Calculation ---
function calculateStars(config, completed, coinsCollected, totalCoins, hadCrash) {
    if (!completed) return 0;
    var stars = 1;
    if (totalCoins > 0 && coinsCollected >= totalCoins * 0.7) stars = 2;
    if (totalCoins > 0 && coinsCollected >= totalCoins * 0.7 && !hadCrash) stars = 3;
    return stars;
}

// --- Level State ---
var currentLevelConfig = null;
var levelMode = false;
var levelCoinsTotal = 0;
var levelCoinsCollected = 0;
var levelHadCrash = false;
