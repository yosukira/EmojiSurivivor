/**
 * 游戏配置
 * 定义游戏中的常量
 */

// 游戏尺寸
let GAME_WIDTH = 1920 // 增加游戏宽度
let GAME_HEIGHT = 1080// 增加游戏高度

// 游戏字体大小
const GAME_FONT_SIZE = 24;

// 最大等级
const MAX_LEVEL = 100;

// 等级经验需求 (调整升级曲线，前期更快)
const LEVEL_XP_REQUIREMENTS = [
    3, 5, 8, 12, 16, // Lv 2-6 更快 (原: 5, 10, 15, 22, 30)
    20, 25, 33, 40, 50, // Lv 7-11 (原: 40, 50, 65, 80, 100)
    60, 70, 83, 95, 110, // Lv 12-16 (原: 120, 140, 165, 190, 220)
    125, 140, 160, 180, 200, // Lv 17-21 (原: 250, 280, 320, 360, 400)
    // 后续等级保持不变，或按需调整
    450, 500, 550, 600, 650, // Lv 22-26
    700, 780, 860, 950, 1050, // Lv 27-31 (开始增加幅度)
    1150, 1250, 1350, 1450, 1550, // Lv 32-36
    1650, 1750, 1850, 1950, 2050, // Lv 37-41
    2150, 2250, 2350, 2450, 2550, // Lv 42-46
    2650, 2750, 2850, 2950, 3050, // Lv 47-51
    3150, 3250, 3350, 3450, 3550, // Lv 52-56
    3650, 3750, 3850, 3950, 4050, // Lv 57-61
    4150, 4250, 4350, 4450, 4550, // Lv 62-66
    4650, 4750, 4850, 4950, 5050, // Lv 67-71
    5150, 5250, 5350, 5450, 5550, // Lv 72-76
    5650, 5750, 5850, 5950, 6050, // Lv 77-81
    6150, 6250, 6350, 6450, 6550, // Lv 82-86
    6650, 6750, 6850, 6950, 7050, // Lv 87-91
    7150, 7250, 7350, 7450, 7550, // Lv 92-96
    7650, 7750, 7850, 7950 // Lv 97-100
];

// Boss生成间隔（秒）
// const BOSS_INTERVAL = 60 // 100秒，调整Boss出现频率 (将使用下面的新值)

// Boss基础生命值乘数
// const BOSS_BASE_HEALTH_MULTIPLIER = 8; // 降低Boss生命值 (将使用下面的新值)

// Boss基础伤害乘数
// const BOSS_BASE_DAMAGE_MULTIPLIER = 1.5; // 降低Boss伤害 (将使用下面的新值)

// 玩家默认属性
const PLAYER_DEFAULT_STATS = {
    health: 100,  // 增加初始生命值
    speed: 170,   // 增加初始速度
    armor: 0,
    regen: 0,   // 添加初始生命恢复
    pickupRadius: 70,  // 增加拾取范围
    damageMultiplier: 1.0,
    areaMultiplier: 1.0,
    durationMultiplier: 1.0,
    projectileSpeedMultiplier: 1.0,
    cooldownMultiplier: 1.0,
    projectileCountBonus: 0,
    maxWeapons: 20,
    maxPassives: 20
};

// 基础敌人属性
const ENEMY_BASE_STATS = {
    health: 30,
    speed: 70,      // 基础移动速度
    damage: 8,     // 基础伤害
    xp: 2          // 基础经验值 (原为 5)
};

// Boss 基础属性乘数 (基于 ENEMY_BASE_STATS)
const BOSS_BASE_HEALTH_MULTIPLIER = 10; 
const BOSS_BASE_DAMAGE_MULTIPLIER = 2.5; 

// 其他游戏设定
const MAX_ENEMIES_ON_SCREEN = 500; // 屏幕上允许的最大敌人数量
const BOSS_INTERVAL = 120; // Boss出现间隔时间（秒）
// SPAWN_PADDING 和 ENEMY_ATTACK_RANGE 已在下面定义，将检查并使用新值如果不同

// 敌人生成边界距离 - 确保敌人从屏幕外生成
const SPAWN_PADDING = 100;  // (原为 250)

// 敌人攻击屏幕范围限制
const ENEMY_ATTACK_RANGE = 800; // (原为 GAME_WIDTH * 1.2)

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

    // 计算生成位置 - 确保从屏幕外生成
    const angle = Math.random() * Math.PI * 2;
    const distance = SPAWN_PADDING + 300; // 额外增加距离，确保在屏幕外
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
