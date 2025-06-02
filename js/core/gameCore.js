/**
 * 游戏核心系统
 * 包含游戏循环、初始化、绘制和主要的游戏状态管理功能
 */

// 移除重复声明，使用gameStateManager.js中的全局变量
// 注意：offscreenCanvas, offscreenCtx 已在gameStateManager.js中声明
// 注意：playerImage, backgroundImage 已在gameStateManager.js中声明
// 注意：animationFrameId, lastTime, deltaTime 已在gameStateManager.js中声明

// 注意：鼠标隐藏相关变量已在gameStateManager.js中声明
// 注意：对象池已在gameStateManager.js中声明

/**
 * 强制注册被动物品到BASE_PASSIVES数组
 */
function forceRegisterPassiveItems() {
    console.log("强制注册被动物品到BASE_PASSIVES...");
    
    // 确保BASE_PASSIVES存在
    if (typeof window.BASE_PASSIVES === 'undefined') {
        window.BASE_PASSIVES = [];
    }
    
    // 清空现有数组
    BASE_PASSIVES.length = 0;
    
    // 手动添加所有被动物品类
    const passiveClasses = [
        Spinach, Wings, Bracer, HollowHeart, AncientTreeSap, 
        EmptyBottle, Gargoyle, BarrierRune, FrostHeart, 
        DragonSpice, ThunderAmulet, PoisonOrb, MagnetSphere, SoulRelic
    ];
    
    passiveClasses.forEach(cls => {
        if (cls && typeof cls === 'function') {
            BASE_PASSIVES.push(cls);
            console.log(`已注册被动物品: ${cls.name}`);
        } else {
            console.error(`无效的被动物品类:`, cls);
        }
    });
    
    console.log(`BASE_PASSIVES注册完成，共 ${BASE_PASSIVES.length} 个被动物品`);
    return BASE_PASSIVES;
}

/**
 * 初始化游戏
 */
