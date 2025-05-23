/**
 * 通过名称获取敌人类型
 * @param {string} name - 敌人类型名称
 * @returns {Object} 敌人类型对象
 */
function getEnemyTypeByName(name) {
    return ENEMY_TYPES.find(type => type.name === name);
}

/**
 * 添加从点到线段距离的平方计算函数
 * @param {number} px - 点的X坐标
 * @param {number} py - 点的Y坐标
 * @param {number} x1 - 线段的起点X坐标
 * @param {number} y1 - 线段的起点Y坐标
 * @param {number} x2 - 线段的终点X坐标
 * @param {number} y2 - 线段的终点Y坐标
 * @returns {number} 从点到线段的距离平方
 */
function pointToLineDistanceSq(px, py, x1, y1, x2, y2) {
    const lengthSq = ((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1));
    if (lengthSq === 0) return ((px - x1) * (px - x1)) + ((py - y1) * (py - y1));
    
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    
    const nearestX = x1 + t * (x2 - x1);
    const nearestY = y1 + t * (y2 - y1);
    
    return ((px - nearestX) * (px - nearestX)) + ((py - nearestY) * (py - nearestY));
}

/**
 * 敌人类
 * 游戏中的敌人角色
 */
class Enemy extends Character {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} type - 敌人类型
     */
    constructor(x, y, type) {
        // 调用父类构造函数
        super(
            x, y,
            type.emoji || EMOJI.ENEMY_NORMAL,
            GAME_FONT_SIZE * 0.7, // 将尺寸改回原来的70%，之前改成了50%
            {
                health: ENEMY_BASE_STATS.health * (type.healthMult || 1),
                speed: ENEMY_BASE_STATS.speed * (type.speedMult || 1),
                damage: ENEMY_BASE_STATS.damage * (type.damageMult || 1),
                xp: ENEMY_BASE_STATS.xp * (type.xpMult || 1)
            }
        );

        // Time-based scaling for health and damage
        const minutesPassed = gameTime / 60;
        // Health: Starts scaling after 2 mins, no cap on scaling
        let healthScalingFactor = 1.0;
        if (minutesPassed > 2) {
            healthScalingFactor += (minutesPassed - 2) * 0.20; // 0.20 per min after 2 mins, no cap
        }
        // Damage: Starts scaling after 3 mins, no cap on scaling
        let damageScalingFactor = 1.0;
        if (minutesPassed > 3) {
            damageScalingFactor += (minutesPassed - 3) * 0.15; // 0.15 per min after 3 mins, no cap
        }

        this.stats.health *= healthScalingFactor;
        this.stats.damage *= damageScalingFactor;
        this.health = this.stats.health; // Update current health to scaled max health
        this.maxHealth = this.stats.health; // Ensure maxHealth is also updated

        // 敌人类型
        this.type = type;
        // 目标
        this.target = null;
        // 收益
        this.reward = type.xpMult || 1;
        // 攻击冷却
        this.attackCooldown = 0;
        // 是否是远程敌人
        this.isRanged = type.isRanged || false;
        // 远程攻击范围
        this.attackRange = type.attackRange || 150;
        // 远程攻击冷却
        this.attackCooldownTime = type.attackCooldownTime || 1.5;
        // 远程投射物速度
        this.projectileSpeed = type.projectileSpeed || 120;
        
        // 特殊能力相关
        // 地狱犬冲刺
        if (type.canDash) {
            this.dashCooldown = 0;
            this.dashCooldownTime = type.dashCooldown || 3;
            this.dashSpeed = type.dashSpeed || 2.5;
            this.dashDuration = type.dashDuration || 0.8;
            this.isDashing = false;
            this.dashTimer = 0;
            this.dashDirection = { x: 0, y: 0 };
        }
        
        // 堕落天使光束攻击
        if (type.canShootBeam) {
            this.beamCooldown = 0;
            this.beamCooldownTime = type.beamCooldown || 5;
            this.beamDamage = type.beamDamage || 15;
            this.beamWidth = type.beamWidth || 30;
            this.beamDuration = type.beamDuration || 1.5;
            this.isShootingBeam = false;
            this.beamTimer = 0;
            this.beamDirection = { x: 0, y: 0 };
            this.beamTarget = null;
            this.beamHitTargets = new Set();
        }
        
        // 精英僵尸毒气光环
        if (type.hasPoisonAura) {
            this.poisonAuraRadius = type.poisonAuraRadius || 100;
            this.poisonDamage = type.poisonDamage || 2;
            this.poisonTickTimer = 0;
            this.poisonTickInterval = 1.0;
        }
    }

    /**
     * 更新敌人状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果敌人不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 调用父类更新方法
        super.update(dt);
        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }
        
        // 更新特殊能力冷却和状态
        this.updateSpecialAbilities(dt);
        
        // 更新状态效果（燃烧、冰冻、毒素等）
        this.updateStatusEffects(dt);
        
        // 更新移动
        if (!this.isStunned() && !this.isDashing && !this.isShootingBeam) {
            this.updateMovement(dt);
        } else if (this.isDashing) {
            // 正在冲刺，更新冲刺逻辑
            this.updateDash(dt);
        }
        
        // 如果是远程敌人，尝试进行远程攻击
        if (this.isRanged && this.target && this.attackCooldown <= 0 && !this.isStunned()) {
            const distSq = this.getDistanceSquared(this.target);
            if (distSq <= this.attackRange * this.attackRange && distSq >= 100 * 100) {
                this.performRangedAttack();
                this.attackCooldown = this.attackCooldownTime;
            }
        }
        
        // 处理状态效果
        this.handleStatusEffects(dt);
    }
    
    /**
     * 更新特殊能力
     * @param {number} dt - 时间增量
     */
    updateSpecialAbilities(dt) {
        // 如果没有目标或被眩晕，不更新特殊能力
        if (!this.target || this.isStunned()) return;
        
        // 地狱犬冲刺
        if (this.type && this.type.canDash && !this.isDashing) {
            // 更新冲刺冷却
            if (this.dashCooldown > 0) {
                this.dashCooldown -= dt;
            } 
            // 如果冷却结束且在合适范围内，尝试冲刺
            else {
                const distSq = this.getDistanceSquared(this.target);
                // 如果距离合适(比如在100-300之间)，启动冲刺
                if (distSq >= 100*100 && distSq <= 300*300) {
                    this.startDash();
                }
            }
        }
        
        // 堕落天使光束攻击
        if (this.type && this.type.canShootBeam && !this.isShootingBeam) {
            // 更新光束冷却
            if (this.beamCooldown > 0) {
                this.beamCooldown -= dt;
            } 
            // 如果冷却结束，尝试射出光束
            else {
                this.startBeamAttack();
            }
        } 
        // 如果正在射出光束，更新光束
        else if (this.isShootingBeam) {
            this.updateBeamAttack(dt);
        }
        
        // 精英僵尸毒气光环
        if (this.type && this.type.hasPoisonAura) {
            // 更新毒气计时器
            this.poisonTickTimer += dt;
            
            // 如果达到触发间隔，对范围内敌人造成伤害
            if (this.poisonTickTimer >= this.poisonTickInterval) {
                this.applyPoisonAura();
                this.poisonTickTimer = 0;
            }
        }
    }
    
    /**
     * 开始冲刺
     */
    startDash() {
        if (!this.target) return;
        
        // 设置冲刺状态
        this.isDashing = true;
        this.dashTimer = 0;
        
        // 计算冲刺方向
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.dashDirection = {
                x: dx / dist,
                y: dy / dist
            };
        } else {
            this.dashDirection = { x: 0, y: 1 }; // 默认向下
        }
    }
    
    /**
     * 更新冲刺
     * @param {number} dt - 时间增量
     */
    updateDash(dt) {
        // 更新冲刺计时器
        this.dashTimer += dt;
        
        // 如果冲刺结束，重置状态
        if (this.dashTimer >= this.dashDuration) {
            this.isDashing = false;
            this.dashCooldown = this.dashCooldownTime;
            return;
        }
        
        // 更新位置
        const dashMultiplier = this.dashSpeed * this.stats.speed;
        this.x += this.dashDirection.x * dashMultiplier * dt;
        this.y += this.dashDirection.y * dashMultiplier * dt;
        
        // 检查与目标的碰撞
        if (this.target && this.checkCollision(this.target)) {
            // 攻击目标
            this.attack(this.target);
        }
    }
    
    /**
     * 开始光束攻击
     */
    startBeamAttack() {
        if (!this.target) return;
        
        // 设置光束状态
        this.isShootingBeam = true;
        this.beamTimer = 0;
        this.beamTarget = this.target;
        this.beamHitTargets = new Set();
        
        // 计算光束方向
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.beamDirection = {
                x: dx / dist,
                y: dy / dist
            };
        } else {
            this.beamDirection = { x: 0, y: 1 }; // 默认向下
        }
    }
    
    /**
     * 更新光束攻击
     * @param {number} dt - 时间增量
     */
    updateBeamAttack(dt) {
        // 更新光束计时器
        this.beamTimer += dt;
        
        // 如果光束结束，重置状态
        if (this.beamTimer >= this.beamDuration) {
            this.isShootingBeam = false;
            this.beamCooldown = this.beamCooldownTime;
            return;
        }
        
        // 计算光束终点
        const beamLength = 300; // 光束长度
        const endX = this.x + this.beamDirection.x * beamLength;
        const endY = this.y + this.beamDirection.y * beamLength;
        
        // 检查光束与玩家的碰撞
        if (this.target && !this.beamHitTargets.has(this.target)) {
            // 简单检查：如果玩家在光束附近，造成伤害
            const playerToBeamDistSq = pointToLineDistanceSq(
                this.target.x, this.target.y,
                this.x, this.y,
                endX, endY
            );
            
            if (playerToBeamDistSq <= (this.beamWidth * this.beamWidth / 4)) {
                // 造成伤害
                this.target.takeDamage(this.beamDamage, this);
                // 标记已命中
                this.beamHitTargets.add(this.target);
            }
        }
    }
    
    /**
     * 应用毒气光环效果
     */
    applyPoisonAura() {
        if (!this.target) return;
        
        // 计算与玩家的距离
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        // 如果玩家在范围内，应用毒气效果
        if (distSq <= this.poisonAuraRadius * this.poisonAuraRadius) {
            // 造成伤害
            this.target.takeDamage(this.poisonDamage, this, false, true); // 是光环伤害
            
            // 应用减速效果
            if (this.type.slowFactor) {
                // 使用新的减速效果应用逻辑
                this.applySlowEffect(this.target, this.type.slowFactor, 1.0); // 持续1秒
            }
        }
    }
    
    /**
     * 应用减速效果（不叠加，取最强效果）
     * @param {Character} target - 目标角色
     * @param {number} slowFactor - 减速因子
     * @param {number} slowDuration - 减速持续时间
     */
    applySlowEffect(target, slowFactor, slowDuration) {
        if (!target || !target.stats) return;
        
        // 确保目标有statusEffects对象
        if (!target.statusEffects) {
            target.statusEffects = {};
        }
        
        // 检查玩家是否有减速免疫（如翅膀10级）
        if (target.getStat && target.getStat('slowImmunity') === true) {
            // 玩家完全免疫减速，不应用效果
            return;
        }
        
        // 检查玩家是否有减速抗性（如翅膀5级）
        let slowResistance = 0;
        if (target.getStat && typeof target.getStat('slowResistance') === 'number') {
            slowResistance = target.getStat('slowResistance'); // 0到1之间的值
        }
        
        // 应用减速抗性，降低减速效果
        if (slowResistance > 0) {
            // 减速因子接近1表示减速效果更弱
            // 所以我们要让计算后的slowFactor更接近1
            slowFactor = 1 - (1 - slowFactor) * (1 - slowResistance);
        }
        
        // 保存原有速度（如果没有已存在的减速效果）
        let originalSpeed = target.statusEffects.slow ? 
                          target.statusEffects.slow.originalSpeed : 
                          target.stats.speed;
        
        // 检查是否已有减速效果
        if (target.statusEffects.slow) {
            // 已有减速效果，取最强的效果（更低的factor值表示更强的减速）
            if (slowFactor <= target.statusEffects.slow.factor) {
                // 新的减速效果更强或相同，更新减速系数
                target.statusEffects.slow.factor = slowFactor;
                // 重置目标速度为原速度×新减速系数
                target.stats.speed = originalSpeed * slowFactor;
            }
            // 不管新效果是否更强，都刷新持续时间（取较长的）
            target.statusEffects.slow.duration = Math.max(target.statusEffects.slow.duration, slowDuration);
        } else {
            // 没有已存在的减速效果，直接应用
            target.stats.speed *= slowFactor;
            
            target.statusEffects.slow = {
                factor: slowFactor,
                duration: slowDuration,
                originalSpeed: originalSpeed,
                source: this,
                icon: '🐌' // 确保有蜗牛图标
            };
        }
    }

    /**
     * 更新移动
     * @param {number} dt - 时间增量
     */
    updateMovement(dt) {
        // 如果没有目标或被眩晕，不移动
        if (!this.target || this.isStunned()) return;
        
        // 计算方向
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        // 如果是炸弹敌人，检查是否玩家进入爆炸范围，如果是则爆炸
        if (this.type && this.type.name === "炸弹") {
            const explodeRadius = this.type.explodeRadius || 150;
            if (distSq <= explodeRadius * explodeRadius * 0.7) { // 使用70%的爆炸半径作为触发距离
                // 立即引爆
                this.health = 0; // 将血量设为0，触发死亡处理
                this.onDeath(this.target); // 调用死亡处理程序，传入玩家作为击杀者
                return;
            }
        }
        
        // 如果是远程敌人且在攻击范围内，保持距离
        if (this.isRanged && distSq <= this.attackRange * this.attackRange) {
            // 远程敌人会试图保持在一定距离外
            const idealDistance = this.attackRange * 0.7;
            if (distSq < idealDistance * idealDistance) {
                // 远离玩家
                const dist = Math.sqrt(distSq);
                const dirX = -dx / dist;
                const dirY = -dy / dist;
                
                // 获取当前速度
                const currentSpeed = this.getCurrentSpeed() * 0.5;
                
                // 更新位置
                this.x += dirX * currentSpeed * dt;
                this.y += dirY * currentSpeed * dt;
                return;
            }
        }
        
        // 常规移动逻辑
        const dist = Math.sqrt(distSq);
        // 如果距离为0，不移动
        if (dist === 0) return;
        // 计算方向
        const dirX = dx / dist;
        const dirY = dy / dist;

        // 获取当前速度
        const currentSpeed = this.getCurrentSpeed();

        // 更新位置
        this.x += dirX * currentSpeed * dt;
        this.y += dirY * currentSpeed * dt;
        // 检查与目标的碰撞
        if (this.checkCollision(this.target)) {
            // 攻击目标
            this.attack(this.target);
        }
    }

    /**
     * 攻击目标
     * @param {Character} target - 目标
     */
    attack(target) {
        // 如果攻击冷却未结束，不攻击
        if (this.attackCooldown > 0) return;
        
        // 造成伤害
        target.takeDamage(this.damage, this);
        
        // 应用特殊效果（如果有）
        if (this.type) {
            // 处理燃烧效果 (火焰精灵)
            if (this.type.appliesBurn) {
                if (!target.statusEffects) {
                    target.statusEffects = {};
                }
                
                // 应用燃烧效果
                const burnDamage = this.type.burnDamage || (this.damage * 0.3);
                const burnDuration = this.type.burnDuration || 3;
                
                target.statusEffects.burn = {
                    damage: burnDamage,
                    duration: burnDuration,
                    tickInterval: burnDuration / 4, // 4次伤害
                    tickTimer: burnDuration / 4,
                    source: this
                };
            }
            
            // 处理减速效果 (冰霜精灵)
            if (this.type.appliesSlow) {
                if (!target.statusEffects) {
                    target.statusEffects = {};
                }
                
                // 应用减速效果
                const slowFactor = this.type.slowFactor || 0.6;
                const slowDuration = this.type.slowDuration || 2;
                
                // 不再直接修改速度，而是使用新的应用减速效果的逻辑
                this.applySlowEffect(target, slowFactor, slowDuration);
            }
            
            // 处理眩晕效果 (雷电精灵)
            if (this.type.appliesStun) {
                const stunChance = this.type.stunChance || 0.3;
                
                // 按几率触发眩晕
                if (Math.random() < stunChance) {
                    if (!target.statusEffects) {
                        target.statusEffects = {};
                    }
                    
                    // 应用眩晕效果
                    const stunDuration = this.type.stunDuration || 1;
                    
                    target.statusEffects.stun = {
                        duration: stunDuration,
                        source: this
                    };
                }
            }
            
            // 处理毒素效果 (精英僵尸)
            if (this.type.hasPoisonAura && this.type.poisonDamage) {
                if (!target.statusEffects) {
                    target.statusEffects = {};
                }
                
                // 应用中毒效果
                const poisonDamage = this.type.poisonDamage || 2;
                const poisonDuration = 3; // 默认持续3秒
                
                target.statusEffects.poison = {
                    damage: poisonDamage,
                    duration: poisonDuration,
                    tickInterval: 0.5, // 每0.5秒造成一次伤害
                    tickTimer: 0.5,
                    source: this
                };
            }
        }
        
        // 重置攻击冷却
        this.attackCooldown = this.attackInterval;
    }

    /**
     * 死亡处理
     * @param {GameObject} killer - 击杀者
     */
    onDeath(killer) {
        // 调用父类死亡处理
        super.onDeath(killer);
        
        // 如果是精英史莱姆，死亡时分裂
        if (this.type && this.type.splitOnDeath) {
            const splitCount = this.type.splitCount || 2;
            const splitType = getEnemyTypeByName(this.type.splitType || "史莱姆");
            
            if (splitType) {
                for (let i = 0; i < splitCount; i++) {
                    // 计算分裂位置（在原位置附近随机）
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 10 + Math.random() * 20;
                    const x = this.x + Math.cos(angle) * distance;
                    const y = this.y + Math.sin(angle) * distance;
                    
                    // 创建分裂后的小怪
                    const minion = new Enemy(x, y, splitType);
                    // 设置血量为原来的一半
                    minion.health = minion.health * 0.5;
                    minion.maxHealth = minion.health;
                    // 添加到敌人列表
                    enemies.push(minion);
                }
            }
        }
        
        // 如果是爆炸敌人，创建爆炸效果
        if (this.type && this.type.explodeOnDeath) {
            this.createExplosion(this.type.explodeRadius || 120, this.type.explodeDamage || 15);
        }
        
        // 如果击杀者是玩家
        if (killer instanceof Player) { // 确保 killer 是玩家实例
            // 增加击杀数
            killCount++;
            // 生成经验宝石
            this.dropXP();
            // 随机掉落物品 (普通敌人)
            if (!(this instanceof BossEnemy) && Math.random() < 0.05) { // Boss 不掉落普通小物品
                this.dropItem();
            }

            // 检查舍利子回魂
            const soulRelicItem = killer.passiveItems.find(item => item instanceof SoulRelic);
            if (soulRelicItem) {
                // 尝试召唤幽灵，并获取是否成功召唤
                const reanimated = soulRelicItem.tryReanimate(this.x, this.y, killer);
                if(reanimated) {
                    // 如果成功召唤幽灵，可以考虑不掉落宝箱或经验？(当前逻辑保留都掉落)
                }
            }

            // --- 新增：如果是 Boss，则掉落宝箱 ---
            if (this instanceof BossEnemy) {
                console.log("Boss defeated! Spawning chest...");
                
                // 在生成宝箱前播放特效
                if (typeof createEvolutionEffect === 'function') {
                    createEvolutionEffect(this.x, this.y);
                } else {
                    // 如果 createEvolutionEffect 不可用，可以放一个简单的备用特效或日志
                    console.warn("createEvolutionEffect function not found. Skipping Boss death effect.");
                }
                
                const chest = new Chest(this.x, this.y);
                worldObjects.push(chest);
                // 确保宝箱立即激活（如果 Chest 构造函数没有这么做，或者 isActive 默认为 false）
                // 并且确保我们操作的是正确的 Chest 实例，以防 worldObjects 中有其他类型的对象
                if (chest instanceof Chest && !chest.isActive) {
                     chest.isActive = true;
                }
            }
            // --- 结束新增 ---
        }
    }

    /**
     * 创建爆炸效果
     * @param {number} radius - 爆炸半径
     * @param {number} damage - 爆炸伤害
     */
    createExplosion(radius, damage) {
        // 创建爆炸视觉效果
        const explosion = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: radius,
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
                const alpha = 0.7 - (this.timer / this.lifetime) * 0.7;
                
                // 绘制爆炸效果
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, this.radius
                );
                
                gradient.addColorStop(0, `rgba(255, 200, 50, ${alpha})`);
                gradient.addColorStop(0.7, `rgba(255, 100, 50, ${alpha * 0.7})`);
                gradient.addColorStop(1, `rgba(255, 50, 50, 0)`);
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        visualEffects.push(explosion);
        
        // 对范围内的玩家造成伤害
        if (player && !player.isGarbage && player.isActive) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distSq = dx * dx + dy * dy;
            
            if (distSq <= radius * radius) {
                // 计算伤害衰减
                const dist = Math.sqrt(distSq);
                const damageFactor = 1 - (dist / radius);
                const actualDamage = damage * damageFactor;
                
                // 造成伤害
                player.takeDamage(actualDamage, this);
            }
        }
    }

    /**
     * 生成经验宝石
     */
    dropXP() {
        // 如果是Boss，则不掉落经验
        if (this.isBoss) {
            return;
        }
        // 计算经验值
        const xpValue = Math.ceil(this.xpValue);

        // 创建经验宝石
        // 在生成经验宝石时，稍微分散一下，避免完全重叠
        const offsetX = (Math.random() - 0.5) * this.size * 0.5;
        const offsetY = (Math.random() - 0.5) * this.size * 0.5;
        const gem = new ExperienceGem(this.x + offsetX, this.y + offsetY, xpValue);

        // 添加到经验宝石列表
        xpGems.push(gem);
    }
    /**
     * 掉落物品
     */
    dropItem() {
        // 基础掉落率
        let baseHealDropRate = 0.045; // 4.5%基础几率掉落治疗物品，提高掉落率
        let baseMagnetDropRate = 0.010; // 1.0%基础几率掉落磁铁，保持不变
        
        // 根据游戏时间调整掉落率（随着时间推移线性降低）
        // 每分钟减少5%的掉落率，最低降低到基础掉落率的30%
        const minutesPassed = gameTime / 60;
        const reductionFactor = Math.max(0.3, 1 - (minutesPassed * 0.05));
        
        // 应用时间调整
        const healDropRate = baseHealDropRate * reductionFactor;
        const magnetDropRate = baseMagnetDropRate * reductionFactor;
        
        // 随机选择掉落物品类型
        const rand = Math.random();
        
        if (rand < healDropRate) {
            // 创建治疗物品
            const pickup = new Pickup(this.x, this.y, EMOJI.HEART, 'heal', 20);
            pickup.lifetime = Infinity; // 不会消失
            worldObjects.push(pickup);
        } else if (rand < healDropRate + magnetDropRate) {
            // 创建磁铁物品
            const pickup = new Pickup(this.x, this.y, EMOJI.MAGNET, 'magnet', 0);
            pickup.lifetime = Infinity; // 不会消失
            worldObjects.push(pickup);
        }
    }

    /**
     * 绘制敌人
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;

        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);

        // 受击动画
        if (this.hitAnimationTimer > 0) {
            ctx.save();
            ctx.globalAlpha = 0.7;
        }
        
        // 眩晕效果
        if (this.isStunned && this.stunTimer % 0.5 < 0.25) {
            // 绘制眩晕星星
            ctx.save();
            ctx.font = `${GAME_FONT_SIZE * 0.5}px Arial`;
            ctx.fillStyle = 'yellow';
            ctx.fillText('✨', screenPos.x - GAME_FONT_SIZE * 0.5, screenPos.y - GAME_FONT_SIZE * 0.8);
            ctx.fillText('✨', screenPos.x + GAME_FONT_SIZE * 0.5, screenPos.y - GAME_FONT_SIZE * 0.8);
            ctx.restore();
        }

        // 绘制减速效果
        if (this.statusEffects && this.statusEffects.slow) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#3498db';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 添加蜗牛图标表示减速状态
            ctx.save();
            ctx.globalAlpha = 1.0;
            ctx.font = `${GAME_FONT_SIZE * 0.5}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('🐌', screenPos.x, screenPos.y - this.size * 0.8);
            ctx.restore();
        }

        // 绘制燃烧效果
        if (this.statusEffects && this.statusEffects.burn) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#e74c3c';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size * 0.7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 添加火焰小图标
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.font = `${GAME_FONT_SIZE * 0.5}px Arial`;
            ctx.fillStyle = 'orange';
            ctx.fillText('🔥', screenPos.x + GAME_FONT_SIZE * 0.5, screenPos.y - GAME_FONT_SIZE * 0.3);
            ctx.restore();
        }

        // 绘制毒素效果
        if (this.statusEffects && this.statusEffects.poison) {
            ctx.save();
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size * 0.65, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 添加毒素小图标
            ctx.save();
            ctx.globalAlpha = 0.7;
            ctx.font = `${GAME_FONT_SIZE * 0.5}px Arial`;
            ctx.fillStyle = 'green';
            ctx.fillText('☠️', screenPos.x - GAME_FONT_SIZE * 0.5, screenPos.y - GAME_FONT_SIZE * 0.3);
            ctx.restore();
        }
        
        // 绘制敌人
        try {
            if (this.type && this.type.svgPath) {
                // 使用SVG图像
                if (!this.svgImage) {
                    this.svgImage = new Image();
                    this.svgImage.src = this.type.svgPath;
                    
                    // 预加载图像，避免闪烁
                    this.svgImage.onload = () => {
                        this.svgImageLoaded = true;
                    };
                    
                    // 立即尝试使用emoji作为后备，直到图像加载完成
                    ctx.font = `${this.size * 2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(this.type.emoji, screenPos.x, screenPos.y);
                } else if (this.svgImageLoaded) {
                    // 如果SVG图像已加载，绘制它
                    const size = this.size * 2;
                    ctx.drawImage(
                        this.svgImage,
                        screenPos.x - size / 2,
                        screenPos.y - size / 2,
                        size,
                        size
                    );
                } else {
                    // 图像仍在加载中，使用emoji作为后备
                    ctx.font = `${this.size * 2}px Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(this.type.emoji, screenPos.x, screenPos.y);
                }
            } else {
                // 没有SVG图像，使用emoji
                ctx.font = `${this.size * 2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.type.emoji, screenPos.x, screenPos.y);
            }
        } catch (e) {
            console.error("绘制敌人时出错:", e);
            
            // 发生错误时，确保至少显示emoji
            ctx.font = `${this.size * 2}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.type.emoji || "👾", screenPos.x, screenPos.y);
        }

        // 绘制生命条（仅在血量不满时）
        if (this.health < this.maxHealth) {
            const healthBarWidth = this.size * 2;
            const healthBarHeight = 5;
            const healthPercent = Math.max(0, this.health / this.maxHealth);
            
            // 背景
            ctx.fillStyle = '#555';
            ctx.fillRect(
                screenPos.x - healthBarWidth / 2,
                screenPos.y + this.size + 5,
                healthBarWidth,
                healthBarHeight
            );
            
            // 血量
            ctx.fillStyle = '#e74c3c';
            ctx.fillRect(
                screenPos.x - healthBarWidth / 2,
                screenPos.y + this.size + 5,
                healthBarWidth * healthPercent,
                healthBarHeight
            );
        }

        // 恢复透明度
        if (this.hitAnimationTimer > 0) {
            ctx.restore();
        }
    }

    /**
     * 处理状态效果
     * @param {number} dt - 时间增量
     */
    handleStatusEffects(dt) {
        // 处理燃烧
        if (this.statusEffects.burn) {
            const burn = this.statusEffects.burn;
            burn.duration -= dt;
            burn.tickTimer -= dt;
            
            if (burn.tickTimer <= 0) {
                // 造成燃烧伤害
                this.takeDamage(burn.damage, burn.source, true); // 添加一个 isBurnDamage 标志
                burn.tickTimer = burn.tickInterval; // 重置计时器
            }
            
            if (burn.duration <= 0) {
                delete this.statusEffects.burn; // 移除效果
            }
        }
        
        // 处理中毒
        if (this.statusEffects.poison) {
            const poison = this.statusEffects.poison;
            poison.duration -= dt;
            poison.tickTimer -= dt;
            
            if (poison.tickTimer <= 0) {
                // 造成中毒伤害
                this.takeDamage(poison.damage, poison.source, false, true); // 第四个参数表示是中毒伤害
                poison.tickTimer = poison.tickInterval; // 重置计时器
            }
            
            if (poison.duration <= 0) {
                delete this.statusEffects.poison; // 移除效果
            }
        }
        
        // 处理眩晕
        if (this.statusEffects.stun) {
            const stun = this.statusEffects.stun;
            stun.duration -= dt;
            
            if (stun.duration <= 0) {
                delete this.statusEffects.stun; // 移除效果
            }
        }
        
        // 处理减速
        if (this.statusEffects.slow) {
            const slow = this.statusEffects.slow;
            slow.duration -= dt;
            
            if (slow.duration <= 0) {
                // 恢复原有速度
                if (slow.originalSpeed) {
                    this.speed = slow.originalSpeed;
                }
                delete this.statusEffects.slow; // 移除效果
            }
        }
    }

    /**
     * 受到伤害
     * @param {number} amount - 伤害量
     * @param {GameObject} source - 伤害来源
     * @param {boolean} isBurnDamage - 是否是燃烧伤害（可选）
     * @param {boolean} isAuraDamage - 是否是光环伤害（可选）
     * @returns {boolean} 是否死亡
     */
    takeDamage(amount, source, isBurnDamage = false, isAuraDamage = false) { 
        if (this.isGarbage) return false;

        let actualDamage = amount;
        // 燃烧和光环伤害目前不计算护甲或最小伤害调整
        // 普通攻击计算护甲，且伤害至少为1
        if (!isBurnDamage && !isAuraDamage) {
            const armor = this.getStat('armor') || 0; // 确保有 armor 属性或默认为0
            actualDamage = Math.max(1, amount - armor);
        } else {
            actualDamage = amount; // 允许燃烧和光环造成小于1的伤害
        }

        this.health -= actualDamage;

        // 伤害数字的颜色和文本
        let damageColor = 'white'; // 默认普通攻击
        if (isBurnDamage) damageColor = 'orange';
        // if (isAuraDamage) damageColor = 'purple'; // 紫色可能与经验宝石冲突，暂用默认或特定颜色

        let damageText = actualDamage.toFixed(0);
        if (isBurnDamage) damageText = actualDamage.toFixed(1);
        if (isAuraDamage) damageText = actualDamage.toFixed(2); // 光环伤害显示更精确的小数

        // 对于非常小的光环伤害，可以选择不显示，或者累计后再显示
        // 目前，如果 actualDamage * dt 非常小，它可能仍然会显示为0.00
        // 如果是光环伤害，并且伤害量很小 (例如小于0.01)，则不显示伤害数字
        if (!isAuraDamage || Math.abs(actualDamage) >= 0.01) {
             spawnDamageNumber(this.x, this.y - this.size / 2, damageText, damageColor); 
        }

        // 检查炸弹敌人被攻击时是否应该爆炸
        if (this.type && this.type.name === "炸弹" && source instanceof Player) {
            // 如果炸弹被玩家击中且剩余血量很低，则立即爆炸
            if (this.health <= this.maxHealth * 0.3) {
                this.health = 0; // 立即致死，触发爆炸
                this.onDeath(source); // 调用死亡处理
                return true;
            }
        }

        if (this.health <= 0) {
            // 检查是否被泡泡困住，如果是，触发泡泡爆炸
            if (this.statusEffects && this.statusEffects.bubbleTrap && this.statusEffects.bubbleTrap.bubble) {
                // 获取泡泡实例并触发爆炸
                const bubble = this.statusEffects.bubbleTrap.bubble;
                if (bubble && typeof bubble.burst === 'function') {
                    // 触发泡泡爆炸
                    bubble.burst();
                }
                // 移除困住效果引用，防止死亡后的引用问题
                delete this.statusEffects.bubbleTrap;
            }
            
            this.onDeath(source); // killer 应该是 source
            return true;
        }
        return false;
    }

    /**
     * 计算与目标的距离平方
     * @param {GameObject} target - 目标
     * @returns {number} 距离平方
     */
    getDistanceSquared(target) {
        const dx = this.x - target.x;
        const dy = this.y - target.y;
        return dx * dx + dy * dy;
    }

    /**
     * 执行远程攻击
     */
    performRangedAttack() {
        if (!this.target || !this.isActive) return;
        
        // 计算方向
        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dx / dist;
        const dirY = dy / dist;
        
        // 创建投射物
        const projectile = new EnemyProjectile(
            this.x, 
            this.y, 
            dirX * this.projectileSpeed, 
            dirY * this.projectileSpeed, 
            this.damage, 
            this
        );
        
        // 添加到投射物列表
        enemyProjectiles.push(projectile);
    }
}

