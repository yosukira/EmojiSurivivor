/**
 * 游戏常量定义
 * 包含游戏中使用的各种常量
 */

// Emoji 定义
const EMOJI = {
    // 角色
    PLAYER: '🥷', // 忍者
    
    // 敌人
    ENEMY_NORMAL: '💀',
    ENEMY_FAST: '👻',
    ENEMY_TANK: '🧟',
    
    // Boss
    BOSS: '👹',
    BOSS_SKELETON: '☠️',
    BOSS_GHOST: '👻',
    BOSS_ZOMBIE: '🧟',
    BOSS_DEMON: '👿',
    
    // 投射物
    PROJECTILE_DAGGER: '🔪',
    PROJECTILE_GARLIC: '💨',
    PROJECTILE_WHIP_L: '➬',
    PROJECTILE_WHIP_R: '➪',
    PROJECTILE_FIRE: '🔥',
    PROJECTILE_LIGHTNING: '⚡',
    PROJECTILE_GHOST: '👻',
    PROJECTILE_HANDSHAKE: '🤝',
    
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
    WEAPON_STORM_BLADE: '⚔️',
    WEAPON_LIGHTNING: '⚡',
    WEAPON_HANDSHAKE: '🤝',
    WEAPON_HIGH_FIVE: '✋',
    
    // 被动物品
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

// 敌人类型定义
const ENEMY_TYPES = [
    {
        emoji: EMOJI.ENEMY_NORMAL,
        healthMult: 1,
        speedMult: 1,
        damageMult: 1,
        xpMult: 1,
        weight: 10
    },
    {
        emoji: EMOJI.ENEMY_FAST,
        healthMult: 0.7,
        speedMult: 1.5,
        damageMult: 0.8,
        xpMult: 1.2,
        weight: 5,
        minTime: 75
    },
    {
        emoji: EMOJI.ENEMY_TANK,
        healthMult: 2.5,
        speedMult: 0.6,
        damageMult: 1.2,
        xpMult: 1.5,
        weight: 3,
        minTime: 150
    }
];

// Boss类型定义
const BOSS_TYPES = [
    {
        name: "骷髅王",
        emoji: EMOJI.BOSS_SKELETON,
        healthMult: 1.0,
        speedMult: 0.8,
        damageMult: 1.0,
        xpMult: 1.0,
        attackPattern: "melee",
        minTime: 0
    },
    {
        name: "幽灵领主",
        emoji: EMOJI.BOSS_GHOST,
        healthMult: 0.8,
        speedMult: 1.2,
        damageMult: 0.9,
        xpMult: 1.2,
        attackPattern: "ranged",
        projectileCount: 5,
        minTime: BOSS_INTERVAL
    },
    {
        name: "巨型僵尸",
        emoji: EMOJI.BOSS_ZOMBIE,
        healthMult: 1.5,
        speedMult: 0.6,
        damageMult: 1.2,
        xpMult: 1.5,
        attackPattern: "aoe",
        minTime: BOSS_INTERVAL * 2
    },
    {
        name: "恶魔领主",
        emoji: EMOJI.BOSS_DEMON,
        healthMult: 1.2,
        speedMult: 1.0,
        damageMult: 1.1,
        xpMult: 2.0,
        attackPattern: "summon",
        minTime: BOSS_INTERVAL * 3
    }
];

// 武器定义
const BASE_WEAPONS = [
    DaggerWeapon,
    GarlicWeapon,
    WhipWeapon,
    FireDaggerWeapon,
    StormBladeWeapon,
    HandshakeWeapon
];

// 被动物品定义
const BASE_PASSIVES = [
    Spinach,
    Armor,
    Wings,
    EmptyTome,
    Candelabrador,
    Bracer,
    HollowHeart,
    Pummarola,
    Magnet
];