function init() {
    try {
        console.log("Game initialization started");
        
        // 获取Canvas和Context
        canvas = document.getElementById('gameCanvas');
        ctx = canvas.getContext('2d');
        
        // 强制注册被动物品
        forceRegisterPassiveItems();
        
        resetGame(); //确保在初始化前重置所有状态

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

        // 从预加载的资源中获取图像
        playerImage = loadedAssets.player;
        backgroundImage = loadedAssets.background;

        if (!playerImage) {
            console.error("玩家图片未能从预加载资源中获取！");
        }
        if (!backgroundImage) {
            console.warn("背景图片未能从预加载资源中获取，将使用纯色背景。");
        }

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
        bossManager.nextBossTime = FIRST_BOSS_TIME;
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

        // 游戏实际开始时显示游戏内主要UI
        const topLeftUI = document.getElementById('topLeftUI');
        const topRightUI = document.getElementById('topRightUI');
        const bottomLeftUI = document.getElementById('bottomLeftUI');
        if (topLeftUI) topLeftUI.classList.remove('hidden');
        if (topRightUI) topRightUI.classList.remove('hidden');
        if (bottomLeftUI) bottomLeftUI.classList.remove('hidden');

        console.log("Emoji 幸存者 - 重构版 已初始化。游戏开始！");
    } catch (error) {
        console.error("游戏初始化错误:", error);
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
 * 更新游戏状态
 * @param {number} dt - 时间增量
 */
function update(dt) {
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

    // 更新活动的幽灵
    for (let i = activeGhosts.length - 1; i >= 0; i--) {
        if (activeGhosts[i] && !activeGhosts[i].isGarbage && activeGhosts[i].isActive) {
            activeGhosts[i].update(dt);
        } else if (activeGhosts[i] && activeGhosts[i].isGarbage) {
            // GhostEnemy.destroy() 应该已经处理了从数组中移除
        }
    }

    // 更新持续性危害物（藤蔓、火山等）
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

    // 处理宝箱多次升级
    if (player && player.pendingLevelUpsFromChest > 0 && !isPaused && !isLevelUp) {
        console.log(`宝箱升级待处理: ${player.pendingLevelUpsFromChest} 次. Setting isLevelUp = true.`);
        isLevelUp = true; // 标记需要显示升级界面
        player.pendingLevelUpsFromChest--; 
    }

    // 处理升级
    if (isLevelUp) {
        presentLevelUpOptions();
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
            const currentIntensity = screenShakeIntensity;

            appliedShakeX = (Math.random() - 0.5) * 2 * currentIntensity;
            appliedShakeY = (Math.random() - 0.5) * 2 * currentIntensity;
            ctx.translate(appliedShakeX, appliedShakeY);
        }

        // 清除离屏画布并重置其状态 - 修复透明度累积问题
        offscreenCtx.save();
        offscreenCtx.setTransform(1, 0, 0, 1, 0, 0); // 重置变换矩阵
        offscreenCtx.globalAlpha = 1; // 重置透明度
        offscreenCtx.globalCompositeOperation = 'source-over'; // 重置混合模式
        offscreenCtx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); // 清除画布
        offscreenCtx.restore();

        // 使用离屏画布进行绘制
        if (backgroundImage && backgroundImage.complete && backgroundImage.naturalHeight !== 0) {
            // 使用图片作为背景纹理
            const pattern = offscreenCtx.createPattern(backgroundImage, 'repeat');
            offscreenCtx.fillStyle = pattern;
            
            // 计算重复纹理的偏移，基于相机位置实现视差效果
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
                offscreenCtx.save(); // 保护画布状态
                worldObjects[i].draw(offscreenCtx);
                offscreenCtx.restore(); // 恢复画布状态
            }
        }

        // 绘制经验宝石 (第二层)
        for (let i = 0; i < xpGems.length; i++) {
            if (!xpGems[i].isGarbage && xpGems[i].isActive) {
                offscreenCtx.save();
                xpGems[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 绘制持续性危害物 (第三层)
        for (let i = 0; i < hazards.length; i++) {
            if (hazards[i] && !hazards[i].isGarbage) {
                offscreenCtx.save();
                hazards[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 绘制投射物 (第四层)
        for (let i = 0; i < projectiles.length; i++) {
            if (!projectiles[i].isGarbage && projectiles[i].isActive) {
                offscreenCtx.save();
                projectiles[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }
        
        // 绘制敌人投射物
        for (let i = 0; i < enemyProjectiles.length; i++) {
            if (!enemyProjectiles[i].isGarbage && enemyProjectiles[i].isActive) {
                offscreenCtx.save();
                enemyProjectiles[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 绘制视觉特效
        for (let i = 0; i < visualEffects.length; i++) {
            if (!visualEffects[i].isGarbage) {
                offscreenCtx.save();
                visualEffects[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 绘制敌人 (第五层)
        for (let i = 0; i < enemies.length; i++) {
            if (!enemies[i].isGarbage && enemies[i].isActive) {
                offscreenCtx.save();
                enemies[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 绘制活动的幽灵
        for (let i = 0; i < activeGhosts.length; i++) {
            if (activeGhosts[i] && !activeGhosts[i].isGarbage && activeGhosts[i].isActive) {
                offscreenCtx.save();
                activeGhosts[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 绘制玩家 (最顶层)
        if (player && !player.isGarbage && player.isActive) {
            offscreenCtx.save();
            
            // 绘制武器光环（在玩家之前绘制，这样玩家会显示在光环上方）
            if (player.weapons) {
                player.weapons.forEach(weapon => {
                    if (weapon && typeof weapon.drawAura === 'function') {
                        offscreenCtx.save();
                        weapon.drawAura(offscreenCtx, player);
                        offscreenCtx.restore();
                    }
                });
            }
            
            // 绘制玩家
            player.draw(offscreenCtx);
            offscreenCtx.restore();
        }

        // 绘制伤害数字 (UI层)
        for (let i = 0; i < damageNumbers.length; i++) {
            if (!damageNumbers[i].isGarbage && damageNumbers[i].isActive) {
                offscreenCtx.save();
                damageNumbers[i].draw(offscreenCtx);
                offscreenCtx.restore();
            }
        }

        // 将离屏画布内容复制到主画布
        ctx.clearRect(0, 0, GAME_WIDTH, GAME_HEIGHT); // 同样清除主画布
        ctx.drawImage(offscreenCanvas, 0, 0);

        // 恢复画布状态 (移除震动等变换)
        ctx.restore();
    } catch (error) {
        console.error("绘制过程中发生错误:", error);
    }
}

/**
 * 生成投射物（对象池）
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
 */
function spawnDamageNumber(x, y, text, color = 'white', size = GAME_FONT_SIZE * 0.8, duration = 0.7, isCrit = false) {
    let damageNumber = null;
    if (inactiveDamageNumbers.length > 0) {
        damageNumber = inactiveDamageNumbers.pop();
        damageNumber.init(x, y, text, size, color, duration, isCrit);
    } else {
        damageNumber = new DamageNumber(x, y, text, size, color, duration, isCrit);
    }
    damageNumbers.push(damageNumber);
    return damageNumber;
}

/**
 * 开始游戏
 */
function startGame() {
    if (isGameRunning) return;

    // 在加载和开始屏幕时隐藏游戏内主要UI
    const topLeftUI = document.getElementById('topLeftUI');
    const topRightUI = document.getElementById('topRightUI');
    const bottomLeftUI = document.getElementById('bottomLeftUI');
    if (topLeftUI) topLeftUI.classList.add('hidden');
    if (topRightUI) topRightUI.classList.add('hidden');
    if (bottomLeftUI) bottomLeftUI.classList.add('hidden');

    // 显示加载屏幕，隐藏开始屏幕
    document.getElementById('loadingScreen').classList.remove('hidden');
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelUpScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');

    loadAssets(() => {
        // 资源加载完成后
        document.getElementById('loadingScreen').classList.add('hidden');
        document.getElementById('startScreen').classList.remove('hidden'); // 显示开始屏幕

        // 游戏开始按钮事件
        const startButton = document.getElementById('startButton');
        // 移除旧的事件监听器，防止重复绑定
        const newStartButton = startButton.cloneNode(true);
        startButton.parentNode.replaceChild(newStartButton, startButton);

        newStartButton.addEventListener('click', () => {
            console.log("开始游戏按钮被点击");
            document.getElementById('startScreen').classList.add('hidden');
            init(); // 直接调用init开始游戏
            lastTime = performance.now();
            gameLoop(lastTime);
        });

        // 重新开始按钮事件
        const restartButton = document.getElementById('restartButton');
        if (restartButton) {
            const newRestartButton = restartButton.cloneNode(true);
            restartButton.parentNode.replaceChild(newRestartButton, restartButton);
            
            newRestartButton.addEventListener('click', () => {
                console.log("重新开始按钮被点击");
                document.getElementById('gameOverScreen').classList.add('hidden');
                init();
                lastTime = performance.now();
                gameLoop(lastTime);
            });
        }

        // 继续按钮事件
        const resumeButton = document.getElementById('resumeButton');
        if (resumeButton) {
            const newResumeButton = resumeButton.cloneNode(true);
            resumeButton.parentNode.replaceChild(newResumeButton, resumeButton);
            
            newResumeButton.addEventListener('click', () => {
                resumeGame();
            });
        }
    });
}

// 确保在DOM加载完成后调用startGame来启动加载过程
window.addEventListener('DOMContentLoaded', () => {
    console.log("DOM 已加载，准备开始资源加载流程。");
    // 初始隐藏所有覆盖屏幕，除了加载屏幕
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOverScreen').classList.add('hidden');
    document.getElementById('levelUpScreen').classList.add('hidden');
    document.getElementById('pauseScreen').classList.add('hidden');
    document.getElementById('loadingScreen').classList.remove('hidden');

    startGame(); // 开始加载资源，加载完毕后显示开始屏幕
}); 