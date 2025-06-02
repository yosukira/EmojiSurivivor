/**
 * 工具函数模块
 * 包含特效、数学工具、对象清理和其他实用函数
 */

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
 * 随机打乱数组
 * @param {Array} array - 要打乱的数组
 * @returns {Array} 打乱后的数组
 */
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

/**
 * 创建爆炸特效
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} maxRadius - 最大半径
 * @param {string} color - 颜色
 * @param {number} lifetime - 生命周期
 */
function createExplosionEffect(x, y, maxRadius, color, lifetime = 0.5) {
    const explosion = {
        x: x,
        y: y,
        maxRadius: maxRadius,
        currentRadius: 0,
        color: color,
        lifetime: lifetime,
        age: 0,
        isGarbage: false,
        
        update(dt) {
            this.age += dt;
            const progress = this.age / this.lifetime;
            
            if (progress >= 1) {
                this.isGarbage = true;
                return;
            }
            
            // 爆炸半径增长曲线
            this.currentRadius = this.maxRadius * Math.sin(progress * Math.PI);
        },
        
        draw(ctx) {
            if (this.isGarbage) return;
            
            const progress = this.age / this.lifetime;
            const alpha = 1 - progress;
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x - cameraManager.x + GAME_WIDTH/2, 
                   this.y - cameraManager.y + GAME_HEIGHT/2, 
                   this.currentRadius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
    };
    
    visualEffects.push(explosion);
    return explosion;
}

/**
 * 生成随机拾取物
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 */
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

/**
 * 触发屏幕震动函数
 * @param {number} intensity - 震动强度
 * @param {number} duration - 震动持续时间
 */
function triggerScreenShake(intensity, duration) {
    // 如果当前有震动，并且新震动的强度更大，则覆盖；或者简单地总是接受新的震动
    // 为了简单，这里总是接受新的震动参数，并重置计时器
    screenShakeIntensity = intensity;
    screenShakeDuration = duration;
    screenShakeTimer = 0; // 重置计时器，使新震动立即生效并持续其完整时长
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
 * 计算并显示伤害数字
 * @param {GameObject} target - 目标对象
 * @param {number} baseDamage - 基础伤害
 * @param {GameObject} attacker - 攻击者
 * @param {string} damageType - 伤害类型 ('normal', 'heal', 'xp')
 * @returns {Object} 包含实际伤害和是否暴击的信息
 */
function calculateAndShowDamage(target, baseDamage, attacker = null, damageType = 'normal') {
    let finalDamage = baseDamage;
    let isCrit = false;
    let color = 'white';
    let displayText = '';
    
    if (damageType === 'normal') {
        // 暴击检测 - 只有玩家攻击时才能暴击
        if (attacker && attacker === player) {
            const critChance = attacker.getStat('critChance') || 0.05; // 默认5%暴击率
            const critMultiplier = attacker.getStat('critMultiplier') || 1.5; // 默认1.5倍暴击伤害
            
            if (Math.random() < critChance) {
                isCrit = true;
                finalDamage *= critMultiplier;
            }
        }
        
        // 应用护甲减伤
        if (target && typeof target.getStat === 'function') {
            const armor = target.getStat('armor') || 0;
            finalDamage = Math.max(1, finalDamage - armor);
        }
        
        displayText = Math.floor(finalDamage).toString();
        color = isCrit ? '#FFD700' : 'white'; // 暴击金色，普通白色
        
    } else if (damageType === 'heal') {
        displayText = `+${Math.floor(finalDamage)}`;
        color = '#50C850'; // 绿色
        
    } else if (damageType === 'xp') {
        displayText = `+${Math.floor(finalDamage)}`;
        color = '#4FC3F7'; // 蓝色
    }
    
    // 显示伤害数字 - 从目标头顶弹出
    const offsetY = target.size ? target.size / 2 : 20;
    spawnDamageNumber(
        target.x, 
        target.y - offsetY, 
        displayText, 
        color, 
        GAME_FONT_SIZE * (isCrit ? 1.0 : 0.8), 
        isCrit ? 1.0 : 0.8,
        isCrit
    );
    
    return {
        damage: finalDamage,
        isCrit: isCrit,
        displayText: displayText
    };
}

/**
 * 数学工具函数
 */
const MathUtils = {
    /**
     * 计算两点之间的距离
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    },
    
    /**
     * 计算两点之间的角度
     */
    angle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },
    
    /**
     * 将角度限制在0-2π范围内
     */
    normalizeAngle(angle) {
        while (angle < 0) angle += Math.PI * 2;
        while (angle >= Math.PI * 2) angle -= Math.PI * 2;
        return angle;
    },
    
    /**
     * 线性插值
     */
    lerp(a, b, t) {
        return a + (b - a) * t;
    },
    
    /**
     * 将值限制在指定范围内
     */
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    /**
     * 生成指定范围内的随机数
     */
    random(min, max) {
        return Math.random() * (max - min) + min;
    },
    
    /**
     * 生成指定范围内的随机整数
     */
    randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}; 