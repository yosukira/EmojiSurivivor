/**
 * UI管理器
 * 负责游戏界面的更新和管理
 */

// Boss 血条 UI 控制
const bossHealthUIContainer = document.getElementById('bossHealthUIContainer');
const bossHealthBarFill = document.getElementById('bossHealthBarFill');
const bossHealthValueText = document.getElementById('bossHealthValueText'); // 新增：获取血量数值的span
let currentBossForHealthBar = null;

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
        const pauseScreen = document.getElementById('pauseScreen');
        if (pauseScreen) pauseScreen.classList.remove('hidden');
    }
}

/**
 * 恢复游戏
 */
function resumeGame() {
    if (isGameOver) return;
    isPaused = false;
    isLevelUp = false;
    const levelUpScreen = document.getElementById('levelUpScreen');
    const pauseScreen = document.getElementById('pauseScreen');
    if (levelUpScreen) levelUpScreen.classList.add('hidden');
    if (pauseScreen) pauseScreen.classList.add('hidden');
    lastTime = performance.now();
    if (!animationFrameId) {
        gameLoop(lastTime);
    }
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

/**
 * 显示Boss血条
 */
function showBossHealthBar(boss) {
    console.log('[showBossHealthBar] Called. Boss object:', boss, 'UI Container:', bossHealthUIContainer); // DEBUG
    if (!bossHealthUIContainer || !boss) return;
    currentBossForHealthBar = boss;
    bossHealthUIContainer.classList.remove('hidden');
    updateBossHealthBar(); // 初始更新一次
    console.log("Boss health bar shown for:", boss.name || 'Unknown Boss');
}

/**
 * 隐藏Boss血条
 */
function hideBossHealthBar() {
    console.log('[hideBossHealthBar] Called. UI Container:', bossHealthUIContainer, 'currentBossForHealthBar:', currentBossForHealthBar); // DEBUG
    if (!bossHealthUIContainer) return;
    bossHealthUIContainer.classList.add('hidden');
    currentBossForHealthBar = null;
    console.log("Boss health bar hidden.");
}

/**
 * 更新Boss血条
 */
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

/**
 * 显示Boss警告
 */
function showBossWarning(bossName) {
    const bossWarning = document.getElementById('bossWarning');
    if (!bossWarning) return;
    
    bossWarning.textContent = `👹 ${bossName} 来袭! 👹`;
    bossWarning.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        bossWarning.style.display = 'none';
    }, 3000);
} 