/**
 * 游戏主脚本
 * 包含游戏初始化、更新和绘制逻辑
 */

// --- 获取DOM元素 ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const ui = document.getElementById('ui');
const healthValueUI = document.getElementById('healthValue');
const maxHealthValueUI = document.getElementById('maxHealthValue');
const healthBarUI = document.getElementById('healthBar');
const levelValueUI = document.getElementById('levelValue');
const xpValueUI = document.getElementById('xpValue');
const xpNextLevelValueUI = document.getElementById('xpNextLevelValue');
const xpBarUI = document.getElementById('xpBar');
const timerValueUI = document.getElementById('timerValue');
const weaponIconsUI = document.getElementById('weaponIcons');
const passiveIconsUI = document.getElementById('passiveIcons');
const killCountValueUI = document.getElementById('killCountValue');

const startScreen = document.getElementById('startScreen');
const levelUpScreen = document.getElementById('levelUpScreen');
const pauseScreen = document.getElementById('pauseScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const upgradeOptionsContainer = document.getElementById('upgradeOptions');
const finalTimeUI = document.getElementById('finalTime');
const finalLevelUI = document.getElementById('finalLevel');
const finalKillsUI = document.getElementById('finalKills');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const resumeButton = document.getElementById('resumeButton');
const bossWarningUI = document.getElementById('bossWarning');

// --- 设置画布尺寸 ---
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// --- 创建离屏画布 ---
const offscreenCanvas = document.createElement('canvas');
const offscreenCtx = offscreenCanvas.getContext('2d', { alpha: false });
offscreenCanvas.width = GAME_WIDTH;
offscreenCanvas.height = GAME_HEIGHT;

/**
 * 初始化游戏
 */
function init() {
    // 清空对象池和活动列表
    inactiveProjectiles = [];
    inactiveDamageNumbers = [];
    projectiles = [];
    damageNumbers = [];
    enemies = [];
    xpGems = [];
    worldObjects = [];
    visualEffects = [];
    // 重置状态
    isGameOver = false;
    isPaused = false;
    isLevelUp = false;
    gameTime = 0;
    killCount = 0;
    // 创建玩家
    player = new Player(0, 0); // 在世界中心创建玩家
    player.addWeapon(new DaggerWeapon());
    // 重置可用武器和被动道具
    availableWeapons = [DaggerWeapon, GarlicWeapon, WhipWeapon, FireDaggerWeapon, StormBladeWeapon, HandshakeWeapon];
    availablePassives = [Spinach, Armor, Wings, EmptyTome, Candelabrador, Bracer, HollowHeart, Pummarola, Magnet];
    // 重置UI
    gameOverScreen.classList.add('hidden');
    levelUpScreen.classList.add('hidden');
    pauseScreen.classList.add('hidden');
    startScreen.classList.add('hidden');
    // 重置双缓冲画布尺寸
    offscreenCanvas.width = GAME_WIDTH;
    offscreenCanvas.height = GAME_HEIGHT;
    // 重置相机位置
    cameraManager.x = 0;
    cameraManager.y = 0;
    cameraManager.targetX = 0;
    cameraManager.targetY = 0;
    // 重置敌人和Boss管理器
    enemyManager.spawnTimer = 0;
    enemyManager.currentSpawnInterval = BASE_SPAWN_INTERVAL;
    enemyManager.difficultyTimer = 0;
    bossManager.nextBossTime = BOSS_INTERVAL;
    bossManager.currentBoss = null;
    bossManager.bossWarningTimer = 0;
    bossManager.showingWarning = false;
    // 开始游戏循环
    lastTime = performance.now();
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    animationFrameId = requestAnimationFrame(gameLoop);
    // 更新UI
    updateUI();
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
 * @param {number} size - 大小
 * @param {string} color - 颜色
 * @param {number} duration - 持续时间
 * @returns {DamageNumber} 生成的伤害数字
 */
function spawnDamageNumber(x, y, text, size = 20, color = 'white', duration = 0.8) {
    let damageNumber = null;
    if (inactiveDamageNumbers.length > 0) {
        damageNumber = inactiveDamageNumbers.pop();
        damageNumber.init(x, y, text, color, duration);
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
    // 如果游戏结束或暂停或升级，只更新经验宝石
    if (isGameOver || isPaused || isLevelUp) {
        if (player && xpGems.length > 0) {
            xpGems.forEach(gem => gem.update(dt * 3.5, player));
        }
        return;
    }
    // 更新游戏时间
    gameTime += dt;
    // 更新相机
    cameraManager.update(player, dt);
    // 更新敌人管理器
    enemyManager.update(dt, gameTime, player);
    // 更新Boss管理器
    bossManager.update(dt, gameTime, player);
    // 更新玩家
    if (player) {
        player.update(dt, keys);
    }
    // 更新敌人
    for (let i = 0; i < enemies.length; i++) {
        if (!enemies[i].isGarbage && enemies[i].isActive) {
            enemies[i].update(dt, player);
        }
    }
    // 更新投射物
    for (let i = 0; i < projectiles.length; i++) {
        if (!projectiles[i].isGarbage && projectiles[i].isActive) {
            projectiles[i].update(dt);
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
    // 对象池回收
    // 倒序遍历以安全地使用 splice
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectiles[i].isGarbage) {
            const proj = projectiles.splice(i, 1)[0];
            proj.isActive = false;
            inactiveProjectiles.push(proj);
        }
    }
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
    // 处理升级
    if (isLevelUp) {
        presentLevelUpOptions();
        isLevelUp = false;
    }
    // 更新UI
    updateUI();
}

/**
 * 绘制游戏
 */
function draw() {
    try {
        // 使用离屏画布进行绘制
        offscreenCtx.fillStyle = '#2d2d3a';
        offscreenCtx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        // 绘制背景
        cameraManager.drawBackground(offscreenCtx);
        // 应用相机变换
        cameraManager.applyTransform(offscreenCtx);
        // 绘制经验宝石
        for (let i = 0; i < xpGems.length; i++) {
            if (!xpGems[i].isGarbage && xpGems[i].isActive && cameraManager.isVisible(xpGems[i])) {
                xpGems[i].draw(offscreenCtx);
            }
        }
        // 绘制世界物体
        for (let i = 0; i < worldObjects.length; i++) {
            if (!worldObjects[i].isGarbage && worldObjects[i].isActive && cameraManager.isVisible(worldObjects[i])) {
                worldObjects[i].draw(offscreenCtx);
            }
        }
        // 绘制敌人
        for (let i = 0; i < enemies.length; i++) {
            if (!enemies[i].isGarbage && enemies[i].isActive && cameraManager.isVisible(enemies[i])) {
                enemies[i].draw(offscreenCtx);
            }
        }
        // 绘制投射物
        for (let i = 0; i < projectiles.length; i++) {
            if (!projectiles[i].isGarbage && projectiles[i].isActive && cameraManager.isVisible(projectiles[i])) {
                projectiles[i].draw(offscreenCtx);
            }
        }
        // 绘制玩家和武器效果
        if (player && !player.isGarbage && player.isActive) {
            // 绘制武器效果
            for (let i = 0; i < player.weapons.length; i++) {
                const weapon = player.weapons[i];
                if (weapon.drawAura) weapon.drawAura(offscreenCtx, player);
                if (weapon.drawHitboxes) weapon.drawHitboxes(offscreenCtx);
                if (weapon.drawEffects) weapon.drawEffects(offscreenCtx);
            }
            // 绘制玩家
            player.draw(offscreenCtx);
        }
        // 绘制视觉特效
        for (let i = 0; i < visualEffects.length; i++) {
            if (!visualEffects[i].isGarbage) {
                visualEffects[i].draw(offscreenCtx);
            }
        }
        // 恢复相机变换
        cameraManager.restoreTransform(offscreenCtx);
        // 绘制伤害数字（在屏幕空间）
        for (let i = 0; i < damageNumbers.length; i++) {
            if (!damageNumbers[i].isGarbage && damageNumbers[i].isActive) {
                // 将世界坐标转换为屏幕坐标
                const screenPos = cameraManager.worldToScreen(damageNumbers[i].x, damageNumbers[i].y);
                // 保存原始位置
                const originalX = damageNumbers[i].x;
                const originalY = damageNumbers[i].y;
                // 临时设置屏幕位置
                damageNumbers[i].x = screenPos.x;
                damageNumbers[i].y = screenPos.y;
                // 绘制
                damageNumbers[i].draw(offscreenCtx);
                // 恢复原始位置
                damageNumbers[i].x = originalX;
                damageNumbers[i].y = originalY;
            }
        }
        // 一次性将离屏画布内容复制到显示画布
        ctx.drawImage(offscreenCanvas, 0, 0);
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
    // 更新生命值
    healthValueUI.textContent = Math.ceil(player.health);
    maxHealthValueUI.textContent = player.getStat('health');
    healthBarUI.style.width = `${Math.max(0, (player.health / player.getStat('health'))) * 100}%`;
    // 更新等级和经验
    levelValueUI.textContent = player.level;
    if (player.level < MAX_LEVEL) {
        xpValueUI.textContent = player.xp;
        xpNextLevelValueUI.textContent = player.xpToNextLevel;
        xpBarUI.style.width = `${(player.xp / player.xpToNextLevel) * 100}%`;
        xpBarUI.style.backgroundColor = '#3498db';
    } else {
        xpValueUI.textContent = "MAX";
        xpNextLevelValueUI.textContent = "";
        xpBarUI.style.width = `100%`;
        xpBarUI.style.backgroundColor = '#f1c40f';
    }
    // 更新时间和击杀数
    timerValueUI.textContent = formatTime(gameTime);
    killCountValueUI.textContent = killCount;
    // 更新武器和被动道具图标
    weaponIconsUI.innerHTML = player.weapons.map(w =>
        `<span class="uiIcon" title="${w.name}">${w.emoji}<span class="uiItemLevel">${w.isEvolved ? 'MAX' : 'Lv' + w.level}</span></span>`
    ).join(' ');

    passiveIconsUI.innerHTML = player.passiveItems.map(p =>
        `<span class="uiIcon" title="${p.name}">${p.emoji}<span class="uiItemLevel">Lv${p.level}</span></span>`
    ).join(' ');
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
    // 更新游戏结束界面
    finalTimeUI.textContent = formatTime(gameTime);
    finalLevelUI.textContent = player.level;
    finalKillsUI.textContent = killCount;
    // 显示游戏结束界面
    gameOverScreen.classList.remove('hidden');
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
    // 添加武器升级选项
    player.weapons.forEach(weapon => {
        if (!weapon.isEvolved) {
            options.push(...weapon.getCurrentUpgradeOptions(player));
        }
    });
    // 添加被动道具升级选项
    player.passiveItems.forEach(passive => {
        options.push(...passive.getCurrentUpgradeOptions(player));
    });
    // 添加新武器选项
    if (player.weapons.length < player.maxWeapons) {
        availableWeapons.forEach(WeaponClass => {
            if (!player.weapons.some(w =>
                w instanceof WeaponClass ||
                (w.constructor.Evolution && w.constructor.Evolution.evolvesTo === WeaponClass.Name)
            )) {
                options.push(...(new WeaponClass()).getBaseUpgradeOptions(player));
            }
        });
    }
    // 添加新被动道具选项
    if (player.passiveItems.length < player.maxPassives) {
        availablePassives.forEach(PassiveClass => {
            if (!player.passiveItems.some(p => p instanceof PassiveClass)) {
                options.push(...(new PassiveClass()).getBaseUpgradeOptions(player));
            }
        });
    }
    // 如果选项不足，添加实用选项
    if (options.length < 4) {
        options.push({
            type: 'utility',
            text: '恢复 30% 生命',
            description: '一点慰藉。',
            icon: '🍗',
            action: () => {
                player.heal(player.getStat('health') * 0.3);
            }
        });
        options.push({
            type: 'utility',
            text: '获得 25 金币',
            description: '积少成多。',
            icon: '🪙',
            action: () => {
                console.log("获得金币 (功能待实现)");
            }
        });
    }
    // 随机打乱选项
    shuffleArray(options);
    // 返回前4个选项
    return options.slice(0, 4);
}

/**
 * 显示升级选项
 */
function presentLevelUpOptions() {
    pauseGame(true);
    isLevelUp = true;
    const options = getAvailableUpgrades(player);
    upgradeOptionsContainer.innerHTML = '';
    options.forEach(option => {
        const button = document.createElement('button');
        const iconSpan = document.createElement('span');
        iconSpan.className = 'upgradeIcon';
        iconSpan.textContent = option.icon || '❓';
        const textSpan = document.createElement('span');
        textSpan.className = 'upgradeText';
        textSpan.textContent = option.text;
        if (option.level) {
            const levelSpan = document.createElement('span');
            levelSpan.className = 'upgradeLevel';
            levelSpan.textContent = `Lv ${option.level}`;
            textSpan.appendChild(levelSpan);
        }
        const descP = document.createElement('p');
        descP.style.cssText = 'font-size:0.8em;margin:6px 0 0 0;color:#e0e0e0;';
        descP.textContent = option.description || '';
        button.append(iconSpan, textSpan, descP);
        button.onclick = () => {
            option.action();
            resumeGame();
        };
        upgradeOptionsContainer.appendChild(button);
    });
    levelUpScreen.classList.remove('hidden');
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
        if (weapon.isEvolved || !weapon.constructor.Evolution) continue;
        const evolutionInfo = weapon.constructor.Evolution;
        const requiredPassiveName = evolutionInfo.requires;
        const evolvedClassName = evolutionInfo.evolvesTo;
        // 检查是否满足进化条件
        if (weapon.isMaxLevel() && player.passiveItems.some(passive => passive.name === requiredPassiveName)) {
            console.log(`满足进化条件: ${weapon.name} -> ${evolvedClassName}!`);
            // 查找进化后的类
            let EvolvedClass = null;
            if (evolvedClassName === "ThousandKnives") EvolvedClass = ThousandKnives;
            else if (evolvedClassName === "SoulEater") EvolvedClass = SoulEater;
            else if (evolvedClassName === "BloodyTear") EvolvedClass = BloodyTear;
            else if (evolvedClassName === "Inferno") EvolvedClass = Inferno;
            else if (evolvedClassName === "Lightning") EvolvedClass = Lightning;
            else if (evolvedClassName === "HighFive") EvolvedClass = HighFive;
            if (EvolvedClass) {
                // 创建进化武器
                const evolvedWeapon = new EvolvedClass(weapon);
                evolvedWeapon.owner = player;
                // 替换原武器
                player.weapons[i] = evolvedWeapon;
                console.log(`${weapon.name} 进化为 ${evolvedWeapon.name}!`);
                evolutionOccurred = true;
                // 创建进化特效
                createEvolutionEffect(player.x, player.y);
                break;
            } else {
                console.error(`找不到进化后的类: ${evolvedClassName}`);
            }
        }
    }
    if (evolutionOccurred) {
        updateUI();
    }
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