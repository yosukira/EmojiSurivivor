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
        name: "史莱姆",
        emoji: "🟢",
        svgPath: "assets/svg/slime.svg",
        healthMult: 0.5, // 降低血量
        speedMult: 1,
        damageMult: 0.8,
        xpMult: 1,
        weight: 10,
        minTime: 0 // 开始就可以刷新
    },
    {
        name: "蝙蝠",
        emoji: "🦇",
        healthMult: 0.35, // 降低血量
        speedMult: 1.6,
        damageMult: 0.6,
        xpMult: 1.2,
        weight: 8,
        minTime: 0 // 开始就可以刷新
    },
    {
        name: "骷髅",
        emoji: "☠️",
        healthMult: 0.65, // 降低血量
        speedMult: 1.1,
        damageMult: 0.9,
        xpMult: 1.3,
        weight: 7,
        minTime: 180 // 第一个Boss之后出现
    },
    {
        name: "幽灵",
        emoji: "👻",
        healthMult: 0.4, // 降低血量
        speedMult: 1.3,
        damageMult: 0.8,
        xpMult: 1.3,
        weight: 7,
        minTime: 180, // 第一个Boss之后出现
        // 可以穿墙特性可以在碰撞检测或移动逻辑中处理
    },
    {
        name: "僵尸",
        emoji: "🧟",
        healthMult: 2.0, // 较高的生命值
        speedMult: 0.7, // 较慢的移动速度
        damageMult: 1.1, // 略高的伤害
        xpMult: 2.5, // 较高经验值
        weight: 10, // 常见敌人
        minTime: 180 // 3分钟后出现(第一个Boss后)
    },
    {
        name: "蜘蛛",
        emoji: "🕷️",
        healthMult: 0.6, // 降低血量
        speedMult: 1.35,
        damageMult: 0.8,
        xpMult: 1.3,
        weight: 5,
        minTime: 240, // 4分钟后出现
        isRanged: true, // 可以发射蛛网
        attackRange: 180,
        attackCooldownTime: 2.5,
        projectileSpeed: 140
    },
    {
        name: "魔法师",
        emoji: "🧙",
        healthMult: 0.8, // 降低血量
        speedMult: 0.9,
        damageMult: 1.3,
        xpMult: 1.5,
        weight: 5,
        minTime: 300, // 5分钟后出现
        isRanged: true,
        attackRange: 220,
        attackCooldownTime: 2.0,
        projectileSpeed: 160
    },
    {
        name: "火焰精灵",
        emoji: "🔥",
        healthMult: 0.5, // 降低血量
        speedMult: 1.2,
        damageMult: 1.0,
        xpMult: 1.4,
        weight: 4,
        minTime: 300, // 5分钟后出现
        // 接触时造成燃烧效果可在Enemy.attack方法中实现
        appliesBurn: true,
        burnDamage: 2,
        burnDuration: 3
    },
    {
        name: "冰霜精灵",
        emoji: "❄️",
        healthMult: 0.5, // 降低血量
        speedMult: 1.2,
        damageMult: 0.9,
        xpMult: 1.4,
        weight: 4,
        minTime: 300, // 5分钟后出现
        // 接触时造成减速效果可在Enemy.attack方法中实现
        appliesSlow: true,
        slowFactor: 0.6,
        slowDuration: 2
    },
    {
        name: "雷电精灵",
        emoji: "⚡",
        healthMult: 0.5, // 降低血量
        speedMult: 1.3,
        damageMult: 1.2,
        xpMult: 1.5,
        weight: 4,
        minTime: 300, // 5分钟后出现
        // 接触时有几率眩晕玩家可在Enemy.attack方法中实现
        appliesStun: true,
        stunChance: 0.3,
        stunDuration: 1
    },
    {
        name: "精英史莱姆",
        emoji: "🟣",
        svgPath: "assets/svg/elite_slime.svg",
        healthMult: 1.7, // 降低血量但保持较高
        speedMult: 0.8,
        damageMult: 1.2,
        xpMult: 2.0,
        weight: 3,
        minTime: 360, // 6分钟后出现
        // 死亡时分裂可在onDeath中处理
        splitOnDeath: true,
        splitCount: 2,
        splitType: "史莱姆"
    },
    {
        name: "精英骷髅",
        emoji: "💀",
        healthMult: 2.0, // 降低血量但保持较高
        speedMult: 1.0,
        damageMult: 1.5,
        xpMult: 2.5,
        weight: 3,
        minTime: 420, // 7分钟后出现
        isRanged: true,
        attackRange: 200,
        attackCooldownTime: 1.8,
        projectileSpeed: 170
    },
    {
        name: "精英僵尸",
        emoji: "🧟‍♂️",
        healthMult: 3.5, // 降低血量但保持较高
        speedMult: 0.6,
        damageMult: 1.7,
        xpMult: 3.0,
        weight: 2,
        minTime: 480, // 8分钟后出现
        // 毒气光环可以在update中处理
        hasPoisonAura: true,
        poisonAuraRadius: 100,
        poisonDamage: 2,
        slowFactor: 0.7
    },
    {
        name: "恶魔",
        emoji: "😈",
        healthMult: 1.5, // 降低血量
        speedMult: 1.1,
        damageMult: 1.2,
        xpMult: 2.0,
        weight: 3,
        minTime: 480, // 8分钟后出现
        isRanged: true,
        attackRange: 190,
        attackCooldownTime: 1.5,
        projectileSpeed: 180
    },
    {
        name: "地狱犬",
        emoji: "🐕",
        healthMult: 1.0,
        speedMult: 1.7,
        damageMult: 1.0,
        xpMult: 1.8,
        weight: 3,
        minTime: 480,
        canDash: true,
        dashCooldown: 3,
        dashSpeed: 3.75,
        dashDuration: 1.2
    },
    {
        name: "骷髅弓手",
        emoji: "🏹",
        healthMult: 0.7, // 降低血量
        speedMult: 1.1,
        damageMult: 1.0,
        xpMult: 1.5,
        weight: 4,
        minTime: 540, // 9分钟后出现
        isRanged: true,
        attackRange: 250,
        attackCooldownTime: 2.2,
        projectileSpeed: 190
    },
    {
        name: "巫师",
        emoji: "🧙‍♀️",
        healthMult: 1.2, // 降低血量
        speedMult: 0.8,
        damageMult: 1.5,
        xpMult: 2.0,
        weight: 3,
        minTime: 540, // 9分钟后出现
        isRanged: true,
        attackRange: 230,
        attackCooldownTime: 2.5,
        projectileSpeed: 150,
        // 减速法术可以在projectile命中时处理
        appliesSlowOnHit: true,
        slowFactor: 0.5,
        slowDuration: 3
    },
    {
        name: "堕落天使",
        emoji: "👼",
        healthMult: 2.4, // 降低血量但保持较高
        speedMult: 1.0,
        damageMult: 1.8,
        xpMult: 2.5,
        weight: 2,
        minTime: 600, // 10分钟后出现
        // 周期性光束攻击可在update中处理
        canShootBeam: true,
        beamCooldown: 5,
        beamDamage: 15,
        beamWidth: 30,
        beamDuration: 1.5
    },
    {
        name: "炸弹",
        emoji: "💣",
        healthMult: 0.6, // 较低血量，容易被打爆
        speedMult: 1.3, // 移动速度较快
        damageMult: 0.5, // 直接伤害低
        xpMult: 1.5, // 较高经验值
        weight: 4,
        minTime: 360, // 6分钟后出现
        // 死亡时爆炸
        explodeOnDeath: true,
        explodeRadius: 150, // 爆炸范围
        explodeDamage: 20 // 爆炸伤害
    }
];

