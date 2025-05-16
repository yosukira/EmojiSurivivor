/**
 * 游戏主脚本
 * 包含游戏初始化、更新和绘制逻辑
 */

// Conditional Debug Panel Loader
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const DEBUG_MODE = urlParams.get('debug') === 'true';

    if (DEBUG_MODE) {
        console.log("Debug mode activated. Loading debug panel...");
        const script = document.createElement('script');
        script.src = 'js/debug.js';
        script.onload = () => {
            if (window.DebugPanel && typeof window.DebugPanel.init === 'function') {
                window.DebugPanel.init();
            } else {
                console.error("Failed to initialize Debug Panel. DebugPanel.init not found.");
            }
        };
        script.onerror = () => {
            console.error("Failed to load js/debug.js. Ensure the file exists and path is correct.");
        };
        // Append to head or body. Body is generally safer for DOM manipulation scripts.
        document.body.appendChild(script);
    }
})();

let canvas, ctx;

// 添加离屏画布
let offscreenCanvas, offscreenCtx;

// 游戏状态
let isGameRunning = false;
let isGameOver = false;
let isPaused = false;
let isLevelUp = false; // 这里必须是let，不能是const
let gameTime = 0;
let lastTime = 0;
let deltaTime = 0;
let killCount = 0;
let animationFrameId = null;
let playerImage = null; // 用于存储玩家图片

// 屏幕震动相关变量
let screenShakeIntensity = 0;
let screenShakeDuration = 0;
let screenShakeTimer = 0;

// 游戏对象
let player;
let enemies = [];
let projectiles = [];
let enemyProjectiles = []; // 敌人投射物
let xpGems = [];
let worldObjects = [];
let visualEffects = [];
let damageNumbers = [];
let activeGhosts = []; // 新增：用于存储活动的幽灵

// 对象池
let inactiveProjectiles = [];
let inactiveDamageNumbers = []

// 按键状态
let keys = {};

// 敌人管理器
const enemyManager = {
    spawnTimer: 0,
    currentSpawnInterval: 3.5, // 初始生成间隔，增加为3.5秒
    BASE_SPAWN_INTERVAL: 2.0,
    difficultyTimer: 0,
    maxEnemyCap: MAX_ENEMIES_ON_SCREEN, // 使用常量

    update(dt, gameTime, player) {
        // 更新生成计时器
        this.spawnTimer += dt;

        // 更新难度计时器
        this.difficultyTimer += dt;

        // 每20秒增加难度 (原30秒)
        if (this.difficultyTimer >= 20) {
            // 随着时间推移逐渐减少生成间隔，但不低于0.5秒 (原0.8, 原削减率0.92)
            this.currentSpawnInterval = Math.max(0.5, this.currentSpawnInterval * 0.90);
            this.difficultyTimer = 0;
        }

        // 如果计时器超过生成间隔，并且当前敌人数量未达上限，则生成敌人
        if (this.spawnTimer >= this.currentSpawnInterval && enemies.length < this.maxEnemyCap) {
            // 生成敌人
            this.spawnEnemies(gameTime, player);

            // 重置计时器
            this.spawnTimer = 0;
        }
    },

    spawnEnemies(gameTime, player) {
        // 获取相机视图的中心和半宽/半高
        const viewCenterX = cameraManager.x;
        const viewCenterY = cameraManager.y;
        const halfWidth = GAME_WIDTH / 2;
        const halfHeight = GAME_HEIGHT / 2;
        
        // 根据游戏时间获取可用敌人类型
        const availableEnemies = ENEMY_TYPES.filter(enemy => !enemy.minTime || gameTime >= enemy.minTime);
        
        // 计算总权重
        const totalWeight = availableEnemies.reduce((sum, enemy) => sum + enemy.weight, 0);
        if (totalWeight === 0) return; // 防止没有可用敌人时出错
        
        // 根据游戏时间计算生成数量
        const initialSpawnCount = 3;  // 初始
        const midGameTime = 180;      // 3分钟进入中期
        const midGameSpawnCount = 8;  // 中期单次生成数量
        const lateGameTime = 480;     // 8分钟进入后期
        const lateGameSpawnCount = 15; // 后期单次生成数量
        const maxTotalEnemies = MAX_ENEMIES_ON_SCREEN; // 使用常量，例如 60

        let spawnCountThisWave;
        if (gameTime < midGameTime) { // 0-3 分钟
            const progress = gameTime / midGameTime;
            spawnCountThisWave = Math.floor(initialSpawnCount + progress * (midGameSpawnCount - initialSpawnCount));
        } else if (gameTime < lateGameTime) { // 3-8 分钟
            const progress = (gameTime - midGameTime) / (lateGameTime - midGameTime);
            spawnCountThisWave = Math.floor(midGameSpawnCount + progress * (lateGameSpawnCount - midGameSpawnCount));
        } else { // 8分钟以后
            spawnCountThisWave = lateGameSpawnCount;
        }
        // 确保不会因为一次生成过多而超过总数上限（虽然 update 中已检查，这里再保险一下）
        spawnCountThisWave = Math.min(spawnCountThisWave, maxTotalEnemies - enemies.length);
        if (spawnCountThisWave <= 0) return; // 如果已满或计算为0，则不生成
        
        // 生成敌人
        for (let i = 0; i < spawnCountThisWave; i++) {
            // 随机选择生成边缘 (0:上, 1:右, 2:下, 3:左)
            const edge = Math.floor(Math.random() * 4);
            let x, y;
            const spawnDist = SPAWN_PADDING; // 使用常量 SPAWN_PADDING

            switch (edge) {
                case 0: // 上边缘
                    x = viewCenterX - halfWidth - spawnDist + Math.random() * (GAME_WIDTH + 2 * spawnDist);
                    y = viewCenterY - halfHeight - spawnDist;
                    break;
                case 1: // 右边缘
                    x = viewCenterX + halfWidth + spawnDist;
                    y = viewCenterY - halfHeight - spawnDist + Math.random() * (GAME_HEIGHT + 2 * spawnDist);
                    break;
                case 2: // 下边缘
                    x = viewCenterX - halfWidth - spawnDist + Math.random() * (GAME_WIDTH + 2 * spawnDist);
                    y = viewCenterY + halfHeight + spawnDist;
                    break;
                case 3: // 左边缘
                    x = viewCenterX - halfWidth - spawnDist;
                    y = viewCenterY - halfHeight - spawnDist + Math.random() * (GAME_HEIGHT + 2 * spawnDist);
                    break;
            }
            
            // 根据权重随机选择敌人类型
            const rand = Math.random() * totalWeight;
            let weightSum = 0;
            let selectedType = availableEnemies[0];
            
            for (const enemyType of availableEnemies) {
                weightSum += enemyType.weight;
                if (rand <= weightSum) {
                    selectedType = enemyType;
                    break;
                }
            }
            
            // 创建敌人
            const enemy = new Enemy(x, y, selectedType);
            enemies.push(enemy);
        }
    },

    cleanup() {
        // 清理已标记为垃圾的敌人
        enemies = enemies.filter(enemy => !enemy.isGarbage);
    }
};

