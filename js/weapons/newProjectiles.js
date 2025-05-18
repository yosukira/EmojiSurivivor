/**
 * EmojiSurvivor - 新武器投射物
 * 这个文件包含新武器的投射物实现
 */

/**
 * 泡泡投射物类
 * 泡泡魔棒的投射物
 */
class BubbleProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X方向速度
     * @param {number} vy - Y方向速度
     * @param {number} damage - 伤害值
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} trapDuration - 困敌时间
     * @param {boolean} splitOnBurst - 是否爆炸分裂
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, trapDuration, splitOnBurst) {
        super(x, y, "🧼", size, vx, vy, damage, 0, duration, ownerStats);
        
        // 额外属性
        this.trapDuration = trapDuration;
        this.splitOnBurst = splitOnBurst;
        
        // 泡泡状态
        this.trapped = null;  // 被困住的敌人
        this.burstTimer = 0;  // 爆炸计时器
        this.burstDelay = 0.2;  // 爆炸延迟
        this.isBursting = false;  // 是否正在爆炸
        
        // 视觉效果
        this.oscillation = Math.random() * Math.PI * 2;  // 随机初相位
        this.oscillationSpeed = 1 + Math.random() * 0.5;  // 振荡速度
        this.originalVx = vx;
        this.originalVy = vy;
        this.maxOscillationDist = 5;  // 最大振荡距离
        this.prevOscX = 0;
        this.prevOscY = 0;
        
        // 安全设置：强制销毁计时器
        this.forceDestroyTimer = 0;
        this.maxExistTime = 15; // 泡泡存在的最大时间（秒）
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        
        // 更新振荡效果
        this.oscillation += dt * this.oscillationSpeed;
        
        // 安全检查：强制销毁计时器
        this.forceDestroyTimer += dt;
        if (this.forceDestroyTimer >= this.maxExistTime) {
            console.log("泡泡强制销毁：超过最大存在时间");
            this.burst();
            return;
        }
        
        // 设置一个强制最大生命周期，确保泡泡永远不会无限存在
        const MAX_LIFETIME = 10; // 10秒的绝对最大生命周期
        if (this.lifetime > MAX_LIFETIME) {
            this.burst();
            return;
        }
        
        if (this.trapped) {
            // 已困住敌人，更新位置以跟随敌人
            if (this.trapped.isGarbage || !this.trapped.isActive || this.trapped.health <= 0) {
                // 敌人已消失或已死亡，泡泡爆炸
                this.burst();
                return;
            }
            
            // 更新位置
            this.x = this.trapped.x;
            this.y = this.trapped.y;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 如果生命周期结束，泡泡爆炸
            if (this.lifetime >= this.duration) {
                this.burst();
                return;
            }
            
            // 边界检查：如果泡泡位置离开了有效区域，强制销毁
            const worldSize = Math.max(GAME_WIDTH, GAME_HEIGHT);
            if (Math.abs(this.x) > worldSize * 2 || Math.abs(this.y) > worldSize * 2) {
                console.log("泡泡强制销毁：超出边界");
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
        } else {
            // 自由移动的泡泡
            
            // 添加正弦振荡移动，但减小振幅
            const oscX = Math.sin(this.oscillation) * (this.maxOscillationDist * 0.6);
            const oscY = Math.cos(this.oscillation * 0.7) * (this.maxOscillationDist * 0.6);
            
            // 计算新位置
            const newX = this.x + (this.vx * dt) + (oscX - this.prevOscX);
            const newY = this.y + (this.vy * dt) + (oscY - this.prevOscY);
            
            // 边界检查 - 如果泡泡将要离开游戏区域，就改变方向
            const margin = this.size;
            const worldMinX = -GAME_WIDTH/2 + margin;
            const worldMaxX = GAME_WIDTH*1.5 - margin;
            const worldMinY = -GAME_HEIGHT/2 + margin;
            const worldMaxY = GAME_HEIGHT*1.5 - margin;
            
            // 检查是否超出边界，如果是则反弹
            if (newX < worldMinX || newX > worldMaxX) {
                this.vx = -this.vx * 0.8; // 反向并减少速度
            }
            
            if (newY < worldMinY || newY > worldMaxY) {
                this.vy = -this.vy * 0.8; // 反向并减少速度
            }
            
            // 应用最终位置，确保在边界内
            this.x = Math.max(worldMinX, Math.min(worldMaxX, newX));
            this.y = Math.max(worldMinY, Math.min(worldMaxY, newY));
            
            // 记录上一帧的振荡值
            this.prevOscX = oscX;
            this.prevOscY = oscY;
            
            // 自然减速
            this.vx *= 0.99;
            this.vy *= 0.99;
            
            // 速度太低时判定为静止，避免泡泡卡住
            const minSpeed = 5;
            if (Math.abs(this.vx) < minSpeed && Math.abs(this.vy) < minSpeed) {
                this.staticTimer = (this.staticTimer || 0) + dt;
                // 如果静止时间过长，爆炸
                if (this.staticTimer > 2) {
                    this.burst();
                    return;
                }
            } else {
                this.staticTimer = 0;
            }
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 如果生命周期结束，泡泡爆炸
            if (this.lifetime >= this.duration) {
                this.burst();
                return;
            }
            
            // 检查与敌人碰撞
            enemies.forEach(enemy => {
                // 跳过已命中敌人和无效敌人
                if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
                
                // 检查碰撞
                if (this.checkCollision(enemy)) {
                    // 困住敌人
                    this.trapEnemy(enemy);
                    return;
                }
            });
        }
        
        // 如果正在爆炸，更新爆炸效果
        if (this.isBursting) {
            this.burstTimer += dt;
            if (this.burstTimer >= this.burstDelay) {
                // 爆炸效果结束，标记为垃圾
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
        }
    }

    /**
     * 困住敌人
     * @param {Enemy} enemy - 敌人
     */
    trapEnemy(enemy) {
        // 造成伤害
        enemy.takeDamage(this.damage, this.owner);
        
        // 设置被困住的敌人
        this.trapped = enemy;
        
        // 添加到已命中列表
        this.hitTargets.add(enemy);
        
        // 添加减速效果
        if (!enemy.statusEffects) {
            enemy.statusEffects = {};
        }
        
        // 添加特殊的困住效果
        enemy.statusEffects.bubbleTrap = {
            duration: this.trapDuration,
            originalSpeed: enemy.speed,
            source: this.owner
        };
        
        // 几乎停止移动
        enemy.speed *= 0.05;
    }

    /**
     * 泡泡爆炸
     */
    burst() {
        // 如果已经在爆炸或已经是垃圾，不重复触发
        if (this.isBursting || this.isGarbage) return;
        
        // 标记为正在爆炸
        this.isBursting = true;
        
        // 释放被困住的敌人
        if (this.trapped && !this.trapped.isGarbage && this.trapped.isActive) {
            // 移除困住效果
            if (this.trapped.statusEffects && this.trapped.statusEffects.bubbleTrap) {
                // 恢复原有速度
                this.trapped.speed = this.trapped.statusEffects.bubbleTrap.originalSpeed;
                // 删除困住效果
                delete this.trapped.statusEffects.bubbleTrap;
            }
            
            // 再次造成伤害
            this.trapped.takeDamage(this.damage, this.owner);
        }
        
        // 创建爆炸效果
        this.createBurstEffect();

        // 分裂功能(如果启用)
        if (this.splitOnBurst && this.owner) {
            this.createSplitBubbles();
        }
    }

    /**
     * 创建爆炸效果
     */
    createBurstEffect() {
        // 创建爆炸粒子
        for (let i = 0; i < 8; i++) {
            const angle = Math.PI * 2 * i / 8;
            const speed = 30 + Math.random() * 20;
            
            const particle = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: this.size * 0.3,
                lifetime: 0.3 + Math.random() * 0.2,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.9;
                    this.vy *= 0.9;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 1 - this.timer / this.lifetime;
                    
                    ctx.fillStyle = `rgba(200, 230, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            // 添加到粒子列表
            if (typeof particles !== 'undefined') {
                particles.push(particle);
            }
        }
    }

    /**
     * 创建分裂泡泡
     * 当泡泡爆炸时，创建多个小泡泡
     */
    createSplitBubbles() {
        // 限制同屏泡泡数量，如果已经太多泡泡，就不再分裂
        const bubbleCount = projectiles.filter(p => p instanceof BubbleProjectile).length;
        if (bubbleCount > 50) return; // 限制屏幕上最多50个泡泡
        
        // 创建分裂泡泡，减少数量从3个改为2个
        for (let i = 0; i < 2; i++) {
            const angle = Math.PI * 2 * i / 2 + Math.random() * 0.5;
            const speed = 80 + Math.random() * 40;
            
            // 计算速度
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // 创建小泡泡
            const smallBubble = new BubbleProjectile(
                this.x, this.y, this.size * 0.6, vx, vy,
                this.damage * 0.7, this.duration * 0.5, 
                this.ownerStats, this.trapDuration * 0.7, false // 不允许小泡泡再次分裂
            );
            
            smallBubble.owner = this.owner;
            projectiles.push(smallBubble);
        }
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;
        
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            
            if (this.isBursting) {
                // 绘制爆炸效果
                const burstProgress = this.burstTimer / this.burstDelay;
                const burstSize = this.size * (1 + burstProgress * 1.5);
                const alpha = 1 - burstProgress;
                
                // 绘制爆炸光环
                ctx.fillStyle = `rgba(200, 230, 255, ${alpha * 0.5})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, burstSize, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制爆炸中心
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.7})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, burstSize * 0.6, 0, Math.PI * 2);
                ctx.fill();
            } else {
                // 常规绘制
                // 计算泡泡脉动
                const pulseScale = 1 + Math.sin(this.oscillation) * 0.1;
                const drawSize = this.size * pulseScale;
                
                // 绘制泡泡边缘
                ctx.strokeStyle = 'rgba(200, 230, 255, 0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, drawSize, 0, Math.PI * 2);
                ctx.stroke();
                
                // 绘制泡泡内部
                ctx.fillStyle = 'rgba(200, 230, 255, 0.2)';
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, drawSize, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制泡泡高光
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.beginPath();
                ctx.arc(
                    screenPos.x - drawSize * 0.3,
                    screenPos.y - drawSize * 0.3,
                    drawSize * 0.2,
                    0, Math.PI * 2
                );
                ctx.fill();
                
                // 如果困住了敌人，绘制困住效果
                if (this.trapped) {
                    // 绘制包围效果
                    const trapScale = 1.5;
                    ctx.strokeStyle = 'rgba(150, 200, 255, 0.6)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(
                        screenPos.x, screenPos.y,
                        drawSize * trapScale, 0, Math.PI * 2
                    );
                    ctx.stroke();
                }
            }
        } catch (e) {
            console.error("绘制泡泡投射物时出错:", e);
        }
    }
}

/**
 * 混沌骰子投射物类
 * 混沌骰子的投射物
 */
class ChaosDiceProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} area - 效果范围
     * @param {number} effectPower - 效果强度
     * @param {Object} effect1 - 第一个效果
     * @param {Object} effect2 - 第二个效果（可能为null）
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, area, effectPower, effect1, effect2) {
        super(x, y, "🎲", size, vx, vy, damage, 0, duration, ownerStats);
        
        // 额外属性
        this.area = area;
        this.effectPower = effectPower;
        this.effect1 = effect1;
        this.effect2 = effect2;
        
        // 骰子状态
        this.isRolling = true;
        this.rollingTime = 0.5;  // 滚动时间
        this.rollingTimer = 0;
        
        // 效果显示
        this.effect1Emoji = effect1.emoji;
        this.effect2Emoji = effect2 ? effect2.emoji : null;
        
        // 视觉效果
        this.rotation = 0;
        this.rotationSpeed = Math.PI * 4;  // 每秒旋转2圈
        
        // 爆炸状态
        this.exploded = false;
        this.explosionTimer = 0;
        this.explosionDuration = 0.3;
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        
        if (this.exploded) {
            // 已爆炸，更新爆炸计时器
            this.explosionTimer += dt;
            
            // 如果爆炸结束，标记为垃圾
            if (this.explosionTimer >= this.explosionDuration) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
        } else if (this.isRolling) {
            // 正在滚动，更新滚动计时器
            this.rollingTimer += dt;
            
            // 更新旋转角度
            this.rotation += this.rotationSpeed * dt;
            
            // 如果滚动结束，停止滚动
            if (this.rollingTimer >= this.rollingTime) {
                this.isRolling = false;
            }
            
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 如果生命周期结束，爆炸
            if (this.lifetime >= this.duration) {
                this.explode();
                return;
            }
            
            // 如果超出屏幕，标记为垃圾
            if (
                this.x < -this.width ||
                this.x > GAME_WIDTH + this.width ||
                this.y < -this.height ||
                this.y > GAME_HEIGHT + this.height
            ) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查与敌人的碰撞
            enemies.forEach(enemy => {
                // 跳过已命中的敌人
                if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
                
                // 检查碰撞
                if (this.checkCollision(enemy)) {
                    // 爆炸
                    this.explode();
                    return;
                }
            });
        } else {
            // 非滚动状态，减慢速度
            this.vx *= 0.9;
            this.vy *= 0.9;
            
            // 减慢旋转速度
            this.rotationSpeed *= 0.9;
            this.rotation += this.rotationSpeed * dt;
            
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 如果生命周期结束，爆炸
            if (this.lifetime >= this.duration) {
                this.explode();
                return;
            }
            
            // 如果超出屏幕，标记为垃圾
            if (
                this.x < -this.width ||
                this.x > GAME_WIDTH + this.width ||
                this.y < -this.height ||
                this.y > GAME_HEIGHT + this.height
            ) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查与敌人的碰撞
            enemies.forEach(enemy => {
                // 跳过已命中的敌人
                if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
                
                // 检查碰撞
                if (this.checkCollision(enemy)) {
                    // 爆炸
                    this.explode();
                    return;
                }
            });
        }
    }

    /**
     * 爆炸
     */
    explode() {
        // 获取范围内的敌人
        const area = this.area;
        enemies.forEach(enemy => {
            if (enemy.isGarbage || !enemy.isActive) return;
            
            // 计算距离
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            
            // 如果在爆炸范围内，应用效果
            if (distSq <= area * area) {
                // 造成伤害
                enemy.takeDamage(this.damage, this.owner);
                
                // 应用第一个效果
                if (this.effect1) {
                    this.applyEffect(enemy, this.effect1);
                    
                    // 创建效果图标
                    this.createEffectIcon(this.effect1, dx * 0.3, dy * 0.3);
                }
                
                // 如果有第二个效果，也应用
                if (this.effect2) {
                    this.applyEffect(enemy, this.effect2);
                    
                    // 创建效果图标
                    this.createEffectIcon(this.effect2, dx * 0.6, dy * 0.6);
                }
            }
        });
        
        // 创建爆炸效果
        this.createExplosionEffect();
    }

    /**
     * 应用效果
     * @param {Enemy} enemy - 敌人
     * @param {Object} effect - 效果
     */
    applyEffect(enemy, effect) {
        // 初始化状态效果对象
        if (!enemy.statusEffects) {
            enemy.statusEffects = {};
        }
        
        // 确保effect是有效对象
        if (!effect) return;
        
        // 获取效果名称
        const effectName = effect.name || (typeof effect === 'string' ? effect : '');
        
        // 根据效果类型应用不同效果
        switch (effectName) {
            case "火焰":
                // 添加燃烧效果
                const burnDamage = this.damage * 0.3 * this.effectPower;
                const burnDuration = 3 * this.effectPower;
                
                if (enemy.statusEffects.burn) {
                    enemy.statusEffects.burn.duration = Math.max(
                        enemy.statusEffects.burn.duration, burnDuration
                    );
                    enemy.statusEffects.burn.damage = Math.max(
                        enemy.statusEffects.burn.damage, burnDamage / 4
                    );
                } else {
                    enemy.statusEffects.burn = {
                        damage: burnDamage / 4,  // 四次伤害
                        duration: burnDuration,
                        tickInterval: burnDuration / 4,
                        tickTimer: burnDuration / 4,
                        source: this.owner
                    };
                }
                break;
                
            case "冰冻":
                // 添加减速效果
                const slowFactor = 0.4 / this.effectPower;  // 减速60%-80%
                const slowDuration = 2.5 * this.effectPower;
                
                if (enemy.statusEffects.slow) {
                    enemy.statusEffects.slow.duration = Math.max(
                        enemy.statusEffects.slow.duration, slowDuration
                    );
                    enemy.statusEffects.slow.factor = Math.min(
                        enemy.statusEffects.slow.factor, slowFactor
                    );
                } else {
                    const originalSpeed = enemy.speed;
                    enemy.speed *= slowFactor;
                    enemy.statusEffects.slow = {
                        duration: slowDuration,
                        factor: slowFactor,
                        originalSpeed: originalSpeed,
                        source: this.owner
                    };
                }
                break;
                
            case "雷电":
                // 添加连锁效果
                const chainDamage = this.damage * 0.5 * this.effectPower;
                const chainCount = Math.floor(2 * this.effectPower);
                const chainRange = 100 * this.effectPower;
                
                // 链式伤害
                this.chainLightning(enemy, chainDamage, chainCount, chainRange);
                break;
                
            case "击退":
                // 应用击退效果
                const knockbackPower = 80 * this.effectPower;
                
                // 计算方向
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    const nx = dx / dist;
                    const ny = dy / dist;
                    
                    // 应用击退
                    enemy.x += nx * knockbackPower;
                    enemy.y += ny * knockbackPower;
                }
                break;
                
            case "护盾":
                // 为玩家添加护盾
                if (this.owner && this.owner.shield !== undefined) {
                    const shieldAmount = this.damage * 0.8 * this.effectPower;
                    this.owner.shield += shieldAmount;
                    
                    // 创建护盾效果
                    this.createShieldEffect(shieldAmount);
                }
                break;
                
            case "治疗":
                // 治疗玩家
                if (this.owner && this.owner.heal) {
                    const healAmount = this.damage * 0.5 * this.effectPower;
                    this.owner.heal(healAmount);
                }
                break;
        }
    }

    /**
     * 链式闪电
     * @param {Enemy} startEnemy - 起始敌人
     * @param {number} damage - 伤害
     * @param {number} count - 连锁次数
     * @param {number} range - 连锁范围
     */
    chainLightning(startEnemy, damage, count, range) {
        let currentEnemy = startEnemy;
        let remainingChains = count;
        let hitEnemies = new Set([startEnemy]);
        
        while (remainingChains > 0) {
            remainingChains--;
            
            // 寻找最近的敌人
            let nextEnemy = null;
            let closestDistSq = range * range;
            
            enemies.forEach(enemy => {
                // 跳过无效敌人和已命中的敌人
                if (enemy.isGarbage || !enemy.isActive || hitEnemies.has(enemy)) return;
                
                // 计算距离
                const dx = enemy.x - currentEnemy.x;
                const dy = enemy.y - currentEnemy.y;
                const distSq = dx * dx + dy * dy;
                
                // 如果在范围内且更近，更新下一个目标
                if (distSq < closestDistSq) {
                    closestDistSq = distSq;
                    nextEnemy = enemy;
                }
            });
            
            // 如果找到下一个目标，造成伤害并创建连锁效果
            if (nextEnemy) {
                // 造成伤害
                nextEnemy.takeDamage(damage, this.owner);
                
                // 创建连锁效果
                this.createChainEffect(currentEnemy, nextEnemy);
                
                // 更新当前敌人和已命中列表
                currentEnemy = nextEnemy;
                hitEnemies.add(nextEnemy);
            } else {
                // 没有找到下一个目标，结束连锁
                break;
            }
        }
    }

    /**
     * 创建连锁效果
     * @param {Enemy} from - 起始敌人
     * @param {Enemy} to - 目标敌人
     */
    createChainEffect(from, to) {
        // 创建闪电效果
        const effect = {
            fromX: from.x,
            fromY: from.y,
            toX: to.x,
            toY: to.y,
            lifetime: 0.3,
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
                
                const fromPos = cameraManager.worldToScreen(this.fromX, this.fromY);
                const toPos = cameraManager.worldToScreen(this.toX, this.toY);
                const alpha = 0.8 * (1 - this.timer / this.lifetime);
                
                ctx.save();
                ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                
                // 绘制锯齿状闪电
                const segments = 4;
                const dx = (toPos.x - fromPos.x) / segments;
                const dy = (toPos.y - fromPos.y) / segments;
                const zigZagAmount = 8;
                
                ctx.moveTo(fromPos.x, fromPos.y);
                
                for (let i = 1; i < segments; i++) {
                    const x = fromPos.x + dx * i;
                    const y = fromPos.y + dy * i;
                    const offsetX = (Math.random() - 0.5) * zigZagAmount;
                    const offsetY = (Math.random() - 0.5) * zigZagAmount;
                    
                    ctx.lineTo(x + offsetX, y + offsetY);
                }
                
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        visualEffects.push(effect);
    }

    /**
     * 创建护盾效果
     * @param {number} amount - 护盾量
     */
    createShieldEffect(amount) {
        // 创建护盾效果
        const effect = {
            x: this.owner.x,
            y: this.owner.y,
            radius: 0,
            maxRadius: 50,
            lifetime: 0.5,
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
                const alpha = 0.7 * (1 - this.timer / this.lifetime);
                
                ctx.save();
                ctx.fillStyle = `rgba(100, 100, 255, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.strokeStyle = `rgba(100, 100, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                ctx.restore();
            }
        };
        
        visualEffects.push(effect);
    }

    /**
     * 创建爆炸效果
     */
    createExplosionEffect() {
        // 创建爆炸效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: this.area * 0.8, // 减小爆炸效果尺寸，原来是 this.area
            maxRadius: this.area,
            duration: 0.5,
            timer: 0,
            isGarbage: false,
            color: 'rgba(255, 200, 100, 0.3)', // 降低基础不透明度，原来是0.6
            
            update: function(dt) {
                this.timer += dt;
                this.radius = this.maxRadius * (this.timer / this.duration);
                
                if (this.timer >= this.duration) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                // 计算不透明度
                const progress = this.timer / this.duration;
                const alpha = 0.3 * (1 - progress); // 降低最大不透明度，原来是0.6
                
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                ctx.save();
                // 修复：添加空值检查以防止color未定义
                if (this.color && typeof this.color === 'string') {
                    ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgba', 'rgba');
                } else {
                    // 使用默认颜色
                    ctx.fillStyle = `rgba(255, 200, 100, ${alpha})`;
                }
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }
        };
        
        visualEffects.push(effect);
        
        // 创建效果图标，调整位置使其不那么集中
        this.createEffectIcon(this.effect1, -20, -20);
        
        if (this.effect2) {
            this.createEffectIcon(this.effect2, 20, -20);
        }
    }

    /**
     * 创建效果图标
     * @param {Object} effect - 效果
     * @param {number} offsetX - X偏移
     * @param {number} offsetY - Y偏移
     */
    createEffectIcon(effect, offsetX, offsetY) {
        if (!effect) return;
        
        // 获取效果名称
        const effectName = effect.name || (typeof effect === 'string' ? effect : '');
        
        // 显示对应图标
        let icon;
        switch (effectName) {
            case "火焰": icon = "🔥"; break;
            case "冰冻": icon = "❄️"; break;
            case "雷电": icon = "⚡"; break;
            case "击退": icon = "💨"; break;
            case "护盾": icon = "🛡️"; break;
            case "治疗": icon = "💚"; break;
            default: icon = "✨"; break;
        }
        
        const iconElement = {
            x: this.x + offsetX,
            y: this.y + offsetY,
            emoji: icon,
            size: this.size * 0.8,
            vx: 0,
            vy: -30,
            lifetime: 0.8,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.y += this.vy * dt;
                this.vy += 50 * dt; // 重力
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 1 - this.timer / this.lifetime;
                
                ctx.save();
                ctx.globalAlpha = alpha;
                ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.emoji, screenPos.x, screenPos.y);
                ctx.restore();
            }
        };
        
        visualEffects.push(iconElement);
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive || this.exploded) return;
        
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            
            // 保存上下文
            ctx.save();
            
            // 平移到投射物位置
            ctx.translate(screenPos.x, screenPos.y);
            
            // 应用旋转
            ctx.rotate(this.rotation);
            
            if (this.isRolling) {
                // 绘制骰子
                ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("🎲", 0, 0);
            } else {
                // 绘制静止的骰子和效果
                ctx.font = `${this.size * 0.8}px 'Segoe UI Emoji', Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                // 绘制效果1
                ctx.fillText(this.effect1Emoji, 0, 0);
                
                // 如果有效果2，绘制效果2旁边
                if (this.effect2Emoji) {
                    ctx.font = `${this.size * 0.6}px 'Segoe UI Emoji', Arial`;
                    ctx.fillText(this.effect2Emoji, this.size * 0.5, -this.size * 0.5);
                }
            }
            
            // 恢复上下文
            ctx.restore();
        } catch (e) {
            console.error("绘制骰子投射物时出错:", e);
        }
    }
}

/**
 * 磁力波投射物类
 * 磁力枪的投射物
 */
class MagnetWaveProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} pullRadius - 吸引范围
     * @param {number} pullStrength - 吸引强度
     * @param {number} stun - 眩晕时间
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, pullRadius, pullStrength, stun) {
        super(x, y, "🧲", size, vx, vy, damage, 0, duration, ownerStats);
        
        // 额外属性
        this.pullRadius = pullRadius;
        this.pullStrength = pullStrength;
        this.stun = stun;
        
        // 磁力波状态
        this.isPulling = false;  // 是否正在吸引
        this.pullingTimer = 0;  // 吸引计时器
        this.pullingDuration = 1.0;  // 吸引持续时间
        this.pullingPoint = { x: 0, y: 0 };  // 吸引中心点
        
        // 视觉效果
        this.rotation = Math.atan2(vy, vx);  // 旋转角度
        this.wave1 = 0;  // 波纹1
        this.wave2 = Math.PI * 0.5;  // 波纹2
        this.waveSpeed = 3;  // 波纹速度
        
        // 吸引到的敌人列表
        this.pulledEnemies = new Set();
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        
        // 更新波纹
        this.wave1 = (this.wave1 + dt * this.waveSpeed) % (Math.PI * 2);
        this.wave2 = (this.wave2 + dt * this.waveSpeed) % (Math.PI * 2);
        
        if (this.isPulling) {
            // 正在吸引，更新吸引计时器
            this.pullingTimer += dt;
            
            // 执行吸引逻辑
            this.pullEnemies(dt);
            
            // 如果吸引结束，标记为垃圾
            if (this.pullingTimer >= this.pullingDuration) {
                // 如果有眩晕效果，应用眩晕
                if (this.stun > 0) {
                    this.stunPulledEnemies();
                }
                
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
        } else {
            // 正常移动
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 如果生命周期结束，开始吸引
            if (this.lifetime >= this.duration) {
                this.startPulling();
                return;
            }
            
            // 如果超出屏幕，标记为垃圾
            if (
                this.x < -this.width ||
                this.x > GAME_WIDTH + this.width ||
                this.y < -this.height ||
                this.y > GAME_HEIGHT + this.height
            ) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查与敌人的碰撞
            enemies.forEach(enemy => {
                // 跳过已命中的敌人
                if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
                
                // 检查碰撞
                if (this.checkCollision(enemy)) {
                    // 造成伤害
                    enemy.takeDamage(this.damage, this.owner);
                    
                    // 开始吸引
                    this.startPulling();
                    return;
                }
            });
        }
    }

    /**
     * 开始吸引
     */
    startPulling() {
        // 标记为正在吸引
        this.isPulling = true;
        
        // 设置吸引中心点
        this.pullingPoint.x = this.x;
        this.pullingPoint.y = this.y;
        
        // 创建吸引视觉效果
        this.createPullEffect();
    }

    /**
     * 吸引敌人
     * @param {number} dt - 时间增量
     */
    pullEnemies(dt) {
        // 创建波纹粒子
        this.createWaveParticle();
        
        // 对范围内的敌人施加吸引力
        enemies.forEach(enemy => {
            // 跳过无效敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            
            // 计算距离
            const dx = this.pullingPoint.x - enemy.x;
            const dy = this.pullingPoint.y - enemy.y;
            const distSq = dx * dx + dy * dy;
            
            // 如果在吸引范围内，施加吸引力
            if (distSq <= this.pullRadius * this.pullRadius) {
                const dist = Math.sqrt(distSq);
                
                if (dist > 0) {
                    // 计算吸引力大小（距离越近，吸引力越小，防止敌人重叠）
                    const pullFactor = Math.min(0.95, this.pullStrength * (1 - Math.pow(dist / this.pullRadius, 0.5)) * 3);
                    
                    // 应用吸引力
                    enemy.x += dx * pullFactor * dt;
                    enemy.y += dy * pullFactor * dt;
                    
                    // 标记为已被吸引
                    this.pulledEnemies.add(enemy);
                    
                    // 如果距离很近，造成伤害
                    if (dist < 20 && enemy.invincibleTimer <= 0) {
                        enemy.takeDamage(this.damage * dt * 2, this.owner);  // 持续伤害
                    }
                }
            }
        });
    }

    /**
     * 使被吸引的敌人眩晕
     */
    stunPulledEnemies() {
        this.pulledEnemies.forEach(enemy => {
            // 跳过无效敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            
            // 初始化状态效果对象
            if (!enemy.statusEffects) {
                enemy.statusEffects = {};
            }
            
            // 添加眩晕效果
            enemy.statusEffects.stun = {
                duration: this.stun,
                source: this.owner
            };
        });
    }

    /**
     * 创建波纹粒子
     */
    createWaveParticle() {
        // 随机角度
        const angle = Math.random() * Math.PI * 2;
        const distance = this.pullRadius * (0.3 + Math.random() * 0.7);
        
        // 粒子位置在吸引半径内随机
        const x = this.pullingPoint.x + Math.cos(angle) * distance;
        const y = this.pullingPoint.y + Math.sin(angle) * distance;
        
        // 计算目标方向
        const dx = this.pullingPoint.x - x;
        const dy = this.pullingPoint.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        const speed = 100 + Math.random() * 50;
        const vx = dist > 0 ? dx / dist * speed : 0;
        const vy = dist > 0 ? dy / dist * speed : 0;
        
        // 创建粒子
        const particle = {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            size: 3 + Math.random() * 2,
            lifetime: 0.3 + Math.random() * 0.2,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.7 * (1 - this.timer / this.lifetime);
                
                ctx.fillStyle = `rgba(0, 100, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(particle);
        }
    }

    /**
     * 创建吸引视觉效果
     */
    createPullEffect() {
        // 创建吸引视觉效果
        const effect = {
            x: this.pullingPoint.x,
            y: this.pullingPoint.y,
            radius: this.pullRadius,
            duration: this.pullingDuration,
            timer: 0,
            wave1: this.wave1,
            wave2: this.wave2,
            waveSpeed: this.waveSpeed,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.wave1 = (this.wave1 + dt * this.waveSpeed) % (Math.PI * 2);
                this.wave2 = (this.wave2 + dt * this.waveSpeed) % (Math.PI * 2);
                
                if (this.timer >= this.duration) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.5 * (1 - this.timer / this.duration);
                
                // 绘制外围圆环
                ctx.strokeStyle = `rgba(0, 100, 255, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 绘制内部波纹1
                const wave1Radius = this.radius * (0.3 + 0.2 * Math.sin(this.wave1));
                ctx.strokeStyle = `rgba(0, 150, 255, ${alpha * 0.8})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, wave1Radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 绘制内部波纹2
                const wave2Radius = this.radius * (0.5 + 0.15 * Math.sin(this.wave2));
                ctx.strokeStyle = `rgba(100, 200, 255, ${alpha * 0.7})`;
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, wave2Radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 绘制中心点
                ctx.fillStyle = `rgba(200, 230, 255, ${alpha * 1.5})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, 5, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive || this.isPulling) return;
        
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            
            // 保存上下文
            ctx.save();
            
            // 平移到投射物位置
            ctx.translate(screenPos.x, screenPos.y);
            
            // 应用旋转
            ctx.rotate(this.rotation);
            
            // 磁力波轮廓
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
            ctx.lineWidth = 2;
            
            // 绘制磁力波（波浪形状）
            const waveWidth = this.size * 1.5;
            const waveHeight = this.size * 0.8;
            
            ctx.beginPath();
            ctx.moveTo(-waveWidth, 0);
            
            // 波浪形状
            for (let i = -waveWidth; i <= waveWidth; i += 4) {
                const phase = (i / waveWidth) * Math.PI + this.wave1;
                const y = Math.sin(phase * 3) * waveHeight * (1 - Math.abs(i / waveWidth));
                ctx.lineTo(i, y);
            }
            
            ctx.stroke();
            
            // 绘制磁铁图标
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
            
            // 磁力波尾迹
            ctx.strokeStyle = 'rgba(0, 100, 255, 0.3)';
            ctx.lineWidth = 1;
            
            // 绘制尾迹
            ctx.beginPath();
            ctx.moveTo(-waveWidth * 1.2, 0);
            
            // 波浪尾迹
            for (let i = -waveWidth * 1.2; i <= waveWidth * 1.2; i += 4) {
                const phase = (i / waveWidth) * Math.PI + this.wave2;
                const y = Math.sin(phase * 3) * waveHeight * 1.2 * (1 - Math.abs(i / (waveWidth * 1.2)));
                ctx.lineTo(i, y);
            }
            
            ctx.stroke();
            
            // 恢复上下文
            ctx.restore();
        } catch (e) {
            console.error("绘制磁力波投射物时出错:", e);
        }
    }
}

/**
 * 声波攻击类
 * 声波号角的攻击效果
 */
class SonicWaveAttack {
    /**
     * 构造函数
     * @param {Player} owner - 拥有者
     * @param {number} dirX - X方向
     * @param {number} dirY - Y方向
     * @param {number} width - 宽度
     * @param {number} length - 长度
     * @param {number} damage - 伤害
     * @param {number} duration - 持续时间
     * @param {number} knockback - 击退力度
     * @param {boolean} bounce - 是否反弹
     */
    constructor(owner, dirX, dirY, width, length, damage, duration, knockback, bounce) {
        // 基本属性
        this.owner = owner;
        this.dirX = dirX;
        this.dirY = dirY;
        this.width = width;
        this.length = length;
        this.damage = damage;
        this.duration = duration;
        this.knockback = knockback;
        this.bounce = bounce;
        
        // 碰撞检测
        this.hitEnemies = new Set();
        this.isActive = true;
        this.isGarbage = false;
        
        // 视觉效果
        this.lifetime = 0;
        this.expansion = 0.1;  // 扩展时间
        this.maxExpansion = 0.7;  // 最大扩展比例
        this.currentLength = 0;  // 当前长度
        
        // 反弹相关
        this.hasBounced = false;
        this.bounceDir = { x: 0, y: 0 };
        this.bouncePoint = { x: 0, y: 0 };
        this.bounceTimer = 0;
        this.bounceDuration = 0.15;  // 反弹动画持续时间
        
        // 计算攻击起点
        this.x = owner.x;
        this.y = owner.y;
        
        // 波形参数
        this.waveFrequency = 0.2;  // 波浪频率
        this.waveAmplitude = 8;  // 波浪振幅
        this.wavePhase = 0;  // 波浪相位
        this.waveSpeed = 15;  // 波浪速度
    }

    /**
     * 更新攻击状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果已标记为垃圾，不更新
        if (this.isGarbage) return;
        
        // 更新生命周期
        this.lifetime += dt;
        
        // 更新波浪相位
        this.wavePhase = (this.wavePhase + dt * this.waveSpeed) % (Math.PI * 2);
        
        // 如果已经反弹
        if (this.hasBounced) {
            // 更新反弹计时器
            this.bounceTimer += dt;
            
            // 如果反弹结束，标记为垃圾
            if (this.bounceTimer >= this.bounceDuration || this.lifetime >= this.duration) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
        } 
        // 扩展阶段
        else if (this.lifetime < this.expansion) {
            // 扩展阶段
            this.currentLength = (this.lifetime / this.expansion) * this.length;
        } 
        // 持续阶段
        else if (this.lifetime < this.duration - this.expansion) {
            // 保持最大长度
            this.currentLength = this.length;
            
            // 检测碰撞
            this.checkCollisions();
        } 
        // 收缩阶段
        else if (this.lifetime < this.duration) {
            // 收缩阶段
            const remaining = this.duration - this.lifetime;
            this.currentLength = (remaining / this.expansion) * this.length;
        } 
        // 结束
        else {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        
        // 创建粒子效果
        this.createParticles(dt);
    }

    /**
     * 检测与敌人的碰撞
     */
    checkCollisions() {
        // 跳过无效攻击
        if (!this.isActive || this.isGarbage) return;
        
        // 获取攻击区域的端点坐标
        const endX = this.x + this.dirX * this.currentLength;
        const endY = this.y + this.dirY * this.currentLength;
        
        // 如果启用了反弹和尚未反弹
        if (this.bounce && !this.hasBounced) {
            // 检查是否需要反弹
            this.checkBounce();
        }
        
        // 检查与敌人的碰撞
        enemies.forEach(enemy => {
            // 跳过无效敌人和已命中的敌人
            if (enemy.isGarbage || !enemy.isActive || this.hitEnemies.has(enemy)) return;
            
            // 计算敌人到线段的距离
            const distToLine = this.pointToLineDistanceSq(
                enemy.x, enemy.y,
                this.x, this.y,
                endX, endY
            );
            
            // 如果在攻击范围内，命中敌人
            if (distToLine <= (this.width/2 + enemy.radius) * (this.width/2 + enemy.radius)) {
                // 标记为已命中
                this.hitEnemies.add(enemy);
                
                // 造成伤害
                enemy.takeDamage(this.damage, this.owner);
                
                // 应用击退
                this.applyKnockback(enemy);
            }
        });
    }

    /**
     * 计算点到线段的距离平方
     * @param {number} px - 点的X坐标
     * @param {number} py - 点的Y坐标
     * @param {number} x1 - 线段起点X坐标
     * @param {number} y1 - 线段起点Y坐标
     * @param {number} x2 - 线段终点X坐标
     * @param {number} y2 - 线段终点Y坐标
     * @returns {number} 距离平方
     */
    pointToLineDistanceSq(px, py, x1, y1, x2, y2) {
        const lineLength = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        
        if (lineLength === 0) {
            // 线段退化为点
            return (px - x1) * (px - x1) + (py - y1) * (py - y1);
        }
        
        // 计算点在线段上的投影比例
        const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLength;
        
        if (t < 0) {
            // 投影在线段起点之前
            return (px - x1) * (px - x1) + (py - y1) * (py - y1);
        }
        
        if (t > 1) {
            // 投影在线段终点之后
            return (px - x2) * (px - x2) + (py - y2) * (py - y2);
        }
        
        // 投影在线段上
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        
        return (px - projX) * (px - projX) + (py - projY) * (py - projY);
    }

    /**
     * 应用击退效果
     * @param {Enemy} enemy - 敌人
     */
    applyKnockback(enemy) {
        // 计算击退方向
        let knockbackDirX = this.dirX;
        let knockbackDirY = this.dirY;
        
        // 如果已经反弹，使用反弹方向
        if (this.hasBounced) {
            knockbackDirX = this.bounceDir.x;
            knockbackDirY = this.bounceDir.y;
        }
        
        // 应用击退
        enemy.x += knockbackDirX * this.knockback;
        enemy.y += knockbackDirY * this.knockback;
    }

    /**
     * 检查是否需要反弹
     */
    checkBounce() {
        // 获取攻击区域的端点坐标
        const endX = this.x + this.dirX * this.currentLength;
        const endY = this.y + this.dirY * this.currentLength;
        
        // 查找攻击范围内的敌人
        const maxDistSq = this.width * this.width / 4;
        let closestEnemy = null;
        let closestDistSq = maxDistSq;
        
        enemies.forEach(enemy => {
            // 跳过无效敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            
            // 计算敌人到线段的距离
            const distToLine = this.pointToLineDistanceSq(
                enemy.x, enemy.y,
                this.x, this.y,
                endX, endY
            );
            
            // 如果在攻击范围内且更近，更新最近的敌人
            if (distToLine <= maxDistSq && distToLine < closestDistSq) {
                closestDistSq = distToLine;
                closestEnemy = enemy;
            }
        });
        
        // 如果找到敌人，反弹
        if (closestEnemy) {
            // 标记为已反弹
            this.hasBounced = true;
            
            // 计算反弹点
            const lineLength = Math.sqrt(
                (endX - this.x) * (endX - this.x) + 
                (endY - this.y) * (endY - this.y)
            );
            
            // 获取反弹向量（与入射向量相反）
            const reflectX = -this.dirX;
            const reflectY = -this.dirY;
            
            // 添加随机角度（±30度）
            const angle = Math.atan2(reflectY, reflectX);
            const randomAngle = angle + (Math.random() - 0.5) * Math.PI / 3;
            
            // 更新反弹方向
            this.bounceDir.x = Math.cos(randomAngle);
            this.bounceDir.y = Math.sin(randomAngle);
            
            // 设置反弹点
            this.bouncePoint.x = closestEnemy.x;
            this.bouncePoint.y = closestEnemy.y;
            
            // 重置已命中敌人列表，允许二次命中
            this.hitEnemies.clear();
        }
    }

    /**
     * 创建粒子效果
     * @param {number} dt - 时间增量
     */
    createParticles(dt) {
        // 控制粒子生成速率
        if (Math.random() > 0.3) return;
        
        // 获取攻击区域的端点坐标
        const endX = this.x + this.dirX * this.currentLength;
        const endY = this.y + this.dirY * this.currentLength;
        
        // 如果已经反弹
        if (this.hasBounced) {
            // 计算反弹线段的端点
            const bounceProgress = this.bounceTimer / this.bounceDuration;
            const bounceLength = this.currentLength * bounceProgress;
            
            const bounceEndX = this.bouncePoint.x + this.bounceDir.x * bounceLength;
            const bounceEndY = this.bouncePoint.y + this.bounceDir.y * bounceLength;
            
            // 在反弹线段上随机选择点
            const t = Math.random();
            const particleX = this.bouncePoint.x + t * (bounceEndX - this.bouncePoint.x);
            const particleY = this.bouncePoint.y + t * (bounceEndY - this.bouncePoint.y);
            
            // 创建粒子
            this.createSonicParticle(particleX, particleY);
        } else {
            // 在攻击线段上随机选择点
            const t = Math.random();
            const particleX = this.x + t * (endX - this.x);
            const particleY = this.y + t * (endY - this.y);
            
            // 创建粒子
            this.createSonicParticle(particleX, particleY);
        }
    }

    /**
     * 创建声波粒子
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    createSonicParticle(x, y) {
        // 计算垂直于攻击方向的向量
        const perpX = -this.dirY;
        const perpY = this.dirX;
        
        // 随机偏移
        const offsetDist = (Math.random() - 0.5) * this.width * 0.8;
        
        // 粒子位置
        const particleX = x + perpX * offsetDist;
        const particleY = y + perpY * offsetDist;
        
        // 随机速度
        const speed = 30 + Math.random() * 20;
        const angle = Math.random() * Math.PI * 2;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed;
        
        // 创建粒子
        const particle = {
            x: particleX,
            y: particleY,
            vx: vx,
            vy: vy,
            size: 2 + Math.random() * 3,
            lifetime: 0.2 + Math.random() * 0.3,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.vx *= 0.9;
                this.vy *= 0.9;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.7 * (1 - this.timer / this.lifetime);
                
                ctx.fillStyle = `rgba(220, 220, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(particle);
        }
    }

    /**
     * 绘制攻击
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage) return;
        
        try {
            // 主要攻击光束
            if (!this.hasBounced || this.bounceTimer < this.bounceDuration) {
                this.drawBeam(ctx);
            }
            
            // 如果已经反弹，绘制反弹光束
            if (this.hasBounced) {
                this.drawBounceBeam(ctx);
            }
        } catch (e) {
            console.error("绘制声波攻击时出错:", e);
        }
    }

    /**
     * 绘制主要攻击光束
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawBeam(ctx) {
        // 获取攻击区域的起点和终点
        const startPos = cameraManager.worldToScreen(this.x, this.y);
        const endX = this.x + this.dirX * this.currentLength;
        const endY = this.y + this.dirY * this.currentLength;
        const endPos = cameraManager.worldToScreen(endX, endY);
        
        // 计算垂直于攻击方向的向量
        const perpX = -this.dirY;
        const perpY = this.dirX;
        
        // 计算衰减因子
        let alpha = 1.0;
        if (this.lifetime < this.expansion) {
            // 扩展阶段
            alpha = this.lifetime / this.expansion;
        } else if (this.lifetime > this.duration - this.expansion) {
            // 收缩阶段
            alpha = (this.duration - this.lifetime) / this.expansion;
        }
        
        // 如果已经反弹，减小主光束不透明度
        if (this.hasBounced) {
            alpha *= (1 - this.bounceTimer / this.bounceDuration);
        }
        
        // 保存上下文
        ctx.save();
        
        // 裁剪区域，限制在光束形状内
        ctx.beginPath();
        
        // 计算光束多边形的顶点
        const points = this.calculateBeamPolygon(startPos, endPos, perpX, perpY);
        
        // 绘制多边形路径
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        
        // 设置光束渐变
        const gradient = ctx.createLinearGradient(startPos.x, startPos.y, endPos.x, endPos.y);
        gradient.addColorStop(0, `rgba(200, 200, 255, ${alpha * 0.3})`);
        gradient.addColorStop(0.5, `rgba(220, 220, 255, ${alpha * 0.6})`);
        gradient.addColorStop(1, `rgba(240, 240, 255, ${alpha * 0.3})`);
        
        // 填充光束
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制光束边缘
        ctx.strokeStyle = `rgba(180, 180, 255, ${alpha * 0.7})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 恢复上下文
        ctx.restore();
    }

    /**
     * 绘制反弹光束
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawBounceBeam(ctx) {
        // 计算反弹进度
        const bounceProgress = this.bounceTimer / this.bounceDuration;
        
        // 计算反弹光束的长度
        const bounceLength = this.currentLength * bounceProgress;
        
        // 计算反弹光束的终点
        const bounceEndX = this.bouncePoint.x + this.bounceDir.x * bounceLength;
        const bounceEndY = this.bouncePoint.y + this.bounceDir.y * bounceLength;
        
        // 获取屏幕坐标
        const bounceStartPos = cameraManager.worldToScreen(this.bouncePoint.x, this.bouncePoint.y);
        const bounceEndPos = cameraManager.worldToScreen(bounceEndX, bounceEndY);
        
        // 计算垂直于反弹方向的向量
        const bouncePerpX = -this.bounceDir.y;
        const bouncePerpY = this.bounceDir.x;
        
        // 计算反弹光束的不透明度
        const alpha = Math.min(1.0, bounceProgress * 2) * (1 - Math.pow(bounceProgress, 2));
        
        // 保存上下文
        ctx.save();
        
        // 裁剪区域，限制在光束形状内
        ctx.beginPath();
        
        // 计算反弹光束多边形的顶点
        const points = this.calculateBeamPolygon(bounceStartPos, bounceEndPos, bouncePerpX, bouncePerpY);
        
        // 绘制多边形路径
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.closePath();
        
        // 设置反弹光束渐变
        const gradient = ctx.createLinearGradient(bounceStartPos.x, bounceStartPos.y, bounceEndPos.x, bounceEndPos.y);
        gradient.addColorStop(0, `rgba(220, 220, 255, ${alpha * 0.5})`);
        gradient.addColorStop(0.5, `rgba(240, 240, 255, ${alpha * 0.8})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${alpha * 0.5})`);
        
        // 填充反弹光束
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 绘制反弹光束边缘
        ctx.strokeStyle = `rgba(200, 200, 255, ${alpha * 0.9})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 恢复上下文
        ctx.restore();
    }

    /**
     * 计算光束多边形的顶点
     * @param {Object} startPos - 起点屏幕坐标
     * @param {Object} endPos - 终点屏幕坐标
     * @param {number} perpX - 垂直向量X分量
     * @param {number} perpY - 垂直向量Y分量
     * @returns {Array} 多边形顶点
     */
    calculateBeamPolygon(startPos, endPos, perpX, perpY) {
        // 屏幕上的垂直向量
        const screenPerpX = perpX * 50;  // 放大以适应屏幕坐标
        const screenPerpY = perpY * 50;
        
        // 计算波浪效果的宽度比例
        const widthScale = this.width / 100;  // 基于标准宽度调整
        
        // 上边缘点集
        const topPoints = [];
        const bottomPoints = [];
        
        const segments = 8;  // 分段数量
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            
            // 插值计算线段上的点
            const x = startPos.x + t * (endPos.x - startPos.x);
            const y = startPos.y + t * (endPos.y - startPos.y);
            
            // 波浪效果（振幅随距离减小）
            const waveFactor = 1 - Math.pow(Math.abs(t - 0.5) * 2, 2);  // 中间最大，两端最小
            const waveOffset = Math.sin(this.wavePhase + t * 10) * this.waveAmplitude * waveFactor * widthScale;
            
            // 计算边缘点
            const halfWidth = this.width / 2 * widthScale * (0.8 + 0.2 * Math.sin(t * Math.PI));  // 宽度中间略粗
            
            // 上边缘点
            topPoints.push({
                x: x + screenPerpX * (halfWidth / 50) + screenPerpX * (waveOffset / 100),
                y: y + screenPerpY * (halfWidth / 50) + screenPerpY * (waveOffset / 100)
            });
            
            // 下边缘点（逆序添加，形成环路）
            bottomPoints.unshift({
                x: x - screenPerpX * (halfWidth / 50) - screenPerpX * (waveOffset / 100),
                y: y - screenPerpY * (halfWidth / 50) - screenPerpY * (waveOffset / 100)
            });
        }
        
        // 合并上下边缘点集
        return topPoints.concat(bottomPoints);
    }
}

