/**
 * BaseEnemy.js - 基础敌人类实现
 * 从enemy.js中提取的Enemy类
 */

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
            type.emoji || EMOJI.ENEMY_NORMAL, // emoji 仍然可以作为备用
            GAME_FONT_SIZE * 0.7,
            {
                health: ENEMY_BASE_STATS.health * (type.healthMult || 1),
                speed: ENEMY_BASE_STATS.speed * (type.speedMult || 1),
                damage: ENEMY_BASE_STATS.damage * (type.damageMult || 1),
                xp: ENEMY_BASE_STATS.xp * (type.xpMult || 1)
            }
        );

        // Time-based scaling for health and damage
        const minutesPassed = gameTime / 60;

        // 根据玩家武器和被动道具数量调整难度
        let playerWeaponScaling = 1.0;
        let playerPassiveScaling = 1.0;

        if (player && player.weapons) {
            // 武器数量影响：每把武器增加10%难度（不考虑等级）
            playerWeaponScaling += player.weapons.length * 0.10;
        }

        if (player && player.passiveItems) {
            // 被动道具影响：每个被动道具增加5%难度（不考虑等级）
            playerPassiveScaling += player.passiveItems.length * 0.05;
        }

        // Health: Starts scaling after 2 mins, no cap on scaling
        let healthScalingFactor = 1.0;
        if (minutesPassed > 2) {
            healthScalingFactor += (minutesPassed - 2) * 0.20; // 0.20 per min after 2 mins, no cap
        }
        // 应用玩家装备影响
        healthScalingFactor *= playerWeaponScaling * playerPassiveScaling;

        // Damage: Starts scaling after 3 mins, no cap on scaling
        let damageScalingFactor = 1.0;
        if (minutesPassed > 3) {
            damageScalingFactor += (minutesPassed - 3) * 0.15; // 0.15 per min after 3 mins, no cap
        }
        // 应用玩家装备影响，但对伤害的影响减少25%
        damageScalingFactor *= 1 + ((playerWeaponScaling - 1) * 0.75) * ((playerPassiveScaling - 1) * 0.75);

        // 如果时间超过10分钟，对新种类的敌人增加额外的基础属性提升
        if (minutesPassed > 10 && type.minTime >= 600) {
            // 对10分钟后刷新的新敌人，基础属性提高20%
            healthScalingFactor *= 1.2;
            damageScalingFactor *= 1.2;
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
        // 攻击间隔
        this.attackInterval = type.attackInterval || 1.5; // 增加默认攻击间隔到1.5秒，让特殊效果更容易观察
        // 是否是远程敌人
        this.isRanged = type.isRanged || false;
        // 远程攻击范围
        this.attackRange = type.attackRange || 150;
        // 远程攻击冷却
        this.attackCooldownTime = type.attackCooldownTime || 1.5;
        // 远程投射物速度
        this.projectileSpeed = type.projectileSpeed || 120;

        // 新增：图片加载和朝向
        this.image = null;
        this.imageLoaded = false;
        this.facingRight = true; // 默认朝右

        if (this.type && this.type.svgPath) { // svgPath 现在用于PNG
            // 从预加载的资源中获取图像
            let assetName = this.type.svgPath.split('/').pop().split('.')[0]; // 例如: assets/enemy/firewisp.png -> firewisp
            // 为了匹配 ASSETS_TO_LOAD 中的命名，可能需要更复杂的映射或统一命名
            // 这里简单处理，假设 ASSETS_TO_LOAD 中的 name 与文件名（无后缀）一致或相似
            if (assetName === 'slime') assetName = 'slimeSvg';
            if (assetName === 'elite_slime') assetName = 'eliteSlimeSvg';
            if (assetName === 'firewisp') assetName = 'firewispPng';
            if (assetName === 'frostwisp') assetName = 'frostwispPng';
            if (assetName === 'lightningwisp') assetName = 'lightningwispPng';

            this.image = loadedAssets[assetName];
            if (this.image) {
                this.imageLoaded = true;
            } else {
                // console.warn(`图片 ${assetName} (${this.type.svgPath}) 未在 loadedAssets 中找到. 将使用 emoji.`);
                // 如果预加载的图片未找到，可以尝试动态加载作为备用，或直接使用emoji
                this.image = new Image();
                this.image.src = this.type.svgPath;
                this.image.onload = () => {
                    this.imageLoaded = true;
                };
                this.image.onerror = () => {
                    console.error(`备用加载失败: ${this.type.svgPath}`);
                }
            }
        }

        // 特殊能力相关
        // 地狱犬冲刺
        if (type.canDash) {
            this.dashCooldown = 0;
            this.dashCooldownTime = type.dashCooldown || 1.5; // 减少冷却时间从3秒到1.5秒
            this.dashSpeed = type.dashSpeed || 2.5;
            this.dashDuration = type.dashDuration || 0.8;
            this.isDashing = false;
            this.dashTimer = 0;
            this.dashDirection = { x: 0, y: 0 };
        }

        // 堕落天使光束攻击
        if (type.canShootBeam) {
            this.beamCooldown = 1.0; // 生成后1秒内不能发射光线
            this.beamCooldownTime = type.beamCooldown || 5;
            this.beamDamage = type.beamDamage || 15;
            this.beamWidth = type.beamWidth || 30;
            this.beamDuration = type.beamDuration || 1.5;
            this.isShootingBeam = false;
            this.beamTimer = 0;
            this.beamDirection = { x: 0, y: 0 };
            this.beamTarget = null;
            this.beamHitTargets = new Set();
            this.beamWarningTimer = 0;
        }

        // 精英僵尸毒气光环
        if (type.hasPoisonAura) {
            this.poisonAuraRadius = type.poisonAuraRadius || 100;
            this.poisonDamage = type.poisonDamage || 2;
            this.poisonTickTimer = 0;
            this.poisonTickInterval = 1.0;
        }

        // 添加时间增长系数
        this.timeScalingFactor = 1.0;
        this.lastTimeScalingUpdate = 0;
        this.timeScalingInterval = 60; // 每60秒更新一次

        // 如果是炸弹敌人，设置更高的基础伤害
        if (type && type.name === "炸弹") {
            this.stats.damage = 20;
            this.damage = 20;
        }

        this.beamAttackCooldown = 0;
        this.beamAttackTimer = 0;
        this.beamWarningTimer = 0;
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
        if (!this.isStunned() && !this.isFrozen() && !this.isDashing && !this.isShootingBeam) {
            this.updateMovement(dt);
        } else if (this.isDashing) {
            // 正在冲刺，更新冲刺逻辑
            this.updateDash(dt);
        }

        // 如果是远程敌人，尝试进行远程攻击
        if (this.isRanged && this.target && this.attackCooldown <= 0 && !this.isStunned() && !this.isFrozen()) {
            const distSq = this.getDistanceSquared(this.target);
            if (distSq <= this.attackRange * this.attackRange && distSq >= 100 * 100) {
                this.performRangedAttack();
                this.attackCooldown = this.attackCooldownTime;
            }
        }

        // 更新时间增长系数
        this.lastTimeScalingUpdate += dt;
        if (this.lastTimeScalingUpdate >= this.timeScalingInterval) {
            this.timeScalingFactor += 0.1; // 每60秒增加10%伤害
            this.lastTimeScalingUpdate = 0;
        }

        // 怪物-怪物碰撞处理，使用平滑推挤而非突然位移
        if (!this.isBoss && !this.isGarbage && this.isActive) {
            const minDist = (this.size || 32) * 0.6;
            for (let i = 0; i < enemies.length; i++) {
                const other = enemies[i];
                if (other !== this && !other.isBoss && !other.isGarbage && other.isActive) {
                    const dx = this.x - other.x;
                    const dy = this.y - other.y;
                    const distSq = dx * dx + dy * dy;
                    const dist = Math.sqrt(distSq);
                    if (dist > 0 && dist < minDist) {
                        // 计算推力，但平滑应用
                        const push = (minDist - dist) / 2.5; // 减小推力，从2到2.5
                        const pushX = (dx / dist) * push;
                        const pushY = (dy / dist) * push;

                        // 平滑应用推力，降低推力效果，每帧只应用部分推力
                        this.x += pushX * 0.6; // 减缓推力应用，只应用60%
                        this.y += pushY * 0.6;
                        other.x -= pushX * 0.6;
                        other.y -= pushY * 0.6;
                    }
                }
            }
        }
    }

    /**
     * 更新特殊能力
     * @param {number} dt - 时间增量
     */
    updateSpecialAbilities(dt) {
        // 如果没有目标或被眩晕/冻结，不更新特殊能力
        if (!this.target || this.isStunned() || this.isFrozen()) return;

        // 地狱犬冲刺
        if (this.type && this.type.canDash) {
            // dashCooldown每帧递减
            if (this.dashCooldown > 0) {
                this.dashCooldown -= dt;
                if (this.dashCooldown < 0) this.dashCooldown = 0;
            }
            // 狗的AI状态
            if (!this._dogState) {
                this._dogState = {
                    angle: Math.random() * Math.PI * 2, // 绕圈角度
                    mode: 'approach', // 初始状态改为approach
                    stuckTimer: 0,
                    circleReady: false,
                    lastX: this.x,
                    lastY: this.y
                };
            }
            // 目标丢失时自动恢复AI状态
            if (!this.target) {
                this._dogState.mode = 'approach';
                this._dogState.stuckTimer = 0;
                this._dogState.lastX = this.x;
                this._dogState.lastY = this.y;
                this._dogState.circleReady = false;
                return;
            }
            const dashRange = (this.dashSpeed || 2.5) * (this.dashDuration || 0.8) * 60; // 修正计算，移除0.7倍数
            const safeDistance = Math.min(dashRange * 0.8, 120); // 进一步减小安全距离到120，让地狱犬更靠近玩家
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 状态切换 - 调整阈值让地狱犬更频繁进入approach模式
            if (dist < safeDistance * 0.5) { // 更小的离开阈值
                this._dogState.mode = 'leave';
                this._dogState.circleReady = false;
            } else if (dist > safeDistance * 1.4) { // 降低接近阈值，更容易进入approach模式
                this._dogState.mode = 'approach';
                this._dogState.circleReady = false;
            } else {
                this._dogState.mode = 'circle';
            }
            // 行为 - 只有在不被眩晕/冻结时才能移动
            if (!this.isDashing && !this.isStunned() && !this.isFrozen()) {
                const currentSpeed = this.getCurrentSpeed();
                if (this._dogState.mode === 'leave') {
                    this.x -= (dx / dist) * currentSpeed * dt;
                    this.y -= (dy / dist) * currentSpeed * dt;
                    this._dogState.circleReady = false;
                } else if (this._dogState.mode === 'approach') {
                    this.x += (dx / dist) * currentSpeed * dt;
                    this.y += (dy / dist) * currentSpeed * dt;
                    this._dogState.circleReady = false;
                } else {
                    // 转圈前先平滑移动到圆周边缘
                    if (!this._dogState.circleReady) {
                        const toEdge = safeDistance - dist;
                        if (Math.abs(toEdge) > 2) {
                            this.x += (dx / dist) * Math.min(Math.abs(toEdge), currentSpeed * dt) * Math.sign(toEdge);
                            this.y += (dy / dist) * Math.min(Math.abs(toEdge), currentSpeed * dt) * Math.sign(toEdge);
                        } else {
                            this._dogState.circleReady = true;
                            this._dogState.angle = Math.atan2(this.y - this.target.y, this.x - this.target.x);
                        }
                    } else {
                        this._dogState.angle += 1.5 * dt;
                        this.x = this.target.x + Math.cos(this._dogState.angle) * safeDistance;
                        this.y = this.target.y + Math.sin(this._dogState.angle) * safeDistance;
                    }
                }
                // 防止卡住 - 使用平滑位移
                if (!this._dogState.lastX) {
                    this._dogState.lastX = this.x;
                    this._dogState.lastY = this.y;
                }
                const moved = Math.abs(this.x - this._dogState.lastX) + Math.abs(this.y - this._dogState.lastY);
                if (moved < 0.5) {
                    this._dogState.stuckTimer += dt;
                    if (this._dogState.stuckTimer > 0.8) { // 降低卡住检测时间
                        // 更激进的反卡逻辑
                        const jumpDistance = 25; // 增加跳跃距离
                        const angle = Math.random() * Math.PI * 2;
                        this.x += Math.cos(angle) * jumpDistance;
                        this.y += Math.sin(angle) * jumpDistance;
                        this._dogState.stuckTimer = 0;
                        this._dogState.mode = 'approach'; // 强制切换到approach模式
                        this._dogState.circleReady = false;
                        console.log("地狱犬反卡处理：跳跃脱困");
                    }
                } else {
                    this._dogState.stuckTimer = Math.max(0, this._dogState.stuckTimer - dt * 2); // 更快恢复卡住计时器
                }
                this._dogState.lastX = this.x;
                this._dogState.lastY = this.y;
                // 冲刺判定 - 多种触发条件，让地狱犬更频繁冲刺
                if (this.dashCooldown <= 0) {
                    let shouldDash = false;
                    
                    // 条件1：距离较远时冲刺（主要条件）
                    if (dist > 180) {
                        shouldDash = true;
                    }
                    // 条件2：在circle模式下随机冲刺（增加随机性）
                    else if (this._dogState.mode === 'circle' && this._dogState.circleReady && Math.random() < 0.008) { // 每帧约0.8%几率
                        shouldDash = true;
                    }
                    // 条件3：被卡住时间过长，强制冲刺突破
                    else if (this._dogState.stuckTimer > 0.5) {
                        shouldDash = true;
                    }
                    // 条件4：approach模式下距离适中时也可以冲刺
                    else if (this._dogState.mode === 'approach' && dist > 120 && Math.random() < 0.012) { // 每帧约1.2%几率
                        shouldDash = true;
                    }
                    
                    if (shouldDash) {
                        this.startDash();
                    }
                }
            }
        }

        // 堕落天使光束攻击
        if (this.type && this.type.canShootBeam) {
            if (!this.isShootingBeam) {
                if (this.beamCooldown > 0) {
                    this.beamCooldown -= dt;
                } else if (this.beamWarningTimer <= 0 && this.target && this.getDistanceSquared(this.target) < 500*500) { // 索敌范围提升到500
                    this.beamWarningTimer = 0.3; // 0.3秒警告
                    // 在警告阶段就确定光束方向，不再跟踪玩家
                    if (this.target) {
                        const dx = this.target.x - this.x;
                        const dy = this.target.y - this.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        this.beamDirection = dist > 0 ? { x: dx / dist, y: dy / dist } : { x: 0, y: 1 };

                        // 保存终点位置，以便绘制红线
                        this.beamEndPoint = {
                            x: this.x + this.beamDirection.x * 1000,
                            y: this.y + this.beamDirection.y * 1000
                        };
                    }
                }
                if (this.beamWarningTimer > 0) {
                    this.beamWarningTimer -= dt;
                    if (this.beamWarningTimer <= 0) {
                        this.startBeamAttack();
                    }
                }
            } else {
                this.updateBeamAttack(dt);
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

        if (this.type === '堕落天使') {
            if (this.beamAttackCooldown > 0) {
                this.beamAttackCooldown -= dt;
            }

            // 添加攻击提示
            if (this.beamAttackCooldown <= 0 && this.distanceToTarget < 300) {
                this.beamWarningTimer = 0.5; // 0.5秒警告时间
                this.beamAttackCooldown = 5; // 5秒冷却
            }

            if (this.beamWarningTimer > 0) {
                this.beamWarningTimer -= dt;
                if (this.beamWarningTimer <= 0) {
                    this.beamAttackTimer = 1.5; // 1.5秒持续时间
                    this.beamDamage = this.damage * 2; // 光束伤害为基础伤害的2倍
                }
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
        this.dashTimer += dt;
        if (this.dashTimer >= this.dashDuration) {
            this.isDashing = false;
            this.dashCooldown = this.dashCooldownTime;
            // 冲刺结束后优化AI状态，让地狱犬更激进
            if (this._dogState) {
                // 如果冲刺后距离仍然较远，立即切换到approach模式
                if (this.target) {
                    const dx = this.target.x - this.x;
                    const dy = this.target.y - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 150) {
                        this._dogState.mode = 'approach';
                    } else {
                        this._dogState.mode = 'circle';
                    }
                }
                this._dogState.stuckTimer = 0;
                this._dogState.lastX = this.x;
                this._dogState.lastY = this.y;
                this._dogState.circleReady = false;
            }
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
        // 设置光束状态
        this.isShootingBeam = true;
        this.beamAttackTimer = 1.0; // 攻击持续1秒

        // 这里不再重新计算光束方向，而是使用之前在警告阶段保存的方向
        this.beamHitTargets = new Set();
    }

    /**
     * 更新光束攻击
     * @param {number} dt - 时间增量
     */
    updateBeamAttack(dt) {
        // 更新攻击计时器
        this.beamAttackTimer -= dt;
        if (this.beamAttackTimer <= 0) {
            // 结束攻击
            this.isShootingBeam = false;
            this.beamCooldown = 3.0; // 3秒冷却
            return;
        }

        // 计算光束终点
        const beamEndX = this.x + this.beamDirection.x * 1000;
        const beamEndY = this.y + this.beamDirection.y * 1000;

        // 检查是否击中玩家
        if (player && !player.isGarbage && player.isActive && !this.beamHitTargets.has(player.id)) {
            // 计算玩家到光束的距离
            const dist = pointToLineDistanceSq(
                player.x, player.y,
                this.x, this.y,
                beamEndX, beamEndY
            );

            // 如果距离小于碰撞阈值，造成伤害
            const collisionThreshold = (this.beamWidth * this.beamWidth) / 4 + (player.size * player.size) / 4;
            if (dist <= collisionThreshold) {
                // 确保伤害值有效（不是NaN或Infinity）
                let beamDamage = this.beamDamage || (this.attackDamage * 2);
                if (isNaN(beamDamage) || !isFinite(beamDamage)) {
                    beamDamage = 15; // 如果伤害无效，使用默认值15
                }

                // 造成伤害
                player.takeDamage(beamDamage, this);

                // 标记已击中
                this.beamHitTargets.add(player.id);
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
        if (!target.statusEffects) target.statusEffects = {};
        if (target.getStat && target.getStat('slowImmunity') === true) {
            // 免疫所有减速，且如果已经有减速，立即移除
            if (target.statusEffects.slow) {
                delete target.statusEffects.slow;
                target.speed = target.getStat('speed');
            }
            return;
        }
        let slowResistance = 0;
        if (target.getStat && typeof target.getStat('slowResistance') === 'number') {
            slowResistance = target.getStat('slowResistance');
        }
        if (slowResistance > 0) {
            slowFactor = 1 - (1 - slowFactor) * (1 - slowResistance);
        }
        let originalSpeed = target.statusEffects.slow ?
            target.statusEffects.slow.originalSpeed :
            target.stats.speed;
        if (target.statusEffects.slow) {
            // 只保留最强减速
            if (slowFactor < target.statusEffects.slow.factor) {
                target.statusEffects.slow.factor = slowFactor;
                target.stats.speed = originalSpeed * slowFactor;
            }
            target.statusEffects.slow.duration = Math.max(target.statusEffects.slow.duration, slowDuration);
        } else {
            target.stats.speed *= slowFactor;
            target.statusEffects.slow = {
                factor: slowFactor,
                duration: slowDuration,
                originalSpeed: originalSpeed,
                source: this,
                icon: '🐌'
            };
        }
    }

    /**
     * 更新移动
     * @param {number} dt - 时间增量
     */
    updateMovement(dt) {
        if (!this.target) {
            // 如果没有目标，随机移动或返回出生点（简化处理）
            // this.wander(dt); // 可以实现一个徘徊逻辑
            return;
        }

        // 如果被眩晕、冻结或泡泡困住，不能移动
        if (this.isStunned() || this.isFrozen() || this.isBubbleTrapped()) {
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > (this.size / 2)) { // 只有在距离大于一定值时才移动
            // 获取当前速度，考虑所有状态效果
            const currentSpeed = this.getCurrentSpeed();
            const moveSpeed = currentSpeed * dt;
            
            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;

            // 更新朝向
            if (dx > 0) {
                this.facingRight = true;
            } else if (dx < 0) {
                this.facingRight = false;
            }
        }
    }

    /**
     * 检查并处理敌人卡住的情况
     * @param {number} dt - 时间增量
     */
    checkAndHandleStuck(dt) {
        // 暂时完全禁用卡死处理逻辑，观察基础移动和碰撞表现

        // 更新上一次位置，这对于任何基于上一帧位置的计算仍然是必要的
        if (this._movementState) { // 确保_movementState已初始化
            this._movementState.lastX = this.x;
            this._movementState.lastY = this.y;
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
                const burnDamage = this.type.burnDamage || (this.stats.damage * 0.3);
                const burnDuration = this.type.burnDuration || 3;
                
                // 使用玩家的燃烧应用方法或直接设置状态效果
                if (target && typeof target.applyStatusEffect === 'function') {
                    // 如果目标有applyStatusEffect方法，使用它
                    target.applyStatusEffect('burn', {
                        damage: burnDamage,
                        duration: burnDuration,
                        tickInterval: 1.0, // 每秒伤害一次
                        tickTimer: 1.0,
                        source: this,
                        icon: '🔥'
                    });
                } else {
                    // 直接设置状态效果（为了兼容性）
                    if (!target.statusEffects) {
                        target.statusEffects = {};
                    }

                    target.statusEffects.burn = {
                        damage: burnDamage,
                        duration: burnDuration,
                        tickInterval: 1.0, // 每秒伤害一次
                        tickTimer: 1.0,
                        source: this,
                        icon: '🔥'
                    };
                }
            }

            // 处理减速效果 (冰霜精灵)
            if (this.type.appliesSlow) {
                const slowFactor = this.type.slowFactor || 0.5;
                const slowDuration = this.type.slowDuration || 2;

                // 使用玩家的减速应用方法或直接调用applySlowEffect
                if (target && typeof target.applyStatusEffect === 'function') {
                    // 如果目标有applyStatusEffect方法，使用它
                    target.applyStatusEffect('slow', {
                        factor: slowFactor,
                        duration: slowDuration,
                        source: this,
                        icon: '🐌'
                    });
                } else {
                    // 否则使用我们自己的减速效果应用逻辑
                    this.applySlowEffect(target, slowFactor, slowDuration);
                }
            }

            // 处理眩晕效果 (雷电精灵) - 提高几率到80%便于测试
            if (this.type.appliesStun) {
                const stunChance = this.type.stunChance || 0.8; // 提高到80%
                const stunDuration = this.type.stunDuration || 1.0; // 增加持续时间到1秒

                if (Math.random() < stunChance) {
                    // 调用目标的 applyStatusEffect 方法以确保免疫逻辑得到遵守
                    if (target && typeof target.applyStatusEffect === 'function') {
                        console.log(`敌人 ${this.type.name} 对 ${target.constructor.name} 施加眩晕。持续时间: ${stunDuration}`);
                        target.applyStatusEffect('stun', { 
                            duration: stunDuration, 
                            source: this,
                            icon: '⭐'
                        });
                    } else {
                        console.warn("目标没有 applyStatusEffect 方法或目标为空。");
                    }
                } else {
                    console.log(`敌人 ${this.type.name} 的眩晕效果因几率问题未对 ${target.constructor.name} 生效。`);
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

            // 恢复原始的updateMovement方法
            if (this._originalUpdateMovement) {
                this.updateMovement = this._originalUpdateMovement;
                delete this._originalUpdateMovement;
            }
        }

        // 调用父类死亡处理
        super.onDeath(killer);

        // 增加击杀计数 (为所有非Boss敌人增加)
        // Boss的击杀计数在 bossManager.handleBossDeath 中处理
        if (!(this instanceof BossEnemy)) {
             if (typeof killCount !== 'undefined') {
                killCount++;
            }
        }

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

        // 如果是炸弹敌人，死亡时爆炸
        if (this.type && this.type.explodeOnDeath) {
            const explodeRadius = this.type.explodeRadius || 150;
            const explodeDamage = this.type.explodeDamage || 15; // 默认使用15的伤害值

            // 创建爆炸效果和伤害
            this.createExplosion(explodeRadius, explodeDamage);
        }

        // 随机掉落经验值
        this.dropXP();

        // 随机掉落物品
        this.dropItem();

        // --- 新增：通知击杀者（如果是玩家）处理被动效果 ---
        if (killer && killer instanceof Player && typeof killer.handleEnemyDeath === 'function') {
            killer.handleEnemyDeath(this);
        }
        // --- 结束新增 ---
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
            timer: 0,
            maxTime: 0.5,
            isGarbage: false,

            update: function(dt) {
                this.timer += dt;

                if (this.timer >= this.maxTime) {
                    this.isGarbage = true;
                    return;
                }

                this.radius = this.maxRadius * (this.timer / this.maxTime);
            },

            draw: function(ctx) {
                if (this.isGarbage) return;

                // 绘制爆炸效果
                const screenPos = cameraManager.worldToScreen(this.x, this.y);

                // 创建径向渐变
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, this.radius
                );

                // 设置渐变颜色
                gradient.addColorStop(0, 'rgba(255, 200, 50, 0.8)');
                gradient.addColorStop(0.5, 'rgba(255, 100, 50, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

                // 绘制圆形
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // 添加到视觉效果列表
        visualEffects.push(explosion);

        // 对范围内的玩家造成伤害，应用时间增长系数
        if (player && !player.isGarbage && player.isActive) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const distSq = dx * dx + dy * dy;

            if (distSq <= radius * radius) {
                // 计算伤害衰减
                const dist = Math.sqrt(distSq);
                const damageFactor = 1 - (dist / radius);
                const actualDamage = damage * damageFactor * this.timeScalingFactor;

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

        // 新增：为精英僵尸绘制毒气光环 (如果hasPoisonAura为true)
        if (this.type && this.type.hasPoisonAura && this.type.name === "精英僵尸") {
            ctx.save();
            const auraRadius = (this.type.poisonAuraRadius || 100) * cameraManager.zoom; 
            const auraTime = gameTime; // For animations
            
            // 基础光环
            const gradient = ctx.createRadialGradient(
                screenPos.x, screenPos.y, auraRadius * 0.1,
                screenPos.x, screenPos.y, auraRadius
            );
            const baseAuraAlpha = 0.15; // 精英僵尸的光环稍微透明一些
            gradient.addColorStop(0, `rgba(0, 180, 80, ${baseAuraAlpha * 0.4})`);
            gradient.addColorStop(0.7, `rgba(0, 150, 50, ${baseAuraAlpha})`);
            gradient.addColorStop(1, `rgba(0, 120, 30, ${baseAuraAlpha * 0.3})`);
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, auraRadius, 0, Math.PI * 2);
            ctx.fill();

            // 添加清晰的边缘
            ctx.strokeStyle = `rgba(0, 220, 100, ${baseAuraAlpha * 2.5 > 1 ? 1 : baseAuraAlpha * 2.5})`; // 更亮且更不透明的绿色边缘
            ctx.lineWidth = 2 * cameraManager.zoom; // 边框宽度
            ctx.stroke(); // 绘制描边

            // 旋转线条增加动态感
            const numLines = 3;
            const lineLength = auraRadius * 0.8;
            ctx.strokeStyle = `rgba(0, 200, 80, ${baseAuraAlpha * 1.2})`; 
            ctx.lineWidth = 1.5 * cameraManager.zoom;
            for (let i = 0; i < numLines; i++) {
                const angle = (auraTime * 0.3 + (Math.PI * 2 / numLines) * i) % (Math.PI * 2);
                ctx.beginPath();
                ctx.moveTo(screenPos.x, screenPos.y);
                ctx.lineTo(
                    screenPos.x + Math.cos(angle) * lineLength,
                    screenPos.y + Math.sin(angle) * lineLength
                );
                ctx.stroke();
            }
            ctx.restore();
        }

        // 绘制椭圆形阴影（在绘制敌人之前）
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        const enemySize = this.size * 2; // 敌人的显示大小
        const shadowCenterY = screenPos.y + enemySize / 2 + 5; // 5是额外偏移，可调
        ctx.ellipse(screenPos.x, shadowCenterY, enemySize / 2.5, enemySize / 7, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.restore();

        // 绘制敌人
        try {
            ctx.save(); // 保存当前绘图状态，以便翻转后恢复
            if (this.image && this.imageLoaded) {
                // 使用图片
                const size = this.size * 2; // 可以根据图片实际尺寸调整
                
                let drawX = screenPos.x - size / 2;
                const drawY = screenPos.y - size / 2;

                if (!this.facingRight) {
                    ctx.scale(-1, 1);
                    drawX = -screenPos.x - size / 2; // 翻转后，x坐标也需要调整
                }
                
                ctx.drawImage(
                    this.image,
                    drawX,
                    drawY,
                    size,
                    size
                );
            } else if (this.type && this.type.emoji) {
                // 没有图片或图片未加载，使用emoji作为备用
                ctx.font = `${this.size * 2}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                let emojiX = screenPos.x;
                if (!this.facingRight) {
                    // Emoji 通常是字符，翻转效果可能不理想，但可以尝试
                    // 或者对于emoji，不进行翻转，或者用特定朝向的emoji
                    ctx.scale(-1, 1);
                    emojiX = -screenPos.x;
                }
                ctx.fillText(this.type.emoji, emojiX, screenPos.y);
            }
            ctx.restore(); // 恢复绘图状态
        } catch (e) {
            console.error("绘制敌人时出错:", e);
            ctx.restore(); // 确保在出错时也恢复状态

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

        // 堕落天使光束
        if (this.type && this.type.canShootBeam) {
            // 绘制警告线
            if (this.beamWarningTimer > 0) {
                // 使用已保存的终点位置绘制警告线
                let endX, endY;
                if (this.beamEndPoint) {
                    endX = this.beamEndPoint.x;
                    endY = this.beamEndPoint.y;
                } else {
                    // 向后兼容：如果没有保存终点，则使用方向计算
                    endX = this.x + this.beamDirection.x * 1000;
                    endY = this.y + this.beamDirection.y * 1000;
                }

                const startScreen = cameraManager.worldToScreen(this.x, this.y);
                const endScreen = cameraManager.worldToScreen(endX, endY);

                ctx.save();
                ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
                ctx.lineWidth = 2; // 修改为细线，固定宽度2
                ctx.beginPath();
                ctx.moveTo(startScreen.x, startScreen.y);
                ctx.lineTo(endScreen.x, endScreen.y);
                ctx.stroke();
                ctx.restore();
            }

            // 绘制光束
            if (this.isShootingBeam) {
                const screenPos = cameraManager.worldToScreen(this.x, this.y);

                // 使用已保存的终点位置绘制光束
                let endX, endY;
                if (this.beamEndPoint) {
                    endX = this.beamEndPoint.x;
                    endY = this.beamEndPoint.y;
                } else {
                    // 向后兼容：如果没有保存终点，则使用方向计算
                    endX = this.x + this.beamDirection.x * 1000;
                    endY = this.y + this.beamDirection.y * 1000;
                }

                const endScreen = cameraManager.worldToScreen(endX, endY);
                ctx.save();
                ctx.strokeStyle = 'rgba(255,0,0,0.8)';
                ctx.lineWidth = this.beamWidth * cameraManager.zoom;
                ctx.beginPath();
                ctx.moveTo(screenPos.x, screenPos.y);
                ctx.lineTo(endScreen.x, endScreen.y);
                ctx.stroke();
                ctx.restore();

                // 判定玩家是否被击中（点到线段距离）
                if (this.target && this.target instanceof Player) {
                    const px = this.target.x, py = this.target.y;
                    const distSq = pointToLineDistanceSq(px, py, this.x, this.y, endX, endY);
                    if (distSq <= (this.beamWidth * this.beamWidth / 4)) {
                        // 只要无敌时间<=0就持续造成伤害
                        if (this.target.invincibleTime <= 0) {
                            this.target.takeDamage(this.beamDamage, this, false, false);
                            this.target.invincibleTime = 0.5; // 0.5秒无敌
                        }
                    }
                }
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
     * 检查是否被冻结
     * @returns {boolean} 是否被冻结
     */
    isFrozen() {
        return this.statusEffects && this.statusEffects.freeze && this.statusEffects.freeze.duration > 0;
    }

    /**
     * 获取当前速度
     * @returns {number} 当前速度
     */
    getCurrentSpeed() {
        // 如果被眩晕或冻结，速度为0
        if (this.isStunned() || this.isFrozen()) {
            return 0;
        }
        
        // 获取基础速度
        let speed = this.getStat('speed') || this.stats.speed;
        
        // 如果被减速，应用减速效果
        if (this.statusEffects && this.statusEffects.slow && this.statusEffects.slow.duration > 0) {
            speed *= this.statusEffects.slow.factor;
        }
        
        return speed;
    }
} 