// Boss管理器
const bossManager = {
    nextBossTime: BOSS_INTERVAL,
    currentBoss: null,
    bossWarningTimer: 0,
    showingWarning: false,
    pendingBossType: null, // 新增：用于存储待生成的Boss类型

    update(dt, gameTime, player) {
        // 如果当前有Boss，更新Boss
        if (this.currentBoss && !this.currentBoss.isGarbage) {
            return;
        }

        // 重置当前Boss
        this.currentBoss = null;

        // 如果正在显示警告，更新警告计时器
        if (this.showingWarning) {
            this.bossWarningTimer += dt;

            // 如果警告计时器超过3秒，生成Boss
            if (this.bossWarningTimer >= 3) {
                if (this.pendingBossType) {
                    this.spawnBoss(player, this.pendingBossType); // 使用预选的Boss类型
                }
                this.showingWarning = false;
                this.bossWarningTimer = 0;
                this.pendingBossType = null; // 清除预选的Boss
            }
            return;
        }

        // 如果游戏时间超过下一次Boss生成时间，显示警告
        if (gameTime >= this.nextBossTime) {
            const availableBosses = BOSS_TYPES.filter(boss => gameTime >= (boss.minTime || 0));
            if (availableBosses.length > 0) {
                // 随机选择一个Boss并存储
                this.pendingBossType = availableBosses[Math.floor(Math.random() * availableBosses.length)];
                this.showBossWarning(this.pendingBossType.name); // 用选定的Boss名字显示警告
            this.showingWarning = true;
            } else {
                // 如果没有可用的Boss（理论上不应发生，除非BOSS_TYPES为空或minTime都过高）
                // 简单地推迟下一次检查，或者可以记录一个错误
                console.warn("No bosses available to choose from at gameTime:", gameTime);
            }
            this.nextBossTime = gameTime + BOSS_INTERVAL; // 设置下一次Boss生成的时间
        }
    },

    showBossWarning(bossName) { // 修改：接收Boss名字
        // 显示Boss警告
        const bossWarningElement = document.getElementById('bossWarning');
        bossWarningElement.textContent = `👹 BOSS ${bossName} 来袭! 👹`; // 使用传入的Boss名字
        bossWarningElement.style.display = 'block';
        bossWarningElement.classList.add('animate');

        // 3秒后隐藏警告
        setTimeout(() => {
            bossWarningElement.style.display = 'none';
            bossWarningElement.classList.remove('animate');
        }, 3000);
    },

    spawnBoss(player, bossTypeToSpawn) { // 修改：接收预选的Boss类型
        // 计算生成位置
        const angle = Math.random() * Math.PI * 2;
        const distance = 300;
        const x = player.x + Math.cos(angle) * distance;
        const y = player.y + Math.sin(angle) * distance;

        // 创建Boss - 使用 BossEnemy 类
        const boss = new BossEnemy(x, y, bossTypeToSpawn); // 使用传入的Boss类型

        // 添加到敌人列表
        enemies.push(boss);

        // 设置当前Boss
        this.currentBoss = boss;
    },

    cleanup() {
        // 如果当前Boss已标记为垃圾，重置当前Boss
        if (this.currentBoss && this.currentBoss.isGarbage) {
            this.currentBoss = null;
        }
    }
};

/**
 * 初始化游戏
 */
function init() {
    console.log("初始化游戏...");

    // 获取画布和上下文
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');

    // 设置画布尺寸
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;

    // 创建离屏画布
    offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = GAME_WIDTH;
    offscreenCanvas.height = GAME_HEIGHT;
    offscreenCtx = offscreenCanvas.getContext('2d');

    // 加载玩家图片
    playerImage = new Image();
    playerImage.src = 'assets/ninja.png';
    playerImage.onload = () => {
        console.log("玩家图片加载完成。");
    };
    playerImage.onerror = () => {
        console.error("无法加载玩家图片！");
        playerImage = null; // 加载失败则不使用图片
    };

    // 清空对象池和活动列表
    inactiveProjectiles = [];
    inactiveDamageNumbers = [];
    projectiles = [];
    enemyProjectiles = []; // 清空敌人投射物
    damageNumbers = [];
    enemies = [];
    xpGems = [];
    worldObjects = [];
    visualEffects = [];
    activeGhosts = []; // 清空活动的幽灵

    // 重置状态
    isGameOver = false;
    isPaused = false;
    isLevelUp = false;
    gameTime = 0;
    killCount = 0;

    // 创建玩家
    player = new Player(GAME_WIDTH / 2, GAME_HEIGHT / 2);

    // 添加初始武器
    player.addWeapon(new DaggerWeapon());

    // 重置敌人和Boss管理器
    enemyManager.spawnTimer = 0;
    enemyManager.currentSpawnInterval = 3.5; // 使用更长的初始生成间隔
    enemyManager.difficultyTimer = 0;
    bossManager.nextBossTime = BOSS_INTERVAL;
    bossManager.currentBoss = null;
    bossManager.bossWarningTimer = 0;
    bossManager.showingWarning = false;

    // 重置UI
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelUpScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');

    // 重置相机位置
    cameraManager.setPosition(player.x, player.y);

    // 开始游戏循环
    lastTime = performance.now();
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    animationFrameId = requestAnimationFrame(gameLoop);

    // 更新UI
    updateUI();

    // 标记游戏为运行状态
    isGameRunning = true;

    console.log("Emoji 幸存者 - 重构版 已初始化。");
}


/**
 * 生成投射物（对象池）
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {string} emoji - 表情符号
 * @param {number} size - 大小
 * @param {number} vx - X速度
 * @param {number} vy - Y速度
 * @param {number} damage - 伤害
 * @param {number} pierce - 穿透次数
 * @param {number} duration - 持续时间
 * @param {Object} ownerStats - 拥有者属性
 * @returns {Projectile} 生成的投射物
 */
function spawnProjectile(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats) {
    let projectile = null;
    if (inactiveProjectiles.length > 0) {
        projectile = inactiveProjectiles.pop();
        projectile.init(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats);
    } else {
        projectile = new Projectile(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats);
    }
    projectiles.push(projectile);
    return projectile;
}

/**
 * 生成伤害数字（对象池）
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {string} text - 文本
 * @param {string} [color='white'] - 文本颜色
 * @param {number} [size=GAME_FONT_SIZE * 0.8] - 文本大小
 * @param {number} [duration=0.7] - 持续时间
 * @returns {DamageNumber} 生成的伤害数字
 */
function spawnDamageNumber(x, y, text, color = 'rgb(255, 80, 80)', size = GAME_FONT_SIZE * 0.8, duration = 0.7) {
    let damageNumber = null;
    if (inactiveDamageNumbers.length > 0) {
        damageNumber = inactiveDamageNumbers.pop();
        // 需要确保 init 方法也更新，或者在获取时设置属性
        damageNumber.init(x, y, text, size, color, duration);
    } else {
        damageNumber = new DamageNumber(x, y, text, size, color, duration);
    }
    damageNumbers.push(damageNumber);
    return damageNumber;
}

