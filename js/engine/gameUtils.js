/**
 * 游戏工具函数
 * 包含各种辅助函数和工具方法
 */

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
 * 随机生成拾取物
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
    for (let i = window.activeGhosts.length - 1; i >= 0; i--) {
        if (window.activeGhosts[i].isGarbage) {
            window.activeGhosts.splice(i, 1);
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
        // 先应用护甲减伤
        if (target && typeof target.getStat === 'function') {
            const armor = target.getStat('armor') || 0;
            finalDamage = Math.max(1, finalDamage - armor);
        }
        
        // 暴击检测 - 只有玩家攻击时才能暴击
        if (attacker && attacker === player) {
            const critChance = attacker.getStat('critChance') || 0.05; // 默认5%暴击率
            const critMultiplier = attacker.getStat('critMultiplier') || 2.0; // 默认2.0倍暴击伤害
            
            if (Math.random() < critChance) {
                isCrit = true;
                finalDamage *= critMultiplier;
            }
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