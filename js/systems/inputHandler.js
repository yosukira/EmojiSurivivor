/**
 * 事件处理系统
 * 包含键盘输入、鼠标处理和游戏控制功能
 */

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
    const finalTimeUI = document.getElementById('finalTime');
    const finalLevelUI = document.getElementById('finalLevel');
    const finalKillsUI = document.getElementById('finalKills');
    const gameOverScreen = document.getElementById('gameOverScreen');
    
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
    isPaused = true;
    if (!forceHideUI) {
        document.getElementById('pauseScreen').classList.remove('hidden');
    }
}

/**
 * 恢复游戏
 */
function resumeGame() {
    isPaused = false;
    document.getElementById('pauseScreen').classList.add('hidden');
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
 * 初始化事件监听器
 */
function initEventListeners() {
    // 键盘事件监听
    document.addEventListener('keydown', (e) => {
        keys[e.key.toLowerCase()] = true;
        
        // 暂停/恢复游戏
        if (e.key.toLowerCase() === 'p') {
            if (isPaused) {
                resumeGame();
            } else if (!isLevelUp && !isGameOver) {
                pauseGame();
            }
        }
        
        // 阻止默认行为
        if (['w', 'a', 's', 'd', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
        }
    });

    document.addEventListener('keyup', (e) => {
        keys[e.key.toLowerCase()] = false;
    });

    // 鼠标移动事件监听
    document.addEventListener('mousemove', () => {
        lastMouseMoveTime = Date.now();
        if (isMouseHidden) {
            document.body.style.cursor = 'default';
            isMouseHidden = false;
        }
    });

    // 防止右键菜单
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });

    // 窗口失焦时暂停游戏
    window.addEventListener('blur', () => {
        if (isGameRunning && !isGameOver && !isPaused) {
            pauseGame(true); // 强制隐藏UI，避免显示暂停屏幕
        }
    });

    // 窗口获得焦点时恢复游戏
    window.addEventListener('focus', () => {
        if (isGameRunning && !isGameOver && isPaused) {
            resumeGame();
        }
    });
}

// 在DOM加载完成后初始化事件监听器
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
}); 