/**
 * 更新游戏状态
 * @param {number} dt - 时间增量
 */
function update(dt) {
    // --- 新增：日志记录 ---
    if (player) {
        console.log(`Update Start: isPaused=${isPaused}, isLevelUp=${isLevelUp}, pendingChestUps=${player.pendingLevelUpsFromChest}`);
    }
    // --- 结束新增 ---

    if (isGameOver || isPaused || isLevelUp) return;

    gameTime += dt;

    // 更新屏幕震动计时器
    if (screenShakeDuration > 0) {
        screenShakeTimer += dt;
        if (screenShakeTimer >= screenShakeDuration) {
            screenShakeIntensity = 0;
            screenShakeDuration = 0;
            screenShakeTimer = 0;
        }
    }

    // 更新相机
    cameraManager.setTarget(player.x, player.y);
    cameraManager.update(dt);
    // 更新敌人管理器
    enemyManager.update(dt, gameTime, player);

    // 更新Boss管理器
    bossManager.update(dt, gameTime, player);

    // 更新玩家
    if (player) {
        player.update(dt, keys);
    }

    // 更新敌人 (包括普通敌人和Boss)
    for (let i = 0; i < enemies.length; i++) {
        if (!enemies[i].isGarbage && enemies[i].isActive) {
            enemies[i].target = player; // 确保所有敌人都有目标
            if (enemies[i] instanceof BossEnemy) {
                enemies[i].update(dt, player); // <--- 确保 BossEnemy 的 update 也接收 player
            } else {
            enemies[i].update(dt);
            }
        }
    }

    // 更新投射物
    for (let i = 0; i < projectiles.length; i++) {
        if (!projectiles[i].isGarbage && projectiles[i].isActive) {
            projectiles[i].update(dt);
        }
    }
    
    // 更新敌人投射物
    for (let i = 0; i < enemyProjectiles.length; i++) {
        if (!enemyProjectiles[i].isGarbage && enemyProjectiles[i].isActive) {
            enemyProjectiles[i].update(dt);
        }
    }

    // 更新经验宝石
    for (let i = 0; i < xpGems.length; i++) {
        if (!xpGems[i].isGarbage && xpGems[i].isActive) {
            xpGems[i].update(dt, player);
        }
    }

    // 更新世界物体
    for (let i = 0; i < worldObjects.length; i++) {
        if (!worldObjects[i].isGarbage && worldObjects[i].isActive) {
            worldObjects[i].update(dt, player);
        }
    }

    // 更新伤害数字
    for (let i = 0; i < damageNumbers.length; i++) {
        if (!damageNumbers[i].isGarbage && damageNumbers[i].isActive) {
            damageNumbers[i].update(dt);
        }
    }

    // 更新视觉特效
    for (let i = 0; i < visualEffects.length; i++) {
        if (!visualEffects[i].isGarbage) {
            visualEffects[i].update(dt);
        }
    }

    // 新增：更新活动的幽灵
    for (let i = activeGhosts.length - 1; i >= 0; i--) {
        if (activeGhosts[i] && !activeGhosts[i].isGarbage && activeGhosts[i].isActive) {
            activeGhosts[i].update(dt);
        } else if (activeGhosts[i] && activeGhosts[i].isGarbage) {
            // GhostEnemy.destroy() 应该已经处理了从数组中移除
            // 但以防万一，如果仍然存在已标记为垃圾的，这里可以再次确认移除
            // activeGhosts.splice(i, 1); // GhostEnemy.destroy() 中已包含此逻辑
        }
    }

    // 对象池回收
    // 倒序遍历以安全地使用 splice
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectiles[i].isGarbage) {
            const proj = projectiles.splice(i, 1)[0];
            proj.isActive = false;
            inactiveProjectiles.push(proj);
        }
    }
    
    // 回收敌人投射物
    enemyProjectiles = enemyProjectiles.filter(p => !p.isGarbage);

    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        if (damageNumbers[i].isGarbage) {
            const dn = damageNumbers.splice(i, 1)[0];
            dn.isActive = false;
            inactiveDamageNumbers.push(dn);
        }
    }

    // 清理其他对象
    enemies = enemies.filter(e => !e.isGarbage);
    xpGems = xpGems.filter(g => !g.isGarbage);
    worldObjects = worldObjects.filter(o => !o.isGarbage);
    visualEffects = visualEffects.filter(e => !e.isGarbage);

    // 清理管理器
    enemyManager.cleanup();
    bossManager.cleanup();

    // --- 新增：处理宝箱多次升级 ---
    if (player && player.pendingLevelUpsFromChest > 0 && !isPaused && !isLevelUp) {
        console.log(`宝箱升级待处理: ${player.pendingLevelUpsFromChest} 次. Setting isLevelUp = true.`); // <-- 添加日志
        isLevelUp = true; // 标记需要显示升级界面
        player.pendingLevelUpsFromChest--; 
        // 注意：升级选项执行完毕后会自动将 isPaused 和 isLevelUp 设为 false
        // presentLevelUpOptions() 会在下面的 isLevelUp 检查中被调用
    }
    // --- 结束新增 ---

    // 处理升级
    if (isLevelUp) {
        // 如果是因为宝箱触发的升级，并且次数用尽，确保 isLevelUp 不会再被错误设置
        if (player && player.pendingLevelUpsFromChest === 0 && arguments.callee.caller !== player.levelUp) {
             // This check is tricky and might not be perfectly robust.
             // The idea is to prevent re-triggering if level up was from normal XP gain right after chest.
        }
        presentLevelUpOptions();
        // isLevelUp = false; // presentLevelUpOptions 或其按钮回调会处理 isPaused 和 isLevelUp
    }

    // 更新UI
    updateUI();
}

/**
 * 绘制游戏
 */
