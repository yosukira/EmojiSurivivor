/**
 * 游戏配置文件
 * 包含游戏常量和敌人类型
 */

// --- 游戏尺寸 ---
const GAME_WIDTH = Math.min(window.innerWidth * 0.95, 1280);
const GAME_HEIGHT = Math.min(window.innerHeight * 0.95, 720);

// --- 游戏字体大小 ---
const GAME_FONT_SIZE = 24;

// --- 玩家默认属性 ---
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
    regen: 0
};

// --- 敌人基础属性 ---
const ENEMY_BASE_STATS = {
    health: 8,
    speed: 50,
    damage: 6,
    xp: 2
};

// --- Boss间隔 ---
const BOSS_INTERVAL = 180; // 秒

// --- Boss基础属性乘数 ---
const BOSS_BASE_HEALTH_MULTIPLIER = 35;
const BOSS_BASE_DAMAGE_MULTIPLIER = 2.0;

// --- 等级经验需求 ---
const LEVEL_XP_REQUIREMENTS = [6, 15, 28, 45, 65, 90, 120, 155, 195, 240];

// --- 最大等级 ---
const MAX_LEVEL = 99;

// --- 生成边距 ---
const SPAWN_PADDING = 50;

// --- 最大伤害数字数量 ---
const MAX_DAMAGE_NUMBERS = 30;

// --- 表情符号 ---
const EMOJI = {
    PLAYER: "🥷",
    XP_GEM: "✨",
    CHEST: "🎁",
    HEART: "❤️",
    MAGNET: "🧲",
    PROJECTILE_DAGGER: "🔪",
    PROJECTILE_FIRE: "🔥",
    PROJECTILE_LIGHTNING: "⚡",
    PROJECTILE_HANDSHAKE: "🤝"
};

// --- 敌人类型 ---
const ENEMY_TYPES = [
    {
        name: "骷髅",
        emoji: "💀",
        healthMult: 1.0,
        speedMult: 1.0,
        damageMult: 1.0,
        xpMult: 1.0,
        minTime: 0,
        weight: 100
    },
    {
        name: "幽灵",
        emoji: "👻",
        healthMult: 0.7,
        speedMult: 1.4,
        damageMult: 0.8,
        xpMult: 1.2,
        minTime: 30,
        weight: 80
    },
    {
        name: "僵尸",
        emoji: "🧟",
        healthMult: 1.5,
        speedMult: 0.7,
        damageMult: 1.2,
        xpMult: 1.5,
        minTime: 60,
        weight: 70
    },
    {
        name: "蝙蝠",
        emoji: "🦇",
        healthMult: 0.5,
        speedMult: 1.8,
        damageMult: 0.6,
        xpMult: 0.8,
        minTime: 90,
        weight: 60
    },
    {
        name: "狼",
        emoji: "🐺",
        healthMult: 1.2,
        speedMult: 1.3,
        damageMult: 1.3,
        xpMult: 1.8,
        minTime: 150,
        weight: 50
    },
    {
        name: "精灵",
        emoji: "🧞",
        healthMult: 1.8,
        speedMult: 1.1,
        damageMult: 1.5,
        xpMult: 2.0,
        minTime: 240,
        weight: 40
    }
];

// --- Boss类型 ---
const BOSS_TYPES = [
    {
        name: "狂暴巨魔",
        emoji: "👹",
        healthMult: 1.0,
        speedMult: 0.8,
        damageMult: 1.2,
        xpMult: 1.0,
        attackPattern: "melee",
        minTime: 0
    },
    {
        name: "恶魔射手",
        emoji: "👿",
        healthMult: 0.8,
        speedMult: 0.7,
        damageMult: 1.0,
        xpMult: 1.2,
        attackPattern: "ranged",
        projectileCount: 8,
        minTime: 180
    },
    {
        name: "地狱领主",
        emoji: "😈",
        healthMult: 1.2,
        speedMult: 0.6,
        damageMult: 1.5,
        xpMult: 1.5,
        attackPattern: "aoe",
        minTime: 360
    },
    {
        name: "亡灵巫师",
        emoji: "🧙",
        healthMult: 0.7,
        speedMult: 0.9,
        damageMult: 0.8,
        xpMult: 1.3,
        attackPattern: "summon",
        minTime: 540
    },
    {
        name: "混沌之王",
        emoji: "🤴",
        healthMult: 1.5,
        speedMult: 1.0,
        damageMult: 1.3,
        xpMult: 2.0,
        attackPattern: "melee",
        minTime: 720
    },
    {
        name: "死神",
        emoji: "💀",
        healthMult: 2.0,
        speedMult: 1.2,
        damageMult: 1.8,
        xpMult: 2.5,
        attackPattern: "ranged",
        projectileCount: 12,
        minTime: 900
    },
    {
        name: "龙王",
        emoji: "🐉",
        healthMult: 3.0,
        speedMult: 0.9,
        damageMult: 2.0,
        xpMult: 3.0,
        attackPattern: "aoe",
        minTime: 1200
    }
];

/**
 * 生成Boss
 * @param {number} gameTime - 游戏时间
 * @returns {BossEnemy} Boss敌人
 */
function spawnBoss(gameTime) {
    // 获取可用Boss类型
    const availableBosses = BOSS_TYPES.filter(boss => gameTime >= boss.minTime);

    // 如果没有可用Boss，使用第一个Boss
    const bossType = availableBosses.length > 0 ? availableBosses[availableBosses.length - 1] : BOSS_TYPES[0];

    // 计算生成位置
    const angle = Math.random() * Math.PI * 2;
    const distance = 300;
    const x = player.x + Math.cos(angle) * distance;
    const y = player.y + Math.sin(angle) * distance;

    // 创建Boss
    const boss = new BossEnemy(x, y, bossType);

    // 显示Boss警告
    showBossWarning(bossType.name);

    return boss;
}

/**
 * 显示Boss警告
 * @param {string} bossName - Boss名称
 */
function showBossWarning(bossName) {
    // 获取警告元素
    const warningElement = document.getElementById('bossWarning');

    // 设置警告文本
    warningElement.textContent = `👹 BOSS ${bossName} 来袭! 👹`;

    // 显示警告
    warningElement.style.display = 'block';

    // 添加动画类
    warningElement.classList.add('animate');

    // 3秒后隐藏警告
    setTimeout(() => {
        warningElement.style.display = 'none';
        warningElement.classList.remove('animate');
    }, 3000);
}
