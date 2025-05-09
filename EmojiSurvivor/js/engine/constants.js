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

// 敌人类型
const ENEMY_TYPES = [
    {
        emoji: '💀',
        name: '骷髅',
        healthMult: 1,
        speedMult: 1,
        damageMult: 1,
        xpMult: 1,
        weight: 10
    },
    {
        emoji: '👻',
        name: '幽灵',
        healthMult: 0.7,
        speedMult: 1.5,
        damageMult: 0.8,
        xpMult: 1.2,
        weight: 5,
        minTime: 75
    },
    {
        emoji: '🧟',
        name: '僵尸',
        healthMult: 2.5,
        speedMult: 0.6,
        damageMult: 1.2,
        xpMult: 1.5,
        weight: 3,
        minTime: 150
    },
    {
        emoji: '🦇',
        name: '蝙蝠',
        healthMult: 0.5,
        speedMult: 1.8,
        damageMult: 0.7,
        xpMult: 1.3,
        weight: 4,
        minTime: 120
    },
    {
        emoji: '🐺',
        name: '狼',
        healthMult: 1.5,
        speedMult: 1.2,
        damageMult: 1.1,
        xpMult: 1.4,
        weight: 3,
        minTime: 180
    },
    {
        emoji: '🕷️',
        name: '蜘蛛',
        healthMult: 0.8,
        speedMult: 1.3,
        damageMult: 0.9,
        xpMult: 1.2,
        weight: 4,
        minTime: 210
    }
];

// Boss 类型
const BOSS_TYPES = [
    {
        emoji: '👹',
        name: '鬼怪',
        healthMult: 35,
        speedMult: 0.7,
        damageMult: 2.0,
        xpMult: 35,
        attackPattern: 'melee',
        projectileCount: 3,
        minTime: 0
    },
    {
        emoji: '🧙',
        name: '巫师',
        healthMult: 25,
        speedMult: 0.6,
        damageMult: 2.5,
        xpMult: 40,
        attackPattern: 'ranged',
        projectileCount: 5,
        minTime: 300
    },
    {
        emoji: '👿',
        name: '恶魔',
        healthMult: 30,
        speedMult: 0.8,
        damageMult: 2.2,
        xpMult: 45,
        attackPattern: 'teleport',
        projectileCount: 4,
        minTime: 600
    },
    {
        emoji: '🐉',
        name: '龙',
        healthMult: 50,
        speedMult: 0.5,
        damageMult: 3.0,
        xpMult: 60,
        attackPattern: 'summon',
        projectileCount: 6,
        minTime: 900
    }
];

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

// 表情符号定义
const EMOJI = {
    // 玩家
    PLAYER: '🥷',

    // 敌人
    ENEMY_NORMAL: '💀',
    ENEMY_FAST: '👻',
    ENEMY_TANK: '🧟',
    BOSS: '👹',

    // 投射物
    PROJECTILE_DAGGER: '🔪',
    PROJECTILE_GARLIC: '💨',
    PROJECTILE_WHIP_L: '➬',
    PROJECTILE_WHIP_R: '➪',
    PROJECTILE_FIRE: '🔥',
    PROJECTILE_LIGHTNING: '⚡',
    PROJECTILE_HANDSHAKE: '👋',

    // 物品
    XP_GEM: '✨',
    CHEST: '🎁',
    HEART: '💖',
    MAGNET: '🧲',

    // 武器
    WEAPON_DAGGER: '🔪',
    WEAPON_GARLIC: '🧄',
    WEAPON_WHIP: '〰️',
    WEAPON_KNIVES: '⚔️',
    WEAPON_SOUL_EATER: '👻',
    WEAPON_BLOODY_TEAR: '🩸',
    WEAPON_FIRE_DAGGER: '🔥',
    WEAPON_INFERNO: '🌋',
    WEAPON_STORM_BLADE: '⚡',
    WEAPON_LIGHTNING: '☇',
    WEAPON_HANDSHAKE: '👋',
    WEAPON_HIGH_FIVE: '✋',

    // 被动道具
    PASSIVE_SPINACH: '🥬',
    PASSIVE_ARMOR: '🛡️',
    PASSIVE_WINGS: '🕊️',
    PASSIVE_TOME: '📖',
    PASSIVE_CANDELABRADOR: '🕯️',
    PASSIVE_BRACER: '🥊',
    PASSIVE_HOLLOW_HEART: '❤️‍🔥',
    PASSIVE_PUMMAROLA: '🍅',
    PASSIVE_MAGNET: '🧲'
};

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