function draw() {
    try {
        // 保存原始画布状态
        ctx.save();

        // 应用屏幕震动
        let appliedShakeX = 0;
        let appliedShakeY = 0;
        if (screenShakeDuration > 0 && screenShakeIntensity > 0) {
            const currentProgress = screenShakeTimer / screenShakeDuration;
            // 震动强度可以随时间衰减，例如线性衰减或更复杂的曲线
            // const currentIntensity = screenShakeIntensity * (1 - currentProgress); // 线性衰减
            const currentIntensity = screenShakeIntensity; // 或者保持固定强度直到结束

            appliedShakeX = (Math.random() - 0.5) * 2 * currentIntensity;
            appliedShakeY = (Math.random() - 0.5) * 2 * currentIntensity;
            ctx.translate(appliedShakeX, appliedShakeY);
        }

        // 使用离屏画布进行绘制
        offscreenCtx.fillStyle = '#1a4d2e';
        offscreenCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // 绘制经验宝石
        for (let i = 0; i < xpGems.length; i++) {
            if (!xpGems[i].isGarbage && xpGems[i].isActive) {
                xpGems[i].draw(offscreenCtx);
            }
        }

        // 绘制世界物体
        for (let i = 0; i < worldObjects.length; i++) {
            if (!worldObjects[i].isGarbage && worldObjects[i].isActive) {
                worldObjects[i].draw(offscreenCtx);
            }
        }

        // 绘制敌人
        for (let i = 0; i < enemies.length; i++) {
            if (!enemies[i].isGarbage && enemies[i].isActive) {
                enemies[i].draw(offscreenCtx);
            }
        }

        // 绘制投射物
        for (let i = 0; i < projectiles.length; i++) {
            if (!projectiles[i].isGarbage && projectiles[i].isActive) {
                projectiles[i].draw(offscreenCtx);
            }
        }
        
        // 绘制敌人投射物
        for (let i = 0; i < enemyProjectiles.length; i++) {
            if (!enemyProjectiles[i].isGarbage && enemyProjectiles[i].isActive) {
                enemyProjectiles[i].draw(offscreenCtx);
            }
        }

        // 绘制玩家和武器效果
        if (player && !player.isGarbage && player.isActive) {
            // 绘制武器效果
            for (let i = 0; i < player.weapons.length; i++) {
                const weapon = player.weapons[i];
                if (weapon.drawAura) weapon.drawAura(offscreenCtx, player);
                if (weapon.drawHitboxes) weapon.drawHitboxes(offscreenCtx);
            }

            // 绘制玩家
            player.draw(offscreenCtx);
        }

        // 新增：绘制活动的幽灵 (在玩家之后，特效之前绘制，确保层级关系)
        for (let i = 0; i < activeGhosts.length; i++) {
            if (activeGhosts[i] && !activeGhosts[i].isGarbage && activeGhosts[i].isActive) {
                activeGhosts[i].draw(offscreenCtx);
            }
        }

        // 绘制视觉特效
        for (let i = 0; i < visualEffects.length; i++) {
            if (!visualEffects[i].isGarbage) {
                visualEffects[i].draw(offscreenCtx);
            }
        }

        // 绘制伤害数字
        for (let i = 0; i < damageNumbers.length; i++) {
            if (!damageNumbers[i].isGarbage && damageNumbers[i].isActive) {
                damageNumbers[i].draw(offscreenCtx);
            }
        }

        // 将离屏画布内容复制到显示画布
        ctx.drawImage(offscreenCanvas, 0, 0);

        // 恢复画布状态 (移除震动等变换)
        ctx.restore();
    } catch (error) {
        console.error("绘制过程中发生错误:", error);
    }
}


/**
 * 游戏循环
 * @param {number} timestamp - 时间戳
 */
function gameLoop(timestamp) {
    if (isGameOver) {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
        return;
    }
    animationFrameId = requestAnimationFrame(gameLoop);
    // 计算时间增量，限制最大值以避免大延迟后的跳跃
    deltaTime = Math.min((timestamp - lastTime) / 1000, 0.1);
    lastTime = timestamp;
    // 更新游戏状态
    update(deltaTime);
    // 渲染游戏
    draw();
}

/**
 * 格式化时间
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间
 */
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * 更新UI
 */
function updateUI() {
    if (!player) return;

    try {
        // 获取UI元素
        const healthValueUI = document.getElementById('healthValue');
        const maxHealthValueUI = document.getElementById('maxHealthValue');
        const healthBarUI = document.getElementById('healthBar');
        const levelValueUI = document.getElementById('levelValue');
        const xpValueUI = document.getElementById('xpValue');
        const xpNextLevelValueUI = document.getElementById('xpNextLevelValue');
        const xpBarUI = document.getElementById('xpBar');
        const timerValueUI = document.getElementById('timerValue');
        const killCountValueUI = document.getElementById('killCountValue');
        const weaponIconsUI = document.getElementById('weaponIcons');
        const passiveIconsUI = document.getElementById('passiveIcons');
        
        // 新增：获取左下角属性UI元素
        const statDamageUI = document.getElementById('statDamage');
        const statProjSpeedUI = document.getElementById('statProjSpeed');
        const statCooldownUI = document.getElementById('statCooldown');
        const statAreaUI = document.getElementById('statArea');
        const statDurationUI = document.getElementById('statDuration');
        const statAmountUI = document.getElementById('statAmount');
        const statArmorUI = document.getElementById('statArmor');
        const statRegenUI = document.getElementById('statRegen');
        const statMoveSpeedUI = document.getElementById('statMoveSpeed');
        const statPickupUI = document.getElementById('statPickup');

        // 更新生命值
        if (healthValueUI) healthValueUI.textContent = Math.ceil(player.health);
        if (maxHealthValueUI) maxHealthValueUI.textContent = Math.ceil(player.getStat('health'));
        if (healthBarUI) healthBarUI.style.width = `${Math.max(0, (player.health / player.getStat('health'))) * 100}%`;

        // 更新等级和经验
        if (levelValueUI) levelValueUI.textContent = player.level;
        if (player.level < MAX_LEVEL) {
            if (xpValueUI) xpValueUI.textContent = player.xp;
            if (xpNextLevelValueUI) xpNextLevelValueUI.textContent = player.xpToNextLevel;
            if (xpBarUI) xpBarUI.style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;
        } else {
            if (xpValueUI) xpValueUI.textContent = "MAX";
            if (xpNextLevelValueUI) xpNextLevelValueUI.textContent = "";
            if (xpBarUI) xpBarUI.style.width = `100%`;
        }

        // 更新时间和击杀数
        if (timerValueUI) timerValueUI.textContent = formatTime(gameTime);
        if (killCountValueUI) killCountValueUI.textContent = killCount;

        // 更新武器和被动物品图标
        if (weaponIconsUI) {
            weaponIconsUI.innerHTML = player.weapons.map(w =>
                `<span class="uiIcon" title="${w.name}">${w.emoji}<span class="uiItemLevel">Lv${w.level}</span></span>`
            ).join(' ');
        }

        if (passiveIconsUI) {
            passiveIconsUI.innerHTML = player.passiveItems.map(p =>
                `<span class="uiIcon" title="${p.name}">${p.emoji}<span class="uiItemLevel">Lv${p.level}</span></span>`
            ).join(' ');
        }
        
        // 新增：更新左下角属性值
        if (statDamageUI) statDamageUI.textContent = player.getStat('damageMultiplier').toFixed(2);
        if (statProjSpeedUI) statProjSpeedUI.textContent = player.getStat('projectileSpeedMultiplier').toFixed(2);
        if (statCooldownUI) statCooldownUI.textContent = player.getStat('cooldownMultiplier').toFixed(2);
        if (statAreaUI) statAreaUI.textContent = player.getStat('areaMultiplier').toFixed(2);
        if (statDurationUI) statDurationUI.textContent = player.getStat('durationMultiplier').toFixed(2);
        if (statAmountUI) statAmountUI.textContent = player.getStat('projectileCountBonus').toString();
        if (statArmorUI) statArmorUI.textContent = player.getStat('armor').toFixed(1);
        if (statRegenUI) statRegenUI.textContent = player.getStat('regen').toFixed(1);
        if (statMoveSpeedUI) statMoveSpeedUI.textContent = player.getStat('speed').toFixed(0);
        if (statPickupUI) statPickupUI.textContent = player.getStat('pickupRadius').toFixed(0);
        
    } catch (error) {
        console.error("更新UI时出错:", error, "Player Stats:", JSON.stringify(player?.stats), "Calculated Stats:", JSON.stringify(player?.calculatedStats));
    }
}

