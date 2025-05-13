/**
 * 游戏常量
 * 定义游戏中使用的各种常量
 */

// 游戏尺寸
const GAME_WIDTH = Math.min(window.innerWidth * 0.95, 1280);
const GAME_HEIGHT = Math.min(window.innerHeight * 0.95, 720);

// 游戏字体大小
const GAME_FONT_SIZE = 24;

// 玩家默认属性
const PLAYER_DEFAULT_STATS = {
    health: 100,
    speed: 180,
    pickupRadius: 80,
    magnetBonus: 0,
    luck: 1.0,
    maxWeapons: 6,
    maxPassives: 6,
    damageMultiplier: 1.0,
    areaMultiplier: 1.0,
    durationMultiplier: 1.0,
    projectileSpeedMultiplier: 1.0,
    cooldownMultiplier: 1.0,
    projectileCountBonus: 0,
    armor: 0,
    regen: 0,
    critChance: 0.05,
    critDamage: 1.5,
};

// 敌人基础属性
const ENEMY_BASE_STATS = {
    health: 8,
    speed: 50,
    damage: 6,
    xp: 2
};

// ENEMY_TYPES definition removed, js/constants.js will be the source of truth

// BOSS_TYPES definition removed, js/constants.js will be the source of truth

// 游戏难度设置
const BASE_SPAWN_INTERVAL = 2.8; // 基础生成间隔
const BOSS_INTERVAL = 180; // Boss 生成间隔（秒）
const SPAWN_PADDING = 50; // 生成边距

// 升级设置
const LEVEL_XP_REQUIREMENTS = [6, 15, 28, 45, 65, 90, 120, 155, 195, 240];
const MAX_LEVEL = 99;

// 对象池设置
const MAX_DAMAGE_NUMBERS = 30;

// 相机设置
const CAMERA_LERP = 0.1; // 相机平滑移动系数
const WORLD_SIZE = 10000; // 世界大小

// EMOJI definition removed, js/constants.js will be the source of truth

// 基础武器和被动道具
const BASE_WEAPONS = [
    'DaggerWeapon',
    'GarlicWeapon',
    'WhipWeapon',
    'FireDaggerWeapon',
    'StormBladeWeapon',
    'HandshakeWeapon'
];

const BASE_PASSIVES = [
    'Spinach',
    'Armor',
    'Wings',
    'EmptyTome',
    'Candelabrador',
    'Bracer',
    'HollowHeart',
    'Pummarola',
    'Magnet'
];