// Boss类型定义
const BOSS_TYPES = [
    {
        name: "骷髅王",
        emoji: EMOJI.BOSS_SKELETON,
        healthMult: 1.6, // 降低血量
        speedMult: 0.8,
        damageMult: 1.0,
        xpMult: 1.0,
        attackPattern: "melee",
        minTime: 180, // 第一个Boss在3分钟出现
        earthquakeRadius: 280,
        earthquakeDamageMultiplier: 1.8,
        earthquakeDuration: 2.0,
        specialAbilityCooldown: 4.5,
        specialAttackWarningDuration: 1.0,
        displaySizeMultiplier: 3.0
    },
    {
        name: "幽灵领主",
        emoji: EMOJI.BOSS_GHOST,
        healthMult: 1.3, // 降低血量
        speedMult: 1.2,
        damageMult: 0.9,
        xpMult: 1.2,
        attackPattern: "ranged",
        attackCooldown: 1.8,
        minTime: 420, // 7分钟出现(第二个Boss)
        specialAbilityCooldown: 6.0,
        specialAttackWarningDuration: 1.5,
        displaySizeMultiplier: 2.8,
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
            sizeFactorNormal: 0.35,
            sizeFactorSpecial: 0.4
        }
    },
    {
        name: "巨型僵尸",
        emoji: EMOJI.BOSS_ZOMBIE,
        healthMult: 3.2, // 降低血量
        speedMult: 0.6,
        damageMult: 1.8,
        xpMult: 5.0,
        attackPattern: "aoe",
        minTime: 660, // 11分钟出现(第三个Boss)
        displaySizeMultiplier: 3.4,
        poisonAuraRadiusMultiplier: 2.6,
        toxicPoolRadiusMultiplier: 1.3
    },
    {
        name: "恶魔领主",
        emoji: EMOJI.BOSS_DEMON,
        healthMult: 2.0, // 降低血量
        speedMult: 1.0,
        damageMult: 1.1,
        xpMult: 2.0,
        attackPattern: "summon",
        minTime: 900, // 15分钟出现(第四个Boss)
        displaySizeMultiplier: 3.4
    },
    {
        name: "远古巨龙",
        emoji: EMOJI.BOSS_DRAGON,
        healthMult: 2.5, // 降低血量
        speedMult: 0.7,
        damageMult: 1.5,
        xpMult: 2.5,
        attackPattern: "laser",
        minTime: 1140, // 19分钟出现(第五个Boss)
        projectileSpeed: 200,
        laserWidth: 40,
        laserDamage: 20,
        displaySizeMultiplier: 3.6
    }
];