/**
 * 游戏结束
 */
function gameOver() {
    isGameOver = true;
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // 更新游戏结束界面 - **确保在这里获取元素**
    const finalTimeUI = document.getElementById('finalTime');
    const finalLevelUI = document.getElementById('finalLevel');
    const finalKillsUI = document.getElementById('finalKills');
    const gameOverScreen = document.getElementById('gameOverScreen'); // 也获取一下 gameOverScreen
    
    if (finalTimeUI) finalTimeUI.textContent = formatTime(gameTime);
    if (finalLevelUI) finalLevelUI.textContent = player.level;
    if (finalKillsUI) finalKillsUI.textContent = killCount;
    
    // 显示游戏结束界面
    if (gameOverScreen) gameOverScreen.classList.remove('hidden');
}

/**
 * 暂停游戏
 * @param {boolean} forceHideUI - 是否强制隐藏UI
 */
function pauseGame(forceHideUI = false) {
    if (isGameOver) return;
    isPaused = true;
    if (!forceHideUI) {
        pauseScreen.classList.remove('hidden');
    }
}

/**
 * 恢复游戏
 */
function resumeGame() {
    if (isGameOver) return;
    isPaused = false;
    isLevelUp = false;
    levelUpScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    lastTime = performance.now();
    if (!animationFrameId) {
        gameLoop(lastTime);
    }
}

/**
 * 获取可用升级选项
 * @param {Player} player - 玩家对象
 * @returns {Array} 升级选项数组
 */
function getAvailableUpgrades(player) {
    let options = [];
    let hasWeaponOption = false;

    // 添加武器升级选项
    player.weapons.forEach(weapon => {
        if (weapon) { // 确保 weapon 对象存在
            let weaponUpgrades = null;
            if (typeof weapon.getCurrentUpgradeOptions === 'function') {
                weaponUpgrades = weapon.getCurrentUpgradeOptions(player);
            } else if (!weapon.isMaxLevel() && typeof weapon.getUpgradeDescription === 'function') {
                // 如果 getCurrentUpgradeOptions 不可用，但武器可以升级，则提供一个基于 getUpgradeDescription 的默认升级
                weaponUpgrades = [{
                    item: weapon,
                    type: 'upgrade_weapon',
                    text: `升级 ${weapon.name} (Lv ${weapon.level + 1})`,
                    description: weapon.getUpgradeDescription(),
                    icon: weapon.emoji,
                    level: weapon.level + 1,
                    action: () => {
                        weapon.upgrade(); // 或者 weapon.levelUp()，确保与武器类中的方法一致
                        if(player) player.recalculateStats(); // 确保玩家对象存在
                        checkEvolution(player, weapon); // 升级后检查进化
                    }
                }];
            }

            if (weaponUpgrades && weaponUpgrades.length > 0) {
                options = options.concat(weaponUpgrades);
                hasWeaponOption = true;
            }
        }
    });
    // 添加被动物品升级选项
    player.passiveItems.forEach(passive => {
        if (passive) { // 确保 passive 对象存在
            let passiveUpgrades = null;
            if (typeof passive.getCurrentUpgradeOptions === 'function') {
                passiveUpgrades = passive.getCurrentUpgradeOptions(player);
            } else if (!passive.isMaxLevel && typeof passive.getUpgradeDescription === 'function') { // 确保 isMaxLevel 是方法
                 passiveUpgrades = [{
                    item: passive,
                    type: 'upgrade_passive',
                    text: `升级 ${passive.name} (Lv ${passive.level + 1})`,
                    description: passive.getUpgradeDescription(),
                    icon: passive.emoji,
                    level: passive.level + 1,
                    action: () => {
                        passive.upgrade(); // 或者 passive.levelUp()
                        if(player) player.recalculateStats();
                        // checkEvolutionForPassive(player, passive); // 如果被动有进化
                    }
                }];
            }
             if (passiveUpgrades && passiveUpgrades.length > 0) {
                options = options.concat(passiveUpgrades);
            }
        }
    });

    // 添加新武器选项
    if (player.weapons.length < player.maxWeapons) {
        BASE_WEAPONS.forEach(WeaponClass => {
            if (WeaponClass && !player.weapons.some(w => w instanceof WeaponClass)) {
                if (typeof WeaponClass === 'function' && WeaponClass.prototype) {
                    try {
                const weapon = new WeaponClass();
                options.push({
                    item: weapon,
                            classRef: WeaponClass,
                    type: 'new_weapon',
                            text: `获得 ${weapon.name || WeaponClass.name || '未知武器'}`,
                            description: weapon.getInitialDescription ? weapon.getInitialDescription() : (WeaponClass.Description || '选择一个新武器。'),
                            icon: weapon.emoji || WeaponClass.Emoji || '❓',
                    action: () => {
                                player.addWeapon(new WeaponClass());
                            }
                        });
                        hasWeaponOption = true; // A new weapon is a weapon option
                    } catch (e) {
                        console.error(`Error instantiating weapon ${WeaponClass.name}:`, e);
                    }
                } else {
                    console.warn('Encountered non-constructable item in BASE_WEAPONS:', WeaponClass);
                }
            }
        });
    }

    // 添加新被动物品选项
    if (player.passiveItems.length < player.maxPassives) {
        BASE_PASSIVES.forEach(PassiveClass => {
            if (PassiveClass && !player.passiveItems.some(p => p instanceof PassiveClass)) {
                if (typeof PassiveClass === 'function' && PassiveClass.prototype) {
                    try {
                const passive = new PassiveClass();
                options.push({
                    item: passive,
                            classRef: PassiveClass,
                    type: 'new_passive',
                            text: `获得 ${passive.name || PassiveClass.name || '未知被动'}`,
                            description: passive.getInitialDescription ? passive.getInitialDescription() : (PassiveClass.Description || '选择一个新被动道具。'),
                            icon: passive.emoji || PassiveClass.Emoji || '❓',
                    action: () => {
                                player.addPassive(new PassiveClass());
                            }
                        });
                    } catch (e) {
                        console.error(`Error instantiating passive ${PassiveClass.name}:`, e);
                    }
                } else {
                     console.warn('Encountered non-constructable item in BASE_PASSIVES:', PassiveClass);
                }
            }
        });
    }

    // 如果到目前为止还没有武器选项，并且可以有武器选项，尝试添加一个
    if (!hasWeaponOption) {
        let potentialWeaponOptions = [];
        // 优先升级现有未满级武器
        const upgradableWeapons = player.weapons.filter(w => w && !w.isMaxLevel()); // 确保 w 存在
        if (upgradableWeapons.length > 0) {
            upgradableWeapons.sort((a, b) => a.level - b.level); // 升级等级最低的
            const weaponToUpgrade = upgradableWeapons[0];
            
            let currentWeaponUpgradeOptions = null;
            if (weaponToUpgrade && typeof weaponToUpgrade.getCurrentUpgradeOptions === 'function') {
                currentWeaponUpgradeOptions = weaponToUpgrade.getCurrentUpgradeOptions(player);
            } else if (weaponToUpgrade && !weaponToUpgrade.isMaxLevel() && typeof weaponToUpgrade.getUpgradeDescription === 'function') {
                 currentWeaponUpgradeOptions = [{
                    item: weaponToUpgrade,
                    type: 'upgrade_weapon',
                    text: `升级 ${weaponToUpgrade.name} (Lv ${weaponToUpgrade.level + 1})`,
                    description: weaponToUpgrade.getUpgradeDescription(),
                    icon: weaponToUpgrade.emoji,
                    level: weaponToUpgrade.level + 1,
            action: () => {
                        weaponToUpgrade.upgrade();
                        if(player) player.recalculateStats();
                        checkEvolution(player, weaponToUpgrade);
                    }
                }];
            }

            if (currentWeaponUpgradeOptions && currentWeaponUpgradeOptions.length > 0) {
                 potentialWeaponOptions = potentialWeaponOptions.concat(currentWeaponUpgradeOptions);
            }
        }

        // 如果没有可升级的现有武器，但可以添加新武器
        if (potentialWeaponOptions.length === 0 && player.weapons.length < player.maxWeapons) {
            const availableNewWeapons = BASE_WEAPONS.filter(WC => WC && !player.weapons.some(w => w instanceof WC));
            if (availableNewWeapons.length > 0) {
                const WeaponClass = availableNewWeapons[Math.floor(Math.random() * availableNewWeapons.length)]; // 随机选一个
                 if (typeof WeaponClass === 'function' && WeaponClass.prototype) {
                    try {
                        const weapon = new WeaponClass();
                        potentialWeaponOptions.push({
                            item: weapon,
                            classRef: WeaponClass,
                            type: 'new_weapon',
                            text: `获得 ${weapon.name || WeaponClass.name || '未知武器'}`,
                            description: weapon.getInitialDescription ? weapon.getInitialDescription() : (WeaponClass.Description || '选择一个新武器。'),
                            icon: weapon.emoji || WeaponClass.Emoji || '❓',
                            action: () => {
                                player.addWeapon(new WeaponClass());
                            }
                        });
                    } catch (e) {
                        console.error(`Error instantiating forced weapon ${WeaponClass.name}:`, e);
                    }
                }
            }
        }
        // 如果找到了强制的武器选项，将其添加到主选项列表 (如果主列表还不包含它)
        // 为了简单，直接添加，后续的去重和数量限制会处理
        if (potentialWeaponOptions.length > 0) {
            options = options.concat(potentialWeaponOptions);
            // hasWeaponOption = true; // Not strictly needed to set here as we are at the end of option gathering for weapons
        }
    }

    // 去重：基于 text 和 type (简单去重，可能需要更复杂的逻辑)
    const uniqueOptions = [];
    const seenOptions = new Set();
    for (const opt of options) {
        const key = `${opt.type}_${opt.text}`;
        if (!seenOptions.has(key)) {
            uniqueOptions.push(opt);
            seenOptions.add(key);
        }
    }
    options = uniqueOptions;

    // 如果选项仍然很少 (例如少于1个)，并且玩家生命值不满，则添加恢复生命选项作为保底
    if (options.length < 1 && player && player.health < player.getStat('health')) { // 使用 getStat('health')
        options.push({
            type: 'utility',
            text: '恢复 30% 生命',
            description: '回复部分生命值。',
            icon: '🍗',
            action: () => {
                if(player) player.heal(player.getStat('health') * 0.3);
            }
        });
    }

    // 随机打乱选项顺序
    shuffleArray(options);
    // 返回前N个选项 (通常是3或4，如果选项少于N，则返回所有可用选项)
    return options.slice(0, Math.min(options.length, 4));
}

