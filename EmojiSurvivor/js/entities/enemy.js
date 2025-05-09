/**
 * 敌人类
 * 普通敌人
 */
class Enemy extends Character {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Object} typeData - 类型数据
     * @param {number} difficultyMultiplier - 难度乘数
     */
    constructor(x, y, typeData, difficultyMultiplier) {
        // 计算属性
        const timeHealthBonus = gameTime * 0.06;
        const timeSpeedBonus = gameTime * 0.03;
        const timeDamageBonus = gameTime * 0.04;
        // 创建属性对象
        const stats = {
            health: Math.ceil((ENEMY_BASE_STATS.health + timeHealthBonus) * typeData.healthMult * difficultyMultiplier),
            speed: (ENEMY_BASE_STATS.speed + timeSpeedBonus) * typeData.speedMult,
            damage: Math.ceil((ENEMY_BASE_STATS.damage + timeDamageBonus) * typeData.damageMult),
            xp: Math.ceil(ENEMY_BASE_STATS.xp * typeData.xpMult),
            armor: 0
        };
        // 调用父类构造函数
        super(x, y, typeData.emoji, GAME_FONT_SIZE, stats);

        // 基础速度
        this.baseSpeed = stats.speed;
        // 伤害冷却
        this.damageCooldown = 0.5;
        this.damageTimer = 0;

        // 掉落几率
        this.dropChance = {
            magnet: 0.02, // 2%几率掉落吸铁石
            heart: 0.05   // 5%几率掉落心
        };
    }

    /**
     * 更新敌人状态
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标玩家
     */
    update(dt, target) {
        // 如果敌人不活动或已标记为垃圾，不更新
        if (this.isGarbage || !this.isActive) return;
        // 调用父类更新方法
        super.update(dt);
        // 如果被眩晕，不移动
        if (this.isStunned()) return;
        // 计算到目标的方向
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        // 如果距离足够远，移动向目标
        if (dist > target.size / 4) {
            this.x += (dx / dist) * this.speed * dt;
            this.y += (dy / dist) * this.speed * dt;
        }
        // 更新伤害计时器
        this.damageTimer -= dt;
        // 如果伤害计时器结束且与目标碰撞，造成伤害
        if (this.damageTimer <= 0 && this.checkCollision(target)) {
            target.takeDamage(this.damage, this);
            this.damageTimer = this.damageCooldown;
        }
    }

    /**
     * 死亡处理
     * @param {GameObject} killer - 击杀者
     */
    onDeath(killer) {
        // 调用父类死亡处理
        super.onDeath(killer);

        // 如果击杀者是玩家，掉落物品
        if (killer instanceof Player) {
            // 掉落经验宝石
            xpGems.push(new ExperienceGem(this.x, this.y, this.xpValue));

            // 增加击杀计数
            killCount++;

            // 随机掉落物品
            this.dropItems(killer);
        }
    }

    /**
     * 掉落物品
     * @param {Player} killer - 击杀者
     */
    dropItems(killer) {
        // 获取玩家幸运值
        const luck = killer.getStat('luck');

        // 随机掉落心
        if (Math.random() < this.dropChance.heart * luck) {
            worldObjects.push(new Pickup(this.x, this.y, EMOJI.HEART, 'heal', 20));
        }

        // 随机掉落吸铁石
        if (Math.random() < this.dropChance.magnet * luck) {
            worldObjects.push(new Pickup(this.x, this.y, EMOJI.MAGNET, 'magnet', 0));
        }
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
        super(x, y, typeData, 1);

        // 设置Boss属性
        this.size = GAME_FONT_SIZE * 3.5;
        this.isBoss = true;
        this.name = bossType.name;
        this.attackPattern = bossType.attackPattern;

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
                xpGems.push(new ExperienceGem(gemX, gemY, Math.ceil(this.xpValue / 15)));
            }
        }

        // 重置当前Boss
        currentBoss = null;

        console.log("Boss 被击败!");
    }
}
