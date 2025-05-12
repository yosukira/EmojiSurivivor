/**
 * 游戏配置
 * 定义游戏中的常量
 */

// 游戏尺寸
let GAME_WIDTH = 1600;  // 增加游戏宽度
let GAME_HEIGHT = 900;  // 增加游戏高度

// 游戏字体大小
const GAME_FONT_SIZE = 24;

// 最大等级
const MAX_LEVEL = 100;

// 等级经验需求 (调整前几级经验需求，使其更快升级)
const LEVEL_XP_REQUIREMENTS = [
    5, 10, 18, 28, 40, // 加速前5级
    55, 70, 85, 105, 125, // 后续等级经验平缓增加
    150, 180, 210, 240, 270, 
    300, 350, 400, 450, 500,
    550, 600, 650, 700, 750, 
    800, 900, 1000, 1100, 1200 // 保持后续等级经验不变
];

// Boss生成间隔（秒）
const BOSS_INTERVAL = 100; // 100秒，调整Boss出现频率

// Boss基础生命值乘数
const BOSS_BASE_HEALTH_MULTIPLIER = 8; // 降低Boss生命值

// Boss基础伤害乘数
const BOSS_BASE_DAMAGE_MULTIPLIER = 1.5; // 降低Boss伤害

// 玩家默认属性
const PLAYER_DEFAULT_STATS = {
    health: 120,  // 增加初始生命值
    speed: 170,   // 增加初始速度
    armor: 0,
    regen: 0.2,   // 添加初始生命恢复
    pickupRadius: 70,  // 增加拾取范围
    damageMultiplier: 1.0,
    areaMultiplier: 1.0,
    durationMultiplier: 1.0,
    projectileSpeedMultiplier: 1.0,
    cooldownMultiplier: 1.0,
    projectileCountBonus: 0,
    maxWeapons: 6,
    maxPassives: 6
};

// 敌人基础属性
const ENEMY_BASE_STATS = {
    health: 15,  // 降低敌人生命值
    speed: 70,   // 降低敌人速度
    damage: 8,   // 降低敌人伤害
    xp: 2        // 增加经验掉落
};

// 敌人生成边界距离 - 确保敌人从屏幕外生成
const SPAWN_PADDING = 250;  // 增加生成距离，确保敌人从屏幕外生成

// 敌人攻击屏幕范围限制
const ENEMY_ATTACK_RANGE = GAME_WIDTH * 1.2; // 敌人只能攻击屏幕内和屏幕边缘附近的玩家

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
    const distance = SPAWN_PADDING + 100; // 额外增加距离，确保在屏幕外
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