/**
 * 藤蔓危险区域类
 * 藤蔓种子的效果区域
 */
class VineHazard {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} radius - 半径
     * @param {number} damage - 伤害
     * @param {number} attackDuration - 攻击持续时间
     * @param {number} slowFactor - 减速因子
     * @param {number} lifetime - 生命周期
     * @param {Player} owner - 拥有者
     */
    constructor(x, y, radius, damage, attackDuration, slowFactor, lifetime, owner) {
        // 基本属性
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.attackDuration = attackDuration;
        this.slowFactor = slowFactor;
        this.lifetime = lifetime;
        this.owner = owner;
        
        // 状态
        this.isActive = true;
        this.isGarbage = false;
        this.timer = 0;
        this.damageTimer = 0;
        
        // 生长动画
        this.isGrowing = true;
        this.growDuration = 0.7;
        this.growProgress = 0;
        this.currentRadius = 0;
        
        // 衰减动画
        this.isDecaying = false;
        this.decayDuration = 0.5;
        this.decayTimer = 0;
        
        // 藤蔓
        this.vines = [];
        this.createVines();
        
        // 视觉效果
        this.leafParticleTimer = 0;
        this.leafParticleInterval = 0.5;
    }

    /**
     * 创建藤蔓
     */
    createVines() {
        // 生成多条藤蔓
        const vineCount = 5 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < vineCount; i++) {
            // 随机角度
            const angle = Math.PI * 2 * i / vineCount + Math.random() * 0.2;
            
            // 随机长度
            const length = this.radius * (0.5 + Math.random() * 0.5);
            
            // 随机生长速度
            const growSpeed = 0.5 + Math.random() * 0.5;
            
            // 随机粗细
            const thickness = 3 + Math.random() * 2;
            
            // 创建藤蔓
            const vine = {
                angle: angle,
                length: length,
                growSpeed: growSpeed,
                thickness: thickness,
                currentLength: 0,
                segments: [],
                flowers: [],
                thorns: []
            };
            
            // 生成藤蔓段
            const segmentCount = 6 + Math.floor(Math.random() * 5);
            let prevX = 0;
            let prevY = 0;
            
            for (let j = 0; j < segmentCount; j++) {
                // 段长度
                const segLength = length / segmentCount;
                
                // 随机角度偏移
                const angleOffset = (Math.random() - 0.5) * 0.8;
                
                // 当前段的角度
                const segAngle = angle + angleOffset;
                
                // 当前段的端点
                const endX = prevX + Math.cos(segAngle) * segLength;
                const endY = prevY + Math.sin(segAngle) * segLength;
                
                // 添加段
                vine.segments.push({
                    startX: prevX,
                    startY: prevY,
                    endX: endX,
                    endY: endY,
                    angle: segAngle,
                    isReady: false,
                    growDelay: j * 0.1
                });
                
                // 更新前一个点
                prevX = endX;
                prevY = endY;
                
                // 随机添加花朵
                if (Math.random() < 0.2) {
                    vine.flowers.push({
                        x: endX,
                        y: endY,
                        size: 5 + Math.random() * 3,
                        growDelay: j * 0.1 + 0.2,
                        isReady: false,
                        type: Math.random() < 0.5 ? '🌸' : '🌼'
                    });
                }
                
                // 随机添加刺
                if (Math.random() < 0.3) {
                    const thornAngle = segAngle + Math.PI/2 * (Math.random() < 0.5 ? 1 : -1);
                    const thornLength = 3 + Math.random() * 3;
                    
                    vine.thorns.push({
                        x: (prevX + endX) / 2, // 中点
                        y: (prevY + endY) / 2,
                        angle: thornAngle,
                        length: thornLength,
                        growDelay: j * 0.1 + 0.1,
                        isReady: false
                    });
                }
            }
            
            this.vines.push(vine);
        }
    }

        /**     * 更新危险区域状态     * @param {number} dt - 时间增量     */    update(dt) {        // 如果已标记为垃圾，不更新        if (this.isGarbage) return;                // 更新计时器        this.timer += dt;        this.leafParticleTimer += dt;                // 如果生命周期结束，启动衰减动画        if (this.timer >= this.lifetime && !this.isDecaying) {            this.isDecaying = true;        }                // 如果正在生长        if (this.isGrowing) {            // 更新生长进度            this.growProgress = Math.min(1, this.timer / this.growDuration);            this.currentRadius = this.radius * this.growProgress;                        // 如果生长完成            if (this.growProgress >= 1) {                this.isGrowing = false;            }                        // 更新藤蔓生长            this.updateVinesGrowth(dt);        }        // 如果正在衰减        else if (this.isDecaying) {            // 更新衰减计时器            this.decayTimer += dt;                        // 计算衰减进度            const decayProgress = this.decayTimer / this.decayDuration;                        // 更新当前半径            this.currentRadius = this.radius * (1 - decayProgress);                        // 如果衰减完成，标记为垃圾            if (decayProgress >= 1) {                this.isGarbage = true;                this.isActive = false;                return;            }        }        // 正常状态        else {            // 使用完整半径            this.currentRadius = this.radius;                        // 更新伤害计时器            this.damageTimer += dt;                        // 如果到达攻击间隔，造成伤害            if (this.damageTimer >= this.attackDuration) {                this.damageEnemies();                this.damageTimer = 0;            }        }    }        /**     * 对范围内的敌人造成伤害     */    damageEnemies() {        // 如果藤蔓不活动，不造成伤害        if (!this.isActive || this.isGarbage) return;                // 获取范围内的敌人        enemies.forEach(enemy => {            // 跳过无效敌人            if (enemy.isGarbage || !enemy.isActive) return;                        // 计算距离            const dx = enemy.x - this.x;            const dy = enemy.y - this.y;            const distSq = dx * dx + dy * dy;                        // 如果在范围内，造成伤害            if (distSq <= this.currentRadius * this.currentRadius) {                // 造成伤害                enemy.takeDamage(this.damage, this.owner);                                // 应用减速效果                if (!enemy.statusEffects) {                    enemy.statusEffects = {};                }                                enemy.statusEffects.slow = {                    factor: this.slowFactor,                    duration: 0.5, // 减速持续短暂时间，下一次攻击前会刷新                    source: this.owner                };            }        });    }
        
        // 创建叶子粒子
        if (this.leafParticleTimer >= this.leafParticleInterval) {
            this.createLeafParticle();
            this.leafParticleTimer = 0;
        }
    }

    /**
     * 更新藤蔓生长
     * @param {number} dt - 时间增量
     */
    updateVinesGrowth(dt) {
        this.vines.forEach(vine => {
            // 更新当前藤蔓长度
            vine.currentLength = Math.min(vine.length, vine.currentLength + vine.growSpeed * dt);
            
            // 更新段生长状态
            vine.segments.forEach(segment => {
                if (!segment.isReady) {
                    if (this.timer > segment.growDelay) {
                        segment.isReady = true;
                    }
                }
            });
            
            // 更新花朵生长状态
            vine.flowers.forEach(flower => {
                if (!flower.isReady) {
                    if (this.timer > flower.growDelay) {
                        flower.isReady = true;
                    }
                }
            });
            
            // 更新刺生长状态
            vine.thorns.forEach(thorn => {
                if (!thorn.isReady) {
                    if (this.timer > thorn.growDelay) {
                        thorn.isReady = true;
                    }
                }
            });
        });
    }

    /**
     * 应用减速效果
     * @param {Enemy} enemy - 敌人
     */
    applySlow(enemy) {
        // 初始化状态效果对象
        if (!enemy.statusEffects) {
            enemy.statusEffects = {};
        }
        
        // 如果已经有减速效果，延长持续时间
        if (enemy.statusEffects.vineSlow) {
            enemy.statusEffects.vineSlow.duration = Math.max(
                enemy.statusEffects.vineSlow.duration,
                this.attackDuration * 2
            );
        } else {
            // 添加新的减速效果
            const originalSpeed = enemy.speed;
            enemy.speed *= this.slowFactor;
            
            enemy.statusEffects.vineSlow = {
                duration: this.attackDuration * 2,
                factor: this.slowFactor,
                originalSpeed: originalSpeed,
                source: this.owner
            };
        }
    }

    /**
     * 创建叶子粒子
     */
    createLeafParticle() {
        // 在区域内随机位置生成叶子
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.currentRadius;
        
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        // 随机叶子类型
        const leafType = Math.random() < 0.5 ? '🍃' : '🍂';
        
        // 创建叶子粒子
        const leaf = {
            x: x,
            y: y,
            emoji: leafType,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10 - 5,  // 轻微上升
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: (Math.random() - 0.5) * Math.PI,
            size: 8 + Math.random() * 4,
            lifetime: 1.5 + Math.random() * 1,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.vx *= 0.95;
                this.vy *= 0.95;
                this.rotation += this.rotationSpeed * dt;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.8 * (1 - Math.pow(this.timer / this.lifetime, 2));
                
                ctx.save();
                ctx.translate(screenPos.x, screenPos.y);
                ctx.rotate(this.rotation);
                
                ctx.globalAlpha = alpha;
                ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.emoji, 0, 0);
                
                ctx.restore();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(leaf);
        }
    }

    /**
     * 绘制危险区域
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage) return;
        
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            
            // 保存上下文
            ctx.save();
            
            // 绘制区域边界
            if (!this.isDecaying) {
                ctx.strokeStyle = 'rgba(0, 150, 0, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.currentRadius, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // 绘制藤蔓
            this.drawVines(ctx, screenPos);
            
            // 恢复上下文
            ctx.restore();
        } catch (e) {
            console.error("绘制藤蔓危险区域时出错:", e);
        }
    }

    /**
     * 绘制藤蔓
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} screenPos - 屏幕坐标
     */
    drawVines(ctx, screenPos) {
        // 对于每条藤蔓
        this.vines.forEach(vine => {
            // 计算透明度
            let alpha = 1.0;
            if (this.isDecaying) {
                alpha = 1 - this.decayTimer / this.decayDuration;
            }
            
            // 绘制藤蔓段
            vine.segments.forEach(segment => {
                if (!segment.isReady) return;
                
                // 转换坐标
                const startScreenX = screenPos.x + segment.startX;
                const startScreenY = screenPos.y + segment.startY;
                const endScreenX = screenPos.x + segment.endX;
                const endScreenY = screenPos.y + segment.endY;
                
                // 绘制藤蔓段
                ctx.strokeStyle = `rgba(20, 150, 20, ${alpha * 0.9})`;
                ctx.lineWidth = vine.thickness;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(startScreenX, startScreenY);
                ctx.lineTo(endScreenX, endScreenY);
                ctx.stroke();
                
                // 绘制藤蔓阴影
                ctx.strokeStyle = `rgba(0, 100, 0, ${alpha * 0.5})`;
                ctx.lineWidth = vine.thickness * 1.5;
                
                ctx.beginPath();
                ctx.moveTo(startScreenX, startScreenY);
                ctx.lineTo(endScreenX, endScreenY);
                ctx.stroke();
            });
            
            // 绘制花朵
            vine.flowers.forEach(flower => {
                if (!flower.isReady) return;
                
                // 转换坐标
                const flowerScreenX = screenPos.x + flower.x;
                const flowerScreenY = screenPos.y + flower.y;
                
                // 绘制花朵
                ctx.globalAlpha = alpha;
                ctx.font = `${flower.size}px 'Segoe UI Emoji', Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(flower.type, flowerScreenX, flowerScreenY);
            });
            
            // 绘制刺
            vine.thorns.forEach(thorn => {
                if (!thorn.isReady) return;
                
                // 转换坐标
                const thornStartX = screenPos.x + thorn.x;
                const thornStartY = screenPos.y + thorn.y;
                const thornEndX = thornStartX + Math.cos(thorn.angle) * thorn.length;
                const thornEndY = thornStartY + Math.sin(thorn.angle) * thorn.length;
                
                // 绘制刺
                ctx.strokeStyle = `rgba(100, 40, 0, ${alpha * 0.9})`;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(thornStartX, thornStartY);
                ctx.lineTo(thornEndX, thornEndY);
                ctx.stroke();
            });
        });
    }
}

/**
 * 冰晶投射物类
 * 冰晶杖的投射物
 */
class FrostCrystalProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} pierce - 穿透
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} freezeDuration - 冰冻持续时间
     * @param {number} slowFactor - 减速因子
     * @param {boolean} split - 是否分裂
     */
    constructor(x, y, size, vx, vy, damage, pierce, duration, ownerStats, freezeDuration, slowFactor, split) {
        super(x, y, "❄️", size, vx, vy, damage, pierce, duration, ownerStats);
        
        // 额外属性
        this.freezeDuration = freezeDuration;
        this.slowFactor = slowFactor;
        this.split = split;
        
        // 冰晶状态
        this.isExploding = false;
        this.explodeTimer = 0;
        this.explodeDuration = 0.2;
        
        // 视觉效果
        this.rotation = Math.random() * Math.PI * 2;
        this.rotationSpeed = (Math.random() - 0.5) * Math.PI;
        this.scale = 1.0;
        this.oscillation = Math.random() * Math.PI * 2;
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        
        // 更新视觉效果
        this.rotation += this.rotationSpeed * dt;
        this.oscillation = (this.oscillation + dt * 3) % (Math.PI * 2);
        this.scale = 1.0 + Math.sin(this.oscillation) * 0.1;
        
        if (this.isExploding) {
            // 更新爆炸计时器
            this.explodeTimer += dt;
            
            // 如果爆炸结束，标记为垃圾
            if (this.explodeTimer >= this.explodeDuration) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
        } else {
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 如果生命周期结束，爆炸
            if (this.lifetime >= this.duration) {
                this.explode();
                return;
            }
            
            // 如果超出屏幕，标记为垃圾
            if (
                this.x < -this.width ||
                this.x > GAME_WIDTH + this.width ||
                this.y < -this.height ||
                this.y > GAME_HEIGHT + this.height
            ) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查与敌人的碰撞
            enemies.forEach(enemy => {
                // 跳过已命中的敌人
                if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
                
                // 检查碰撞
                if (this.checkCollision(enemy)) {
                    // 造成伤害
                    enemy.takeDamage(this.damage, this.owner);
                    
                    // 应用冰冻效果
                    this.applyFreezeEffect(enemy);
                    
                    // 添加到已命中列表
                    this.hitTargets.add(enemy);
                    
                    // 创建命中特效
                    this.createHitEffect(enemy);
                    
                    // 减少穿透次数
                    this.pierceCount++;
                    
                    // 如果穿透次数达到上限，爆炸
                    if (this.pierceCount >= this.pierce) {
                        this.explode();
                        return;
                    } else {
                        // 减小冰晶大小
                        this.size *= 0.9;
                    }
                }
            });
            
            // 创建尾迹粒子
            this.createTrailParticle();
        }
    }

    /**
     * 应用冰冻效果
     * @param {Enemy} enemy - 敌人
     */
    applyFreezeEffect(enemy) {
        // 初始化状态效果对象
        if (!enemy.statusEffects) {
            enemy.statusEffects = {};
        }
        
        // 如果已经有减速效果，延长持续时间
        if (enemy.statusEffects.freeze) {
            enemy.statusEffects.freeze.duration = Math.max(
                enemy.statusEffects.freeze.duration,
                this.freezeDuration
            );
        } else {
            // 添加新的减速效果
            const originalSpeed = enemy.speed;
            enemy.speed *= this.slowFactor;
            
            enemy.statusEffects.freeze = {
                duration: this.freezeDuration,
                factor: this.slowFactor,
                originalSpeed: originalSpeed,
                source: this.owner
            };
        }
    }

    /**
     * 爆炸
     */
    explode() {
        // 标记为正在爆炸
        this.isExploding = true;
        
        // 创建爆炸特效
        this.createExplosionEffect();
        
        // 如果启用了分裂
        if (this.split) {
            // 创建分裂冰晶
            this.createSplitCrystals();
        }
    }

    /**
     * 创建命中特效
     * @param {Enemy} enemy - 敌人
     */
    createHitEffect(enemy) {
        // 创建冰晶碎片
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 20;
            
            const fragment = {
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * Math.PI * 4,
                size: 2 + Math.random() * 2,
                lifetime: 0.3 + Math.random() * 0.2,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.9;
                    this.vy *= 0.9;
                    this.rotation += this.rotationSpeed * dt;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 0.8 * (1 - this.timer / this.lifetime);
                    
                    ctx.save();
                    ctx.translate(screenPos.x, screenPos.y);
                    ctx.rotate(this.rotation);
                    
                    // 绘制冰晶碎片
                    ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
                    ctx.beginPath();
                    ctx.moveTo(0, -this.size);
                    ctx.lineTo(this.size, 0);
                    ctx.lineTo(0, this.size);
                    ctx.lineTo(-this.size, 0);
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                }
            };
            
            // 添加到粒子列表
            if (typeof particles !== 'undefined') {
                particles.push(fragment);
            }
        }
    }

    /**
     * 创建爆炸特效
     */
    createExplosionEffect() {
        // 创建爆炸特效
        const explosion = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.size * 3,
            lifetime: 0.4,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 爆炸半径先增加后减少
                const progress = this.timer / this.lifetime;
                if (progress < 0.7) {
                    this.radius = (progress / 0.7) * this.maxRadius;
                } else {
                    this.radius = this.maxRadius * (1 - (progress - 0.7) / 0.3 * 0.3);
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.7 * (1 - this.timer / this.lifetime);
                
                // 绘制爆炸
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, this.radius
                );
                gradient.addColorStop(0, `rgba(230, 250, 255, ${alpha})`);
                gradient.addColorStop(0.7, `rgba(180, 230, 255, ${alpha * 0.7})`);
                gradient.addColorStop(1, `rgba(150, 200, 255, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(explosion);
        }
        
        // 创建冰晶碎片
        for (let i = 0; i < 10; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 30;
            
            const fragment = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * Math.PI * 4,
                size: 3 + Math.random() * 3,
                lifetime: 0.5 + Math.random() * 0.3,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.9;
                    this.vy *= 0.9;
                    this.rotation += this.rotationSpeed * dt;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 0.8 * (1 - this.timer / this.lifetime);
                    
                    ctx.save();
                    ctx.translate(screenPos.x, screenPos.y);
                    ctx.rotate(this.rotation);
                    
                    // 绘制冰晶碎片
                    ctx.fillStyle = `rgba(200, 240, 255, ${alpha})`;
                    ctx.beginPath();
                    const size = this.size;
                    
                    // 绘制雪花形状
                    for (let i = 0; i < 6; i++) {
                        const angle = Math.PI * 2 * i / 6;
                        ctx.moveTo(0, 0);
                        ctx.lineTo(Math.cos(angle) * size, Math.sin(angle) * size);
                        
                        // 每个主分支添加小分支
                        const branchAngle1 = angle - Math.PI/6;
                        const branchAngle2 = angle + Math.PI/6;
                        
                        const branchX = Math.cos(angle) * size * 0.6;
                        const branchY = Math.sin(angle) * size * 0.6;
                        
                        const branchLength = size * 0.4;
                        
                        ctx.moveTo(branchX, branchY);
                        ctx.lineTo(
                            branchX + Math.cos(branchAngle1) * branchLength,
                            branchY + Math.sin(branchAngle1) * branchLength
                        );
                        
                        ctx.moveTo(branchX, branchY);
                        ctx.lineTo(
                            branchX + Math.cos(branchAngle2) * branchLength,
                            branchY + Math.sin(branchAngle2) * branchLength
                        );
                    }
                    
                    ctx.stroke();
                    
                    ctx.restore();
                }
            };
            
            // 添加到粒子列表
            if (typeof particles !== 'undefined') {
                particles.push(fragment);
            }
        }
    }

    /**
     * 创建分裂冰晶
     */
    createSplitCrystals() {
        // 创建2个小冰晶
        for (let i = 0; i < 2; i++) {
            // 随机角度（优先向两侧散开）
            const baseAngle = Math.atan2(this.vy, this.vx);
            const spreadAngle = Math.PI / 2;  // 90度扇形
            const newAngle = baseAngle + spreadAngle * (i === 0 ? -0.5 : 0.5) + (Math.random() - 0.5) * 0.5;
            
            // 计算新速度
            const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy) * 0.8;  // 速度略微降低
            const newVx = Math.cos(newAngle) * speed;
            const newVy = Math.sin(newAngle) * speed;
            
            // 创建小冰晶
            const smallCrystal = new FrostCrystalProjectile(
                this.x, this.y, this.size * 0.7, newVx, newVy,
                this.damage * 0.6, 1, this.duration * 0.7, 
                this.ownerStats, this.freezeDuration * 0.8, this.slowFactor, false
            );
            
            smallCrystal.owner = this.owner;
            projectiles.push(smallCrystal);
        }
    }

    /**
     * 创建尾迹粒子
     */
    createTrailParticle() {
        // 控制粒子生成速率
        if (Math.random() > 0.2) return;
        
        // 创建尾迹粒子
        const particle = {
            x: this.x,
            y: this.y,
            vx: (Math.random() - 0.5) * 10,
            vy: (Math.random() - 0.5) * 10,
            size: 2 + Math.random() * 2,
            lifetime: 0.3 + Math.random() * 0.2,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.vx *= 0.9;
                this.vy *= 0.9;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.6 * (1 - this.timer / this.lifetime);
                
                // 绘制雪花粒子
                ctx.fillStyle = `rgba(220, 240, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(particle);
        }
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive || this.isExploding) return;
        
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            
            // 保存上下文
            ctx.save();
            
            // 平移到投射物位置
            ctx.translate(screenPos.x, screenPos.y);
            
            // 应用旋转
            ctx.rotate(this.rotation);
            
            // 应用缩放
            ctx.scale(this.scale, this.scale);
            
            // 绘制冰晶
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
            
            // 绘制冰晶光晕
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(0, 0, this.size * 1.2, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(200, 240, 255, 0.3)';
            ctx.fill();
            
            // 恢复上下文
            ctx.restore();
        } catch (e) {
            console.error("绘制冰晶投射物时出错:", e);
        }
    }
}

/**
 * 激光束攻击类
 * 光棱塔的激光攻击效果
 */
class LaserBeamAttack {
    /**
     * 构造函数
     * @param {Player} owner - 拥有者
     * @param {number} dirX - X方向
     * @param {number} dirY - Y方向
     * @param {number} length - 长度
     * @param {number} width - 宽度
     * @param {number} damage - 伤害
     * @param {number} duration - 持续时间
     * @param {number} rotationSpeed - 旋转速度
     * @param {boolean} piercing - 是否穿透
     */
    constructor(owner, dirX, dirY, length, width, damage, duration, rotationSpeed, piercing) {
        // 基本属性
        this.owner = owner;
        this.dirX = dirX;
        this.dirY = dirY;
        this.length = length;
        this.width = width;
        this.damage = damage;
        this.duration = duration;
        this.rotationSpeed = rotationSpeed;
        this.piercing = piercing;
        
        // 碰撞检测
        this.hitEnemies = new Set();
        this.isActive = true;
        this.isGarbage = false;
        
        // 视觉效果
        this.lifetime = 0;
        this.rotationAngle = Math.atan2(dirY, dirX);
        
        // 计算攻击起点
        this.x = owner.x;
        this.y = owner.y;
    }

    /**
     * 更新攻击状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果已标记为垃圾，不更新
        if (this.isGarbage) return;
        
        // 更新生命周期
        this.lifetime += dt;
        
        // 更新位置为玩家位置
        this.x = this.owner.x;
        this.y = this.owner.y;
        
        // 更新旋转角度
        this.rotationAngle += this.rotationSpeed * dt;
        
        // 更新方向向量
        this.dirX = Math.cos(this.rotationAngle);
        this.dirY = Math.sin(this.rotationAngle);
        
        // 如果生命周期结束，标记为垃圾
        if (this.lifetime >= this.duration) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        
        // 检测碰撞
        this.checkCollisions();
    }

    /**
     * 检测与敌人的碰撞
     */
    checkCollisions() {
        // 跳过无效攻击
        if (!this.isActive || this.isGarbage) return;
        
        // 获取激光终点
        const endX = this.x + this.dirX * this.length;
        const endY = this.y + this.dirY * this.length;
        
        // 检查与敌人的碰撞
        enemies.forEach(enemy => {
            // 如果不穿透，跳过已命中的敌人
            if ((!this.piercing && this.hitEnemies.has(enemy)) || enemy.isGarbage || !enemy.isActive) return;
            
            // 计算敌人到线段的距离
            const distToLine = this.pointToLineDistanceSq(
                enemy.x, enemy.y,
                this.x, this.y,
                endX, endY
            );
            
            // 如果在激光范围内，命中敌人
            if (distToLine <= (this.width/2 + enemy.radius) * (this.width/2 + enemy.radius)) {
                // 如果敌人没有被命中过或者激光可以穿透
                if (!this.hitEnemies.has(enemy)) {
                    // 造成伤害
                    enemy.takeDamage(this.damage, this.owner);
                    
                    // 添加到已命中列表
                    this.hitEnemies.add(enemy);
                    
                    // 创建命中特效
                    this.createHitEffect(enemy);
                }
            }
        });
    }

    /**
     * 计算点到线段的距离平方
     * @param {number} px - 点的X坐标
     * @param {number} py - 点的Y坐标
     * @param {number} x1 - 线段起点X坐标
     * @param {number} y1 - 线段起点Y坐标
     * @param {number} x2 - 线段终点X坐标
     * @param {number} y2 - 线段终点Y坐标
     * @returns {number} 距离平方
     */
    pointToLineDistanceSq(px, py, x1, y1, x2, y2) {
        const lineLength = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
        
        if (lineLength === 0) {
            // 线段退化为点
            return (px - x1) * (px - x1) + (py - y1) * (py - y1);
        }
        
        // 计算点在线段上的投影比例
        const t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lineLength;
        
        if (t < 0) {
            // 投影在线段起点之前
            return (px - x1) * (px - x1) + (py - y1) * (py - y1);
        }
        
        if (t > 1) {
            // 投影在线段终点之后
            return (px - x2) * (px - x2) + (py - y2) * (py - y2);
        }
        
        // 投影在线段上
        const projX = x1 + t * (x2 - x1);
        const projY = y1 + t * (y2 - y1);
        
        return (px - projX) * (px - projX) + (py - projY) * (py - projY);
    }

    /**
     * 创建命中特效
     * @param {Enemy} enemy - 敌人
     */
    createHitEffect(enemy) {
        // 创建激光命中特效
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 20;
            
            const particle = {
                x: enemy.x,
                y: enemy.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 2,
                lifetime: 0.2 + Math.random() * 0.2,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.9;
                    this.vy *= 0.9;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 0.7 * (1 - this.timer / this.lifetime);
                    
                    ctx.fillStyle = `rgba(255, 220, 100, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            // 添加到粒子列表
            if (typeof particles !== 'undefined') {
                particles.push(particle);
            }
        }
    }

    /**
     * 绘制攻击
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage) return;
        
        try {
            // 获取起点屏幕坐标
            const startPos = cameraManager.worldToScreen(this.x, this.y);
            
            // 获取终点
            const endX = this.x + this.dirX * this.length;
            const endY = this.y + this.dirY * this.length;
            const endPos = cameraManager.worldToScreen(endX, endY);
            
            // 绘制激光
            ctx.save();
            
            // 设置激光渐变
            const gradient = ctx.createLinearGradient(startPos.x, startPos.y, endPos.x, endPos.y);
            gradient.addColorStop(0, 'rgba(255, 255, 220, 0.9)');
            gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.7)');
            gradient.addColorStop(1, 'rgba(255, 100, 50, 0.5)');
            
            // 绘制激光中心线
            ctx.strokeStyle = gradient;
            ctx.lineWidth = this.width;
            ctx.lineCap = 'round';
            
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(endPos.x, endPos.y);
            ctx.stroke();
            
            // 绘制激光外发光
            ctx.strokeStyle = 'rgba(255, 200, 100, 0.3)';
            ctx.lineWidth = this.width * 1.5;
            
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(endPos.x, endPos.y);
            ctx.stroke();
            
            // 绘制起点发光
            ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, this.width * 0.8, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        } catch (e) {
            console.error("绘制激光束攻击时出错:", e);
        }
    }
}

/**
 * 火山喷发类
 * 火山杖的喷发效果
 */
class VolcanoEruption {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} radius - 半径
     * @param {number} damage - 伤害
     * @param {number} eruptions - 喷发次数
     * @param {number} eruptionDelay - 喷发间隔
     * @param {number} burnDamage - 燃烧伤害
     * @param {number} burnDuration - 燃烧持续时间
     * @param {boolean} lavaPuddle - 是否留下熔岩池
     * @param {Player} owner - 拥有者
     */
    constructor(x, y, radius, damage, eruptions, eruptionDelay, burnDamage, burnDuration, lavaPuddle, owner) {
        // 基本属性
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.damage = damage;
        this.eruptions = eruptions;
        this.eruptionDelay = eruptionDelay;
        this.burnDamage = burnDamage;
        this.burnDuration = burnDuration;
        this.lavaPuddle = lavaPuddle;
        this.owner = owner;
        
        // 状态
        this.isActive = true;
        this.isGarbage = false;
        this.eruptionTimer = 0;
        this.eruptionCount = 0;
        
        // 熔岩池
        this.lavaPool = null;
        
        // 岩石
        this.rocks = [];
        
        // 火山口
        this.craterRadius = this.radius * 0.3;
        this.craterColor = 'rgba(80, 30, 0, 0.7)';
        
        // 是否准备喷发
        this.readyToErupt = false;
        this.readyTimer = 0;
        this.readyDuration = 0.5;
    }

    /**
     * 更新火山状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果已标记为垃圾，不更新
        if (this.isGarbage) return;
        
        // 更新石头
        this.rocks.forEach(rock => rock.update(dt));
        this.rocks = this.rocks.filter(rock => !rock.isGarbage);
        
        // 如果还没准备好喷发
        if (!this.readyToErupt) {
            this.readyTimer += dt;
            
            // 创建预警效果
            if (Math.random() < 0.2) {
                this.createWarningEffect();
            }
            
            // 如果准备时间结束，开始喷发
            if (this.readyTimer >= this.readyDuration) {
                this.readyToErupt = true;
            }
            
            return;
        }
        
        // 更新喷发计时器
        this.eruptionTimer += dt;
        
        // 如果到达喷发间隔
        if (this.eruptionTimer >= this.eruptionDelay) {
            // 重置计时器
            this.eruptionTimer = 0;
            
            // 增加喷发次数
            this.eruptionCount++;
            
            // 喷发
            this.erupt();
            
            // 如果喷发次数达到上限
            if (this.eruptionCount >= this.eruptions) {
                // 如果启用了熔岩池
                if (this.lavaPuddle) {
                    this.createLavaPool();
                } else {
                    // 标记为垃圾
                    this.isGarbage = true;
                    this.isActive = false;
                }
                return;
            }
        }
        
        // 在喷发间隔中随机喷出小火花
        if (Math.random() < 0.1) {
            this.createSmallEruption();
        }
    }

    /**
     * 喷发
     */
    erupt() {
        // 对范围内的敌人造成伤害
        enemies.forEach(enemy => {
            // 跳过无效敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            
            // 计算距离
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            
            // 如果在范围内，造成伤害和燃烧效果
            if (distSq <= this.radius * this.radius) {
                // 造成伤害
                enemy.takeDamage(this.damage, this.owner);
                
                // 应用燃烧效果
                this.applyBurnEffect(enemy);
                
                // 轻微击退
                const dist = Math.sqrt(distSq);
                if (dist > 0) {
                    const knockbackFactor = 10 * (1 - dist / this.radius);
                    enemy.x += dx / dist * knockbackFactor;
                    enemy.y += dy / dist * knockbackFactor;
                }
            }
        });
        
        // 创建喷发特效
        this.createEruptionEffect();
    }

    /**
     * 应用燃烧效果
     * @param {Enemy} enemy - 敌人
     */
    applyBurnEffect(enemy) {
        // 初始化状态效果对象
        if (!enemy.statusEffects) {
            enemy.statusEffects = {};
        }
        
        // 如果已经有燃烧效果，延长持续时间
        if (enemy.statusEffects.burn) {
            enemy.statusEffects.burn.duration = Math.max(
                enemy.statusEffects.burn.duration,
                this.burnDuration
            );
        } else {
            // 添加新的燃烧效果
            enemy.statusEffects.burn = {
                damage: this.burnDamage / 4,  // 四次伤害
                duration: this.burnDuration,
                tickInterval: this.burnDuration / 4,
                tickTimer: this.burnDuration / 4,
                source: this.owner
            };
        }
    }

    /**
     * 创建熔岩池
     */
    createLavaPool() {
        // 创建熔岩池效果
        this.lavaPool = {
            x: this.x,
            y: this.y,
            radius: this.radius * 0.8,
            lifetime: 6.0,  // 持续6秒
            timer: 0,
            damageTimer: 0,
            damageInterval: 0.5,
            damage: this.damage * 0.3,
            isGarbage: false,
            
            update: function(dt, volcano) {
                this.timer += dt;
                this.damageTimer += dt;
                
                // 如果寿命结束，标记为垃圾
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    volcano.isGarbage = true;
                    volcano.isActive = false;
                    return;
                }
                
                // 如果达到伤害间隔
                if (this.damageTimer >= this.damageInterval) {
                    // 重置伤害计时器
                    this.damageTimer = 0;
                    
                    // 对范围内的敌人造成伤害
                    enemies.forEach(enemy => {
                        // 跳过无效敌人
                        if (enemy.isGarbage || !enemy.isActive) return;
                        
                        // 计算距离
                        const dx = enemy.x - this.x;
                        const dy = enemy.y - this.y;
                        const distSq = dx * dx + dy * dy;
                        
                        // 如果在范围内，造成伤害
                        if (distSq <= this.radius * this.radius) {
                            // 造成伤害
                            enemy.takeDamage(this.damage, volcano.owner);
                            
                            // 应用燃烧效果
                            volcano.applyBurnEffect(enemy);
                            
                            // 减速效果
                            this.applySlowEffect(enemy);
                        }
                    });
                }
                
                // 产生气泡效果
                if (Math.random() < 0.1) {
                    this.createBubbleEffect();
                }
            },
            
            applySlowEffect: function(enemy) {
                // 初始化状态效果对象
                if (!enemy.statusEffects) {
                    enemy.statusEffects = {};
                }
                
                // 如果已经有减速效果，延长持续时间
                if (enemy.statusEffects.lavaSlow) {
                    enemy.statusEffects.lavaSlow.duration = Math.max(
                        enemy.statusEffects.lavaSlow.duration,
                        0.7
                    );
                } else {
                    // 添加新的减速效果
                    const originalSpeed = enemy.speed;
                    enemy.speed *= 0.7;
                    
                    enemy.statusEffects.lavaSlow = {
                        duration: 0.7,
                        factor: 0.7,
                        originalSpeed: originalSpeed,
                        source: volcano.owner
                    };
                }
            },
            
            createBubbleEffect: function() {
                // 随机位置
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * this.radius * 0.8;
                const x = this.x + Math.cos(angle) * distance;
                const y = this.y + Math.sin(angle) * distance;
                
                // 创建气泡粒子
                const bubble = {
                    x: x,
                    y: y,
                    vy: -30 - Math.random() * 20,
                    size: 2 + Math.random() * 3,
                    lifetime: 0.5 + Math.random() * 0.3,
                    timer: 0,
                    isGarbage: false,
                    
                    update: function(dt) {
                        this.timer += dt;
                        this.y += this.vy * dt;
                        this.vy *= 0.95;
                        
                        if (this.timer >= this.lifetime) {
                            this.isGarbage = true;
                            return;
                        }
                    },
                    
                    draw: function(ctx) {
                        if (this.isGarbage) return;
                        
                        const screenPos = cameraManager.worldToScreen(this.x, this.y);
                        const alpha = 0.6 * (1 - this.timer / this.lifetime);
                        
                        ctx.fillStyle = `rgba(255, 80, 0, ${alpha})`;
                        ctx.beginPath();
                        ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                        ctx.fill();
                    }
                };
                
                // 添加到粒子列表
                if (typeof particles !== 'undefined') {
                    particles.push(bubble);
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                // 计算不透明度（随时间减少）
                const alpha = 0.8 * (1 - this.timer / this.lifetime);
                
                // 绘制熔岩池
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, this.radius
                );
                gradient.addColorStop(0, `rgba(255, 80, 0, ${alpha})`);
                gradient.addColorStop(0.6, `rgba(200, 50, 0, ${alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(100, 30, 0, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制表面纹理
                ctx.strokeStyle = `rgba(255, 120, 50, ${alpha * 0.4})`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                
                // 绘制不规则纹理线条
                for (let i = 0; i < 5; i++) {
                    const centerX = screenPos.x + (Math.random() - 0.5) * this.radius * 0.5;
                    const centerY = screenPos.y + (Math.random() - 0.5) * this.radius * 0.5;
                    const patternRadius = this.radius * (0.3 + Math.random() * 0.3);
                    
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, patternRadius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            }
        };
    }

    /**
     * 创建小型喷发特效
     */
    createSmallEruption() {
        // 随机角度
        const angle = Math.random() * Math.PI * 2;
        const speed = 50 + Math.random() * 30;
        const size = 3 + Math.random() * 3;
        
        // 创建火花粒子
        const spark = {
            x: this.x,
            y: this.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 50, // 向上的初始速度
            size: size,
            gravity: 100,
            lifetime: 0.5 + Math.random() * 0.3,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.vy += this.gravity * dt; // 重力
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.8 * (1 - this.timer / this.lifetime);
                
                // 绘制火花
                ctx.fillStyle = `rgba(255, 120, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制尾迹
                const tailLength = this.size * 2;
                const tailWidth = this.size * 0.8;
                
                const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                const tailDirX = speed > 0 ? -this.vx / speed : 0;
                const tailDirY = speed > 0 ? -this.vy / speed : 0;
                
                const tailEndX = screenPos.x + tailDirX * tailLength;
                const tailEndY = screenPos.y + tailDirY * tailLength;
                
                const gradient = ctx.createLinearGradient(
                    screenPos.x, screenPos.y,
                    tailEndX, tailEndY
                );
                gradient.addColorStop(0, `rgba(255, 120, 0, ${alpha})`);
                gradient.addColorStop(1, `rgba(255, 80, 0, 0)`);
                
                ctx.strokeStyle = gradient;
                ctx.lineWidth = tailWidth;
                ctx.lineCap = 'round';
                
                ctx.beginPath();
                ctx.moveTo(screenPos.x, screenPos.y);
                ctx.lineTo(tailEndX, tailEndY);
                ctx.stroke();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(spark);
        }
    }

    /**
     * 创建喷发特效
     */
    createEruptionEffect() {
        // 创建岩石
        for (let i = 0; i < 10; i++) {
            // 随机角度和速度
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 100;
            const size = 5 + Math.random() * 5;
            
            // 创建岩石
            const rock = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 150, // 向上的初始速度
                size: size,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * Math.PI * 2,
                gravity: 200,
                lifetime: 1.0 + Math.random() * 0.5,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vy += this.gravity * dt; // 重力
                    this.rotation += this.rotationSpeed * dt;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 0.8 * (1 - this.timer / this.lifetime);
                    
                    ctx.save();
                    ctx.translate(screenPos.x, screenPos.y);
                    ctx.rotate(this.rotation);
                    
                    // 绘制岩石
                    ctx.fillStyle = `rgba(80, 40, 0, ${alpha})`;
                    ctx.beginPath();
                    
                    // 多边形
                    const sides = 5 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < sides; i++) {
                        const angle = Math.PI * 2 * i / sides;
                        const radius = this.size * (0.8 + Math.random() * 0.4);
                        const px = Math.cos(angle) * radius;
                        const py = Math.sin(angle) * radius;
                        
                        if (i === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                    }
                    
                    ctx.closePath();
                    ctx.fill();
                    
                    // 高光
                    ctx.fillStyle = `rgba(150, 80, 0, ${alpha * 0.7})`;
                    ctx.beginPath();
                    ctx.arc(-this.size * 0.2, -this.size * 0.2, this.size * 0.4, 0, Math.PI * 2);
                    ctx.fill();
                    
                    ctx.restore();
                }
            };
            
            // 添加到石头列表
            this.rocks.push(rock);
        }
        
        // 创建爆炸云
        const explosion = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.radius,
            lifetime: 0.6,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 爆炸半径先增加后减少
                const progress = this.timer / this.lifetime;
                if (progress < 0.7) {
                    this.radius = (progress / 0.7) * this.maxRadius;
                } else {
                    this.radius = this.maxRadius * (1 - (progress - 0.7) / 0.3 * 0.3);
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.7 * (1 - this.timer / this.lifetime);
                
                // 绘制爆炸
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, this.radius
                );
                gradient.addColorStop(0, `rgba(255, 120, 0, ${alpha})`);
                gradient.addColorStop(0.6, `rgba(200, 80, 0, ${alpha * 0.7})`);
                gradient.addColorStop(1, `rgba(100, 50, 0, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(explosion);
        }
        
        // 创建烟雾
        for (let i = 0; i < 5; i++) {
            // 随机位置（在喷发中心附近）
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.radius * 0.3;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            
            // 随机大小和速度
            const size = 10 + Math.random() * 15;
            const speed = 20 + Math.random() * 30;
            
            // 创建烟雾粒子
            const smoke = {
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * speed,
                vy: -speed - Math.random() * 20,
                size: size,
                maxSize: size * 2,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.5,
                lifetime: 1.0 + Math.random() * 0.5,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.98;
                    this.vy *= 0.98;
                    this.rotation += this.rotationSpeed * dt;
                    
                    // 随时间增大
                    const sizeProgress = Math.min(1, this.timer / (this.lifetime * 0.7));
                    this.size = this.size + (this.maxSize - this.size) * sizeProgress * dt * 2;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 0.4 * (1 - this.timer / this.lifetime);
                    
                    ctx.save();
                    ctx.translate(screenPos.x, screenPos.y);
                    ctx.rotate(this.rotation);
                    
                    // 绘制烟雾
                    const gradient = ctx.createRadialGradient(
                        0, 0, 0,
                        0, 0, this.size
                    );
                    gradient.addColorStop(0, `rgba(100, 100, 100, ${alpha})`);
                    gradient.addColorStop(0.6, `rgba(80, 80, 80, ${alpha * 0.7})`);
                    gradient.addColorStop(1, `rgba(60, 60, 60, 0)`);
                    
                    ctx.fillStyle = gradient;
                    ctx.beginPath();
                    
                    // 绘制不规则形状
                    const cloudPoints = 8;
                    for (let i = 0; i <= cloudPoints; i++) {
                        const angle = Math.PI * 2 * i / cloudPoints;
                        const radius = this.size * (0.7 + Math.cos(angle * 3) * 0.3);
                        const px = Math.cos(angle) * radius;
                        const py = Math.sin(angle) * radius;
                        
                        if (i === 0) {
                            ctx.moveTo(px, py);
                        } else {
                            ctx.lineTo(px, py);
                        }
                    }
                    
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                }
            };
            
            // 添加到粒子列表
            if (typeof particles !== 'undefined') {
                particles.push(smoke);
            }
        }
    }

    /**
     * 创建预警效果
     */
    createWarningEffect() {
        // 随机位置（在火山口附近）
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * this.craterRadius;
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        // 创建火花粒子
        const spark = {
            x: x,
            y: y,
            vx: Math.cos(angle) * 5,
            vy: Math.sin(angle) * 5 - 20, // 向上的初始速度
            size: 1 + Math.random() * 2,
            lifetime: 0.3 + Math.random() * 0.2,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.vy += 30 * dt; // 重力
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.7 * (1 - this.timer / this.lifetime);
                
                ctx.fillStyle = `rgba(255, 80, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(spark);
        }
    }

    /**
     * 绘制火山
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage) return;
        
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            
            // 绘制火山口
            ctx.fillStyle = this.craterColor;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.craterRadius, 0, Math.PI * 2);
            ctx.fill();
            
            // 如果准备喷发，绘制发光效果
            if (this.readyToErupt) {
                const glowAlpha = 0.5 + Math.sin(this.eruptionTimer * 10) * 0.3;
                ctx.fillStyle = `rgba(255, 80, 0, ${glowAlpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.craterRadius * 0.7, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 绘制范围指示
            if (this.eruptionCount === 0) {
                ctx.strokeStyle = 'rgba(200, 50, 0, 0.3)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 绘制脉动效果
                const pulseSize = this.radius * (0.8 + Math.sin(this.readyTimer * 5) * 0.2);
                ctx.strokeStyle = 'rgba(255, 100, 0, 0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, pulseSize, 0, Math.PI * 2);
                ctx.stroke();
            }
            
            // 绘制熔岩池
            if (this.lavaPool && !this.lavaPool.isGarbage) {
                this.lavaPool.update(0.016, this); // 使用固定时间步长更新
                this.lavaPool.draw(ctx);
            }
            
            // 绘制岩石
            this.rocks.forEach(rock => rock.draw(ctx));
        } catch (e) {
            console.error("绘制火山喷发时出错:", e);
        }
    }
}

/**
 * 黑洞球投射物类
 * 黑洞球的投射物
 */
class BlackHoleBallProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} blackHoleDuration - 黑洞持续时间
     * @param {number} blackHoleRadius - 黑洞半径
     * @param {number} tickDamage - 每次伤害
     * @param {number} tickInterval - 伤害间隔
     * @param {number} pullStrength - 吸引强度
     * @param {boolean} collapse - 是否爆炸
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, blackHoleDuration, blackHoleRadius, tickDamage, tickInterval, pullStrength, collapse) {
        super(x, y, "⚫", size, vx, vy, damage, 0, duration, ownerStats);
        
        // 额外属性
        this.blackHoleDuration = blackHoleDuration;
        this.blackHoleRadius = blackHoleRadius;
        this.tickDamage = tickDamage;
        this.tickInterval = tickInterval;
        this.pullStrength = pullStrength;
        this.collapse = collapse;
        
        // 黑洞状态
        this.isBlackHole = false;
        this.blackHoleTimer = 0;
        this.damageTimer = 0;
        
        // 视觉效果
        this.rotation = 0;
        this.rotationSpeed = Math.PI;
        this.particleTimer = 0;
        this.particleInterval = 0.05;
        this.pulsePhase = 0;
        
        // 碰撞检测
        this.activeEnemies = new Set();
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        
        // 更新视觉效果
        this.rotation += this.rotationSpeed * dt;
        this.pulsePhase = (this.pulsePhase + dt * 3) % (Math.PI * 2);
        
        // 更新粒子计时器
        this.particleTimer += dt;
        
        // 如果是黑洞状态
        if (this.isBlackHole) {
            // 更新黑洞计时器
            this.blackHoleTimer += dt;
            
            // 更新伤害计时器
            this.damageTimer += dt;
            
            // 如果到达伤害间隔，造成伤害
            if (this.damageTimer >= this.tickInterval) {
                this.damageTimer = 0;
                this.damageEnemiesInRange();
            }
            
            // 吸引范围内的敌人
            this.pullEnemies(dt);
            
            // 创建吸引粒子
            if (this.particleTimer >= this.particleInterval) {
                this.particleTimer = 0;
                this.createOrbitalParticle();
            }
            
            // 如果黑洞持续时间结束
            if (this.blackHoleTimer >= this.blackHoleDuration) {
                // 如果启用了爆炸，爆炸
                if (this.collapse) {
                    this.explode();
                }
                
                // 标记为垃圾
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
        } else {
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 创建尾迹粒子
            if (this.particleTimer >= this.particleInterval) {
                this.particleTimer = 0;
                this.createTrailParticle();
            }
            
            // 如果生命周期结束，变成黑洞
            if (this.lifetime >= this.duration) {
                this.transformToBlackHole();
                return;
            }
            
            // 如果超出屏幕，标记为垃圾
            if (
                this.x < -this.width ||
                this.x > GAME_WIDTH + this.width ||
                this.y < -this.height ||
                this.y > GAME_HEIGHT + this.height
            ) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查与敌人的碰撞
            enemies.forEach(enemy => {
                // 跳过已命中的敌人
                if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
                
                // 检查碰撞
                if (this.checkCollision(enemy)) {
                    // 造成伤害
                    enemy.takeDamage(this.damage, this.owner);
                    
                    // 添加到已命中列表
                    this.hitTargets.add(enemy);
                    
                    // 变成黑洞
                    this.transformToBlackHole();
                    return;
                }
            });
        }
    }

    /**
     * 变成黑洞
     */
    transformToBlackHole() {
        // 标记为黑洞
        this.isBlackHole = true;
        
        // 创建变形特效
        this.createTransformEffect();
    }

    /**
     * 吸引范围内的敌人
     * @param {number} dt - 时间增量
     */
    pullEnemies(dt) {
        // 吸引范围内的敌人
        enemies.forEach(enemy => {
            // 跳过无效敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            
            // 计算距离
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distSq = dx * dx + dy * dy;
            
            // 如果在黑洞范围内，吸引敌人
            if (distSq <= this.blackHoleRadius * this.blackHoleRadius) {
                // 计算吸引力
                const dist = Math.sqrt(distSq);
                
                if (dist > 0) {
                    // 吸引力随距离减小而增加
                    const pullFactor = Math.max(0.1, this.pullStrength * (1 - Math.pow(dist / this.blackHoleRadius, 0.5)) * 2);
                    
                    // 应用吸引力
                    enemy.x += dx * pullFactor * dt;
                    enemy.y += dy * pullFactor * dt;
                    
                    // 添加到活跃敌人列表
                    this.activeEnemies.add(enemy);
                }
            } else {
                // 移除不在范围内的敌人
                this.activeEnemies.delete(enemy);
            }
        });
    }

    /**
     * 对范围内的敌人造成伤害
     */
    damageEnemiesInRange() {
        // 对活跃敌人造成伤害
        this.activeEnemies.forEach(enemy => {
            // 跳过无效敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            
            // 造成伤害
            enemy.takeDamage(this.tickDamage, this.owner);
            
            // 创建伤害特效
            this.createDamageEffect(enemy);
        });
    }

    /**
     * 爆炸
     */
    explode() {
        // 造成范围伤害
        enemies.forEach(enemy => {
            // 跳过无效敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            
            // 计算距离
            const dx = this.x - enemy.x;
            const dy = this.y - enemy.y;
            const distSq = dx * dx + dy * dy;
            
            // 如果在爆炸范围内，造成伤害
            if (distSq <= this.blackHoleRadius * this.blackHoleRadius * 1.5) {
                // 计算伤害（距离越近伤害越高）
                const dist = Math.sqrt(distSq);
                const damageFactor = 1 - Math.min(1, dist / (this.blackHoleRadius * 1.5));
                const explosionDamage = this.damage * 5 * damageFactor;
                
                // 造成伤害
                enemy.takeDamage(explosionDamage, this.owner);
                
                // 击退敌人
                if (dist > 0) {
                    const knockbackFactor = 50 * damageFactor;
                    enemy.x -= dx / dist * knockbackFactor;
                    enemy.y -= dy / dist * knockbackFactor;
                }
            }
        });
        
        // 创建爆炸特效
        this.createExplosionEffect();
    }

    /**
     * 创建变形特效
     */
    createTransformEffect() {
        // 创建内爆特效
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = this.blackHoleRadius * (0.5 + Math.random() * 0.5);
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;
            
            const particle = {
                x: x,
                y: y,
                targetX: this.x,
                targetY: this.y,
                size: 2 + Math.random() * 4,
                lifetime: 0.5 + Math.random() * 0.3,
                timer: 0,
                color: `hsl(${260 + Math.random() * 60}, 70%, 50%)`,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    
                    // 移向中心
                    const progress = this.timer / this.lifetime;
                    const easedProgress = Math.pow(progress, 2); // 缓动函数，加速移动
                    
                    this.x = this.x + (this.targetX - this.x) * easedProgress * dt * 10;
                    this.y = this.y + (this.targetY - this.y) * easedProgress * dt * 10;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 0.8 * (1 - this.timer / this.lifetime);
                    
                    ctx.fillStyle = `${this.color.replace(')', `, ${alpha})`)}`
                        .replace('hsl', 'hsla');
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            // 添加到粒子列表
            if (typeof particles !== 'undefined') {
                particles.push(particle);
            }
        }
        
        // 创建变形波效果
        const wave = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.blackHoleRadius * 0.8,
            lifetime: 0.6,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 半径先快速增大，然后缩小
                const progress = this.timer / this.lifetime;
                if (progress < 0.4) {
                    this.radius = (progress / 0.4) * this.maxRadius;
                } else {
                    this.radius = this.maxRadius * (1 - (progress - 0.4) / 0.6);
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.5 * (1 - this.timer / this.lifetime);
                
                ctx.strokeStyle = `rgba(160, 100, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(wave);
        }
    }

    /**
     * 创建轨道粒子
     */
    createOrbitalParticle() {
        // 随机角度
        const angle = Math.random() * Math.PI * 2;
        const distance = this.blackHoleRadius * (0.3 + Math.random() * 0.7);
        
        // 轨道位置
        const x = this.x + Math.cos(angle) * distance;
        const y = this.y + Math.sin(angle) * distance;
        
        // 轨道方向（垂直于半径）
        const orbitDirX = -Math.sin(angle);
        const orbitDirY = Math.cos(angle);
        
        // 轨道速度（距离越近速度越快）
        const orbitSpeed = 100 + (1 - distance / this.blackHoleRadius) * 150;
        
        // 创建粒子
        const particle = {
            x: x,
            y: y,
            vx: orbitDirX * orbitSpeed,
            vy: orbitDirY * orbitSpeed,
            centerX: this.x,
            centerY: this.y,
            distance: distance,
            size: 1 + Math.random() * 2,
            lifetime: 0.5 + Math.random() * 0.5,
            timer: 0,
            color: `hsl(${260 + Math.random() * 60}, 70%, 50%)`,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                
                // 计算当前角度
                const currentAngle = Math.atan2(this.y - this.centerY, this.x - this.centerX);
                
                // 计算新角度（基于角速度）
                const angularSpeed = this.vx / this.distance; // 角速度 = 线速度 / 半径
                const newAngle = currentAngle + angularSpeed * dt;
                
                // 更新位置（保持与中心的距离）
                this.x = this.centerX + Math.cos(newAngle) * this.distance;
                this.y = this.centerY + Math.sin(newAngle) * this.distance;
                
                // 逐渐向中心移动
                this.distance = Math.max(0, this.distance - 10 * dt);
                
                if (this.timer >= this.lifetime || this.distance < 5) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.8 * (1 - this.timer / this.lifetime);
                
                ctx.fillStyle = `${this.color.replace(')', `, ${alpha})`)}`
                    .replace('hsl', 'hsla');
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(particle);
        }
    }

    /**
     * 创建尾迹粒子
     */
    createTrailParticle() {
        // 在当前位置后方创建尾迹粒子
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const dirX = speed > 0 ? -this.vx / speed : 0;
        const dirY = speed > 0 ? -this.vy / speed : 0;
        
        // 随机偏移
        const offsetAngle = Math.random() * Math.PI * 2;
        const offsetDist = Math.random() * this.size * 0.5;
        const offsetX = Math.cos(offsetAngle) * offsetDist;
        const offsetY = Math.sin(offsetAngle) * offsetDist;
        
        // 尾迹位置
        const x = this.x + dirX * this.size * 0.7 + offsetX;
        const y = this.y + dirY * this.size * 0.7 + offsetY;
        
        // 创建粒子
        const particle = {
            x: x,
            y: y,
            vx: dirX * 10 + (Math.random() - 0.5) * 5,
            vy: dirY * 10 + (Math.random() - 0.5) * 5,
            size: 1 + Math.random() * 2,
            lifetime: 0.3 + Math.random() * 0.2,
            timer: 0,
            color: `hsl(${260 + Math.random() * 60}, 70%, 50%)`,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.vx *= 0.95;
                this.vy *= 0.95;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.5 * (1 - this.timer / this.lifetime);
                
                ctx.fillStyle = `${this.color.replace(')', `, ${alpha})`)}`
                    .replace('hsl', 'hsla');
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(particle);
        }
    }

    /**
     * 创建伤害特效
     * @param {Enemy} enemy - 敌人
     */
    createDamageEffect(enemy) {
        // 计算从黑洞到敌人的向量
        const dx = enemy.x - this.x;
        const dy = enemy.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 如果距离为0，返回
        if (dist <= 0) return;
        
        // 方向向量
        const dirX = dx / dist;
        const dirY = dy / dist;
        
        // 创建能量线粒子
        for (let i = 0; i < 3; i++) {
            const startDistance = this.size * 0.5;
            const startX = this.x + dirX * startDistance;
            const startY = this.y + dirY * startDistance;
            
            const energyLine = {
                startX: startX,
                startY: startY,
                targetX: enemy.x,
                targetY: enemy.y,
                progress: 0,
                speed: 2 + Math.random(),
                thickness: 1 + Math.random() * 1.5,
                isGarbage: false,
                color: `hsl(${260 + Math.random() * 60}, 70%, 50%)`,
                
                update: function(dt) {
                    this.progress += this.speed * dt;
                    
                    if (this.progress >= 1) {
                        this.isGarbage = true;
                        return;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const startScreenPos = cameraManager.worldToScreen(this.startX, this.startY);
                    const targetScreenPos = cameraManager.worldToScreen(this.targetX, this.targetY);
                    
                    const currentX = startScreenPos.x + (targetScreenPos.x - startScreenPos.x) * this.progress;
                    const currentY = startScreenPos.y + (targetScreenPos.y - startScreenPos.y) * this.progress;
                    
                    const alpha = 0.7 * (1 - Math.pow(this.progress, 2));
                    
                    ctx.strokeStyle = `${this.color.replace(')', `, ${alpha})`)}`
                        .replace('hsl', 'hsla');
                    ctx.lineWidth = this.thickness;
                    ctx.lineCap = 'round';
                    
                    ctx.beginPath();
                    ctx.moveTo(startScreenPos.x, startScreenPos.y);
                    ctx.lineTo(currentX, currentY);
                    ctx.stroke();
                    
                    // 头部光点
                    ctx.fillStyle = `${this.color.replace(')', `, ${alpha * 1.5})`)}`
                        .replace('hsl', 'hsla');
                    ctx.beginPath();
                    ctx.arc(currentX, currentY, this.thickness * 1.5, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            // 添加到粒子列表
            if (typeof particles !== 'undefined') {
                particles.push(energyLine);
            }
        }
    }

    /**
     * 创建爆炸特效
     */
    createExplosionEffect() {
        // 创建爆炸波
        const explosion = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.blackHoleRadius * 1.5,
            lifetime: 0.6,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 爆炸半径快速增加
                this.radius = this.maxRadius * Math.min(1, this.timer / this.lifetime);
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.7 * (1 - this.timer / this.lifetime);
                
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, this.radius
                );
                gradient.addColorStop(0, `rgba(160, 100, 255, ${alpha})`);
                gradient.addColorStop(0.7, `rgba(100, 50, 200, ${alpha * 0.8})`);
                gradient.addColorStop(1, `rgba(50, 0, 100, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(explosion);
        }
        
        // 创建能量碎片
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 150;
            
            const fragment = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 2 + Math.random() * 3,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * Math.PI * 4,
                lifetime: 0.7 + Math.random() * 0.5,
                timer: 0,
                color: `hsl(${260 + Math.random() * 60}, 70%, 50%)`,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                    this.rotation += this.rotationSpeed * dt;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 0.8 * (1 - this.timer / this.lifetime);
                    
                    ctx.save();
                    ctx.translate(screenPos.x, screenPos.y);
                    ctx.rotate(this.rotation);
                    
                    ctx.fillStyle = `${this.color.replace(')', `, ${alpha})`)}`
                        .replace('hsl', 'hsla');
                    
                    // 绘制能量碎片（星形）
                    ctx.beginPath();
                    const spikes = 4;
                    const outerRadius = this.size;
                    const innerRadius = this.size * 0.5;
                    
                    for (let i = 0; i < spikes * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = Math.PI * i / spikes;
                        const x = Math.cos(angle) * radius;
                        const y = Math.sin(angle) * radius;
                        
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    
                    ctx.closePath();
                    ctx.fill();
                    
                    ctx.restore();
                }
            };
            
            // 添加到粒子列表
            if (typeof particles !== 'undefined') {
                particles.push(fragment);
            }
        }
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;
        
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            
            // 黑洞模式
            if (this.isBlackHole) {
                // 计算黑洞大小（带脉动效果）
                const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
                const blackHoleSize = this.size * 1.2 * pulseScale;
                
                // 绘制黑洞核心
                ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, blackHoleSize, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制黑洞外围光环
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, blackHoleSize * 0.8,
                    screenPos.x, screenPos.y, blackHoleSize * 1.5
                );
                gradient.addColorStop(0, 'rgba(100, 50, 200, 0.7)');
                gradient.addColorStop(1, 'rgba(50, 0, 100, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, blackHoleSize * 1.5, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制吸引范围（淡淡的轮廓）
                const phase = this.pulsePhase;
                const pulseIntensity = 0.1 + Math.sin(phase) * 0.05;
                
                ctx.strokeStyle = `rgba(100, 50, 200, ${pulseIntensity})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.blackHoleRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 绘制内部波纹
                const waveRadius1 = blackHoleSize * 2 * (0.5 + Math.sin(phase * 0.7) * 0.2);
                const waveRadius2 = blackHoleSize * 2 * (0.7 + Math.cos(phase * 0.5) * 0.15);
                
                ctx.strokeStyle = `rgba(120, 80, 200, ${pulseIntensity * 1.5})`;
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, waveRadius1, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.strokeStyle = `rgba(80, 30, 150, ${pulseIntensity})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, waveRadius2, 0, Math.PI * 2);
                ctx.stroke();
            }
            // 普通投射物模式
            else {
                // 保存上下文
                ctx.save();
                
                // 平移到投射物位置
                ctx.translate(screenPos.x, screenPos.y);
                
                // 应用旋转
                ctx.rotate(this.rotation);
                
                // 绘制黑洞球
                ctx.fillStyle = 'rgba(20, 20, 30, 0.9)';
                ctx.beginPath();
                ctx.arc(0, 0, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制紫色能量环
                ctx.strokeStyle = 'rgba(120, 80, 200, 0.7)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, this.size * 0.7, 0, Math.PI * 2);
                ctx.stroke();
                
                // 绘制星星状能量
                ctx.strokeStyle = 'rgba(160, 120, 255, 0.8)';
                ctx.lineWidth = 1;
                
                const starPoints = 4;
                const outerRadius = this.size * 1.3;
                const innerRadius = this.size * 0.5;
                
                ctx.beginPath();
                for (let i = 0; i < starPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = Math.PI * i / starPoints + this.rotation;
                    const x = Math.cos(angle) * radius;
                    const y = Math.sin(angle) * radius;
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.stroke();
                
                // 恢复上下文
                ctx.restore();
            }
        } catch (e) {
            console.error("绘制黑洞球投射物时出错:", e);
        }
    }
}

