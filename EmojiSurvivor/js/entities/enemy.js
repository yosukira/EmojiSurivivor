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
            GAME_FONT_SIZE,
            {
                health: ENEMY_BASE_STATS.health * (type.healthMult || 1),
                speed: ENEMY_BASE_STATS.speed * (type.speedMult || 1),
                damage: ENEMY_BASE_STATS.damage * (type.damageMult || 1),
                xp: ENEMY_BASE_STATS.xp * (type.xpMult || 1)
            }
        );
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
        // 更新移动
        this.updateMovement(dt);
        
        // 如果是远程敌人，尝试进行远程攻击
        if (this.isRanged && this.target && this.attackCooldown <= 0) {
            const distSq = this.getDistanceSquared(this.target);
            if (distSq <= this.attackRange * this.attackRange && distSq >= 100 * 100) {
                this.performRangedAttack();
                this.attackCooldown = this.attackCooldownTime;
            }
        }
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
        
        // 检查玩家是否在屏幕内或附近 - 只有在范围内才追击和攻击
        if (distSq > ENEMY_ATTACK_RANGE * ENEMY_ATTACK_RANGE) {
            return;
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
        
        // 如果是爆炸敌人，创建爆炸效果
        if (this.type && this.type.explodeOnDeath) {
            this.createExplosion(this.type.explodeRadius || 120, this.type.explodeDamage || 15);
        }
        
        // 如果击杀者是玩家，增加击杀数
        if (killer === player) {
            // 增加击杀数
            killCount++;
            // 生成经验宝石
            this.dropXP();
            // 随机掉落物品
            if (Math.random() < 0.05) { // 5%几率掉落物品
                this.dropItem();
            }
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
        // 计算经验值
        const xpValue = Math.ceil(this.xpValue);

        // 创建经验宝石
        const gem = new ExperienceGem(this.x, this.y, xpValue);

        // 添加到经验宝石列表
        xpGems.push(gem);
    }
    /**
     * 掉落物品
     */
    dropItem() {
        // 随机选择掉落物品类型
        const rand = Math.random();
        if (rand < 0.7) { // 70%几率掉落治疗物品
            // 创建治疗物品
            const pickup = new Pickup(this.x, this.y, EMOJI.HEART, 'heal', 20);
            worldObjects.push(pickup);
        } else { // 30%几率掉落磁铁
            // 创建磁铁物品
            const pickup = new Pickup(this.x, this.y, EMOJI.MAGNET, 'magnet', 0);
            worldObjects.push(pickup);
        }
    }

    /**
     * 绘制敌人
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果敌人不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;

        // 调用父类绘制方法
        super.draw(ctx);
        // 如果是Boss，绘制生命条
        if (this.isBoss) {
            this.drawHealthBar(ctx);
        }
    }

    /**
     * 绘制生命条
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawHealthBar(ctx) {
        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        // 计算生命条宽度
        const barWidth = this.size * 1.5;
        const barHeight = 5;
        const healthPercent = this.health / this.maxHealth;
        // 绘制背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y + this.size / 2 + 5, barWidth, barHeight);

        // 绘制生命条
        ctx.fillStyle = `rgb(${255 * (1 - healthPercent)}, ${255 * healthPercent}, 0)`;
        ctx.fillRect(screenPos.x - barWidth / 2, screenPos.y + this.size / 2 + 5, barWidth * healthPercent, barHeight);
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
        // 计算Boss循环次数
        const bossCount = Math.floor(gameTime / BOSS_INTERVAL);

        // 创建类型数据
        const typeData = {
            emoji: bossType.emoji,
            healthMult: bossType.healthMult * (BOSS_BASE_HEALTH_MULTIPLIER + bossCount * 15),
            speedMult: bossType.speedMult,
            damageMult: bossType.damageMult * (BOSS_BASE_DAMAGE_MULTIPLIER + bossCount * 0.6),
            xpMult: bossType.xpMult * (BOSS_BASE_HEALTH_MULTIPLIER + bossCount * 15)
        };
        
        // 调用父类构造函数
        super(x, y, typeData);
        
        // 设置Boss属性
        this.size = GAME_FONT_SIZE * 3.5;
        this.isBoss = true;
        this.name = bossType.name;
        this.attackPattern = bossType.attackPattern;
        this.bossType = bossType;

        // 确保Boss生命值足够高
        this.stats.health = Math.max(150, this.stats.health);
        this.health = this.stats.health;
        
        // 攻击相关属性
        this.attackTimer = 0;
        this.attackCooldown = 3.0;
        this.attackPhase = 0;
        this.projectileCount = bossType.projectileCount || 8;
        
        // 特殊能力
        this.specialAbilityTimer = 0;
        this.specialAbilityCooldown = 10.0;
        
        // 掉落几率
        this.dropChance = {
            magnet: 0.5, // 50%几率掉落吸铁石
            heart: 1.0   // 100%几率掉落心
        };
    }

    /**
     * 更新Boss状态
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标玩家
     */
    update(dt, target) {
        // 如果Boss不活动或已标记为垃圾，不更新
        if (this.isGarbage || !this.isActive) return;

        // 调用父类更新方法
        super.update(dt, target);

        // 更新攻击计时器
        this.attackTimer -= dt;

        // 如果攻击计时器结束且未被眩晕，执行攻击
        if (this.attackTimer <= 0 && !this.isStunned()) {
            // 执行攻击
            this.performAttack(target);

            // 重置攻击计时器
            this.attackTimer = this.attackCooldown;
        }

        // 更新特殊能力计时器
        this.specialAbilityTimer -= dt;

        // 如果特殊能力计时器结束且未被眩晕，执行特殊能力
        if (this.specialAbilityTimer <= 0 && !this.isStunned()) {
            // 执行特殊能力
            this.performSpecialAbility(target);

            // 重置特殊能力计时器
            this.specialAbilityTimer = this.specialAbilityCooldown;
        }
    }

    /**
     * 执行攻击
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
        // 计算到目标的方向
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 如果距离足够远，冲向目标
        if (dist > 0) {
            // 创建冲锋效果
            const effect = {
                x: this.x,
                y: this.y,
                targetX: target.x,
                targetY: target.y,
                speed: this.speed * 3,
                damage: this.damage * 1.5,
                radius: this.size,
                lifetime: 1.0,
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

                    // 计算方向
                    const dx = this.targetX - this.x;
                    const dy = this.targetY - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // 如果距离足够远，移动向目标
                    if (dist > 10) {
                        // 更新位置
                        const moveX = (dx / dist) * this.speed * dt;
                        const moveY = (dy / dist) * this.speed * dt;

                        this.x += moveX;
                        this.y += moveY;

                        // 更新Boss位置
                        this.boss.x = this.x;
                        this.boss.y = this.y;
                    }

                    // 检查与玩家的碰撞
                    const playerDx = player.x - this.x;
                    const playerDy = player.y - this.y;
                    const playerDistSq = playerDx * playerDx + playerDy * playerDy;

                    // 如果与玩家碰撞，造成伤害
                    if (playerDistSq <= (this.radius + player.size / 2) * (this.radius + player.size / 2)) {
                        player.takeDamage(this.damage, this.boss);
                    }
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    // 获取屏幕坐标
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);

                    // 绘制冲锋效果
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
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
                    ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
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

                // 计算透明度
                let alpha;
                if (this.timer < this.expandDuration) {
                    // 扩张阶段：逐渐增加透明度
                    alpha = this.timer / this.expandDuration * 0.5;
                } else {
                    // 保持阶段：闪烁效果
                    const t = (this.timer - this.expandDuration) / this.holdDuration;
                    alpha = 0.5 - 0.3 * Math.sin(t * Math.PI * 10);
                }

                // 绘制范围攻击效果
                ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
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
        // 根据攻击模式执行不同特殊能力
        switch (this.attackPattern) {
            case 'melee':
                // 近战特殊能力：地震
                this.performEarthquake(target);
                break;

            case 'ranged':
                // 远程特殊能力：弹幕
                this.performBarrage(target);
                break;

            case 'aoe':
                // 范围特殊能力：毒云
                this.performPoisonCloud(target);
                break;

            case 'summon':
                // 召唤特殊能力：精英召唤
                this.performEliteSummon(target);
                break;

            default:
                // 默认特殊能力：地震
                this.performEarthquake(target);
                break;
        }
    }

    /**
     * 执行地震特殊能力
     * @param {Player} target - 目标玩家
     */
    performEarthquake(target) {
        // 创建地震效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: 300,
            damage: this.damage * 2,
            expandDuration: 2.0,
            timer: 0,
            boss: this,
            hitTargets: new Set(),
            isGarbage: false,

            update: function(dt) {
                // 更新计时器
                this.timer += dt;

                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.expandDuration) {
                    this.isGarbage = true;
                    return;
                }

                // 更新半径
                this.radius = (this.timer / this.expandDuration) * this.maxRadius;

                // 检查与玩家的碰撞
                const playerDx = player.x - this.x;
                const playerDy = player.y - this.y;
                const playerDistSq = playerDx * playerDx + playerDy * playerDy;

                // 如果玩家在范围内且尚未命中，造成伤害
                if (playerDistSq <= this.radius * this.radius && !this.hitTargets.has(player)) {
                    player.takeDamage(this.damage, this.boss);
                    this.hitTargets.add(player);
                }
            },

            draw: function(ctx) {
                if (this.isGarbage) return;

                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);

                // 计算透明度
                const alpha = 0.3 * (1 - (this.timer / this.expandDuration));

                // 绘制地震效果
                ctx.fillStyle = `rgba(139, 69, 19, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();

                // 绘制地震波纹
                ctx.strokeStyle = `rgba(139, 69, 19, ${alpha * 2})`;
                ctx.lineWidth = 5;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        };

        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 执行弹幕特殊能力
     * @param {Player} target - 目标玩家
     */
    performBarrage(target) {
        // 弹幕波数
        const waveCount = 3;

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
        // 调用父类绘制方法
        super.draw(ctx);
        // 如果Boss活动且有生命，绘制生命条
        if (!this.isGarbage && this.isActive && this.health > 0) {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);

            // 绘制Boss生命条
            this.drawBossHealthBar(ctx, screenPos.x, screenPos.y);
        }
    }

    /**
     * 绘制Boss生命条
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {number} x - 屏幕X坐标
     * @param {number} y - 屏幕Y坐标
     */
    drawBossHealthBar(ctx, x, y) {
        // 设置生命条尺寸和位置
        const barWidth = 100;
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
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);
        ctx.lineWidth = 1;

        // 绘制Boss名称
        ctx.font = '14px Arial';
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, x, barY - 5);
    }

    /**
     * 死亡处理
     * @param {GameObject} killer - 击杀者
     */
    onDeath(killer) {
        // 标记为垃圾和非活动
        this.isGarbage = true;
        this.isActive = false;

        // 如果击杀者是玩家，掉落物品
        if (killer instanceof Player) {
            // 增加击杀计数
            killCount++;

            // 掉落宝箱
            worldObjects.push(new Chest(this.x, this.y));

            // 掉落大量经验宝石
            for (let i = 0; i < 15; i++) {
                const gemX = this.x + (Math.random() - 0.5) * 60;
                const gemY = this.y + (Math.random() - 0.5) * 60;
                xpGems.push(new XPGem(gemX, gemY, Math.ceil(this.xpValue / 15)));
            }
        }

        // 重置当前Boss
        bossManager.currentBoss = null;

        console.log("Boss 被击败!");
    }
}
