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
    ENEMY_RANGED: '🧙',
    ENEMY_ELITE: '👹',
    ENEMY_BOMBER: '💣',
    
    // Boss
    BOSS: '👹',
    BOSS_SKELETON: '☠️',
    BOSS_GHOST: '👻',
    BOSS_ZOMBIE: '🧟',
    BOSS_DEMON: '👿',
    BOSS_DRAGON: '🐉',
    BOSS_ALIEN: '👾',
    
    // 投射物
    PROJECTILE_DAGGER: '🔪',
    PROJECTILE_GARLIC: '💨',
    PROJECTILE_WHIP_L: '➬',
    PROJECTILE_WHIP_R: '➪',
    PROJECTILE_FIRE: '🔥',
    PROJECTILE_LIGHTNING: '⚡',
    PROJECTILE_GHOST: '👻',
    PROJECTILE_GHOST_ALT: '🔹',
    PROJECTILE_GHOST_SPECIAL: '💠',
    PROJECTILE_HANDSHAKE: '🤝',
    SWORD: '🗡️',
    
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
    WEAPON_DEATH_GRIP: '👊',
    WEAPON_THUNDER_SWORD: '🗡️',
    
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
    },
    {
        emoji: EMOJI.ENEMY_RANGED,
        healthMult: 0.8,
        speedMult: 0.7,
        damageMult: 1.0,
        xpMult: 1.3,
        weight: 4,
        minTime: 120,
        isRanged: true,
        attackRange: 200,
        attackCooldownTime: 2.0,
        projectileSpeed: 150
    },
    {
        emoji: EMOJI.ENEMY_ELITE,
        healthMult: 3.0,
        speedMult: 0.8,
        damageMult: 1.5,
        xpMult: 2.0,
        weight: 2,
        minTime: 300
    },
    {
        emoji: EMOJI.ENEMY_BOMBER,
        healthMult: 1.2,
        speedMult: 1.2,
        damageMult: 2.0,
        xpMult: 1.8,
        weight: 2,
        minTime: 240,
        explodeOnDeath: true,
        explodeRadius: 120,
        explodeDamage: 15
    }
];

// Boss类型定义
const BOSS_TYPES = [
    {
        name: "骷髅王",
        emoji: EMOJI.BOSS_SKELETON,
        healthMult: 2.5,
        speedMult: 0.8,
        damageMult: 1.0,
        xpMult: 1.0,
        attackPattern: "melee",
        minTime: 0,
        earthquakeRadius: 280,
        earthquakeDamageMultiplier: 1.8,
        earthquakeDuration: 2.0,
        specialAbilityCooldown: 4.5,
        specialAttackWarningDuration: 1.0,
        displaySizeMultiplier: 4.0
    },
    {
        name: "幽灵领主",
        emoji: EMOJI.BOSS_GHOST,
        healthMult: 2.0,
        speedMult: 1.2,
        damageMult: 0.9,
        xpMult: 1.2,
        attackPattern: "ranged",
        attackCooldown: 1.8,
        minTime: BOSS_INTERVAL,
        specialAbilityCooldown: 6.0,
        specialAttackWarningDuration: 1.5,
        displaySizeMultiplier: 4.0,
        projectileInfo: {
            emoji: EMOJI.PROJECTILE_GHOST_ALT,
            emojiSpecial: EMOJI.PROJECTILE_GHOST_SPECIAL,
            speed: 220,
            damageFactor: 0.8,
            countNormal: 8,
            countSpecialSingleWave: 12,
            specialAttackWaves: 4,
            projectilesPerWaveSpecial: 8,
            specialAttackWaveDelay: 0.3,
            sizeFactorNormal: 0.25,
            sizeFactorSpecial: 0.3
        }
    },
    {
        name: "巨型僵尸",
        emoji: EMOJI.BOSS_ZOMBIE,
        healthMult: 5.0,
        speedMult: 0.6,
        damageMult: 1.8,
        xpMult: 5.0,
        attackPattern: "aoe",
        minTime: BOSS_INTERVAL * 2,
        displaySizeMultiplier: 4.5
    },
    {
        name: "恶魔领主",
        emoji: EMOJI.BOSS_DEMON,
        healthMult: 3.0,
        speedMult: 1.0,
        damageMult: 1.1,
        xpMult: 2.0,
        attackPattern: "summon",
        minTime: BOSS_INTERVAL * 3,
        displaySizeMultiplier: 4.0
    },
    {
        name: "远古巨龙",
        emoji: EMOJI.BOSS_DRAGON,
        healthMult: 4.0,
        speedMult: 0.7,
        damageMult: 1.5,
        xpMult: 2.5,
        attackPattern: "laser",
        minTime: BOSS_INTERVAL * 4,
        projectileSpeed: 200,
        laserWidth: 40,
        laserDamage: 20,
        displaySizeMultiplier: 4.2
    }
];