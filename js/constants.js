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
        minTime: 0, // 开始就可以刷新
        maxTime: 300 // 5分钟后停止刷新
    },
    {
        name: "蝙蝠",
        emoji: "🦇",
        healthMult: 0.35, // 降低血量
        speedMult: 1.6,
        damageMult: 0.6,
        xpMult: 1.2,
        weight: 8,
        minTime: 30, // 30秒后开始刷新
        maxTime: 720 // 12分钟后停止刷新
    },
    {
        name: "骷髅",
        emoji: "☠️",
        healthMult: 0.65, // 降低血量
        speedMult: 1.1,
        damageMult: 0.9,
        xpMult: 1.3,
        weight: 7,
        minTime: 120, // 2分钟后开始刷新
        maxTime: 420 // 7分钟后停止刷新
    },
    {
        name: "幽灵",
        emoji: "👻",
        healthMult: 0.4, // 降低血量
        speedMult: 1.3,
        damageMult: 0.8,
        xpMult: 1.3,
        weight: 7,
        minTime: 180, // 3分钟后开始刷新
        maxTime: 540 // 9分钟后停止刷新
    },
    {
        name: "僵尸",
        emoji: "🧟",
        healthMult: 1.5, // 从 2.0 降低到 1.5
        speedMult: 0.7, // 较慢的移动速度
        damageMult: 1.1, // 略高的伤害
        xpMult: 2.5, // 较高经验值
        weight: 10, // 常见敌人
        minTime: 300, // 5分钟后开始刷新
        maxTime: 1200 // 20分钟后停止刷新
    },
    {
        name: "蜘蛛",
        emoji: "🕷️",
        healthMult: 0.6, // 降低血量
        speedMult: 1.35,
        damageMult: 0.8,
        xpMult: 1.3,
        weight: 5,
        minTime: 420, // 7分钟后开始刷新
        maxTime: 1500, // 25分钟后停止刷新
        isRanged: true, // 可以发射蛛网
        attackRange: 180,
        attackCooldownTime: 2.5,
        projectileSpeed: 140
    },
    {
        name: "魔法师",
        emoji: "🧙",
        healthMult: 1.0,
        speedMult: 0.8,
        damageMult: 1.0,
        xpMult: 1.5,
        weight: 5,
        minTime: 900, // 15分钟后开始刷新
        maxTime: 1320, // 22分钟后停止刷新
        isRanged: true, // 远程攻击
        attackRange: 300,
        attackCooldownTime: 2.0,
        projectileSpeed: 120
    },
    {
        name: "火焰精灵",
        emoji: "🔥",
        svgPath: "assets/enemy/firewisp.png",
        healthMult: 0.6,
        speedMult: 1.2,
        damageMult: 0.7,
        xpMult: 1.4,
        weight: 4,
        minTime: 540, // 9分钟后开始刷新
        attackInterval: 0.2, // 大幅缩短攻击间隔，让特殊效果可以持续触发
        appliesBurn: true, // 燃烧效果
        burnDamage: 2, // 改成2点伤害
        burnDuration: 4 // 增加燃烧持续时间
    },
    {
        name: "冰霜精灵",
        emoji: "❄️",
        svgPath: "assets/enemy/frostwisp.png",
        healthMult: 0.6,
        speedMult: 1.2,
        damageMult: 0.7,
        xpMult: 1.4,
        weight: 4,
        minTime: 540, // 9分钟后开始刷新
        attackInterval: 0.2, // 大幅缩短攻击间隔，让特殊效果可以持续触发
        appliesSlow: true, // 减速效果
        slowFactor: 0.4, // 更强的减速，减速到40%
        slowDuration: 3 // 增加减速持续时间
    },
    {
        name: "雷电精灵",
        emoji: "⚡",
        svgPath: "assets/enemy/lightningwisp.png",
        healthMult: 0.6,
        speedMult: 1.2,
        damageMult: 0.7,
        xpMult: 1.4,
        weight: 4,
        minTime: 540, // 9分钟后开始刷新
        attackInterval: 0.2, // 大幅缩短攻击间隔，让特殊效果可以持续触发
        appliesStun: true, // 眩晕效果
        stunChance: 0.9, // 90%眩晕几率
        stunDuration: 1.5 // 1.5秒眩晕时间
    },
    {
        name: "炸弹",
        emoji: "💣",
        healthMult: 0.6, // 较低血量，容易被打爆
        speedMult: 1.3, // 移动速度较快
        damageMult: 0.5, // 直接伤害低
        xpMult: 1.5, // 较高经验值
        weight: 4,
        minTime: 900, // 15分钟后开始刷新
        // 死亡时爆炸
        explodeOnDeath: true,
        explodeRadius: 150, // 爆炸范围
        explodeDamage: 15 // 修改爆炸伤害为15
    },
    {
        name: "精英史莱姆",
        emoji: "🟣",
        svgPath: "assets/svg/elite_slime.svg",
        healthMult: 1.2,
        speedMult: 0.9,
        damageMult: 1.0,
        xpMult: 1.8,
        weight: 4,
        minTime: 780, // 13分钟后开始刷新
        // 死亡时分裂
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
        minTime: 1020, // 17分钟后开始刷新
        isRanged: true,
        attackRange: 200,
        attackCooldownTime: 1.8,
        projectileSpeed: 170
    },
    {
        name: "精英僵尸",
        emoji: "🧟‍♂️",
        healthMult: 2.8, // 从 3.5 降低到 2.8
        speedMult: 0.6,
        damageMult: 1.7,
        xpMult: 3.0,
        weight: 2,
        minTime: 1200, // 20分钟后开始刷新
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
        minTime: 1200, // 20分钟后开始刷新
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
        minTime: 720, // 12分钟后开始刷新
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
        minTime: 1320, // 22分钟后开始刷新
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
        minTime: 1500, // 25分钟后开始刷新
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
        minTime: 1500, // 25分钟后开始刷新
        // 周期性光束攻击可在update中处理
        canShootBeam: true,
        beamCooldown: 5,
        beamDamage: 15,
        beamWidth: 30,
        beamDuration: 1.5
    }
];

// Boss类型定义
const BOSS_TYPES = [
    {
        name: "骷髅王",
        emoji: EMOJI.BOSS_SKELETON,
        healthBase: 500, // 修改为500
        healthMult: 1.6, // 降低血量
        speedMult: 0.8,
        damageMult: 1.0,
        xpMult: 1.0,
        attackPattern: "melee",
        minTime: 180, // 第一个Boss在3分钟出现
        earthquakeRadius: 280,
        earthquakeDamageMultiplier: 0.9,
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

function createExplosion(radius, damage) {
    // 直接使用传入的damage参数，不应用任何修正
    const explosionDamage = damage; // 直接使用传入的damage(15)
    
    // 查找范围内的玩家
    if (player && !player.isGarbage) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        if (distSq <= radius * radius) {
            // 直接应用完整伤害值，不应用距离衰减
            player.takeDamage(explosionDamage, this);
            
            // 可选：添加击退效果
            const knockbackStrength = 200;
            const angle = Math.atan2(dy, dx);
            player.applyKnockback(
                Math.cos(angle) * knockbackStrength,
                Math.sin(angle) * knockbackStrength
            );
        }
    }
    
    // 爆炸视觉效果
    createExplosionEffect(this.x, this.y, radius, 'rgba(255, 100, 50, 0.7)');
}