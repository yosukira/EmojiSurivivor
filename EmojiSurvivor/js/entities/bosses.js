/**
 * Boss类型定义
 * 定义游戏中的各种Boss
 */
const BOSS_TYPES = [
    // 近战型Boss
    {
        name: "狂暴巨魔",
        emoji: "👹",
        healthMult: 1.0,
        speedMult: 0.8,
        damageMult: 1.0,
        xpMult: 1.0,
        attackPattern: "melee",
        projectileCount: 0
    },
    
    // 远程型Boss
    {
        name: "恶魔射手",
        emoji: "👿",
        healthMult: 0.8,
        speedMult: 0.6,
        damageMult: 0.9,
        xpMult: 1.0,
        attackPattern: "ranged",
        projectileCount: 8
    },
    
    // 范围型Boss
    {
        name: "地狱领主",
        emoji: "😈",
        healthMult: 1.2,
        speedMult: 0.5,
        damageMult: 1.1,
        xpMult: 1.2,
        attackPattern: "aoe",
        projectileCount: 0
    },
    
    // 召唤型Boss
    {
        name: "亡灵巫师",
        emoji: "🧙",
        healthMult: 0.7,
        speedMult: 0.7,
        damageMult: 0.8,
        xpMult: 1.1,
        attackPattern: "summon",
        projectileCount: 0
    },
    
    // 混合型Boss
    {
        name: "混沌之王",
        emoji: "🤴",
        healthMult: 1.5,
        speedMult: 0.6,
        damageMult: 1.2,
        xpMult: 1.5,
        attackPattern: "ranged",
        projectileCount: 12
    },
    
    // 特殊Boss - 只在高级阶段出现
    {
        name: "死神",
        emoji: "💀",
        healthMult: 2.0,
        speedMult: 0.9,
        damageMult: 1.5,
        xpMult: 2.0,
        attackPattern: "aoe",
        projectileCount: 0,
        minGameTime: 600 // 10分钟后出现
    },
    
    // 特殊Boss - 只在高级阶段出现
    {
        name: "龙王",
        emoji: "🐉",
        healthMult: 2.5,
        speedMult: 0.7,
        damageMult: 1.8,
        xpMult: 2.5,
        attackPattern: "ranged",
        projectileCount: 16,
        minGameTime: 900 // 15分钟后出现
    }
];

/**
 * 获取随机Boss类型
 * @param {number} gameTime - 游戏时间
 * @returns {Object} Boss类型
 */
function getRandomBossType(gameTime) {
    // 过滤可用的Boss类型
    const availableBossTypes = BOSS_TYPES.filter(bossType => {
        // 如果Boss有最小游戏时间要求，检查是否满足
        if (bossType.minGameTime && gameTime < bossType.minGameTime) {
            return false;
        }
        
        return true;
    });
    
    // 如果没有可用的Boss类型，返回默认Boss
    if (availableBossTypes.length === 0) {
        return BOSS_TYPES[0];
    }
    
    // 返回随机Boss类型
    return availableBossTypes[Math.floor(Math.random() * availableBossTypes.length)];
}

/**
 * 生成Boss
 * @param {number} gameTime - 游戏时间
 * @returns {BossEnemy} Boss敌人
 */
function spawnBoss(gameTime) {
    console.log("尝试生成 Boss...");
    
    // 获取随机Boss类型
    const bossType = getRandomBossType(gameTime);
    
    // 计算生成位置
    let spawnX, spawnY;
    const edge = Math.floor(Math.random() * 4);
    const bossPadding = SPAWN_PADDING * 2;
    
    switch (edge) {
        case 0: // 上边缘
            spawnX = player.x + (Math.random() * GAME_WIDTH - GAME_WIDTH / 2);
            spawnY = player.y - GAME_HEIGHT / 2 - bossPadding;
            break;
            
        case 1: // 右边缘
            spawnX = player.x + GAME_WIDTH / 2 + bossPadding;
            spawnY = player.y + (Math.random() * GAME_HEIGHT - GAME_HEIGHT / 2);
            break;
            
        case 2: // 下边缘
            spawnX = player.x + (Math.random() * GAME_WIDTH - GAME_WIDTH / 2);
            spawnY = player.y + GAME_HEIGHT / 2 + bossPadding;
            break;
            
        case 3: // 左边缘
            spawnX = player.x - GAME_WIDTH / 2 - bossPadding;
            spawnY = player.y + (Math.random() * GAME_HEIGHT - GAME_HEIGHT / 2);
            break;
    }
    
    // 创建Boss
    const boss = new BossEnemy(spawnX, spawnY, bossType);
    
    // 显示Boss警告
    showBossWarning(bossType.name);
    
    return boss;
}

/**
 * 显示Boss警告
 * @param {string} bossName - Boss名称
 */
function showBossWarning(bossName) {
    // 获取Boss警告UI
    const bossWarningUI = document.getElementById('bossWarning');
    
    // 设置警告文本
    bossWarningUI.textContent = `👹 ${bossName} 来袭! 👹`;
    
    // 显示警告
    bossWarningUI.style.display = 'block';
    
    // 2.5秒后隐藏警告
    setTimeout(() => {
        bossWarningUI.style.display = 'none';
    }, 2500);
}