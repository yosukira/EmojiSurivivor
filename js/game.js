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
let backgroundImage = null; // 用于存储背景图片

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
let hazards = []; // 新增：用于存储持续性危害物，如藤蔓、火山等
let particles = []; // 粒子效果

// 鼠标隐藏相关
let lastMouseMoveTime = Date.now(); // 最后一次鼠标移动的时间
let mouseIdleTime = 2000; // 鼠标不动多少毫秒后隐藏（2秒）
let isMouseHidden = false; // 鼠标是否已隐藏

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
            // 将削减率从0.90改为0.95，使生成速度增长更平缓
            this.currentSpawnInterval = Math.max(0.8, this.currentSpawnInterval * 0.95);
            this.difficultyTimer = 0;
            
            // 根据游戏时间动态调整敌人上限
            // 初始上限较低，随时间逐渐增加
            const baseEnemyCap = 30; // 初始敌人上限
            const maxEnemyCap = 100; // 最大敌人上限
            const minutesPassed = gameTime / 60;
            // 每3分钟增加10个敌人上限，但不超过最大值
            const capIncrease = Math.min(Math.floor(minutesPassed / 3) * 10, maxEnemyCap - baseEnemyCap);
            this.maxEnemyCap = baseEnemyCap + capIncrease;
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
        let availableEnemies;
        
        // 移除 firstBossDefeated 的判断
        // const firstBossDefeated = bossManager.isFirstBossDefeated(); 
        // console.log(`SpawnEnemies Check - GameTime: ${Math.floor(gameTime)}s, FirstBossDefeated: ${firstBossDefeated}`);
        
        // 根据游戏时间筛选敌人类型
        availableEnemies = ENEMY_TYPES.filter(enemy => {
            // 基本条件：游戏时间必须大于等于敌人的最小出现时间
            if (gameTime < (enemy.minTime || 0)) {
                return false;
            }
            
            // 如果有最大时间限制，检查是否超过
            if (enemy.maxTime && gameTime >= enemy.maxTime) {
                return false;
            }
            
            // 移除与 firstBossDefeated 相关的判断逻辑，完全依赖 minTime 和 maxTime
            return true; 
        });
        
        // 打印详细的可用敌人列表，但只在每隔60秒时记录一次，避免日志过多
        if (gameTime % 60 < 1) {
            console.log(`当前游戏时间: ${Math.floor(gameTime)}秒, 可用敌人有 ${availableEnemies.length} 种:`);
            console.log(availableEnemies.map(e => e.name).join(', '));
        }
        
        // 如果没有可用敌人，使用史莱姆作为后备选择
        if (availableEnemies.length === 0) {
            console.warn("没有找到符合条件的敌人类型，使用史莱姆作为后备");
            availableEnemies = ENEMY_TYPES.filter(enemy => enemy.name === "史莱姆");
            // 如果史莱姆也不可用，尝试蝙蝠，然后僵尸
            if (availableEnemies.length === 0) {
                availableEnemies = ENEMY_TYPES.filter(enemy => enemy.name === "蝙蝠");
                if (availableEnemies.length === 0) {
                    availableEnemies = ENEMY_TYPES.filter(enemy => enemy.name === "僵尸");
                }
            }
            // 如果所有备选都不可用，使用第一个敌人类型
            if (availableEnemies.length === 0 && ENEMY_TYPES.length > 0) {
                availableEnemies = [ENEMY_TYPES[0]];
            }
        }
        
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
        if (spawnCountThisWave <= 0) return;
        
        // 生成敌人
        for (let i = 0; i < spawnCountThisWave; i++) {
            // 增加生成距离，确保敌人在视野外生成
            const forcedMinSpawnDistance = 150; // 强制最小生成距离
            const visualRange = Math.max(GAME_WIDTH, GAME_HEIGHT) / 2; // 玩家视野范围
            const currentSpawnOffset = Math.max(SPAWN_PADDING, visualRange + forcedMinSpawnDistance);
            
            // 随机选择生成角度，确保敌人在视野外均匀分布
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDistance = currentSpawnOffset + Math.random() * 100; // 添加一些随机性
            
            // 根据角度和距离计算生成坐标
            const x = player.x + Math.cos(spawnAngle) * spawnDistance;
            const y = player.y + Math.sin(spawnAngle) * spawnDistance;
            
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
    nextBossTime: FIRST_BOSS_TIME, // 使用新的第一个Boss时间
    currentBoss: null,
    bossWarningTimer: 0,
    showingWarning: false,
    pendingBossType: null, // 新增：用于存储待生成的Boss类型
    defeatedBossCount: 0, // 跟踪已击败的Boss数量
    bossArenaEffect: null, // 存储Boss战场边界效果

    update(dt, gameTime, player) {
        // 如果当前有Boss，更新Boss
        if (this.currentBoss && !this.currentBoss.isGarbage) {
            return;
        }
        
        // 如果之前有Boss且现在没有了，表示Boss被击败
        if (this.currentBoss && this.currentBoss.isGarbage) {
            this.defeatedBossCount++;
            console.log(`Boss已击败! 总计击败: ${this.defeatedBossCount}`);
            
            // 立即执行Boss战场清理，并做彻底检查
            this.cleanupBossEffects();
            
            // 取消Boss战场限制 - 确保在cameraManager中停用
            cameraManager.deactivateBossArena();
            console.log("Boss战场已解除!");
            
            // 播放胜利音效或视觉效果
            triggerScreenShake(5, 0.8);
            
            // 重置当前Boss
            this.currentBoss = null;
            hideBossHealthBar(); // <--- 新增：隐藏Boss血条
        }

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
            
            // 计算下一个Boss出现的时间间隔
            let nextBossInterval = BOSS_INTERVAL; // 默认4分钟
            
            // 后期Boss刷新频率加快
            if (gameTime >= 900) { // 15分钟后
                if (gameTime < 1200) { // 15-20分钟
                    nextBossInterval = 240; // 保持4分钟
                } else if (gameTime < 1500) { // 20-25分钟
                    nextBossInterval = 210; // 减少到3.5分钟
                } else if (gameTime < 1800) { // 25-30分钟
                    nextBossInterval = 180; // 减少到3分钟
                } else if (gameTime < 2100) { // 30-35分钟
                    nextBossInterval = 150; // 减少到2.5分钟
                } else { // 35分钟后
                    nextBossInterval = 120; // 减少到2分钟
                }
            }
            
            // 设置下一次Boss生成的时间
            this.nextBossTime = gameTime + nextBossInterval;
            console.log(`下一个Boss将在游戏时间 ${Math.floor(this.nextBossTime)} 秒出现，间隔：${nextBossInterval}秒`);
        }
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
        console.log('[BOSS_SPAWN] Boss object for health bar:', this.currentBoss); // DEBUG
        showBossHealthBar(this.currentBoss); 

        // 创建Boss战场，限制玩家移动范围
        const bossArenaRadius = 800; // 设置一个较大的战场半径
        cameraManager.activateBossArena(x, y, bossArenaRadius);
        
        // 播放Boss战场激活音效或视觉效果
        triggerScreenShake(10, 1.5);
    },
    
    // 检查第一个Boss是否已被击败
    isFirstBossDefeated() {
        return this.defeatedBossCount > 0;
    },
    
    showBossWarning(bossName) {
        // 调用全局showBossWarning函数
        if (typeof showBossWarning === 'function') {
            showBossWarning(bossName);
        } else {
            // 备用警告逻辑
            console.warn("全局showBossWarning函数不可用，使用备用警告");
            const warning = document.createElement("div");
            warning.className = "boss-warning";
            warning.textContent = `⚠️ ${bossName}即将出现! ⚠️`;
            warning.style.position = 'absolute';
            warning.style.top = '20%';
            warning.style.left = '50%';
            warning.style.transform = 'translateX(-50%)';
            warning.style.backgroundColor = 'rgba(200, 0, 0, 0.8)';
            warning.style.color = '#ffffff';
            warning.style.padding = '15px 30px';
            warning.style.borderRadius = '8px';
            warning.style.zIndex = '1000';
            document.body.appendChild(warning);
            
            // 3秒后移除警告
            setTimeout(() => {
                warning.remove();
            }, 3000);
        }
    },

    cleanup() {
        // 如果当前Boss已标记为垃圾，重置当前Boss
        if (this.currentBoss && this.currentBoss.isGarbage) {
            this.currentBoss = null;
        }
    },

    // 清理Boss相关的所有视觉效果
    cleanupBossEffects() {
        console.log("开始清理Boss战场效果和相关视觉效果...");

        // 确保全局引用被清除
        if (window.bossArenaEffect) {
            console.log("发现全局Boss战场效果引用，准备清除");
            window.bossArenaEffect.isGarbage = true;
            window.bossArenaEffect = null;
            console.log("全局Boss战场效果引用已清除");
        }
        
        // 确保Boss战场被停用
        cameraManager.bossArenaActive = false;
        console.log("Boss战场标记已重置: bossArenaActive = false");
        
        // 清理本地引用
        this.bossArenaEffect = null;
        
        // 一次性彻底清理所有相关视觉效果 - 使用直接删除方式
        let removedEffectCount = 0;
        
        // 先找出所有需要删除的效果
        const effectsToRemove = [];
        for (let i = 0; i < visualEffects.length; i++) {
            const effect = visualEffects[i];
            // 检查是否为Boss战场效果或与当前Boss相关的效果
            if (effect && (
                effect.isBossArenaEffect || 
                (effect.boss && this.currentBoss && effect.boss === this.currentBoss)
            )) {
                effectsToRemove.push(i);
            }
        }
        
        // 从后向前删除，避免索引问题
        for (let i = effectsToRemove.length - 1; i >= 0; i--) {
            visualEffects.splice(effectsToRemove[i], 1);
            removedEffectCount++;
        }
        
        console.log(`已直接移除 ${removedEffectCount} 个Boss相关视觉效果`);
        
        // 确保所有战场效果都被清理
        for (let i = visualEffects.length - 1; i >= 0; i--) {
            if (visualEffects[i] && visualEffects[i].isBossArenaEffect) {
                console.log("移除残留的Boss战场效果:", visualEffects[i]);
                visualEffects.splice(i, 1);
            }
        }
        
        // 清理Boss产生的危害区域和投射物
        if (this.currentBoss) {
            let removedHazards = 0;
            for (let i = hazards.length - 1; i >= 0; i--) {
                if (hazards[i] && hazards[i].owner === this.currentBoss) {
                    hazards.splice(i, 1);
                    removedHazards++;
                }
            }
            
            if (removedHazards > 0) {
                console.log(`已直接移除 ${removedHazards} 个Boss产生的危害区域`);
            }
            
            let removedProjectiles = 0;
            for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
                if (enemyProjectiles[i] && enemyProjectiles[i].owner === this.currentBoss) {
                    enemyProjectiles.splice(i, 1);
                    removedProjectiles++;
                }
            }
            
            if (removedProjectiles > 0) {
                console.log(`已直接移除 ${removedProjectiles} 个Boss投射物`);
            }
        }
        
        console.log("Boss战场效果清理完成");
    },
    
    // 处理Boss死亡
    handleBossDeath(boss, killer) {
        console.log(`[BossManager.handleBossDeath] Called for Boss: ${boss.type.name}. Preparing to hide health bar and cleanup.`); // 新增日志
        if (!boss || boss.isGarbage) {
            console.warn("[BossManager.handleBossDeath] Boss already marked as garbage or null, skipping.");
            return;
        }
        // 增加击杀计数
        killCount++;
        
        // 掉落宝箱
        worldObjects.push(new Chest(boss.x, boss.y));
        
        // 立即清理战场效果
        this.cleanupBossEffects();
        
        // 确保取消Boss战场限制
        cameraManager.deactivateBossArena();
        
        // 将Boss标记为垃圾，确保不会再次触发其他处理
        boss.isGarbage = true;

        // 确保隐藏血条
        if (this.currentBoss === boss || currentBossForHealthBar === boss) {
            console.log(`[BossManager.handleBossDeath] Hiding health bar for defeated boss: ${boss.type.name}`);
            hideBossHealthBar();
            this.currentBoss = null; // 也清除管理器中的当前Boss引用
        } else {
            console.warn(`[BossManager.handleBossDeath] Defeated boss ${boss.type.name} does not match currentBoss ${this.currentBoss ? this.currentBoss.type.name : 'null'} or currentBossForHealthBar ${currentBossForHealthBar ? currentBossForHealthBar.type.name : 'null'}. Health bar may not hide as expected.`);
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

    // 加载背景图片
    backgroundImage = new Image();
    backgroundImage.src = 'assets/grassbg.png';
    backgroundImage.onload = () => {
        console.log("背景图片加载完成。");
    };
    backgroundImage.onerror = () => {
        console.error("无法加载背景图片！");
        backgroundImage = null; // 加载失败则使用纯色背景
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
    window.player = player;

    // 添加初始武器
    player.addWeapon(new DaggerWeapon());

    // 重置敌人和Boss管理器
    enemyManager.spawnTimer = 0;
    enemyManager.currentSpawnInterval = 3.5; // 使用更长的初始生成间隔
    enemyManager.difficultyTimer = 0;
    bossManager.nextBossTime = FIRST_BOSS_TIME; // <--- 修改这里
    bossManager.currentBoss = null;
    bossManager.bossWarningTimer = 0;
    bossManager.showingWarning = false;
    bossManager.defeatedBossCount = 0; // 确保重置Boss击败计数
    bossManager.pendingBossType = null; // 确保重置待生成的Boss类型

    // 重置UI
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelUpScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.add('hidden');

    // 重置相机位置和状态
    cameraManager.setPosition(player.x, player.y);
    cameraManager.deactivateBossArena();

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
        // console.log(`Update Start: isPaused=${isPaused}, isLevelUp=${isLevelUp}, pendingChestUps=${player.pendingLevelUpsFromChest}`);
    }
    // --- 结束新增 ---

    // 检查鼠标闲置时间
    if (!isMouseHidden && Date.now() - lastMouseMoveTime > mouseIdleTime) {
        document.body.style.cursor = 'none';
        isMouseHidden = true;
    }

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

    // 更新相机跟踪玩家
    cameraManager.follow(player);
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
            // 确保所有敌人都有目标
            enemies[i].target = player;
            
            // 根据敌人类型调用不同的update方法
            if (enemies[i] instanceof BossEnemy) {
                // Boss敌人需要传递player作为参数
                enemies[i].update(dt, player);
            } else {
                // 普通敌人只需要dt
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

    // 新增：更新持续性危害物（藤蔓、火山等）
    for (let i = 0; i < hazards.length; i++) {
        if (hazards[i] && !hazards[i].isGarbage) {
            hazards[i].update(dt);
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
    hazards = hazards.filter(h => !h.isGarbage); // 清理持续性危害物

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

    // 更新Boss血条 (如果显示中)
    if (currentBossForHealthBar && bossHealthUIContainer && !bossHealthUIContainer.classList.contains('hidden')) {
        updateBossHealthBar();
    }
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
        if (backgroundImage && backgroundImage.complete && backgroundImage.naturalHeight !== 0) {
            // 使用图片作为背景纹理
            const pattern = offscreenCtx.createPattern(backgroundImage, 'repeat');
            offscreenCtx.fillStyle = pattern;
            
            // 计算重复纹理的偏移，基于相机位置实现视差效果
            // 将视差速度从0.5改为1.0，使背景与角色移动保持一致
            const offsetX = -cameraManager.x * 1.0 % backgroundImage.width;
            const offsetY = -cameraManager.y * 1.0 % backgroundImage.height;
            
            offscreenCtx.save();
            offscreenCtx.translate(offsetX, offsetY);
            // 确保无论如何都能完全覆盖画布，多绘制一些区域
            offscreenCtx.fillRect(-offsetX - backgroundImage.width, -offsetY - backgroundImage.height, 
                                 GAME_WIDTH + 2 * backgroundImage.width, 
                                 GAME_HEIGHT + 2 * backgroundImage.height);
            offscreenCtx.restore();
        } else {
            // 使用纯色作为背景
            offscreenCtx.fillStyle = '#1a4d2e';
            offscreenCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
        
        // 按照图层顺序从底到顶绘制：
        // 1. 世界背景物体
        // 2. 经验宝石
        // 3. 危险区域/持续性效果
        // 4. 投射物和特效
        // 5. 敌人和玩家（最顶层）
        
        // 绘制世界物体 (最底层)
        for (let i = 0; i < worldObjects.length; i++) {
            if (!worldObjects[i].isGarbage && worldObjects[i].isActive) {
                worldObjects[i].draw(offscreenCtx);
            }
        }

        // 绘制经验宝石 (第二层)
        for (let i = 0; i < xpGems.length; i++) {
            if (!xpGems[i].isGarbage && xpGems[i].isActive) {
                xpGems[i].draw(offscreenCtx);
            }
        }
        
        // 绘制持续性危害物 (第三层)
        for (let i = 0; i < hazards.length; i++) {
            if (!hazards[i].isGarbage) {
                // 调整持续性危害的透明度，确保不会完全遮挡玩家和敌人
                offscreenCtx.save();
                offscreenCtx.globalAlpha = 0.85; // 降低透明度以确保可见性
                hazards[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 绘制投射物 (第四层)
        for (let i = 0; i < projectiles.length; i++) {
            if (!projectiles[i].isGarbage && projectiles[i].isActive) {
                // 调整投射物透明度，确保不会完全遮挡玩家和敌人
                offscreenCtx.save();
                offscreenCtx.globalAlpha = 0.9; // 稍微降低透明度
                projectiles[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }
        
        // 绘制敌人投射物 (第四层)
        for (let i = 0; i < enemyProjectiles.length; i++) {
            if (!enemyProjectiles[i].isGarbage && enemyProjectiles[i].isActive) {
                // 调整投射物透明度
                offscreenCtx.save();
                offscreenCtx.globalAlpha = 0.9; // 稍微降低透明度
                enemyProjectiles[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }
        
        // 绘制视觉特效 (与投射物同层)
        for (let i = 0; i < visualEffects.length; i++) {
            if (!visualEffects[i].isGarbage) {
                // 调整特效透明度
                offscreenCtx.save();
                offscreenCtx.globalAlpha = 0.85; // 降低透明度
                visualEffects[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 绘制武器效果 (与投射物同层)
        if (player && !player.isGarbage && player.isActive) {
            for (let i = 0; i < player.weapons.length; i++) {
                const weapon = player.weapons[i];
                // 如果武器有特殊光环效果，绘制它们
                offscreenCtx.save();
                offscreenCtx.globalAlpha = 0.85; // 降低武器效果透明度
                if (weapon.drawAura) weapon.drawAura(offscreenCtx, player);
                if (weapon.drawHitboxes) weapon.drawHitboxes(offscreenCtx);
                offscreenCtx.restore();
            }
        }
        
        // 绘制活动的幽灵 (与敌人同层但优先级更低)
        for (let i = 0; i < activeGhosts.length; i++) {
            if (activeGhosts[i] && !activeGhosts[i].isGarbage && activeGhosts[i].isActive) {
                activeGhosts[i].draw(offscreenCtx);
            }
        }

        // 绘制敌人 (最顶层之一)
        for (let i = 0; i < enemies.length; i++) {
            if (!enemies[i].isGarbage && enemies[i].isActive) {
                // 特殊处理Boss，使其更加明显
                if (enemies[i].isBoss) {
                    offscreenCtx.save();
                    offscreenCtx.globalAlpha = 1.0; // 保持Boss完全不透明
                    enemies[i].draw(offscreenCtx);
                    offscreenCtx.restore();
                } else {
                    // 普通敌人
                    enemies[i].draw(offscreenCtx);
                }
            }
        }
        
        // 绘制玩家 (最顶层)
        if (player && !player.isGarbage && player.isActive) {
            // 确保玩家始终可见
            offscreenCtx.save();
            offscreenCtx.globalAlpha = 1.0; // 保持玩家完全不透明
            player.draw(offscreenCtx);
            offscreenCtx.restore();
        }

        // 绘制伤害数字 (最顶层之一)
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
    if (!isGameRunning || isGameOver) return;
    
    // 如果暂停或正在升级，不更新游戏状态
    if (isPaused || isLevelUp) {
        // 保持动画循环
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
    }
    
    // 计算帧时间
    if (lastTime === 0) {
        lastTime = timestamp;
    }
    
    deltaTime = (timestamp - lastTime) / 1000; // 转换为秒
    lastTime = timestamp;

    // 限制最大帧时间，防止跨帧过大
    deltaTime = Math.min(deltaTime, 0.1);

    // 增加游戏时间
    gameTime += deltaTime;
    
    // 更新游戏状态
    update(deltaTime);
    
    // 绘制游戏
    draw();
    
    // 清理标记为垃圾的对象
    cleanupGameObjects();
    
    // 继续游戏循环
    animationFrameId = requestAnimationFrame(gameLoop);
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
    try {
        // 如果玩家不存在或UI元素不存在，不更新
        if (!player) return;

        // 检查UI元素是否存在
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

        // 安全获取属性函数
        const getSafeStat = (name, defaultValue = 0) => {
            try {
                if (typeof player.getStat === 'function') {
                    return player.getStat(name);
                } else if (player.stats && player.stats[name] !== undefined) {
                    return player.stats[name];
                } else {
                    return defaultValue;
                }
            } catch (e) {
                console.warn(`获取属性${name}时出错:`, e);
                return defaultValue;
            }
        };

        // 更新生命值
        if (healthValueUI) healthValueUI.textContent = Math.ceil(player.health || 0);
        
        // 获取最大生命值时添加错误处理
        const maxHealth = getSafeStat('health', 100);
        if (maxHealthValueUI) maxHealthValueUI.textContent = Math.ceil(maxHealth);
        if (healthBarUI) healthBarUI.style.width = `${Math.max(0, ((player.health || 0) / maxHealth)) * 100}%`;

        // 更新等级和经验
        if (levelValueUI) levelValueUI.textContent = player.level || 1;
        if (player.level < MAX_LEVEL) {
            if (xpValueUI) xpValueUI.textContent = player.xp || 0;
            if (xpNextLevelValueUI) xpNextLevelValueUI.textContent = player.xpToNextLevel || 0;
            if (xpBarUI) xpBarUI.style.width = `${Math.max(0, Math.min(100, ((player.xp || 0) / (player.xpToNextLevel || 1)) * 100))}%`;
        } else {
            if (xpValueUI) xpValueUI.textContent = "MAX";
            if (xpNextLevelValueUI) xpNextLevelValueUI.textContent = "";
            if (xpBarUI) xpBarUI.style.width = `100%`;
        }

        // 更新时间和击杀数
        if (timerValueUI) timerValueUI.textContent = formatTime(gameTime);
        if (killCountValueUI) killCountValueUI.textContent = killCount;

        // 更新武器和被动物品图标
        if (weaponIconsUI && player.weapons && Array.isArray(player.weapons)) {
            weaponIconsUI.innerHTML = player.weapons.map(w =>
                w ? `<span class="uiIcon" title="${w.name || ''}">${w.emoji || '?'}<span class="uiItemLevel">Lv${w.level || 1}</span></span>` : ''
            ).join(' ');
        }

        if (passiveIconsUI && player.passiveItems && Array.isArray(player.passiveItems)) {
            passiveIconsUI.innerHTML = player.passiveItems.map(p =>
                p ? `<span class="uiIcon" title="${p.name || ''}">${p.emoji || '?'}<span class="uiItemLevel">Lv${p.level || 1}</span></span>` : ''
            ).join(' ');
        }
        
        // 新增：更新左下角属性值
        if (statDamageUI) statDamageUI.textContent = getSafeStat('damageMultiplier', 1).toFixed(2);
        if (statProjSpeedUI) statProjSpeedUI.textContent = getSafeStat('projectileSpeedMultiplier', 1).toFixed(2);
        if (statCooldownUI) statCooldownUI.textContent = getSafeStat('cooldownMultiplier', 1).toFixed(2);
        if (statAreaUI) statAreaUI.textContent = getSafeStat('areaMultiplier', 1).toFixed(2);
        if (statDurationUI) statDurationUI.textContent = getSafeStat('durationMultiplier', 1).toFixed(2);
        if (statAmountUI) statAmountUI.textContent = getSafeStat('projectileCountBonus', 0).toString();
        // if (statArmorUI) statArmorUI.textContent = getSafeStat('armor', 0).toFixed(1); // 移除护甲值面板
        if (statRegenUI) statRegenUI.textContent = getSafeStat('regen', 0).toFixed(1);
        if (statMoveSpeedUI) statMoveSpeedUI.textContent = (typeof player.getCurrentSpeed === 'function' ? player.getCurrentSpeed() : getSafeStat('speed', 170)).toFixed(0);
        if (statPickupUI) statPickupUI.textContent = getSafeStat('pickupRadius', 70).toFixed(0);
        // 显示减速百分比
        const statSlowUI = document.getElementById('statSlow');
        if (statSlowUI) {
            if (player.statusEffects && player.statusEffects.slow && player.statusEffects.slow.factor !== undefined) {
                const slowPercent = Math.round((1 - player.statusEffects.slow.factor) * 100);
                statSlowUI.textContent = slowPercent + '%';
            } else {
                statSlowUI.textContent = '0%';
            }
        }
        // 显示减伤百分比
        const statDRUI = document.getElementById('statDR');
        if (statDRUI) {
            const dr = getSafeStat('damageReductionPercent', 0);
            statDRUI.textContent = (dr * 100).toFixed(1) + '%';
        }
        
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
            } else if (!passive.isMaxLevel() && typeof passive.getUpgradeDescription === 'function') { // 修改为方法调用
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
        console.log("检查可用的被动物品...");
        // 调试输出：检查BASE_PASSIVES中的内容
        console.log("BASE_PASSIVES包含:", BASE_PASSIVES.map(cls => cls ? (cls.name || "未命名类") : "无效类"));
        
        // 调试：检查玩家已有的被动物品
        console.log("玩家已有被动物品:", player.passiveItems.map(p => p.constructor.name));
        
        // 创建已有被动物品的名称集合
        const playerHasPassives = new Set();
        player.passiveItems.forEach(p => {
            if (p && p.constructor) {
                playerHasPassives.add(p.constructor.name);
                // 也添加类的显示名称，防止命名不一致
                if (p.name) playerHasPassives.add(p.name);
            }
        });
        
        console.log("玩家已有被动物品集合:", Array.from(playerHasPassives));
        
        BASE_PASSIVES.forEach(PassiveClass => {
            if (!PassiveClass) {
                console.warn("BASE_PASSIVES中存在无效的被动物品类");
                return;
            }
            
            // 仅尝试实例化函数类型
            if (typeof PassiveClass !== 'function') {
                console.warn(`无法实例化非函数类型:`, PassiveClass);
                return;
            }
            
            // 确保类有原型
            if (!PassiveClass.prototype) {
                console.warn(`类没有原型:`, PassiveClass);
                return;
            }
            
            // 检查玩家是否已经拥有此类被动物品
            // 通过名称匹配和instanceof双重检查
            const className = PassiveClass.name;
            const alreadyHas = playerHasPassives.has(className) || 
                              player.passiveItems.some(p => p instanceof PassiveClass);
            
            console.log(`检查被动物品 ${className}: ${alreadyHas ? "玩家已拥有" : "玩家未拥有"}`);
            
            if (!alreadyHas) {
                try {
                    // 尝试实例化被动物品
                    const passive = new PassiveClass();
                    
                    // 双重检查：确保这不是已经拥有的另一个名称的物品
                    if (passive.name && playerHasPassives.has(passive.name)) {
                        console.log(`玩家已拥有名为 ${passive.name} 的物品，跳过`);
                        return;
                    }
                    
                    console.log(`添加被动物品选项: ${passive.name || className}`);
                    
                    options.push({
                        item: passive,
                        classRef: PassiveClass,
                        type: 'new_passive',
                        text: `获得 ${passive.name || className || '未知被动'}`,
                        description: passive.getInitialDescription ? 
                                     passive.getInitialDescription() : 
                                     (PassiveClass.Description || '选择一个新被动道具。'),
                        icon: passive.emoji || PassiveClass.Emoji || '❓',
                        action: () => {
                            console.log(`玩家选择了被动物品: ${passive.name || className}`);
                            player.addPassive(new PassiveClass());
                        }
                    });
                } catch (e) {
                    console.error(`实例化被动物品 ${className} 时出错:`, e);
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

    // 显示debug属性面板
    showLevelUpDebugStats();
    
    // --- 显示宝箱升级提示 ---
    if (player && player.currentChestTotalUpgrades > 0 && (player.pendingLevelUpsFromChest + 1) > 0) {
        chestUpgradeInfoElement.textContent = `开启宝箱！共 ${player.currentChestTotalUpgrades} 次升级机会，还剩 ${player.pendingLevelUpsFromChest + 1} 次选择。`;
        chestUpgradeInfoElement.style.display = 'block';
    } else {
        chestUpgradeInfoElement.style.display = 'none';
    }
    // --- 结束提示 ---

    // 添加键盘操作提示
    const keyboardHint = document.getElementById('keyboardHint');
    if (keyboardHint) {
        keyboardHint.textContent = "使用数字键 1-4 选择并确认升级，或用鼠标点击。";
    } else {
        const hintElement = document.createElement('p');
        hintElement.id = 'keyboardHint';
        hintElement.textContent = "使用数字键 1-4 选择并确认升级，或用鼠标点击。";
        hintElement.style.fontSize = "0.9em";
        hintElement.style.color = "#ccc";
        hintElement.style.marginTop = "-10px"; // 调整与上方元素的间距
        hintElement.style.marginBottom = "20px";
        // 插入到 upgradeOptionsContainer 之前，并且在<h1>和<p id="chestUpgradeInfo">之后
        const h1Element = levelUpScreenElement.querySelector('h1');
        if (h1Element && h1Element.nextSibling) {
            levelUpScreenElement.insertBefore(hintElement, h1Element.nextSibling.nextSibling); // 插入到第二个p之后
        } else if (h1Element) {
            levelUpScreenElement.insertBefore(hintElement, h1Element.nextSibling);
        }

    }

    try {
        // 获取升级选项
        const options = getAvailableUpgrades(player);
        
        // 清空容器
        upgradeOptionsContainer.innerHTML = '';
        
        // 当前选中的选项索引（用于键盘操作）
        let currentSelection = -1;
        
        // 添加选项
        if (options && options.length > 0) {
        options.forEach((option, index) => {
            // 创建按钮
            const button = document.createElement('button');
            button.dataset.index = index; // 保存索引，方便键盘操作
            
            // 创建数字提示
            const keyHintSpan = document.createElement('span');
            keyHintSpan.className = 'upgradeKeyHint';
            keyHintSpan.textContent = `[${index + 1}] `;
            keyHintSpan.style.marginRight = "8px";
            keyHintSpan.style.color = "#ffd700"; // 金色提示

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
            button.appendChild(keyHintSpan); // 添加数字按键提示
            button.appendChild(iconSpan);
            button.appendChild(textSpan);
            button.appendChild(descP);
            
            // 添加鼠标悬停效果
            button.addEventListener('mouseover', () => {
                selectUpgradeOption(index);
            });
            
            // 添加点击事件
            button.onclick = () => {
                executeUpgradeOption(option, levelUpScreenElement);
            };
            
            // 添加到容器
            upgradeOptionsContainer.appendChild(button);
        });
            
            // 默认选中第一个选项
            if (options.length > 0) {
                selectUpgradeOption(0);
            }
            
            // 添加键盘事件监听
            const handleKeyDown = (e) => {
                const key = e.key.toLowerCase();
                const numOptions = options.length;
                
                // 数字键1-4选择
                if (key >= '1' && key <= '4' && (parseInt(key) <= numOptions)) {
                    const optionIndex = parseInt(key) - 1;
                    
                    // 直接执行选项，不再需要先选中再确认的逻辑了，因为鼠标可以悬停选中
                    // if (currentSelection === optionIndex) {
                    // 如果已经选中，再次按下同一个数字键就确认选择
                    const selectedOption = options[optionIndex];
                    executeUpgradeOption(selectedOption, levelUpScreenElement);
                    // } else {
                    //     // 否则只是选中
                    //     selectUpgradeOption(optionIndex);
                    // }
                }
                // 小键盘数字键1-4选择
                else if (key === 'numpad1' || key === 'numpad2' || key === 'numpad3' || key === 'numpad4') {
                    const optionIndex = parseInt(key.replace('numpad', '')) - 1;
                    if (optionIndex < numOptions) {
                        // 直接执行选项
                        const selectedOption = options[optionIndex];
                        executeUpgradeOption(selectedOption, levelUpScreenElement);
                        // if (currentSelection === optionIndex) {
                        //     // 如果已经选中，再次按下同一个数字键就确认选择
                        //     const option = options[optionIndex];
                        //     executeUpgradeOption(option, levelUpScreenElement);
                        // } else {
                        //     // 否则只是选中
                        //     selectUpgradeOption(optionIndex);
                        // }
                    }
                }
                // W/上方向键选择上一个选项 (注释掉)
                /*
                else if (key === 'w' || key === 'arrowup') {
                    if (currentSelection > 0) {
                        selectUpgradeOption(currentSelection - 1);
                    } else {
                        selectUpgradeOption(numOptions - 1);
                    }
                }
                */
                // S/下方向键选择下一个选项 (注释掉)
                /*
                else if (key === 's' || key === 'arrowdown') {
                    if (currentSelection < numOptions - 1) {
                        selectUpgradeOption(currentSelection + 1);
                    } else {
                        selectUpgradeOption(0);
                    }
                }
                */
                // 空格键或Enter键确认选择 (注释掉)
                /*
                else if (key === ' ' || key === 'enter') {
                    if (currentSelection >= 0 && currentSelection < numOptions) {
                        const option = options[currentSelection];
                        executeUpgradeOption(option, levelUpScreenElement);
                    }
                }
                */
            };
            
            // 添加键盘事件监听器
            window.addEventListener('keydown', handleKeyDown);
            
            // 选中指定选项的函数
            function selectUpgradeOption(index) {
                // 移除所有选项的选中状态
                const allButtons = upgradeOptionsContainer.querySelectorAll('button');
                allButtons.forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // 设置当前选中项
                currentSelection = index;
                const selectedButton = allButtons[index];
                if (selectedButton) {
                    selectedButton.classList.add('selected');
                }
            }
            
            // 执行升级选项的函数
            function executeUpgradeOption(option, levelUpScreenElement) {
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

                    // 隐藏debug面板
                    hideLevelUpDebugStats();

                    // 移除键盘事件监听器
                    window.removeEventListener('keydown', handleKeyDown);

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
                    window.removeEventListener('keydown', handleKeyDown);
                }
            }
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

// 添加鼠标移动事件监听器
window.addEventListener('mousemove', () => {
    // 如果鼠标被隐藏，则显示
    if (isMouseHidden) {
        document.body.style.cursor = '';
        isMouseHidden = false;
    }
    // 更新最后鼠标移动时间
    lastMouseMoveTime = Date.now();
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
        
        // 确保width和height属性存在并赋值，防止"Cannot set properties of undefined"错误
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
                    
                    // 应用效果处理
                    
                    // 如果是蜘蛛敌人的投射物，应用减速效果并显示蜘蛛网特效
                    if (this.owner && this.owner.type && this.owner.type.name === "蜘蛛") {
                        // 应用减速效果
                        const slowFactor = 0.8; // 减速到80%（降低幅度从60%减为20%）
                        const slowDuration = 2.0; // 持续2秒
                        
                        // 应用减速效果（不叠加，取最强效果）
                        this.applySlowToPlayer(slowFactor, slowDuration);
                        
                        // 创建蜘蛛网视觉效果
                        this.createSpiderWebEffect();
                    }
                    // 如果是巫师敌人的投射物，应用更强的减速效果
                    else if (this.owner && this.owner.type && this.owner.type.name === "巫师") {
                        // 应用减速效果
                        const slowFactor = 0.5; // 减速到50%（降低幅度50%）
                        const slowDuration = 3.0; // 持续3秒
                        
                        // 应用减速效果（不叠加，取最强效果）
                        this.applySlowToPlayer(slowFactor, slowDuration);
                        
                        // 创建魔法减速视觉效果
                        this.createMagicSlowEffect();
                    }
                }
            }
        }
    }
    
    /**
     * 对玩家应用减速效果（不叠加，取最强效果）
     * @param {number} slowFactor - 减速因子
     * @param {number} slowDuration - 减速持续时间
     */
    applySlowToPlayer(slowFactor, slowDuration) {
        if (!player || !player.stats) return;
        // slowImmunity判定
        if (player.getStat && player.getStat('slowImmunity')) {
            if (player.statusEffects && player.statusEffects.slow) {
                delete player.statusEffects.slow;
                player.speed = player.getStat('speed');
            }
            return;
        }
        // 确保玩家有statusEffects对象
        if (!player.statusEffects) {
            player.statusEffects = {};
        }
        
        // 保存原有速度（如果没有已存在的减速效果）
        let originalSpeed = player.statusEffects.slow ? 
                          player.statusEffects.slow.originalSpeed : 
                          player.stats.speed;
        
        // 检查是否已有减速效果
        if (player.statusEffects.slow) {
            // 已有减速效果，取最强的效果（更低的factor值表示更强的减速）
            if (slowFactor <= player.statusEffects.slow.factor) {
                // 新的减速效果更强或相同，更新减速系数
                player.statusEffects.slow.factor = slowFactor;
                // 重置玩家速度为原速度×新减速系数
                player.stats.speed = originalSpeed * slowFactor;
            }
            // 不管新效果是否更强，都刷新持续时间（取较长的）
            player.statusEffects.slow.duration = Math.max(player.statusEffects.slow.duration, slowDuration);
        } else {
            // 没有已存在的减速效果，直接应用
            player.stats.speed *= slowFactor;
            
            player.statusEffects.slow = {
                factor: slowFactor,
                duration: slowDuration,
                originalSpeed: originalSpeed,
                source: this.owner,
                icon: '🐌' // 确保有蜗牛图标
            };
        }
    }
    
    /**
     * 创建魔法减速视觉效果
     */
    createMagicSlowEffect() {
        // 创建围绕玩家的魔法减速效果
        const effect = {
            x: player.x,
            y: player.y,
            size: player.size * 2.5,
            lifetime: 3.0, // 与减速效果持续时间一致
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 跟随玩家移动
                this.x = player.x;
                this.y = player.y;
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const alpha = 0.4 - (this.timer / this.lifetime) * 0.4; // 逐渐消失
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                // 绘制魔法减速效果
                ctx.save();
                ctx.globalAlpha = alpha;
                
                // 绘制魔法光环
                const gradientRadius = this.size / 2;
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, gradientRadius
                );
                
                gradient.addColorStop(0, 'rgba(80, 60, 220, 0.1)');
                gradient.addColorStop(0.4, 'rgba(120, 100, 255, 0.2)');
                gradient.addColorStop(0.8, 'rgba(80, 60, 220, 0.1)');
                gradient.addColorStop(1, 'rgba(80, 60, 220, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, gradientRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制魔法符文
                const runeCount = 6;
                const runeSize = this.size * 0.1;
                const runeOrbitRadius = this.size * 0.3;
                const runeAngleOffset = this.timer * 0.5; // 随时间旋转
                
                ctx.fillStyle = 'rgba(150, 130, 255, ' + alpha * 1.5 + ')';
                ctx.strokeStyle = 'rgba(200, 200, 255, ' + alpha * 1.5 + ')';
                ctx.lineWidth = 1;
                
                for (let i = 0; i < runeCount; i++) {
                    const angle = (Math.PI * 2 / runeCount) * i + runeAngleOffset;
                    const runeX = screenPos.x + Math.cos(angle) * runeOrbitRadius;
                    const runeY = screenPos.y + Math.sin(angle) * runeOrbitRadius;
                    
                    // 绘制魔法符文（简化为小星星）
                    ctx.beginPath();
                    for (let j = 0; j < 5; j++) {
                        const starAngle = (Math.PI * 2 / 5) * j - Math.PI / 2;
                        const x = runeX + Math.cos(starAngle) * runeSize * (j % 2 === 0 ? 1 : 0.5);
                        const y = runeY + Math.sin(starAngle) * runeSize * (j % 2 === 0 ? 1 : 0.5);
                        
                        if (j === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        };
        
        visualEffects.push(effect);
    }
    
    /**
     * 创建命中特效
     */
    createHitEffect() {
        // 确定效果颜色
        let effectColor = 'rgba(255, 50, 50, ${alpha})'; // 默认红色
        
        // 如果是蜘蛛敌人的投射物，使用白色
        if (this.owner && this.owner.type && this.owner.type.name === "蜘蛛") {
            effectColor = 'rgba(255, 255, 255, ${alpha})';
        }
        
        // 创建爆炸效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.size * 2,
            lifetime: 0.3,
            timer: 0,
            isGarbage: false,
            effectColor: effectColor,
            
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
                
                // 使用动态颜色
                ctx.fillStyle = this.effectColor.replace('${alpha}', alpha);
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        visualEffects.push(effect);
    }
    
    /**
     * 创建蜘蛛网视觉效果
     */
    createSpiderWebEffect() {
        const webEffect = {
            x: player.x,
            y: player.y,
            size: player.size * 2.0, // 蜘蛛网比玩家大一倍
            lifetime: 2.0, // 持续2秒，与减速效果一致
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const alpha = Math.max(0, 0.7 - (this.timer / this.lifetime) * 0.7); // 逐渐消失
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                // 绘制蜘蛛网
                ctx.save();
                ctx.globalAlpha = alpha;
                
                // 绘制蜘蛛网的放射线
                ctx.strokeStyle = "white";
                ctx.lineWidth = 1;
                const segments = 8;
                const radius = this.size / 2;
                
                // 绘制放射状线条
                for (let i = 0; i < segments; i++) {
                    const angle = (Math.PI * 2) / segments * i;
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x, screenPos.y);
                    ctx.lineTo(
                        screenPos.x + Math.cos(angle) * radius,
                        screenPos.y + Math.sin(angle) * radius
                    );
                    ctx.stroke();
                }
                
                // 绘制同心圆
                const rings = 3;
                for (let i = 1; i <= rings; i++) {
                    const ringRadius = radius * (i / rings);
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, ringRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                ctx.restore();
            }
        };
        
        visualEffects.push(webEffect);
    }
    
    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果投射物不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;
        
        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        
        // 如果是蜘蛛敌人的投射物，绘制白色蛛网球
        if (this.owner && this.owner.type && this.owner.type.name === "蜘蛛") {
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
            
            // 画一些简单的蛛丝线条
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
            
            for (let i = 0; i < 4; i++) {
                const angle = Math.PI / 4 * i;
                const length = this.size / 2;
                
                ctx.beginPath();
                ctx.moveTo(screenPos.x, screenPos.y);
                ctx.lineTo(
                    screenPos.x + Math.cos(angle) * length,
                    screenPos.y + Math.sin(angle) * length
                );
                ctx.stroke();
            }
        } 
        // 其他敌人的投射物保持原样
        else if (this.emoji) {
            // 绘制emoji
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        } else {
            // 绘制圆形
            ctx.fillStyle = 'red';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 基础武器列表 - 确保类名与定义文件一致
if (typeof BASE_WEAPONS === 'undefined') {
    console.log('Creating BASE_WEAPONS array in game.js');
    window.BASE_WEAPONS = [];
}

// 检查并确保必需的武器类已添加到武器列表中
let weaponClasses = {
    DaggerWeapon: false,
    WhipWeapon: false,
    GarlicWeapon: false,
    FireBladeWeapon: false,
    StormBladeWeapon: false,
    HandshakeWeapon: false,
    PoisonVialWeapon: false,
    FrostStaffWeapon: false,
    VineSeedWeapon: false,
    LaserPrismWeapon: false,
    BubbleWandWeapon: false,
    ChaosDiceWeapon: false,
    VolcanoStaffWeapon: false,
    BlackHoleBallWeapon: false,
    MagnetGunWeapon: false
};

// 检查现有武器列表
if (BASE_WEAPONS.length > 0) {
    console.log('Existing BASE_WEAPONS from weapons files:', BASE_WEAPONS.map(w => w.name));
    
    // 标记已存在的武器类
    BASE_WEAPONS.forEach(weaponClass => {
        if (weaponClass.name in weaponClasses) {
            weaponClasses[weaponClass.name] = true;
        }
    });
}

// 添加缺失的武器类
Object.keys(weaponClasses).forEach(className => {
    if (!weaponClasses[className] && typeof window[className] !== 'undefined') {
        console.log(`Adding missing weapon class: ${className}`);
        BASE_WEAPONS.push(window[className]);
    } else if (!weaponClasses[className]) {
        console.error(`${className} is undefined!`);
    }
});

console.log('Final BASE_WEAPONS array:', BASE_WEAPONS.map(w => w.name));

// 基础被动道具列表 - 确保类名与定义文件一致
if (typeof BASE_PASSIVES === 'undefined') {
    console.log('Creating BASE_PASSIVES array in game.js');
    window.BASE_PASSIVES = [];
}

// 检查并确保必需的被动物品类已添加到列表中
let passiveClasses = {
    Magnet: false,
    HollowHeart: false,
    Pummarola: false,
    Spinach: false,
    Armor: false,
    Wings: false,
    EmptyTome: false,
    Candelabrador: false,
    Bracer: false,
    SoulRelic: false,
    MagicCrystal: false,
    MysteryCard: false,
    OccultCharm: false,
    BarrierRune: false,
    FrostHeart: false,
    DragonSpice: false,
    ThunderAmulet: false,
    PoisonOrb: false,
    MagnetSphere: false,
    AncientTreeSap: false // 确保古树精华也被包含
};

// 检查现有被动物品列表
if (BASE_PASSIVES.length > 0) {
    console.log('Existing BASE_PASSIVES from passiveItems.js:', BASE_PASSIVES.map(p => p.name));
    
    // 标记已存在的被动物品类
    BASE_PASSIVES.forEach(passiveClass => {
        if (passiveClass.name in passiveClasses) {
            passiveClasses[passiveClass.name] = true;
        }
    });
}

// 添加缺失的被动物品类
Object.keys(passiveClasses).forEach(className => {
    if (!passiveClasses[className] && typeof window[className] !== 'undefined') {
        console.log(`Adding missing passive class: ${className}`);
        BASE_PASSIVES.push(window[className]);
    }
});

// 显式确保关键被动物品被添加
const criticalPassives = ["Spinach", "Wings", "Bracer", "HollowHeart", "AncientTreeSap"];
console.log("开始注册关键被动物品类...");

// 清理过程：确保没有重复
const existingClassNames = BASE_PASSIVES.map(cls => cls.name);
console.log("当前已注册被动物品类:", existingClassNames);

// 直接检查并添加这些关键类
criticalPassives.forEach(className => {
    // 检查是否已经存在于数组中
    if (existingClassNames.includes(className)) {
        console.log(`${className}已存在于BASE_PASSIVES中，无需重复添加`);
        return;
    }
    
    // 检查全局对象中是否存在这个类
    if (typeof window[className] === 'function') {
        console.log(`直接添加${className}到BASE_PASSIVES数组`);
        BASE_PASSIVES.push(window[className]);
    } else {
        console.error(`错误：全局空间中没有找到${className}类`);
        
        // 尝试创建类（针对特殊情况）
        try {
            // 针对菠菜类特殊处理
            if (className === "Spinach" && Spinach) {
                console.log("找到Spinach类，直接添加");
                BASE_PASSIVES.push(Spinach);
            } 
            // 针对翅膀类特殊处理
            else if (className === "Wings" && Wings) {
                console.log("找到Wings类，直接添加");
                BASE_PASSIVES.push(Wings);
            }
            // 针对护腕类特殊处理
            else if (className === "Bracer" && Bracer) {
                console.log("找到Bracer类，直接添加");
                BASE_PASSIVES.push(Bracer);
            }
            // 针对空心胸甲类特殊处理
            else if (className === "HollowHeart" && HollowHeart) {
                console.log("找到HollowHeart类，直接添加");
                BASE_PASSIVES.push(HollowHeart);
            }
            // 针对古树精华类特殊处理
            else if (className === "AncientTreeSap" && AncientTreeSap) {
                console.log("找到AncientTreeSap类，直接添加");
                BASE_PASSIVES.push(AncientTreeSap);
            }
        } catch (e) {
            console.error(`尝试特殊处理${className}类时出错:`, e);
        }
    }
});

// 确保类名匹配
BASE_PASSIVES.forEach(cls => {
    if (cls && typeof cls === 'function' && cls.prototype) {
        if (!cls.name) {
            console.warn(`警告：BASE_PASSIVES中存在未命名类`);
        } else {
            console.log(`确认：成功添加${cls.name}类`);
        }
    } else {
        console.warn(`警告：BASE_PASSIVES中存在无效类对象:`, cls);
    }
});

console.log('最终BASE_PASSIVES数组:', BASE_PASSIVES.map(p => p && p.name ? p.name : 'UnknownClass'));

function spawnRandomPickup(x, y) {
    const rand = Math.random();

    // 调整掉落率：
    // 磁铁: 2% -> 0.5%
    // 心: 3% -> 3% (累计概率，所以是 0.005 到 0.035)
    if (rand < 0.005) { // 0.5% 几率掉落磁铁
        spawnPickup(x, y, 'magnet');
    } else if (rand < 0.035) { // 3% 几率掉落心 (0.035 - 0.005 = 0.03)
        spawnPickup(x, y, 'heart');
    } else {
        // 剩余 (96.5%) 几率掉落经验
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

/**
 * 清理游戏对象
 */
function cleanupGameObjects() {
    // 清理敌人
    for (let i = enemies.length - 1; i >= 0; i--) {
        if (enemies[i].isGarbage) {
            enemies.splice(i, 1);
        }
    }
    
    // 清理经验宝石
    for (let i = xpGems.length - 1; i >= 0; i--) {
        if (xpGems[i].isGarbage) {
            xpGems.splice(i, 1);
        }
    }
    
    // 清理世界物体
    for (let i = worldObjects.length - 1; i >= 0; i--) {
        if (worldObjects[i].isGarbage) {
            worldObjects.splice(i, 1);
        }
    }
    
    // 清理伤害数字
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        if (damageNumbers[i].isGarbage) {
            damageNumbers.splice(i, 1);
        }
    }
    
    // 清理视觉特效
    for (let i = visualEffects.length - 1; i >= 0; i--) {
        if (visualEffects[i].isGarbage) {
            visualEffects.splice(i, 1);
        }
    }
    
    // 清理粒子效果
    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].isGarbage) {
            particles.splice(i, 1);
        }
    }
    
    // 清理活动的幽灵
    for (let i = activeGhosts.length - 1; i >= 0; i--) {
        if (activeGhosts[i].isGarbage) {
            activeGhosts.splice(i, 1);
        }
    }
    
    // 清理持续性危害物
    for (let i = hazards.length - 1; i >= 0; i--) {
        if (hazards[i].isGarbage) {
            hazards.splice(i, 1);
        }
    }
}

/**
 * 重置游戏状态
 */
function resetGame() {
    // 重置游戏状态
    isGameRunning = false;
    isGameOver = false;
    isPaused = false;
    isLevelUp = false;
    gameTime = 0;
    lastTime = 0;
    deltaTime = 0;
    killCount = 0;
    
    // 重置对象数组
    player = null;
    enemies = [];
    projectiles = [];
    enemyProjectiles = [];
    xpGems = [];
    worldObjects = [];
    visualEffects = [];
    damageNumbers = [];
    activeGhosts = [];
    hazards = [];
    particles = [];
    
    // 重置对象池
    inactiveProjectiles = [];
    inactiveDamageNumbers = [];
    
    // 重置按键状态
    keys = {};
    
    // 重置相机
    cameraManager.resetCamera();
    
    // 如果有动画帧，取消它
    if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
}

/**
 * 开始游戏
 */
function startGame() {
    // 重置游戏状态
    resetGame();
    
    // 隐藏开始屏幕
    document.getElementById('startScreen').classList.add('hidden');
    
    // 创建玩家
    player = new Player(400, 300);
    window.player = player;
    
    // 创建初始武器
    const dagger = new DaggerWeapon();
    player.addWeapon(dagger);
    
    // 设置游戏状态
    isGameRunning = true;
    isGameOver = false;
    gameTime = 0;
    
    // 重置摄像机
    cameraManager.following = player;
    
    // 启动游戏循环
    lastTime = 0;
    animationFrameId = requestAnimationFrame(gameLoop);
    
    // 更新UI
    updateUI();
}

/**
 * 显示升级时的debug属性面板
 */
function showLevelUpDebugStats() {
    const debugPanel = document.getElementById('levelUpDebugPanel');
    const debugStatsContainer = document.getElementById('debugStats');
    
    if (!debugPanel || !debugStatsContainer || !player) return;
    
    // 清空容器
    debugStatsContainer.innerHTML = '';
    
    // 创建并填充属性列表
    const stats = [
        { name: "生命值", value: Math.ceil(player.health) + "/" + Math.ceil(player.getStat('health')) },
        { name: "武器伤害", value: player.getStat('damageMultiplier').toFixed(2) },
        { name: "攻击速度", value: player.getStat('cooldownMultiplier').toFixed(2) },
        { name: "攻击范围", value: player.getStat('areaMultiplier').toFixed(2) },
        { name: "持续时间", value: player.getStat('durationMultiplier').toFixed(2) },
        { name: "投射物数量", value: player.getStat('projectileCountBonus') },
        { name: "投射物速度", value: player.getStat('projectileSpeedMultiplier').toFixed(2) },
        { name: "生命恢复", value: player.getStat('regen').toFixed(1) + "/秒" },
        { name: "移动速度", value: player.getCurrentSpeed().toFixed(0) },
        { name: "拾取范围", value: player.getStat('pickupRadius').toFixed(0) },
        { name: "护甲", value: player.getStat('armor').toFixed(1) },
        { name: "减伤百分比", value: (player.getStat('damageReductionPercent') * 100).toFixed(1) + "%" },
        { name: "暴击率", value: (player.getStat('critChance') * 100).toFixed(1) + "%" },
        { name: "暴击伤害", value: (player.getStat('critMultiplier')).toFixed(2) + "x" },
        { name: "幸运值", value: player.getStat('luck').toFixed(1) }
    ];
    
    // 动态创建每一行
    stats.forEach(stat => {
        const div = document.createElement('div');
        div.innerHTML = `<span class="statName">${stat.name}</span>: <span class="statValue">${stat.value}</span>`;
        debugStatsContainer.appendChild(div);
    });
    
    // 显示面板
    debugPanel.style.display = 'block';
}

/**
 * 隐藏升级时的debug属性面板
 */
function hideLevelUpDebugStats() {
    const debugPanel = document.getElementById('levelUpDebugPanel');
    if (debugPanel) {
        debugPanel.style.display = 'none';
    }
}

// Boss 血条 UI 控制
const bossHealthUIContainer = document.getElementById('bossHealthUIContainer');
const bossHealthBarFill = document.getElementById('bossHealthBarFill');
const bossHealthValueText = document.getElementById('bossHealthValueText'); // 新增：获取血量数值的span
let currentBossForHealthBar = null;

function showBossHealthBar(boss) {
    console.log('[showBossHealthBar] Called. Boss object:', boss, 'UI Container:', bossHealthUIContainer); // DEBUG
    if (!bossHealthUIContainer || !boss) return;
    currentBossForHealthBar = boss;
    bossHealthUIContainer.classList.remove('hidden');
    updateBossHealthBar(); // 初始更新一次
    console.log("Boss health bar shown for:", boss.name || 'Unknown Boss');
}

function hideBossHealthBar() {
    console.log('[hideBossHealthBar] Called. UI Container:', bossHealthUIContainer, 'currentBossForHealthBar:', currentBossForHealthBar); // DEBUG
    if (!bossHealthUIContainer) return;
    bossHealthUIContainer.classList.add('hidden');
    currentBossForHealthBar = null;
    console.log("Boss health bar hidden.");
}

function updateBossHealthBar() {
    if (!bossHealthBarFill || !currentBossForHealthBar || typeof currentBossForHealthBar.health === 'undefined' || typeof currentBossForHealthBar.maxHealth === 'undefined') {
        console.warn('[updateBossHealthBar] Fill element, current boss, or boss health/maxHealth is missing/undefined. Boss:', currentBossForHealthBar);
        if (currentBossForHealthBar) {
            console.warn(`[updateBossHealthBar] Boss Details: health=${currentBossForHealthBar.health}, maxHealth=${currentBossForHealthBar.maxHealth}`);
        }
        // 如果血量文本元素存在，清空它或显示占位符
        if (bossHealthValueText) {
            bossHealthValueText.textContent = ''; 
        }
        return;
    }

    const health = Math.max(0, currentBossForHealthBar.health);
    const maxHealth = Math.max(1, currentBossForHealthBar.maxHealth);
    const lostHealthPercentage = Math.max(0, (1 - (health / maxHealth)) * 100);
    bossHealthBarFill.style.width = lostHealthPercentage + '%';

    // 更新血量数值文本
    if (bossHealthValueText) {
        bossHealthValueText.textContent = `${Math.ceil(health)} / ${Math.ceil(maxHealth)}`;
    }

    console.log(`[updateBossHealthBar] Boss: ${currentBossForHealthBar.type.name}, Health: ${health}/${maxHealth}, Lost Health %: ${lostHealthPercentage.toFixed(2)}%`);
}

// 你需要在你的游戏逻辑中找到合适的地方调用这些函数。
// 例如，在生成Boss的函数末尾：
// if (newBoss.isBoss) { // 假设你的Boss对象有一个 isBoss 属性
//     showBossHealthBar(newBoss);
// }

// 在Boss受到伤害的逻辑中：
// if (bossWasHit && currentBossForHealthBar === thatBoss) {
//     updateBossHealthBar();
// }

// 在Boss死亡的逻辑中：
// if (bossDied && currentBossForHealthBar === thatBoss) {
//     hideBossHealthBar();
// }

// 也可以考虑在游戏主循环 (game loop) 中定期调用 updateBossHealthBar() 
// if (currentBossForHealthBar && !bossHealthUIContainer.classList.contains('hidden')) {
//     updateBossHealthBar();
// }