/**
 * 显示升级选项
 */
function presentLevelUpOptions() {
    // 暂停游戏
    isPaused = true; 
    console.log("Presenting level up options. Setting isPaused = true.");
    
    const levelUpScreenElement = document.getElementById('levelUpScreen');
    const upgradeOptionsContainer = document.getElementById('upgradeOptions');
    const chestUpgradeInfoElement = document.getElementById('chestUpgradeInfo'); // 获取新DOM元素

    // --- 显示宝箱升级提示 ---
    if (player && player.currentChestTotalUpgrades > 0 && (player.pendingLevelUpsFromChest + 1) > 0) {
        chestUpgradeInfoElement.textContent = `开启宝箱！共 ${player.currentChestTotalUpgrades} 次升级机会，还剩 ${player.pendingLevelUpsFromChest + 1} 次选择。`;
        chestUpgradeInfoElement.style.display = 'block';
    } else {
        chestUpgradeInfoElement.style.display = 'none';
    }
    // --- 结束提示 ---

    try {
        // 获取升级选项
        const options = getAvailableUpgrades(player);
        
        // 清空容器
        upgradeOptionsContainer.innerHTML = '';
        
        // 添加选项
        if (options && options.length > 0) {
        options.forEach(option => {
            // 创建按钮
            const button = document.createElement('button');
            // 创建图标
            const iconSpan = document.createElement('span');
            iconSpan.className = 'upgradeIcon';
            iconSpan.textContent = option.icon || '❓';
            // 创建文本
            const textSpan = document.createElement('span');
            textSpan.className = 'upgradeText';
            textSpan.textContent = option.text;
            // 如果有等级，添加等级
            if (option.level) {
                const levelSpan = document.createElement('span');
                levelSpan.className = 'upgradeLevel';
                levelSpan.textContent = `Lv ${option.level}`;
                textSpan.appendChild(levelSpan);
            } else if (option.type === 'new_weapon' || option.type === 'new_passive') {
                // 对于新武器/被动，明确显示 "新"
                const levelSpan = document.createElement('span');
                levelSpan.className = 'upgradeLevel';
                levelSpan.textContent = '新'; // 使用 "新" 来表示未拥有的物品
                textSpan.appendChild(levelSpan);
            }
            // 创建描述
            const descP = document.createElement('p');
            descP.textContent = option.description || '';
            // 添加到按钮
            button.appendChild(iconSpan);
            button.appendChild(textSpan);
            button.appendChild(descP);
            // 添加点击事件
            button.onclick = () => {
                try {
                    // 执行选项操作
                    console.log("Upgrade button clicked. Action:", option.text);
                        if (typeof option.action === 'function') {
                    option.action();
                        }
                        levelUpScreenElement.classList.add('hidden');
                    console.log("Hiding level up screen. Setting isPaused=false, isLevelUp=false.");
                    isPaused = false;
                    isLevelUp = false; 

                    // --- 重置宝箱计数器 (如果适用) ---
                    if (player && player.pendingLevelUpsFromChest === 0) {
                        player.currentChestTotalUpgrades = 0; // 所有宝箱升级已完成
                        console.log("All chest upgrades complete. Resetting currentChestTotalUpgrades.");
                    }
                    // --- 结束重置 ---

                } catch (error) {
                    console.error("升级选项执行错误:", error);
                        levelUpScreenElement.classList.add('hidden');
                    console.log("Error in upgrade action. Setting isPaused=false, isLevelUp=false.");
                    isPaused = false;
                    isLevelUp = false;
                }
            };
            // 添加到容器
            upgradeOptionsContainer.appendChild(button);
        });
        } else {
            // 如果没有有效选项，提供一个默认的关闭方式或提示
            const noOptionText = document.createElement('p');
            noOptionText.textContent = "没有可用的升级选项了！点击屏幕继续。";
            upgradeOptionsContainer.appendChild(noOptionText);
            // 允许点击屏幕关闭
            levelUpScreenElement.onclick = () => {
                levelUpScreenElement.classList.add('hidden');
                isPaused = false;
                // isLevelUp = false; 
                levelUpScreenElement.onclick = null; // 移除事件监听器
            };
        }
        // 显示升级界面
        levelUpScreenElement.classList.remove('hidden');
    } catch (error) {
        console.error("显示升级选项时出错:", error);
        // 确保游戏不会卡住
        levelUpScreenElement.classList.add('hidden');
        isPaused = false;
        // isLevelUp = false;
    }
}