// 武器进化组合
const WEAPON_EVOLUTIONS = {
    // 现有组合
    "短刀 + 菠菜": "瘟疫刃",
    "刀波 + 护腕": "光刃",
    "岚刀 + 空心胸甲": "闪灵之刃",
    "握握手 + 龙息香料": "狂怒之手",
    "大蒜 + 寒冰之心": "霜冻环绕",
    "鞭子 + 雷光护符": "雷霆鞭",
    
    // 新武器组合
    "泡泡魔棒 + 古树精华": "生命之泉",
    "混沌骰子 + 神秘卡片": "命运之轮",
    "磁力枪 + 磁力球": "引力崩溃",
    "声波号角 + 结界符文": "守护之音",
    "毒瓶 + 毒素宝珠": "瘟疫风暴",
    "冰晶杖 + 寒冰之心": "永冬之触",
    "藤蔓种子 + 古树精华": "世界树之根",
    "光棱塔 + 护腕": "棱镜核心",
    "火山杖 + 龙息香料": "诸神黄昏",
    "黑洞球 + 磁力球": "事件视界"
};

// 进化武器额外属性
const EVOLVED_WEAPON_BONUSES = {
    // 现有进化武器
    "瘟疫刃": { piercing: 3, burnChance: 0.3, poisonChance: 0.5 },
    "光刃": { areaMultiplier: 1.5, projectileSpeedMultiplier: 1.3 },
    "闪灵之刃": { count: 5, cooldownMultiplier: 0.7 },
    "狂怒之手": { stunChance: 0.2, burnDamage: 8, burnDuration: 3 },
    "霜冻环绕": { knockbackMultiplier: 2, freezeChance: 0.3 },
    "雷霆鞭": { chainChance: 0.4, lightningDamage: 12 },
    
    // 新进化武器
    "生命之泉": { healAmount: 1, regenDuration: 5, bubbleLifetime: 8 },
    "命运之轮": { extraEffectChance: 0.5, effectDuration: 2, extraDamage: 10 },
    "引力崩溃": { attractRadius: 200, attractStrength: 3, explosionDamage: 20 },
    "守护之音": { shieldDuration: 3, knockback: 50, damageReduction: 0.3 },
    "瘟疫风暴": { spreadRadius: 100, poisonDamage: 8, poisonDuration: 4 },
    "永冬之触": { freezeDuration: 3, slowStrength: 0.7, areaDamage: 15 },
    "世界树之根": { vineCount: 8, vineDuration: 10, healingRate: 0.5 },
    "棱镜核心": { beamCount: 8, beamDamage: 20, rotationSpeed: 1.5 },
    "诸神黄昏": { eruptionCount: 5, burnDamage: 15, explosionRadius: 150 },
    "事件视界": { blackHoleDuration: 8, blackHoleRadius: 180, collapseDamage: 50 }
};