/**
 * Boss敌人类
 * 强大的敌人
 */
class BossEnemy extends Enemy {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} bossType - Boss类型
     */
    constructor(x, y, bossType) {
        // 计算Boss基础属性 (initial calculation before super call)
        const initialBossStats = { ...ENEMY_BASE_STATS };
        initialBossStats.health = (bossType.healthBase || ENEMY_BASE_STATS.health * BOSS_BASE_HEALTH_MULTIPLIER) * (bossType.healthMult || 1);
        initialBossStats.speed = (bossType.speedBase || ENEMY_BASE_STATS.speed) * (bossType.speedMult || 1);
        initialBossStats.damage = (bossType.damageBase || ENEMY_BASE_STATS.damage * BOSS_BASE_DAMAGE_MULTIPLIER) * (bossType.damageMult || 1);
        initialBossStats.xp = (bossType.xpBase || ENEMY_BASE_STATS.xp * 10) * (bossType.xpMult || 1);
        initialBossStats.attackInterval = bossType.attackCooldown || 1.5;
        
        // Call super with a temporary type object that doesn't include multipliers yet for base Enemy constructor,
        // as we will apply scaling after this. The base Enemy constructor already applies type.healthMult etc.
        // So, we pass a simplified type for the super constructor to avoid double multiplication initially.
        const simplifiedSuperType = { ...bossType, healthMult: 1, speedMult: 1, damageMult: 1, xpMult: 1 };        
        super(x, y, simplifiedSuperType); 

        // Now, directly assign the pre-calculated initialBossStats (which already has boss-specific multipliers)
        this.stats = { ...initialBossStats }; // Use a copy

        // Time-based scaling for Bosses (more aggressive or starts earlier)
        const minutesPassed = gameTime / 60;
        // Health: Starts scaling after 1 min, caps at +200% (3x total) around 11 mins
        let bossHealthScaling = 1.0;
        if (minutesPassed > 1) {
            bossHealthScaling += Math.min((minutesPassed - 1) * 0.20, 2.0); // 0.20 per min after 1 min, up to +200%
        }
        // Damage: Starts scaling after 2 mins, caps at +150% (2.5x total) around 12 mins
        let bossDamageScaling = 1.0;
        if (minutesPassed > 2) {
            bossDamageScaling += Math.min((minutesPassed - 2) * 0.15, 1.5); // 0.15 per min after 2 mins, up to +150%
        }

        this.stats.health *= bossHealthScaling;
        this.stats.damage *= bossDamageScaling;
        
        this.health = this.stats.health;
        this.maxHealth = this.stats.health; 
        
        // Boss特定属性
        this.type = bossType; // 确保 this.type 是 bossType 对象
        this.isBoss = true;
        this.meleeAttackTimer = 0;
        this.specialAbilityTimer = 0;
        this.isPerformingSpecial = false;
        this.specialAbilityEffects = []; // 用于存储特殊技能产生的持久效果或对象

        // 应用显示大小乘数
        this.originalSize = this.size; // 保存原始大小 (来自GAME_FONT_SIZE)
        this.size = this.originalSize * (this.type.displaySizeMultiplier || 1.0);
        // 现在 this.size 反映了Boss的期望显示大小，所有依赖 this.size 的绘制都会放大
        // 包括 Character.draw 中的 emoji 绘制，以及 BossEnemy.drawBossHealthBar 中的血条宽度
        // 剑的 swordReach 和 swordDisplaySize 也依赖 this.size，它们也会相应变大

        // Boss控制免疫属性
        this.isControlImmune = true;
        
        // 骷髅王特定属性 (保留)
        this.isSwingingSword = false;
        this.swordSwingTimer = 0;
        this.swordSwingDuration = 0.6; // 挥剑动画持续时间
        this.swordAngle = 0;
        this.initialSwordAngle = -Math.PI / 3;
        this.swordReach = this.size * 1.1; // 增大骷髅王剑的判定范围
        this.swordArc = Math.PI * 0.8;
        this.swordDamageCooldown = 0.3; // 每次挥剑造成伤害的最小间隔
        this.lastSwordDamageTime = 0;
        
        // 特殊攻击警告相关 (通用)
        this.isWarningForSpecialAttack = false;
        this.specialAttackWarningDuration = this.type.specialAttackWarningDuration || 1.0;
        this.specialAttackWarningTimer = 0;
        
        // 幽灵领主特殊攻击波次相关
        if (this.type.name === "幽灵领主") {
            this.ghostLordSpecialAttackWaveTimer = 0;
            this.ghostLordCurrentWave = 0;
        }

        // --- 巨型僵尸 (GiantZombie) 特定属性 ---
        if (this.type.name === "巨型僵尸") {
            this.poisonAuraRadius = this.size * 2.7; // 增大被动毒圈半径
            // this.poisonAuraDamagePerSecond = 5; // 旧的每秒伤害值
            this.poisonAuraDamageAmount = 3; // 每次伤害量
            this.poisonAuraDamageInterval = 1.0; // 伤害间隔（秒）
            this.poisonAuraDamageTimer = 0; // 伤害计时器

            this.poisonAuraSlowFactor = 0.5; 
            this.toxicPoolWarningTime = this.type.toxicPoolWarningTime || 1.5; 
            this.toxicPoolDuration = this.type.toxicPoolDuration || 5.0; // 特殊攻击：毒池持续时间
            this.toxicPoolDamagePerSecond = this.type.toxicPoolDamagePerSecond || 10; // 特殊攻击：毒池每秒伤害
            this.toxicPoolRadius = this.size * 1.2; // 特殊攻击：单个毒池半径，增大
            this.toxicPoolCount = this.type.toxicPoolCount || 3; // 特殊攻击：毒池数量
            // 特殊攻击：毒池生成位置在 Boss 毒环外，且在一定范围内
            this.toxicPoolMinSpawnRadius = this.poisonAuraRadius * 1.2; 
            this.toxicPoolMaxSpawnRadius = this.poisonAuraRadius * 2.5;
            
            this.pendingToxicPools = []; // 用于存储特殊攻击警告阶段的毒池信息
            this.specialAbilityTimer = 6.0; // 开场即可释放特殊技能
        }
        // --- 结束 巨型僵尸 特定属性 ---
    }

    /**
     * 覆盖状态效果应用方法，使Boss免疫控制效果
     * @param {string} type - 效果类型 ('stun', 'slow', 'burn', 'poison')
     * @param {Object} effectData - 效果数据
     */
    applyStatusEffect(type, effectData) {
        // 免疫所有控制效果：眩晕、减速
        if (type === 'stun' || type === 'slow') {
            // 完全免疫，不执行任何效果
            console.log(`Boss ${this.type.name} 免疫了${type === 'stun' ? '眩晕' : '减速'}效果`);
            return;
        }
        
        // 伤害性效果（燃烧和中毒）仍然生效，但伤害降低50%
        if (type === 'burn' || type === 'poison') {
            // 创建减伤后的效果数据副本
            const reducedEffectData = { ...effectData };
            if (reducedEffectData.damage) {
                reducedEffectData.damage *= 0.5; // 伤害减半
            }
            // 调用父类方法应用伤害效果
            super.applyStatusEffect(type, reducedEffectData);
            return;
        }
        
        // 其他未明确处理的效果，调用父类的应用方法
        super.applyStatusEffect(type, effectData);
    }

    /**
     * 覆盖击退处理，使Boss完全免疫击退
     * @param {number} knockbackX - X方向的击退力量
     * @param {number} knockbackY - Y方向的击退力量
     */
    applyKnockback(knockbackX, knockbackY) {
        // Boss完全免疫击退，不执行任何操作
        return; // 直接返回，不应用任何击退
    }

    update(dt, target) { // target 就是 player
        if (!this.isActive || this.isGarbage) return;

        super.update(dt); // 调用Enemy的update，处理基础逻辑如状态效果

        this.target = target; // 确保Boss的目标是玩家

        // 计时器更新
        this.specialAbilityTimer += dt;

        // --- 巨型僵尸：移除普通攻击 & 处理被动毒环 ---
        if (this.type.name === "巨型僵尸") {
            // 1. 移除普通攻击逻辑 (已完成)
            // 2. 被动毒环效果
            if (target && target.isActive && !target.isGarbage) {
                const dx = target.x - this.x;
                const dy = target.y - this.y;
                const distSq = dx * dx + dy * dy;

                if (distSq <= this.poisonAuraRadius * this.poisonAuraRadius) {
                    // 减速效果 (持续施加)
                    if (typeof target.applyStatusEffect === 'function') {
                        target.applyStatusEffect('slow', { 
                            factor: this.poisonAuraSlowFactor, 
                            duration: 0.5, 
                            source: this 
                        });
                    }

                    // 周期性伤害
                    this.poisonAuraDamageTimer += dt;
                    if (this.poisonAuraDamageTimer >= this.poisonAuraDamageInterval) {
                        target.takeDamage(this.poisonAuraDamageAmount, this, false, true); // isAuraDamage = true
                        this.poisonAuraDamageTimer -= this.poisonAuraDamageInterval;
                    }
                }
            }
        } else { // 其他Boss的普通攻击逻辑
            if (!this.isStunned() && !this.isPerformingSpecial && !this.isWarningForSpecialAttack) {
                this.meleeAttackTimer += dt;
                if (this.meleeAttackTimer >= this.stats.attackInterval) {
                    this.performMeleeAttack(target); 
                    this.meleeAttackTimer = 0;
                }
            }
        }
        // --- 结束 巨型僵尸 修改 ---

        // 新增骷髅王挥剑动画和伤害逻辑
        if (this.type.name === "骷髅王" && this.isSwingingSword) {
            this.swordSwingTimer += dt;
            const swingProgress = Math.min(1, this.swordSwingTimer / this.swordSwingDuration); // 确保不超过1

            // 更新剑的角度
            this.swordAngle = this.initialSwordAngle + this.swordArc * swingProgress;

            // 伤害判定 (在挥剑的有效弧度内，且满足冷却)
            if (this.swordSwingTimer > this.lastSwordDamageTime + this.swordDamageCooldown && target && target.isActive && !target.isGarbage) {
                const segments = 5; // 将剑分成几段检测
                for (let i = 1; i <= segments; i++) { //从剑柄后一点开始到剑尖
                    const segmentProgress = i / segments;
                    const checkReach = this.swordReach * segmentProgress;
                    
                    const swordCheckX = this.x + Math.cos(this.swordAngle) * checkReach;
                    const swordCheckY = this.y + Math.sin(this.swordAngle) * checkReach;

                    const dx = target.x - swordCheckX;
                    const dy = target.y - swordCheckY;
                    const collisionRadiusSq = (target.size / 2 + 5) * (target.size / 2 + 5); // 5代表剑刃的半宽度

                    if (dx * dx + dy * dy <= collisionRadiusSq) {
                        target.takeDamage(this.stats.damage, this);
                        this.lastSwordDamageTime = this.swordSwingTimer; 
                        break; // 一旦命中，本次挥剑的该次伤害判定结束
                    }
                }
            }

            if (this.swordSwingTimer >= this.swordSwingDuration) {
                this.isSwingingSword = false;
                this.swordSwingTimer = 0; // 重置计时器
            }
        }

        // 特殊技能CD和警告触发
        if (!this.isStunned() && 
            this.specialAbilityTimer >= (this.type.specialAbilityCooldown || (this.type.name === "巨型僵尸" ? 6.0 : 10.0)) && // 巨型僵尸CD改为6秒
            !this.isPerformingSpecial && 
            !this.isWarningForSpecialAttack) {
            
            this.isWarningForSpecialAttack = true;
            this.specialAttackWarningTimer = 0;
            // 重置特殊技能主计时器，防止警告一结束又立刻满足CD条件再次触发警告
            // 实际的 specialAbilityTimer 重置应该在技能完全结束后
            
            // --- 巨型僵尸：准备特殊攻击的毒池位置 ---
            if (this.type.name === "巨型僵尸") {
                this.pendingToxicPools = []; // 清空旧的
                for (let i = 0; i < this.toxicPoolCount; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = this.toxicPoolMinSpawnRadius + Math.random() * (this.toxicPoolMaxSpawnRadius - this.toxicPoolMinSpawnRadius);
                    const poolX = this.x + Math.cos(angle) * distance;
                    const poolY = this.y + Math.sin(angle) * distance;
                    this.pendingToxicPools.push({ x: poolX, y: poolY, warningProgress: 0 });
        }
            }
            // --- 结束 巨型僵尸 修改 ---
        }

        // 特殊技能警告处理
        if (this.isWarningForSpecialAttack) {
            this.specialAttackWarningTimer += dt;
            // --- 巨型僵尸：更新毒池警告进度 ---
            if (this.type.name === "巨型僵尸") {
                const warningDuration = this.toxicPoolWarningTime; // 使用巨型僵尸自己的警告时间
                 this.pendingToxicPools.forEach(pool => {
                    pool.warningProgress = Math.min(1, this.specialAttackWarningTimer / warningDuration);
                });
                if (this.specialAttackWarningTimer >= warningDuration) {
                    this.isWarningForSpecialAttack = false;
                    this.specialAbilityTimer = 0; 
            this.performSpecialAbility(target);
                }
            } else { // 其他Boss的警告逻辑
                 const warningDuration = this.specialAttackWarningDuration;
                 if (this.specialAttackWarningTimer >= warningDuration) {
                    this.isWarningForSpecialAttack = false;
                    this.specialAbilityTimer = 0; 
                    this.performSpecialAbility(target);
                }
            }
            // --- 结束 巨型僵尸 修改 ---
        }

        // 特殊技能效果更新 / 持续性特殊技能处理
        if (this.isPerformingSpecial) {
            if (this.type.name === "幽灵领主" && this.type.projectileInfo) {
                const projInfo = this.type.projectileInfo;
                if (this.ghostLordCurrentWave < projInfo.specialAttackWaves) {
                    this.ghostLordSpecialAttackWaveTimer += dt;
                    if (this.ghostLordSpecialAttackWaveTimer >= projInfo.specialAttackWaveDelay) {
                        this.ghostLordSpecialAttackWaveTimer = 0;
                        this.ghostLordCurrentWave++;
                        if (this.ghostLordCurrentWave < projInfo.specialAttackWaves) {
                            // 发射下一波弹幕
                            const projectilesPerWave = projInfo.projectilesPerWaveSpecial || projInfo.countSpecialSingleWave || 8;
                            const angleIncrement = (Math.PI * 2) / projectilesPerWave;
                            const projectileEmoji = projInfo.emojiSpecial || projInfo.emoji; // 使用特殊攻击 emoji，如果未定义则用普通
                            const projectileSize = projInfo.sizeFactorSpecial ? projInfo.sizeFactorSpecial * this.size : (GAME_FONT_SIZE * 0.8);

                            for (let i = 0; i < projectilesPerWave; i++) {
                                const angle = angleIncrement * i + (this.ghostLordCurrentWave * angleIncrement / 2); // 每波稍微错开角度
                                const vx = Math.cos(angle) * projInfo.speed;
                                const vy = Math.sin(angle) * projInfo.speed;
                                const damage = this.stats.damage * (projInfo.damageFactor || 1.0);
                                
                                enemyProjectiles.push(new EnemyProjectile(this.x, this.y, vx, vy, damage, this, projectileEmoji, projectileSize));
        }
                        } else {
                            // 所有波次完成
                            this.isPerformingSpecial = false; 
                        }
                    }
                } else {
                     // 如果波数逻辑意外未将isPerformingSpecial设为false
                    this.isPerformingSpecial = false;
                }
            }
            // 如果是骷髅王或其他需要持续更新特殊技能效果的Boss
            else if (this.type.name === "骷髅王") {
                let allEffectsDone = true;
                this.specialAbilityEffects.forEach(effect => {
                    effect.update(dt, target, this); // 传递Boss自身给effect.update
                    if (!effect.isGarbage) {
                        allEffectsDone = false;
                    }
                });
                this.specialAbilityEffects = this.specialAbilityEffects.filter(effect => !effect.isGarbage);
                if (allEffectsDone) {
                    this.isPerformingSpecial = false;
                }
            } else if (this.type.name === "巨型僵尸") {
                let allEffectsDone = true;
                this.specialAbilityEffects.forEach(effect => {
                    if (effect && typeof effect.update === 'function') { // 确保 effect 和 update 方法存在
                        effect.update(dt, target, this); 
                        if (!effect.isGarbage) {
                            allEffectsDone = false;
                        }
                    }
                });
                this.specialAbilityEffects = this.specialAbilityEffects.filter(effect => effect && !effect.isGarbage); // 过滤掉 null 或已回收的
                if (allEffectsDone) {
                    this.isPerformingSpecial = false; 
                }
            } else {
                // 对于没有持续效果的特殊技能，performSpecialAbility 执行后应直接设置 isPerformingSpecial = false
                // 或者有一个默认的计时器
            }
        }
        
        // 检查Boss与玩家的碰撞 (近战伤害) - 这个由Enemy基类处理
        // if (this.checkCollision(target) && this.type.attackPattern === 'melee') {
        //    this.attack(target); // Enemy基类的attack方法
        // }
    }

    /**
     * 执行攻击 (常规攻击分发)
     * @param {Player} target - 目标玩家
     */
    performAttack(target) {
        // 根据攻击模式执行不同攻击
        switch (this.attackPattern) {
            case 'melee':
                // 近战攻击：冲向玩家
                this.performMeleeAttack(target);
                break;

            case 'ranged':
                // 远程攻击：发射投射物
                this.performRangedAttack(target);
                break;

            case 'aoe':
                // 范围攻击：创建伤害区域
                this.performAOEAttack(target);
                break;

            case 'summon':
                // 召唤攻击：召唤小怪
                this.performSummonAttack(target);
                break;

            default:
                // 默认攻击：冲向玩家
                this.performMeleeAttack(target);
                break;
        }

        // 更新攻击阶段
        this.attackPhase = (this.attackPhase + 1) % 3;
    }

    /**
     * 执行近战攻击
     * @param {Player} target - 目标玩家
     */
    performMeleeAttack(target) {
        if (this.isStunned()) return;

        if (this.type.name === "骷髅王") {
            // 骷髅王挥剑逻辑 (已存在)
            if (!this.isSwingingSword) {
                this.isSwingingSword = true;
                this.swordSwingTimer = 0;
                this.lastSwordDamageTime = -this.swordDamageCooldown; // 允许第一次立即判定
                // 根据玩家方向调整初始角度 (简单实现：大致朝向玩家)
                const angleToPlayer = Math.atan2(target.y - this.y, target.x - this.x);
                this.initialSwordAngle = angleToPlayer - this.swordArc / 2;
                this.swordAngle = this.initialSwordAngle;
            }
        } else if (this.type.name === "幽灵领主") {
            // 幽灵领主普通攻击：发射一圈弹幕
            if (this.type.projectileInfo) {
                const projInfo = this.type.projectileInfo;
                const count = projInfo.countNormal || 8;
                const angleIncrement = (Math.PI * 2) / count;
                const damage = this.stats.damage * (projInfo.damageFactor || 1.0);
                const projectileSize = projInfo.sizeFactorNormal ? projInfo.sizeFactorNormal * this.size : (GAME_FONT_SIZE * 0.8);

                for (let i = 0; i < count; i++) {
                    const angle = angleIncrement * i;
                    const vx = Math.cos(angle) * projInfo.speed;
                    const vy = Math.sin(angle) * projInfo.speed;
                    enemyProjectiles.push(new EnemyProjectile(this.x, this.y, vx, vy, damage, this, projInfo.emoji, projectileSize)); 
                }
            }
        } else {
            // 默认或其他Boss的普通攻击 (如果需要)
            // 例如，可以尝试调用父类的 attack 方法，如果它们有近战碰撞伤害
            // super.attack(target); // 如果Boss也期望有碰撞伤害的话
        }
    }

    /**
     * 执行远程攻击
     * @param {Player} target - 目标玩家
     */
    performRangedAttack(target) {
        // 计算攻击角度
        const angleStep = Math.PI * 2 / this.projectileCount;
        const startAngle = Math.random() * Math.PI * 2;

        // 发射多个投射物
        for (let i = 0; i < this.projectileCount; i++) {
            // 计算角度
            const angle = startAngle + i * angleStep;

            // 计算速度
            const speed = 150 + Math.random() * 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // 创建投射物
            const projectile = {
                x: this.x,
                y: this.y,
                vx: vx,
                vy: vy,
                damage: this.damage * 0.7,
                size: GAME_FONT_SIZE,
                lifetime: 3.0,
                timer: 0,
                boss: this,
                isGarbage: false,

                update: function(dt) {
                    // 更新计时器
                    this.timer += dt;

                    // 如果计时器结束，标记为垃圾
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }

                    // 更新位置
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;

                    // 检查与玩家的碰撞
                    const playerDx = player.x - this.x;
                    const playerDy = player.y - this.y;
                    const playerDistSq = playerDx * playerDx + playerDy * playerDy;

                    // 如果与玩家碰撞，造成伤害
                    if (playerDistSq <= (this.size / 2 + player.size / 2) * (this.size / 2 + player.size / 2)) {
                        player.takeDamage(this.damage, this.boss);
                        this.isGarbage = true;
                    }
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    // 获取屏幕坐标
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);

                    // 绘制投射物
                    ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            };

            // 添加到视觉效果列表
            visualEffects.push(projectile);
        }
    }

    /**
     * 执行范围攻击
     * @param {Player} target - 目标玩家
     */
    performAOEAttack(target) {
        // 创建范围攻击效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: 200,
            damage: this.damage,
            expandDuration: 1.0,
            holdDuration: 0.5,
            totalDuration: 1.5, // expandDuration + holdDuration
            timer: 0,
            boss: this,
            damageDealt: false,
            isGarbage: false,

            update: function(dt) {
                // 更新计时器
                this.timer += dt;

                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.totalDuration) {
                    this.isGarbage = true;
                    return;
                }

                // 更新半径
                if (this.timer < this.expandDuration) {
                    // 扩张阶段
                    this.radius = (this.timer / this.expandDuration) * this.maxRadius;
                } else {
                    // 保持阶段
                    this.radius = this.maxRadius;

                    // 如果尚未造成伤害，检查与玩家的碰撞
                    if (!this.damageDealt) {
                        // 计算到玩家的距离
                        const playerDx = player.x - this.x;
                        const playerDy = player.y - this.y;
                        const playerDistSq = playerDx * playerDx + playerDy * playerDy;

                        // 如果玩家在范围内，造成伤害
                        if (playerDistSq <= this.radius * this.radius) {
                            player.takeDamage(this.damage, this.boss);
                            this.damageDealt = true;
                        }
                    }
                }
            },

            draw: function(ctx) {
                if (this.isGarbage) return;

                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);

                // 计算透明度 (修改后，使其更透明)
                let alpha;
                const maxAlpha = 0.3; // 设置最大透明度为 0.3 (更透明)
                const minAlpha = 0.1; // 设置最小透明度
                
                if (this.timer < this.expandDuration) {
                    // 扩张阶段：从 0 到 maxAlpha
                    alpha = (this.timer / this.expandDuration) * maxAlpha;
                } else {
                    // 保持阶段：在 minAlpha 和 maxAlpha 之间闪烁
                    const t = (this.timer - this.expandDuration) / this.holdDuration;
                    // 使用 (maxAlpha + minAlpha) / 2 作为中心点, (maxAlpha - minAlpha) / 2 作为振幅
                    alpha = (maxAlpha + minAlpha) / 2 + (maxAlpha - minAlpha) / 2 * Math.sin(t * Math.PI * 10); 
                }

                // 绘制范围攻击效果
                ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`; // 使用调整后的 alpha
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 执行召唤攻击
     * @param {Player} target - 目标玩家
     */
    performSummonAttack(target) {
        // 召唤小怪数量
        const summonCount = 3 + Math.floor(gameTime / 180);

        // 召唤小怪
        for (let i = 0; i < summonCount; i++) {
            // 计算召唤位置
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;

            // 创建召唤效果
            const effect = {
                x: x,
                y: y,
                radius: 0,
                maxRadius: 30,
                lifetime: 1.0,
                timer: 0,
                isGarbage: false,

                update: function(dt) {
                    // 更新计时器
                    this.timer += dt;

                    // 如果计时器结束，标记为垃圾并召唤敌人
                    if (this.timer >= this.lifetime) {
                        // 创建敌人
                        const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];
                        const enemy = new Enemy(this.x, this.y, enemyType, 0.7);

                        // 添加到敌人列表
                        enemies.push(enemy);

                        // 标记为垃圾
                        this.isGarbage = true;
                        return;
                    }

                    // 更新半径
                    this.radius = (this.timer / this.lifetime) * this.maxRadius;
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    // 获取屏幕坐标
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);

                    // 计算透明度
                    const alpha = 1 - (this.timer / this.lifetime);

                    // 绘制召唤效果
                    ctx.fillStyle = `rgba(128, 0, 128, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            };

            // 添加到视觉效果列表
            visualEffects.push(effect);
        }
    }

    /**
     * 执行特殊能力
     * @param {Player} target - 目标玩家
     */
    performSpecialAbility(target) {
        if (this.isStunned()) return;

        if (this.type.name === "骷髅王") {
            // 骷髅王特殊攻击：地震 (已存在部分逻辑)
            this.isPerformingSpecial = true;
            this.specialAbilityEffects = []; // 清空旧效果
                this.performEarthquake(target);
        } else if (this.type.name === "幽灵领主") {
            // 幽灵领主特殊攻击：分波发射密集弹幕
            if (this.type.projectileInfo) {
                this.isPerformingSpecial = true;
                this.ghostLordCurrentWave = 0;
                this.ghostLordSpecialAttackWaveTimer = 0;
                
                // 发射第一波
                const projInfo = this.type.projectileInfo;
                const projectilesPerWave = projInfo.projectilesPerWaveSpecial || projInfo.countSpecialSingleWave || 8;
                const angleIncrement = (Math.PI * 2) / projectilesPerWave;
                const projectileEmoji = projInfo.emojiSpecial || projInfo.emoji; // 使用特殊攻击 emoji
                const projectileSize = projInfo.sizeFactorSpecial ? projInfo.sizeFactorSpecial * this.size : (GAME_FONT_SIZE * 0.8);

                for (let i = 0; i < projectilesPerWave; i++) {
                    const angle = angleIncrement * i; // 第一波从0度开始
                    const vx = Math.cos(angle) * projInfo.speed;
                    const vy = Math.sin(angle) * projInfo.speed;
                    const damage = this.stats.damage * (projInfo.damageFactor || 1.0);
                    enemyProjectiles.push(new EnemyProjectile(this.x, this.y, vx, vy, damage, this, projectileEmoji, projectileSize));
                }
                // 后续波次由 update 方法中的 isPerformingSpecial 逻辑处理
            }
        } else if (this.type.name === "巨型僵尸") {
            this.isPerformingSpecial = true;
            this.specialAbilityEffects = []; // 清空可能残留的旧效果
            
            this.pendingToxicPools.forEach(poolInfo => {
                const toxicPoolEffect = {
                    x: poolInfo.x,
                    y: poolInfo.y,
                    radius: this.toxicPoolRadius,
                    damagePerSecond: this.toxicPoolDamagePerSecond,
                    duration: this.toxicPoolDuration,
                    timer: 0,
                    damageTickTimer: 0,
                    damageTickInterval: 0.5, // 每0.5秒造成一次伤害
                    boss: this,
                    isGarbage: false,
                    hitTargetsThisTick: new Set(), // 用于跟踪本伤害间隔内已击中的目标

                    update: function(dt, playerTarget) { // playerTarget 是主 update 传来的 target
                        this.timer += dt;
                        if (this.timer >= this.duration) {
                            this.isGarbage = true;
                            return;
                        }

                        this.damageTickTimer += dt;
                        if (this.damageTickTimer >= this.damageTickInterval) {
                            this.damageTickTimer -= this.damageTickInterval; // 或者 this.damageTickTimer = 0;
                            this.hitTargetsThisTick.clear(); // 每个伤害间隔开始时清空

                            if (playerTarget && playerTarget.isActive && !playerTarget.isGarbage) {
                                const dx = playerTarget.x - this.x;
                                const dy = playerTarget.y - this.y;
                                const distSq = dx * dx + dy * dy;
                                if (distSq <= this.radius * this.radius) {
                                    if (!this.hitTargetsThisTick.has(playerTarget)) {
                                        playerTarget.takeDamage(this.damagePerSecond * this.damageTickInterval, this.boss, false, true); // isAuraDamage = true
                                        this.hitTargetsThisTick.add(playerTarget);
                                    }
                                }
                            }
                        }
                    },
                    draw: function(ctx) {
                        // console.log("[ToxicPoolEffect.draw] Called. isGarbage:", this.isGarbage, "timer:", this.timer, "duration:", this.duration);
                        if (this.isGarbage) return;
                        const screenPos = cameraManager.worldToScreen(this.x, this.y);
                        const effectProgress = this.timer / this.duration;
                        
                        // --- 临时调试绘制：使用高可见度颜色 --- 
                        // const debugAlpha = 0.8;
                        // ctx.fillStyle = `rgba(255, 0, 255, ${debugAlpha})`; //亮粉色
                        // ctx.beginPath();
                        // ctx.arc(screenPos.x, screenPos.y, this.radius * cameraManager.zoom, 0, Math.PI * 2);
                        // ctx.fill();
                        // console.log("[ToxicPoolEffect.draw] DEBUG DRAW with Magenta. Radius:", this.radius * cameraManager.zoom, "Pos:", screenPos);
                        // --- 临时调试绘制结束 ---
                        
                        // 正式绘制逻辑 (优化后)
                        ctx.save();
                        const baseRadius = this.radius * cameraManager.zoom;
                        // const pulseFactor = 0.8 + 0.2 * Math.sin(this.timer * Math.PI * 4); // 移除半径脉动
                        const currentRadius = baseRadius; // 使用固定半径

                        // 主体颜色和效果
                        const gradient = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, currentRadius);
                        const alpha = 0.5 + 0.2 * Math.sin(this.timer * Math.PI * 2); // 透明度脉动 0.3 - 0.7
                        
                        gradient.addColorStop(0, `rgba(0, 180, 50, ${alpha * 0.5})`);      // 中心较亮绿色
                        gradient.addColorStop(0.6, `rgba(0, 130, 30, ${alpha})`);     // 主体深绿色
                        gradient.addColorStop(1, `rgba(0, 80, 10, ${alpha * 0.7})`);       // 边缘更深

                        ctx.fillStyle = gradient;
                        ctx.beginPath();
                        ctx.arc(screenPos.x, screenPos.y, currentRadius, 0, Math.PI * 2);
                        ctx.fill();

                        // 添加明确的边界
                        ctx.strokeStyle = `rgba(0, 60, 0, ${Math.min(1, alpha * 1.5)})`; // 深绿色，比填充色更实一些的边框, alpha不超过1
                        ctx.lineWidth = 2 * cameraManager.zoom; // 边框宽度
                        ctx.stroke(); // 绘制边界

                        // 向上飘动的毒气泡
                        const numBubbles = 5;
                        for (let i = 0; i < numBubbles; i++) {
                            // 根据计时器和索引为每个气泡生成伪随机但一致的偏移
                            const bubbleSeed = i + Math.floor(this.timer * 2); 
                            const offsetX = ( (bubbleSeed * 53) % 100 / 50 - 1) * currentRadius * 0.7; // X偏移在半径的 +/- 70% 内
                            // Y偏移随时间向上，并有初始随机高度，循环出现
                            const verticalSpeed = 50 + ( (bubbleSeed * 31) % 20 ); // 气泡上升速度
                            const initialYOffset = ( (bubbleSeed * 71) % 100 / 100) * currentRadius; // 初始Y随机性
                            const currentYOffset = (initialYOffset + this.timer * verticalSpeed) % (currentRadius * 2) - currentRadius; // 在毒圈内循环
                            
                            const bubbleRadius = (2 + ((bubbleSeed * 13) % 3)) * cameraManager.zoom;
                            const bubbleAlpha = alpha * (0.8 - Math.abs(currentYOffset) / currentRadius * 0.5); // 越往边缘/上下越透明

                            if (bubbleAlpha > 0.1) {
                                ctx.fillStyle = `rgba(50, 200, 80, ${bubbleAlpha})`;
                                ctx.beginPath();
                                ctx.arc(screenPos.x + offsetX, screenPos.y + currentYOffset, bubbleRadius, 0, Math.PI * 2);
                                ctx.fill();
                            }
                        }
                        ctx.restore();
                    }
                };
                this.specialAbilityEffects.push(toxicPoolEffect);
            });
            this.pendingToxicPools = []; // 清空已生成的
            
        } else {
            // 默认或其他Boss的特殊攻击
            this.isPerformingSpecial = false; // 如果没有特定实现，确保重置状态
        }
    }

    /**
     * 执行地震特殊能力
     * @param {Player} target - 目标玩家
     */
    performEarthquake(target) {
        console.log(`Boss ${this.type.name} performing Earthquake! Warning duration was: ${this.specialAttackWarningDuration}`);
        // 创建地震效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.type.earthquakeRadius || 280, // 使用 type 配置或默认值
            damage: this.stats.damage * (this.type.earthquakeDamageMultiplier || 1.8), // Boss类型可配置伤害倍率
            expandDuration: this.type.earthquakeDuration || 2.0, // Boss类型可配置持续时间
            timer: 0,
            boss: this,
            hitTargets: new Set(),
            isGarbage: false,
            particles: [], // 用于存储粒子
            crackLines: [], // 用于存储裂纹线段

            // 初始化裂纹
            initCracks: function() {
                this.crackLines = [];
                const numCracks = 5 + Math.floor(Math.random() * 4); // 5到8条裂纹
                for (let i = 0; i < numCracks; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const length = this.maxRadius * (0.6 + Math.random() * 0.4); // 裂纹长度是最大半径的60%-100%
                    this.crackLines.push({
                        angle: angle,
                        startRadius: 0, // 裂纹从中心开始，随效果扩大
                        endRadius: length,
                        thickness: 2 + Math.random() * 3, // 裂纹粗细
                        segments: [] // 用于存储裂纹的抖动点
                    });
                    // 生成裂纹的抖动路径
                    const crack = this.crackLines[i];
                    let currentAngle = crack.angle;
                    let currentRadius = crack.startRadius;
                    const numSegments = 10 + Math.floor(Math.random() * 10); // 10-19段
                    crack.segments.push({ r: currentRadius, a: currentAngle });
                    for (let j = 0; j < numSegments; j++) {
                        currentRadius += crack.endRadius / numSegments;
                        currentAngle += (Math.random() - 0.5) * 0.3; // 随机角度偏移
                        crack.segments.push({ r: currentRadius, a: normalizeAngle(currentAngle) });
                    }
                }
            },

            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.expandDuration) {
                    this.isGarbage = true;
                    return;
                }
                const progress = this.timer / this.expandDuration;
                this.radius = progress * this.maxRadius;

                // 碰撞检测和伤害 (只对玩家造成伤害)
                // 使用传入的 target (在 performEarthquake 调用时是 player)
                if (target && target.isActive && !target.isGarbage && !this.hitTargets.has(target)) {
                    const playerDx = target.x - this.x;
                    const playerDy = target.y - this.y;
                const playerDistSq = playerDx * playerDx + playerDy * playerDy;
                    if (playerDistSq <= this.radius * this.radius) {
                        target.takeDamage(this.damage, this.boss);
                        this.hitTargets.add(target);
                    }
                }

                // 生成粒子
                if (Math.random() < 0.8) { // 控制粒子生成频率
                    const numParticles = 2 + Math.floor(Math.random() * 3);
                    for (let i = 0; i < numParticles; i++) {
                        const angle = Math.random() * Math.PI * 2;
                        // 在当前冲击波边缘生成粒子
                        const particleX = this.x + Math.cos(angle) * this.radius * (0.8 + Math.random() * 0.2) ;
                        const particleY = this.y + Math.sin(angle) * this.radius * (0.8 + Math.random() * 0.2) ;
                        this.particles.push({
                            x: particleX,
                            y: particleY,
                            vx: (Math.random() - 0.5) * 50, // 水平速度
                            vy: -Math.random() * 80 - 50,  // 向上速度
                            size: 2 + Math.random() * 3,
                            lifetime: 0.5 + Math.random() * 0.5, // 粒子存活时间
                            timer: 0,
                            color: `rgba(100, 70, 30, ${0.5 + Math.random() * 0.3})` // 深棕色粒子
                        });
                    }
                }

                // 更新粒子
                for (let i = this.particles.length - 1; i >= 0; i--) {
                    const p = this.particles[i];
                    p.timer += dt;
                    if (p.timer >= p.lifetime) {
                        this.particles.splice(i, 1);
                    } else {
                        p.x += p.vx * dt;
                        p.y += p.vy * dt;
                        p.vy += 150 * dt; // 重力
                    }
                }
                
                // 触发屏幕震动 (假设 cameraManager.shake 存在)
                // cameraManager.shake(10 * (1 - progress), 0.1); 
                // 实际震动应在 game.js 中根据全局状态处理
                if (typeof triggerScreenShake === 'function') {
                     triggerScreenShake(8 * (1-progress), 0.15);
                }


            },

            draw: function(ctx) {
                if (this.isGarbage) return;
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const progress = this.timer / this.expandDuration;
                const currentRadius = this.radius;

                // --- 绘制地面裂纹 ---
                ctx.strokeStyle = `rgba(60, 40, 20, ${0.6 * (1 - progress)})`; // 深棕色裂纹
                this.crackLines.forEach(crack => {
                    if (crack.segments.length < 2) return;
                    ctx.lineWidth = crack.thickness * (1 - progress * 0.5); // 裂纹随时间变细一点
                    ctx.beginPath();
                    let firstPoint = true;
                    crack.segments.forEach(seg => {
                        // 裂纹长度也随效果扩大而增长
                        const r = seg.r * progress; 
                        if (r > currentRadius * 1.1) return; // 不超出当前冲击波太多

                        const crackX = screenPos.x + Math.cos(seg.a) * r;
                        const crackY = screenPos.y + Math.sin(seg.a) * r;
                        if (firstPoint) {
                            ctx.moveTo(crackX, crackY);
                            firstPoint = false;
                        } else {
                            ctx.lineTo(crackX, crackY);
                        }
                    });
                    ctx.stroke();
                });


                // --- 绘制主要的冲击波圆圈 ---
                const alpha = 0.4 * (1 - progress); // 调整透明度变化
                ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`; // 棕色
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, currentRadius, 0, Math.PI * 2);
                ctx.fill();

                // 可选: 绘制一个更亮的内圆或边缘，增加层次感
                ctx.strokeStyle = `rgba(200, 100, 30, ${alpha * 1.5})`; // 亮一点的棕橙色边缘
                ctx.lineWidth = 3 + 3 * (1-progress); // 边缘宽度随时间变化
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, currentRadius, 0, Math.PI * 2);
                ctx.stroke();
                
                // --- 绘制粒子 ---
                this.particles.forEach(p => {
                    const pScreenPos = cameraManager.worldToScreen(p.x, p.y);
                    const particleAlpha = (1 - (p.timer / p.lifetime)) * 0.8;
                    ctx.fillStyle = p.color.replace(/,[^,]*\)/, `,${particleAlpha})`); // 动态设置透明度
                    ctx.beginPath();
                    ctx.arc(pScreenPos.x, pScreenPos.y, p.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        };

        // 在创建效果时初始化裂纹
        effect.initCracks();
        visualEffects.push(effect);
        
        // // 播放音效 (如果 audioManager 和音效已定义)
        // if (typeof audioManager !== 'undefined' && audioManager.playSound) {
        //     audioManager.playSound('earthquake_sound'); 
        // }
    }

    /**
     * 执行弹幕特殊能力
     * @param {Player} target - 目标玩家
     */
    performBarrage(target) {
        // 弹幕波数
        const waveCount = 1;

        // 每波投射物数量
        const projectilesPerWave = this.projectileCount * 2;

        // 发射多波弹幕
        for (let wave = 0; wave < waveCount; wave++) {
            // 延迟发射
            setTimeout(() => {
                // 计算攻击角度
                const angleStep = Math.PI * 2 / projectilesPerWave;
                const startAngle = Math.random() * Math.PI * 2;

                // 发射多个投射物
                for (let i = 0; i < projectilesPerWave; i++) {
                    // 计算角度
                    const angle = startAngle + i * angleStep;

                    // 计算速度
                    const speed = 100 + wave * 50;
                    const vx = Math.cos(angle) * speed;
                    const vy = Math.sin(angle) * speed;

                    // 创建投射物
                    const projectile = {
                        x: this.x,
                        y: this.y,
                        vx: vx,
                        vy: vy,
                        damage: this.damage * 0.5,
                        size: GAME_FONT_SIZE,
                        lifetime: 5.0,
                        timer: 0,
                        boss: this,
                        isGarbage: false,

                        update: function(dt) {
                            // 更新计时器
                            this.timer += dt;

                            // 如果计时器结束，标记为垃圾
                            if (this.timer >= this.lifetime) {
                                this.isGarbage = true;
                                return;
                            }

                            // 更新位置
                            this.x += this.vx * dt;
                            this.y += this.vy * dt;

                            // 检查与玩家的碰撞
                            const playerDx = player.x - this.x;
                            const playerDy = player.y - this.y;
                            const playerDistSq = playerDx * playerDx + playerDy * playerDy;

                            // 如果与玩家碰撞，造成伤害
                            if (playerDistSq <= (this.size / 2 + player.size / 2) * (this.size / 2 + player.size / 2)) {
                                player.takeDamage(this.damage, this.boss);
                                this.isGarbage = true;
                            }
                        },

                        draw: function(ctx) {
                            if (this.isGarbage) return;

                            // 获取屏幕坐标
                            const screenPos = cameraManager.worldToScreen(this.x, this.y);

                            // 绘制投射物
                            ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
                            ctx.beginPath();
                            ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    };

                    // 添加到视觉效果列表
                    visualEffects.push(projectile);
                }
            }, wave * 1000); // 每波间隔1秒
        }
    }

    /**
     * 执行毒云特殊能力
     * @param {Player} target - 目标玩家
     */
    performPoisonCloud(target) {
        // 毒云数量
        const cloudCount = 5;

        // 创建多个毒云
        for (let i = 0; i < cloudCount; i++) {
            // 计算毒云位置
            const angle = Math.random() * Math.PI * 2;
            const distance = 100 + Math.random() * 200;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;

            // 创建毒云效果
            const effect = {
                x: x,
                y: y,
                radius: 80 + Math.random() * 40,
                damage: this.damage * 0.3,
                lifetime: 5.0,
                timer: 0,
                damageTimer: 0,
                damageInterval: 0.5,
                boss: this,
                isGarbage: false,

                update: function(dt) {
                    // 更新计时器
                    this.timer += dt;

                    // 如果计时器结束，标记为垃圾
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }

                    // 更新伤害计时器
                    this.damageTimer += dt;

                    // 如果伤害计时器结束，检查与玩家的碰撞
                    if (this.damageTimer >= this.damageInterval) {
                        // 计算到玩家的距离
                        const playerDx = player.x - this.x;
                        const playerDy = player.y - this.y;
                        const playerDistSq = playerDx * playerDx + playerDy * playerDy;

                        // 如果玩家在范围内，造成伤害
                        if (playerDistSq <= this.radius * this.radius) {
                            player.takeDamage(this.damage, this.boss);
                        }

                        // 重置伤害计时器
                        this.damageTimer = 0;
                    }
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    // 获取屏幕坐标
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);

                    // 计算透明度
                    const alpha = 0.3 * (1 - (this.timer / this.lifetime) * 0.7);

                    // 绘制毒云效果
                    ctx.fillStyle = `rgba(0, 128, 0, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                }
            };

            // 添加到视觉效果列表
            visualEffects.push(effect);
        }
    }

    /**
     * 执行精英召唤特殊能力
     * @param {Player} target - 目标玩家
     */
    performEliteSummon(target) {
        // 召唤精英怪
        const eliteCount = 1 + Math.floor(gameTime / 300);

        // 召唤精英怪
        for (let i = 0; i < eliteCount; i++) {
            // 计算召唤位置
            const angle = Math.random() * Math.PI * 2;
            const distance = 80 + Math.random() * 50;
            const x = this.x + Math.cos(angle) * distance;
            const y = this.y + Math.sin(angle) * distance;

            // 创建召唤效果
            const effect = {
                x: x,
                y: y,
                radius: 0,
                maxRadius: 50,
                lifetime: 2.0,
                timer: 0,
                isGarbage: false,

                update: function(dt) {
                    // 更新计时器
                    this.timer += dt;

                    // 如果计时器结束，标记为垃圾并召唤精英怪
                    if (this.timer >= this.lifetime) {
                        // 创建精英怪
                        const enemyType = ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)];

                        // 创建增强属性
                        const enhancedType = {
                            emoji: enemyType.emoji,
                            healthMult: enemyType.healthMult * 2,
                            speedMult: enemyType.speedMult * 1.2,
                            damageMult: enemyType.damageMult * 1.5,
                            xpMult: enemyType.xpMult * 3
                        };

                        // 创建精英怪
                        const eliteEnemy = new Enemy(this.x, this.y, enhancedType, 1.5);

                        // 增加大小
                        eliteEnemy.size = GAME_FONT_SIZE * 1.5;

                        // 添加到敌人列表
                        enemies.push(eliteEnemy);

                        // 标记为垃圾
                        this.isGarbage = true;
                        return;
                    }

                    // 更新半径
                    this.radius = (this.timer / this.lifetime) * this.maxRadius;
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    // 获取屏幕坐标
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);

                    // 计算透明度
                    const alpha = 0.7 - (this.timer / this.lifetime) * 0.5;

                    // 绘制召唤效果
                    ctx.fillStyle = `rgba(128, 0, 128, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();

                    // 绘制符文
                    ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.radius * 0.8, 0, Math.PI * 2);
                    ctx.stroke();

                    // 绘制五角星
                    const starRadius = this.radius * 0.6;
                    ctx.beginPath();
                    for (let i = 0; i < 5; i++) {
                        const angle = Math.PI / 2 + i * Math.PI * 2 / 5;
                        const x = screenPos.x + Math.cos(angle) * starRadius;
                        const y = screenPos.y + Math.sin(angle) * starRadius;
                        if (i === 0) {
                            ctx.moveTo(x, y);
                        } else {
                            ctx.lineTo(x, y);
                        }
                    }
                    ctx.closePath();
                    ctx.stroke();
                }
            };

            // 添加到视觉效果列表
            visualEffects.push(effect);
        }
    }

    /**
     * 绘制Boss
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        ctx.save(); // 最外层保存
        ctx.globalAlpha = 1.0; // 确保 BossEnemy 绘制开始时不透明

        // isPerformingAOE 和 aoeEffect 的逻辑似乎已被移除或整合
        // super.draw(ctx) 会调用 Character.draw, 然后 Enemy.draw, 
        // 这会绘制基础Emoji, 状态图标, 燃烧效果, 和普通敌人血条 (如果适用)
        super.draw(ctx);

        // --- Boss 特有的绘制逻辑 ---
        const screenPos = cameraManager.worldToScreen(this.x, this.y); // 重新获取，因为super.draw可能restore了

        // 骷髅王挥剑
        if (this.type.name === "骷髅王" && this.isSwingingSword && this.isActive) { 
            const swordScreenPos = screenPos; // 使用上面获取的 screenPos
            ctx.save();
            ctx.translate(swordScreenPos.x, swordScreenPos.y);
            ctx.rotate(this.swordAngle); 
            const swordEmoji = EMOJI.SWORD || '🗡️';
            const swordDisplaySize = this.size * 1.1; 
            const swordOffset = this.size * 0.2;   
            ctx.font = `${swordDisplaySize}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'left'; 
            ctx.textBaseline = 'middle';
            // 确保剑本身不透明，除非特殊效果
            // ctx.globalAlpha = 1.0; // 如果 translate/rotate 影响了 alpha
            ctx.fillText(swordEmoji, swordOffset, 0); 
            ctx.restore();
        }

        // 特殊攻击警告效果
        if (this.isWarningForSpecialAttack && this.isActive) {
            const warningScreenPos = screenPos;
            const warningBlinkInterval = 0.20; 
            const isWarningVisibleThisFrame = (this.specialAttackWarningTimer % warningBlinkInterval) < (warningBlinkInterval / 2);
            if (isWarningVisibleThisFrame) {
                ctx.save();
                ctx.globalAlpha = 0.5; // 特殊攻击警告有意设为半透明
                ctx.fillStyle = 'yellow';
                const warningIndicatorSize = this.size * 0.7;
                ctx.beginPath();
                ctx.arc(warningScreenPos.x, warningScreenPos.y, warningIndicatorSize, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore(); // 恢复到警告前的 alpha (应该是1.0，因为顶层设置了)
            }
        }

        // Boss 血条 (BossEnemy 特有)
            this.drawBossHealthBar(ctx, screenPos.x, screenPos.y);

        // 绘制当前激活的特殊技能效果 (如巨型僵尸的毒池)
        if (this.isPerformingSpecial && this.specialAbilityEffects.length > 0) {
            this.specialAbilityEffects.forEach(effect => {
                if (effect && typeof effect.draw === 'function' && !effect.isGarbage) {
                    // 假设 effect.draw 内部会正确管理自己的 alpha (save/restore)
                    effect.draw(ctx);
                }
            });
        }

        // 巨型僵尸的被动毒环和特殊攻击（红圈）警告
        if (this.type.name === "巨型僵尸" && this.isActive && !this.isGarbage) {
            const zombieScreenPos = screenPos;
            const auraScreenRadius = this.poisonAuraRadius * cameraManager.zoom;
            const auraTime = gameTime; // For animations
            ctx.save(); // 为巨型僵尸的特效创建一个新的 save/restore 块
            
            // --- Enhanced Passive Poison Aura Drawing ---
            // 1. Base Aura with Gradient
            const gradient = ctx.createRadialGradient(
                zombieScreenPos.x, zombieScreenPos.y, auraScreenRadius * 0.1,
                zombieScreenPos.x, zombieScreenPos.y, auraScreenRadius
            );
            const baseAuraAlpha = 0.20;
            gradient.addColorStop(0, `rgba(0, 150, 50, ${baseAuraAlpha * 0.5})`);
            gradient.addColorStop(0.7, `rgba(0, 128, 0, ${baseAuraAlpha})`);
            gradient.addColorStop(1, `rgba(0, 100, 0, ${baseAuraAlpha * 0.3})`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(zombieScreenPos.x, zombieScreenPos.y, auraScreenRadius, 0, Math.PI * 2);
            ctx.fill();

            // 2. Explicit Border for the Aura
            ctx.strokeStyle = `rgba(0, 255, 0, ${baseAuraAlpha * 2.0})`; // Brighter green, more opaque
            ctx.lineWidth = 2.5 * cameraManager.zoom; // Thicker border
            ctx.stroke(); // Draw the border

            // 3. Rotating Lines (previously 2)
            const numLines = 5;
            const lineLength = auraScreenRadius * 0.85;
            ctx.strokeStyle = `rgba(0, 200, 0, ${baseAuraAlpha * 1.5})`; // Kept as is or slightly adjust
            ctx.lineWidth = 1.5 * cameraManager.zoom;
            for (let i = 0; i < numLines; i++) {
                const angle = (auraTime * 0.2 + (Math.PI * 2 / numLines) * i) % (Math.PI * 2);
                ctx.beginPath();
                ctx.moveTo(zombieScreenPos.x, zombieScreenPos.y);
                ctx.lineTo(
                    zombieScreenPos.x + Math.cos(angle) * lineLength,
                    zombieScreenPos.y + Math.sin(angle) * lineLength
                );
                ctx.stroke();
            }

            // 4. Simple Particles (previously 3)
            const numParticles = 15;
            const particleBaseSize = 2 * cameraManager.zoom;
            for (let i = 0; i < numParticles; i++) {
                // Consistent random-like placement for each particle based on index and time
                const particleTimeSeed = auraTime * 0.3 + i * 0.5;
                const angle = (particleTimeSeed * 0.7 + (i * 2.5)) % (Math.PI * 2);
                // Particles move in and out radially
                const distance = auraScreenRadius * (0.2 + (Math.sin(particleTimeSeed) * 0.5 + 0.5) * 0.7); 
                const particleX = zombieScreenPos.x + Math.cos(angle) * distance;
                const particleY = zombieScreenPos.y + Math.sin(angle) * distance;
                
                const particleAlpha = baseAuraAlpha * (0.5 + Math.sin(particleTimeSeed * 1.2) * 0.5);
                const particleSize = particleBaseSize * (0.7 + Math.sin(particleTimeSeed * 0.8) * 0.3);

                if (particleAlpha > 0.05 && particleSize > 0.5) {
                    ctx.fillStyle = `rgba(50, 220, 50, ${particleAlpha})`;
                    ctx.beginPath();
                    ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
            // --- End of Enhanced Aura Drawing ---

            // ... (特殊攻击的毒池警告绘制代码 - 假设它内部管理 alpha)
            if (this.isWarningForSpecialAttack && this.pendingToxicPools.length > 0) {
                 this.pendingToxicPools.forEach(pool => {
                    const poolScreenPos = cameraManager.worldToScreen(pool.x, pool.y);
                    const warningRadius = this.toxicPoolRadius * cameraManager.zoom * pool.warningProgress; 
                    const currentWarningAlpha = 0.2 + pool.warningProgress * 0.4; 
                    ctx.fillStyle = `rgba(100, 0, 0, ${currentWarningAlpha})`; 
                    ctx.beginPath();
                    ctx.arc(poolScreenPos.x, poolScreenPos.y, warningRadius, 0, Math.PI * 2);
                    ctx.fill();
                    if (pool.warningProgress > 0.3) {
                       ctx.strokeStyle = `rgba(255, 50, 50, ${currentWarningAlpha * 1.5})`;
                       ctx.lineWidth = 2 * cameraManager.zoom;
                       ctx.beginPath();
                       ctx.arc(poolScreenPos.x, poolScreenPos.y, warningRadius, 0, Math.PI*2);
                       ctx.stroke();
                    }
                });
            }
            ctx.restore(); // 恢复到巨型僵尸特效之前的状态
        }
        ctx.restore(); // 恢复到 BossEnemy.draw 最开始的状态
    }

    /**
     * 绘制Boss生命条
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - 屏幕X坐标
     * @param {number} y - 屏幕Y坐标
     */
    drawBossHealthBar(ctx, x, y) {
        // 设置生命条尺寸和位置
        const barWidth = this.size * 1.5; // 修改：使宽度与 Boss 大小成比例
        const barHeight = 10;
        const barX = x - barWidth / 2;
        const barY = y - this.size / 1.4 - barHeight;

        // 计算生命百分比
        const healthPercent = Math.max(0, this.health / this.stats.health);

        // 绘制背景
        ctx.fillStyle = '#444';
        ctx.fillRect(barX, barY, barWidth, barHeight);

        // 绘制生命条
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(barX, barY, barWidth * healthPercent, barHeight);

        // 绘制边框
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.lineWidth = 1;

        // 绘制Boss名称
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        
        // 描边
        ctx.strokeStyle = 'red'; // 修改：将描边颜色改为红色
        ctx.lineWidth = 2.5; // 描边宽度
        ctx.strokeText(this.type.name, x, barY - 5);
        
        // 主要文字
        ctx.fillStyle = 'white';
        ctx.fillText(this.type.name, x, barY - 5);
    }
}

/**
 * 幽灵敌人实体 (由舍利子回魂召唤)
 * 不会伤害玩家，会自动攻击其他敌人
 */
class GhostEnemy extends Character {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Player} owner - 召唤者 (玩家)
     * @param {number} damage - 幽灵造成的伤害
     * @param {number} duration - 幽灵持续时间
     * @param {number} speed - 幽灵移动速度
     * @param {Object} effects - 额外效果 (例如减速)
     */
    constructor(x, y, owner, damage, duration, speed = 150, effects = {}) {
        // 使用幽灵 emoji 和基础属性
        super(x, y, '👻', GAME_FONT_SIZE * 0.9, { health: 1, speed: speed, damage: damage, xp: 0 });
        this.owner = owner;
        this.lifetime = 0;
        this.maxLifetime = duration;
        this.targetEnemy = null;
        this.attackCooldown = 0;
        this.attackInterval = 0.8; // 攻击间隔
        this.attackRangeSq = 50 * 50; // 攻击范围平方
        this.searchRangeSq = 300 * 300; // 搜索敌人范围平方
        this.effects = effects; // 如 { slow: { factor: 0.8, duration: 0.5 } }

        // 添加到全局幽灵列表
        if (typeof activeGhosts !== 'undefined') {
            activeGhosts.push(this);
        } else {
            console.warn("activeGhosts 数组未定义!");
        }
    }

    update(dt) {
        if (this.isGarbage || !this.isActive) return;

        // 更新生命周期
        this.lifetime += dt;
        if (this.lifetime >= this.maxLifetime) {
            this.destroy();
            return;
        }

        // 更新攻击冷却
        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        // 寻找目标
        if (!this.targetEnemy || this.targetEnemy.isGarbage || !this.targetEnemy.isActive) {
            this.findTargetEnemy();
        }

        // 移动和攻击
        if (this.targetEnemy) {
            const dx = this.targetEnemy.x - this.x;
            const dy = this.targetEnemy.y - this.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > this.attackRangeSq) {
                // 移动向目标
                const dist = Math.sqrt(distSq);
                const moveX = (dx / dist) * this.stats.speed * dt;
                const moveY = (dy / dist) * this.stats.speed * dt;
                this.x += moveX;
                this.y += moveY;
            } else if (this.attackCooldown <= 0) {
                // 在攻击范围内，进行攻击
                this.attack(this.targetEnemy);
                this.attackCooldown = this.attackInterval;
            }
        } else {
            // 没有目标时随机漂移或返回玩家附近? (可选)
            // 简单处理：原地不动或缓慢移动
        }
    }

    findTargetEnemy() {
        let closestEnemy = null;
        let minDistanceSq = this.searchRangeSq;

        enemies.forEach(enemy => {
            // 跳过自身、其他幽灵或已死亡的敌人
            if (enemy === this || enemy.isGarbage || !enemy.isActive || enemy instanceof GhostEnemy) {
                return;
            }

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });

        this.targetEnemy = closestEnemy;
    }

    attack(target) {
        // 对目标造成伤害
        target.takeDamage(this.stats.damage, this.owner); // 伤害来源算玩家

        // 应用效果 (例如减速)
        if (this.effects.slow && target.applyStatusEffect) {
             target.applyStatusEffect('slow', {
                 factor: this.effects.slow.factor,
                 duration: this.effects.slow.duration,
                 source: this.owner // 效果来源算玩家
             });
        }

        // 创建攻击视觉效果 (可选)
        const hitEffect = {
             x: target.x, y: target.y, radius: target.size * 0.5, maxRadius: target.size * 0.7, lifetime: 0.2, timer: 0, isGarbage: false,
             update: function(dt) { this.timer += dt; if (this.timer >= this.lifetime) this.isGarbage = true; this.radius = this.maxRadius * (this.timer/this.lifetime); },
             draw: function(ctx) { if (this.isGarbage) return; const screenPos = cameraManager.worldToScreen(this.x, this.y); const alpha = 0.6 - (this.timer/this.lifetime)*0.6; ctx.fillStyle = `rgba(180, 180, 255, ${alpha})`; ctx.beginPath(); ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI*2); ctx.fill(); }
        };
        visualEffects.push(hitEffect);
    }

    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;

        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        // 增加基础透明度，并让淡出效果不那么剧烈
        const baseAlpha = 0.9; // 从 0.8 提升到 0.9
        const fadeFactor = Math.max(0.2, 1 - (this.lifetime / this.maxLifetime) * 0.8); // 淡出到 0.2 而不是 0
        const alpha = baseAlpha * fadeFactor;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // --- 添加外发光效果 ---
        ctx.shadowColor = 'yellow'; // 外发光颜色改为 yellow
        ctx.shadowBlur = 20; // 增加外发光模糊半径到 20
        // --- 结束外发光 --- 
        
        ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        ctx.restore();

        // 可选：绘制生命周期条
        // const barWidth = this.size;
        // const barHeight = 3;
        // const lifePercent = 1 - (this.lifetime / this.maxLifetime);
        // ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        // ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y + this.size / 2 + 2, barWidth, barHeight);
        // ctx.fillStyle = 'rgba(100, 100, 255, 0.8)';
        // ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y + this.size / 2 + 2, barWidth * lifePercent, barHeight);
    }

    destroy() {
        this.isGarbage = true;
        this.isActive = false;
        // 从 activeGhosts 数组中移除自身
        if (typeof activeGhosts !== 'undefined') {
            const index = activeGhosts.indexOf(this);
            if (index > -1) {
                activeGhosts.splice(index, 1);
            }
        }
    }
}

// 辅助函数，将角度标准化到 [0, 2PI) 或 (-PI, PI] 范围，具体取决于你的偏好
// 这里我们标准化到 [0, 2PI)
function normalizeAngle(angle) {
    angle = angle % (2 * Math.PI);
    if (angle < 0) {
        angle += (2 * Math.PI);
    }
    return angle;
}