/**
 * 毒瓶投射物类
 * 毒瓶武器的投射物
 */
class PoisonVialProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} area - 毒云范围
     * @param {number} poisonDamage - 毒素伤害
     * @param {number} poisonDuration - 毒素持续时间
     * @param {boolean} toxicCloud - 是否产生毒云
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, area, poisonDamage, poisonDuration, toxicCloud) {
        super(x, y, "🧪", size, vx, vy, damage, 0, duration, ownerStats);
        
        // 毒瓶特有属性
        this.area = area;
        this.poisonDamage = poisonDamage;
        this.poisonDuration = poisonDuration;
        this.toxicCloud = toxicCloud;
        
        // 毒瓶状态
        this.exploded = false;
        this.explosionTimer = 0;
        this.explosionDuration = 0.15; // 爆炸持续时间
        
        // 毒云相关
        this.cloudLifetime = 0;
        this.cloudDuration = toxicCloud ? 5.0 : 0; // 毒云持续5秒
        this.cloudTick = 0;
        this.cloudTickInterval = 0.5; // 每0.5秒造成一次伤害
        this.affectedEnemies = new Set(); // 已中毒的敌人
        
        // 视觉效果
        this.rotation = Math.random() * Math.PI * 2; // 随机旋转
        this.rotationSpeed = (Math.random() - 0.5) * 2; // 随机旋转速度
        this.wobble = Math.random() * Math.PI * 2; // 摇晃初相位
        this.wobbleSpeed = 5 + Math.random() * 3; // 摇晃速度
        this.wobbleAmount = 2 + Math.random() * 2; // 摇晃幅度
    }
    
    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        
        if (this.exploded) {
            // 已爆炸状态
            this.explosionTimer += dt;
            
            if (this.explosionTimer >= this.explosionDuration) {
                // 爆炸效果结束
                
                if (this.toxicCloud) {
                    // 开始毒云效果
                    this.cloudTick += dt;
                    this.cloudLifetime += dt;
                    
                    // 如果毒云结束，标记为垃圾
                    if (this.cloudLifetime >= this.cloudDuration) {
                        this.isGarbage = true;
                        this.isActive = false;
                        return;
                    }
                    
                    // 每隔一段时间造成伤害
                    if (this.cloudTick >= this.cloudTickInterval) {
                        this.damageEnemiesInCloud();
                        this.cloudTick = 0;
                    }
                } else {
                    // 如果没有毒云，直接标记为垃圾
                    this.isGarbage = true;
                    this.isActive = false;
                    return;
                }
            }
        } else {
            // 正常飞行状态
            // 更新旋转
            this.rotation += this.rotationSpeed * dt;
            this.wobble += this.wobbleSpeed * dt;
            
            // 摇晃效果
            const wobbleX = Math.sin(this.wobble) * this.wobbleAmount;
            const wobbleY = Math.cos(this.wobble * 0.6) * this.wobbleAmount;
            
            // 更新位置
            this.x += this.vx * dt + wobbleX * dt;
            this.y += this.vy * dt + wobbleY * dt;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 如果生命周期结束，爆炸
            if (this.lifetime >= this.duration) {
                this.explode();
                return;
            }
            
            // 检查与敌人的碰撞
            for (const enemy of enemies) {
                // 跳过已命中的敌人
                if (enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) continue;
                
                // 检查碰撞
                if (this.checkCollision(enemy)) {
                    enemy.takeDamage(this.damage, this.owner);
                    this.hitTargets.add(enemy);
                    this.explode();
                    return;
                }
            }
            
            // 检查是否超出屏幕
            if (
                this.x < -this.width || 
                this.x > GAME_WIDTH + this.width || 
                this.y < -this.height || 
                this.y > GAME_HEIGHT + this.height
            ) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 创建轨迹粒子
            this.createTrailParticle();
        }
    }
    
    /**
     * 毒瓶爆炸
     */
    explode() {
        this.exploded = true;
        this.vx = 0;
        this.vy = 0;
        
        // 爆炸范围伤害
        enemies.forEach(enemy => {
            if (enemy.isGarbage || !enemy.isActive) return;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq <= this.area * this.area) {
                enemy.takeDamage(this.damage, this.owner);
                this.applyPoisonEffect(enemy);
            }
        });
        
        // 创建爆炸效果
        this.createExplosionEffect();
    }
    
    /**
     * 为敌人添加中毒效果
     * @param {Enemy} enemy - 敌人
     */
    applyPoisonEffect(enemy) {
        // 确保敌人有状态效果容器
        if (!enemy.statusEffects) {
            enemy.statusEffects = {};
        }
        
        // 添加或刷新中毒效果
        enemy.statusEffects.poisoned = {
            duration: this.poisonDuration,
            damage: this.poisonDamage,
            tickTimer: 0,
            tickInterval: 0.5, // 每0.5秒造成一次伤害
            source: this.owner
        };
        
        // 添加到已中毒敌人列表
        this.affectedEnemies.add(enemy);
    }
    
    /**
     * 对毒云范围内的敌人造成伤害
     */
    damageEnemiesInCloud() {
        enemies.forEach(enemy => {
            if (enemy.isGarbage || !enemy.isActive) return;
            
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq <= this.area * this.area) {
                // 造成伤害
                enemy.takeDamage(this.poisonDamage / 2, this.owner);
                
                // 应用中毒效果
                this.applyPoisonEffect(enemy);
            }
        });
    }
    
    /**
     * 创建轨迹粒子
     */
    createTrailParticle() {
        // 确保particles数组存在
        if (typeof particles === 'undefined') return;
        
        // 创建拖尾粒子
        const particle = {
            x: this.x,
            y: this.y,
            size: this.width * 0.3 * (0.5 + Math.random() * 0.5),
            lifetime: 0.3 + Math.random() * 0.2,
            timer: 0,
            opacity: 0.6 + Math.random() * 0.4,
            color: `hsl(${100 + Math.random() * 40}, 80%, 50%)`,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = this.opacity * (1 - this.timer / this.lifetime);
                
                ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        particles.push(particle);
    }
    
    /**
     * 创建爆炸效果
     */
    createExplosionEffect() {
        // 确保particles数组存在
        if (typeof particles === 'undefined') return;
        
        // 创建爆炸粒子
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 100;
            const size = 3 + Math.random() * 5;
            const distance = Math.random() * this.area * 0.7;
            
            const particle = {
                x: this.x + Math.cos(angle) * distance * 0.3,
                y: this.y + Math.sin(angle) * distance * 0.3,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: size,
                lifetime: 0.5 + Math.random() * 0.5,
                timer: 0,
                color: `hsl(${100 + Math.random() * 40}, 80%, 50%)`,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                    
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                    }
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    const alpha = 0.8 * (1 - this.timer / this.lifetime);
                    
                    ctx.fillStyle = this.color.replace('hsl', 'hsla').replace(')', `, ${alpha})`);
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            particles.push(particle);
        }
    }
    
    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - Canvas上下文
     */
    draw(ctx) {
        if (!this.isActive || this.isGarbage) return;
        
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        
        if (this.exploded) {
            // 绘制爆炸效果
            if (this.explosionTimer < this.explosionDuration) {
                const explosionProgress = this.explosionTimer / this.explosionDuration;
                const explosionRadius = this.area * 0.7 * explosionProgress;
                const alpha = 0.7 * (1 - explosionProgress);
                
                // 绘制爆炸波
                ctx.fillStyle = `hsla(120, 70%, 50%, ${alpha * 0.3})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, explosionRadius, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制爆炸中心
                ctx.fillStyle = `hsla(120, 90%, 60%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, explosionRadius * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 绘制毒云
            if (this.toxicCloud && this.cloudLifetime < this.cloudDuration) {
                const cloudProgress = Math.min(1, this.cloudLifetime / 0.5); // 0.5秒内渐入
                const fadeOutStart = this.cloudDuration - 0.5;
                const fadeOutProgress = this.cloudLifetime > fadeOutStart ? (this.cloudLifetime - fadeOutStart) / 0.5 : 0; // 最后0.5秒渐出
                
                const alpha = cloudProgress * (1 - fadeOutProgress) * 0.6;
                const radius = this.area;
                
                // 绘制毒云外圈
                ctx.fillStyle = `hsla(110, 70%, 40%, ${alpha * 0.4})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制毒云内圈
                ctx.fillStyle = `hsla(110, 70%, 50%, ${alpha * 0.6})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, radius * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                // 毒云中心
                ctx.fillStyle = `hsla(110, 90%, 60%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, radius * 0.3, 0, Math.PI * 2);
                ctx.fill();
                
                // 添加毒云图案
                const symbolSize = GAME_FONT_SIZE * 0.7;
                ctx.font = `${symbolSize}px 'Segoe UI Emoji', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText("☠️", screenPos.x, screenPos.y);
            }
        } else {
            // 绘制毒瓶
            ctx.save();
            ctx.translate(screenPos.x, screenPos.y);
            ctx.rotate(this.rotation);
            
            // 缩放一点，使图标显示正确大小
            const scale = this.width / GAME_FONT_SIZE;
            ctx.scale(scale, scale);
            
            ctx.font = `${GAME_FONT_SIZE}px 'Segoe UI Emoji', sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, 0, 0);
            
            ctx.restore();
        }
    }
} 

// 确保导出所有投射物类，使其他文件可以访问
if (typeof window !== "undefined") {
    window.BubbleProjectile = BubbleProjectile;
    window.ChaosDiceProjectile = ChaosDiceProjectile;
    window.MagnetWaveProjectile = MagnetWaveProjectile;
    window.VineHazard = VineHazard;
    window.FrostCrystalProjectile = FrostCrystalProjectile;
    window.LaserBeamAttack = LaserBeamAttack;
    window.VolcanoEruption = VolcanoEruption;
    window.BlackHoleBallProjectile = BlackHoleBallProjectile;
    window.PoisonVialProjectile = PoisonVialProjectile;
}

// 导出到全局对象
Object.assign(window, {
    BubbleProjectile,
    ChaosDiceProjectile,
    MagnetWaveProjectile,
    VineHazard,
    FrostCrystalProjectile,
    LaserBeamAttack,
    VolcanoEruption,
    BlackHoleBallProjectile,
    PoisonVialProjectile
});