/**
 * 检查进化可能性
 * @param {Player} player - 玩家对象
 * @param {UpgradeableItem} item - 可升级物品
 */
function checkEvolution(player, item) {
    console.log("检查进化可能性...");
    let evolutionOccurred = false;

    // 检查武器进化
    for (let i = 0; i < player.weapons.length; i++) {
        const weapon = player.weapons[i];

        // 跳过已进化或没有进化信息的武器
        if (!weapon || weapon.isEvolved || !weapon.constructor || !weapon.constructor.Evolution) {
            continue;
        }

        const evolutionInfo = weapon.constructor.Evolution;
        const requiredPassiveName = evolutionInfo.requires;
        const evolvedClassName = evolutionInfo.evolvesTo; // e.g., "ThunderSword", "DeathGrip"

        // 检查是否满足进化条件 (武器满级，且拥有特定被动物品)
        const hasRequiredPassive = player.passiveItems.some(passive => passive.name === requiredPassiveName);

        if (weapon.isMaxLevel() && hasRequiredPassive) {
            console.log(`武器 ${weapon.name} 满足进化条件 (需求: ${requiredPassiveName}), 尝试进化为 ${evolvedClassName}`);

            // 尝试从全局作用域获取进化后的类定义
            const EvolvedClass = window[evolvedClassName];

            if (typeof EvolvedClass === 'function') {
                try {
                    const evolvedWeapon = new EvolvedClass(weapon); // 传递旧武器实例，供进化武器构造函数使用
                    evolvedWeapon.owner = player; // 确保设置拥有者
                    player.weapons[i] = evolvedWeapon; // 替换原武器
                evolutionOccurred = true;
                    console.log(`${weapon.name} 成功进化为 ${evolvedWeapon.name}!`);
                createEvolutionEffect(player.x, player.y);
                    // 一次只进化一个武器，避免潜在的数组修改问题
                break;
                } catch (e) {
                    console.error(`进化 ${weapon.name} 到 ${evolvedClassName} 时出错: ${e}. 确保 ${evolvedClassName} 类已定义并正确加载。`, e);
                }
            } else {
                console.warn(`进化失败: 找不到类 ${evolvedClassName}。确保它已在加载的脚本中定义 (例如 advancedWeapons.js)。`);
            }
        }
    }

    if (evolutionOccurred) {
        updateUI(); // 更新UI以显示进化后的武器
    }
}

/**
 * 创建通用爆炸特效
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} maxRadius - 最大半径
 * @param {string} color - 颜色 (例如 'rgba(255, 100, 50, 0.7)')
 * @param {number} [lifetime=0.5] - 持续时间（秒）
 */
function createExplosionEffect(x, y, maxRadius, color, lifetime = 0.5) {
    const effect = {
        x: x,
        y: y,
        radius: 0,
        maxRadius: maxRadius,
        color: color,
        lifetime: lifetime,
        timer: 0,
        isGarbage: false,

        update: function(dt) {
            this.timer += dt;
            if (this.timer >= this.lifetime) {
                this.isGarbage = true;
                return;
            }
            this.radius = (this.timer / this.lifetime) * this.maxRadius;
        },

        draw: function(ctx) {
            if (this.isGarbage) return;

            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            // 从颜色字符串中提取alpha值，或者如果没有提供alpha，则根据生命周期计算
            let baseAlpha = 0.7;
            const colorParts = this.color.match(/(\d+(\.\d+)?)/g);
            if (colorParts && colorParts.length === 4) {
                baseAlpha = parseFloat(colorParts[3]);
            }
            
            const alpha = baseAlpha - (this.timer / this.lifetime) * baseAlpha;
            
            ctx.fillStyle = this.color.replace(/(\d\.?\d*\))$/, `${alpha})`); // 动态更新颜色的alpha值
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    };
    visualEffects.push(effect);
}

/**
 * 创建进化特效
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 */
function createEvolutionEffect(x, y) {
    // 创建爆炸特效
    createExplosionEffect(x, y, 200, 'rgba(255, 215, 0, 0.6)');
    // 创建第二层爆炸
    setTimeout(() => {
        createExplosionEffect(x, y, 150, 'rgba(255, 255, 255, 0.7)');
    }, 200);
    // 创建第三层爆炸
    setTimeout(() => {
        createExplosionEffect(x, y, 100, 'rgba(255, 215, 0, 0.8)');
    }, 400);
}

/**
 * 随机打乱数组
 * @param {Array} array - 要打乱的数组
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 事件监听
window.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
    // 暂停/恢复游戏
    if (e.key.toLowerCase() === 'p') {
        if (isPaused && !isLevelUp) {
            resumeGame();
        } else if (!isPaused && !isLevelUp) {
            pauseGame();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

// 按钮事件
startButton.addEventListener('click', init);
restartButton.addEventListener('click', init);
resumeButton.addEventListener('click', resumeGame);

// 窗口大小调整
window.addEventListener('resize', () => {
    GAME_WIDTH = Math.min(window.innerWidth * 0.95, 1280);
    GAME_HEIGHT = Math.min(window.innerHeight * 0.95, 720);
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
    // 更新离屏画布尺寸
    offscreenCanvas.width = GAME_WIDTH;
    offscreenCanvas.height = GAME_HEIGHT;
    // 更新玩家位置（确保在屏幕内）
    if (player) {
        player.x = Math.max(player.size / 2, Math.min(GAME_WIDTH - player.size / 2, player.x));
        player.y = Math.max(player.size / 2, Math.min(GAME_HEIGHT - player.size / 2, player.y));
    }
    // 如果游戏正在运行，重新绘制
    if (player && !isGameOver && !isPaused && !isLevelUp) {
        draw();
    }
});

console.log("Emoji 幸存者 - 重构版 已初始化。");

/**
 * 敌人投射物类
 */
class EnemyProjectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {Enemy} owner - 拥有者
     * @param {string} [emoji=null] - 可选的表情符号用于显示
     * @param {number} [customSize=null] - 可选的自定义大小
     */
    constructor(x, y, vx, vy, damage, owner, emoji = null, customSize = null) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.owner = owner;
        this.emoji = emoji;
        
        // 大小
        this.size = customSize !== null ? customSize : (this.emoji ? GAME_FONT_SIZE * 0.8 : GAME_FONT_SIZE * 0.6);
        this.width = this.size;
        this.height = this.size;
        
        // 生命周期
        this.lifetime = 0;
        this.duration = 3.0;
        
        // 活动状态
        this.isActive = true;
        this.isGarbage = false;
        
        // 已击中的目标
        this.hasHit = false;
    }
    
    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isGarbage && this.isActive) {
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 检查生命周期
            if (this.lifetime >= this.duration) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查是否超出屏幕边界
            if (this.x < cameraManager.x - GAME_WIDTH * 0.6 || 
                this.x > cameraManager.x + GAME_WIDTH * 0.6 || 
                this.y < cameraManager.y - GAME_HEIGHT * 0.6 || 
                this.y > cameraManager.y + GAME_HEIGHT * 0.6) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查与玩家的碰撞
            if (!this.hasHit && player && !player.isGarbage && player.isActive) {
                const dx = this.x - player.x;
                const dy = this.y - player.y;
                const distSq = dx * dx + dy * dy;
                const collisionRadiusSq = (this.size / 2 + player.size / 2) * (this.size / 2 + player.size / 2);
                
                if (distSq <= collisionRadiusSq) {
                    // 对玩家造成伤害
                    player.takeDamage(this.damage, this.owner);
                    
                    // 标记为已击中
                    this.hasHit = true;
                    this.isGarbage = true;
                    this.isActive = false;
                    
                    // 创建命中特效
                    this.createHitEffect();
                }
            }
        }
    }
    
    /**
     * 创建命中特效
     */
    createHitEffect() {
        // 创建爆炸效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.size * 2,
            lifetime: 0.3,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                this.radius = (this.timer / this.lifetime) * this.maxRadius;
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const alpha = 0.5 - (this.timer / this.lifetime) * 0.5;
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        visualEffects.push(effect);
    }
    
    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果投射物不活动或已标记为垃圾，不绘制
        if (this.isGarbage || !this.isActive) return;
        
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        
        if (this.emoji) {
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        } else {
            // 默认绘制：紫色圆形
            ctx.fillStyle = 'purple'; 
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
        ctx.fill();
        }
        
        // 移除轨迹绘制，如果使用emoji则轨迹可能不合适
        /*
        ctx.strokeStyle = 'rgba(128, 0, 128, 0.4)'; 
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenPos.x, screenPos.y);
        ctx.lineTo(
            screenPos.x - this.vx / 10,
            screenPos.y - this.vy / 10
        );
        ctx.stroke();
        */
    }
}

// 基础武器列表 - 确保类名与定义文件一致
BASE_WEAPONS.length = 0; // 清空现有数组
if (typeof DaggerWeapon !== 'undefined') BASE_WEAPONS.push(DaggerWeapon);
if (typeof WhipWeapon !== 'undefined') BASE_WEAPONS.push(WhipWeapon);
if (typeof GarlicWeapon !== 'undefined') BASE_WEAPONS.push(GarlicWeapon);
// 添加高级武器
if (typeof FireBladeWeapon !== 'undefined') BASE_WEAPONS.push(FireBladeWeapon); // 添加 燃烧刀
if (typeof StormBladeWeapon !== 'undefined') BASE_WEAPONS.push(StormBladeWeapon); // 添加 岚刀
if (typeof HandshakeWeapon !== 'undefined') BASE_WEAPONS.push(HandshakeWeapon); // 添加 握握手

// 基础被动道具列表 - 确保类名与定义文件一致
BASE_PASSIVES.length = 0; // 清空现有数组
if (typeof Magnet !== 'undefined') BASE_PASSIVES.push(Magnet); // 修正: MagnetPassive -> Magnet
if (typeof HollowHeart !== 'undefined') BASE_PASSIVES.push(HollowHeart); // 修正: HeartPassive -> HollowHeart
if (typeof Pummarola !== 'undefined') BASE_PASSIVES.push(Pummarola); // 修正: TomatoPassive -> Pummarola
if (typeof Spinach !== 'undefined') BASE_PASSIVES.push(Spinach); // 添加 Spinach
if (typeof Armor !== 'undefined') BASE_PASSIVES.push(Armor); // 添加 Armor
if (typeof Wings !== 'undefined') BASE_PASSIVES.push(Wings); // 添加 Wings
if (typeof EmptyTome !== 'undefined') BASE_PASSIVES.push(EmptyTome); // 添加 EmptyTome
if (typeof Candelabrador !== 'undefined') BASE_PASSIVES.push(Candelabrador); // 添加 Candelabrador
if (typeof Bracer !== 'undefined') BASE_PASSIVES.push(Bracer); // 添加 Bracer
// 新增：添加舍利子回魂
if (typeof SoulRelic !== 'undefined') BASE_PASSIVES.push(SoulRelic);

function spawnRandomPickup(x, y) {
    const rand = Math.random();

    // 调整掉落率：
    // 磁铁: 2% -> 0.5%
    // 心: 3% -> 1% (累计概率，所以是 0.005 到 0.015)
    if (rand < 0.005) { // 0.5% 几率掉落磁铁
        spawnPickup(x, y, 'magnet');
    } else if (rand < 0.015) { // 1% 几率掉落心 (0.015 - 0.005 = 0.01)
        spawnPickup(x, y, 'heart');
    } else {
        // 剩余 (98.5%) 几率掉落经验
        const xpValue = Math.random() < 0.1 ? 5 : 1; // 10% 几率掉落大经验
        spawnPickup(x, y, 'xp', xpValue);
    }
}

// 新增：触发屏幕震动函数
function triggerScreenShake(intensity, duration) {
    // 如果当前有震动，并且新震动的强度更大，则覆盖；或者简单地总是接受新的震动
    // 为了简单，这里总是接受新的震动参数，并重置计时器
    screenShakeIntensity = intensity;
    screenShakeDuration = duration;
    screenShakeTimer = 0; // 重置计时器，使新震动立即生效并持续其完整时长
    // console.log(`Screen shake: intensity=${intensity.toFixed(2)}, duration=${duration.toFixed(2)}`);
}
