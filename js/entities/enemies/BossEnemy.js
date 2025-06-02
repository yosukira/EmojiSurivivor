/**
 * BossEnemy类 - Boss敌人实现
 * 从enemy.js中提取的BossEnemy类
 */

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
        // 修复问题：先确保gameTime存在，否则使用默认值0
        const currentGameTime = typeof gameTime !== 'undefined' ? gameTime : 0;

        // 计算Boss基础属性 (initial calculation before super call)
        const initialBossStats = { ...ENEMY_BASE_STATS };

        // 确保乘数有效，避免NaN或Infinity
        const healthMult = bossType.healthMult || 1;
        const speedMult = bossType.speedMult || 1;
        const damageMult = bossType.damageMult || 1;
        const xpMult = bossType.xpMult || 1;

        // 确保健康乘数正确获取并有默认值
        const baseHealthMultiplier = typeof BOSS_BASE_HEALTH_MULTIPLIER !== 'undefined' ? BOSS_BASE_HEALTH_MULTIPLIER : 8;
        const baseDamageMultiplier = typeof BOSS_BASE_DAMAGE_MULTIPLIER !== 'undefined' ? BOSS_BASE_DAMAGE_MULTIPLIER : 2.5;

        // 正确计算初始属性并确保不为NaN或undefined
        initialBossStats.health = (bossType.healthBase || ENEMY_BASE_STATS.health * baseHealthMultiplier) * healthMult;
        initialBossStats.speed = (bossType.speedBase || ENEMY_BASE_STATS.speed) * speedMult;
        initialBossStats.damage = (bossType.damageBase || ENEMY_BASE_STATS.damage * baseDamageMultiplier) * damageMult;
        initialBossStats.xp = (bossType.xpBase || ENEMY_BASE_STATS.xp * 10) * xpMult;
        initialBossStats.attackInterval = bossType.attackCooldown || 1.5;

        // 确保值不为NaN或负数
        initialBossStats.health = Math.max(1, initialBossStats.health || 1000);
        initialBossStats.speed = Math.max(1, initialBossStats.speed || 70);
        initialBossStats.damage = Math.max(1, initialBossStats.damage || 20);
        initialBossStats.xp = Math.max(1, initialBossStats.xp || 50);

        // Call super with a temporary type object that doesn't include multipliers yet for base Enemy constructor,
        // as we will apply scaling after this. The base Enemy constructor already applies type.healthMult etc.
        // So, we pass a simplified type for the super constructor to avoid double multiplication initially.
        const simplifiedSuperType = { ...bossType, healthMult: 1, speedMult: 1, damageMult: 1, xpMult: 1 };
        super(x, y, simplifiedSuperType);

        // Now, directly assign the pre-calculated initialBossStats (which already has boss-specific multipliers)
        this.stats = { ...initialBossStats }; // Use a copy

        // --- START: 第一个骷髅王固定血量逻辑 ---
        if (bossType.name === "骷髅王" && bossType.healthBase && !window.firstSkeletonKingHealthApplied) {
            this.stats.health = bossType.healthBase; // healthBase 应该是 500
            this.health = this.stats.health;
            this.maxHealth = this.stats.health;
            window.firstSkeletonKingHealthApplied = true; // 标记已应用
            console.log(`First Skeleton King spawned with fixed health: ${this.stats.health}`);
        } else {
            // Time-based scaling for Bosses (more aggressive or starts earlier)
            const minutesPassed = currentGameTime / 60;
            // Health: Starts scaling after 1 min, no cap on scaling (removed cap)
            let bossHealthScaling = 1.0;
            if (minutesPassed > 1) {
                bossHealthScaling += (minutesPassed - 1) * 0.20; // 0.20 per min after 1 min
            }
            // Damage: Starts scaling after 2 mins, no cap on scaling (removed cap)
            let bossDamageScaling = 1.0;
            if (minutesPassed > 2) {
                bossDamageScaling += (minutesPassed - 2) * 0.15; // 0.15 per min after 2 mins
            }

            // 确保缩放因子不为NaN或负数
            bossHealthScaling = Math.max(1.0, bossHealthScaling || 1.0);
            bossDamageScaling = Math.max(1.0, bossDamageScaling || 1.0);

            this.stats.health *= bossHealthScaling;
            this.stats.damage *= bossDamageScaling;

            // 根据玩家武器和被动道具数量调整难度 (与普通敌人逻辑类似)
            let playerWeaponScaling = 1.0;
            let playerPassiveScaling = 1.0;

            if (typeof player !== 'undefined' && player && player.weapons) {
                playerWeaponScaling += player.weapons.length * 0.10;
            }

            if (typeof player !== 'undefined' && player && player.passiveItems) {
                playerPassiveScaling += player.passiveItems.length * 0.05;
            }

            // 应用玩家装备影响 - Boss也受此影响
            // 血量缩放 (可以考虑是否对Boss也应用无上限，或者设置不同的系数/上限)
            this.stats.health *= playerWeaponScaling * playerPassiveScaling;

            // 伤害缩放 (对Boss伤害的影响也减少25%)
            this.stats.damage *= (1 + ((playerWeaponScaling - 1) * 0.75) * ((playerPassiveScaling - 1) * 0.75));

            // 确保最终健康值不为NaN或负数
            this.stats.health = Math.max(100, this.stats.health || 1000); // 保持Boss最低血量

            // 设置当前生命值
            this.health = this.stats.health;
            this.maxHealth = this.stats.health;
             if (bossType.name === "骷髅王") {
                console.log(`Subsequent Skeleton King spawned with scaled health: ${this.stats.health}`);
            }
        }
        // --- END: 第一个骷髅王固定血量逻辑 ---

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

            // 添加一个标记，用来跟踪玩家是否在毒圈内
            this.playerInPoisonAura = false;
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

        // 确认Boss已正确初始化，打印日志
        console.log(`Boss ${this.type.name} created with health: ${this.health}/${this.maxHealth}, damage: ${this.stats.damage}`);

        // 为血条系统明确设置 currentHP 和 maxHP
        this.currentHP = this.health;
        this.maxHP = this.maxHealth;
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

    /**
     * 更新Boss状态
     * @param {number} dt - 时间增量
     * @param {Character} target - 目标角色
     */
    update(dt, target) {
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

                // 检查玩家是否在毒圈内
                const inPoisonAura = distSq <= this.poisonAuraRadius * this.poisonAuraRadius;

                if (inPoisonAura) {
                    // 玩家在毒圈内

                    // 如果刚进入毒圈
                    if (!this.playerInPoisonAura) {
                        this.playerInPoisonAura = true;

                        // 保存当前的普通减速效果（如果有）
                        if (target.statusEffects && target.statusEffects.slow && !target.statusEffects.slow.isAuraEffect) {
                            target._pendingNormalSlow = { ...target.statusEffects.slow };
                        }

                        // 应用光环减速
                        const baseSpeed = target.getStat('speed');
                        // 直接设置减速效果，而不是通过applyStatusEffect
                        target.statusEffects.slow = {
                            factor: this.poisonAuraSlowFactor,
                            duration: 999, // 长时间持续，不会自动消失
                            originalSpeed: baseSpeed,
                            source: this,
                            isAuraEffect: true,
                            icon: '🐌'
                        };
                        target.speed = baseSpeed * this.poisonAuraSlowFactor;
                    }

                    // 周期性伤害
                    this.poisonAuraDamageTimer += dt;
                    if (this.poisonAuraDamageTimer >= this.poisonAuraDamageInterval) {
                        target.takeDamage(this.poisonAuraDamageAmount, this, false, true);
                        this.poisonAuraDamageTimer -= this.poisonAuraDamageInterval;
                    }
                } else if (this.playerInPoisonAura) {
                    // 玩家刚离开毒圈
                    this.playerInPoisonAura = false;

                    // 移除光环减速
                    if (target.statusEffects && target.statusEffects.slow && target.statusEffects.slow.isAuraEffect) {
                        delete target.statusEffects.slow;

                        // 恢复普通减速（如果有）
                        if (target._pendingNormalSlow) {
                            target.statusEffects.slow = { ...target._pendingNormalSlow };
                            target.speed = target.getStat('speed') * target._pendingNormalSlow.factor;
                            delete target._pendingNormalSlow;
                        } else {
                            // 没有普通减速，恢复原速
                            target.speed = target.getStat('speed');
                        }
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
                this.performMeleeAttack(target);
                break;
            case 'ranged':
                this.performRangedAttack(target);
                break;
            case 'aoe':
                this.performAOEAttack(target);
                break;
            case 'summon':
                this.performSummonAttack(target);
                break;
            default:
                this.performMeleeAttack(target);
        }
    }

    /**
     * 执行近战攻击
     * @param {Player} target - 目标玩家
     */
    performMeleeAttack(target) {
        if (this.type.name === "骷髅王") {
            // 计算与目标的距离
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // 如果在近战范围内，攻击目标
            if (distance <= this.size + target.size) {
                this.isSwingingSword = true;
                this.swordSwingTimer = 0; // 重置挥剑计时器
                this.lastSwordDamageTime = 0; // 重置最后伤害时间，确保从挥剑开始就可以造成伤害
                // 剑的初始朝向面向玩家
                this.initialSwordAngle = Math.atan2(dy, dx) - this.swordArc / 2;
            }
        } else if (this.type.name === "幽灵领主") {
            // 幽灵领主普通攻击：发射一圈弹幕（无需近战范围检查）
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
            // 其他Boss的近战攻击需要范围检查
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= this.size + target.size) {
                target.takeDamage(this.stats.damage, this);
            }
        }
    }

    /**
     * 执行远程攻击
     * @param {Player} target - 目标玩家
     */
    performRangedAttack(target) {
        // 计算方向
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            // 标准化方向向量
            const dirX = dx / distance;
            const dirY = dy / distance;

            // 创建投射物
            const projectileSpeed = this.type.projectileSpeed || 200;
            const projectile = new EnemyProjectile(
                this.x,
                this.y,
                dirX * projectileSpeed,
                dirY * projectileSpeed,
                this.stats.damage,
                this
            );

            // 添加到全局投射物数组
            enemyProjectiles.push(projectile);
        }
    }

    /**
     * 执行范围攻击
     * @param {Player} target - 目标玩家
     */
    performAOEAttack(target) {
        // 在自身周围创建范围伤害
        const aoeRadius = this.type.aoeRadius || 100;
        const aoeDamage = this.stats.damage * (this.type.aoeDamageMultiplier || 1.5);

        // 检查目标是否在范围内
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance <= aoeRadius) {
            // 造成伤害
            target.takeDamage(aoeDamage, this);
        }

        // 创建视觉效果
        const aoeEffect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: aoeRadius,
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

                const screenPos = cameraManager.worldToScreen(this.x, this.y);

                // 创建径向渐变
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, this.radius
                );

                gradient.addColorStop(0, 'rgba(255, 100, 100, 0.6)');
                gradient.addColorStop(1, 'rgba(255, 50, 50, 0)');

                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // 添加到视觉效果列表
        if (typeof visualEffects !== 'undefined') {
            visualEffects.push(aoeEffect);
        }
    }

    /**
     * 执行召唤攻击
     * @param {Player} target - 目标玩家
     */
    performSummonAttack(target) {
        // 召唤小怪的数量
        const summonCount = this.type.summonCount || 2;
        const summonType = getEnemyTypeByName(this.type.summonEnemyType || "史莱姆");

        if (summonType) {
            for (let i = 0; i < summonCount; i++) {
                // 在Boss周围随机位置生成小怪
                const angle = Math.random() * Math.PI * 2;
                const distance = 50 + Math.random() * 50;
                const x = this.x + Math.cos(angle) * distance;
                const y = this.y + Math.sin(angle) * distance;

                // 创建小怪
                const minion = new Enemy(x, y, summonType);
                minion.target = target; // 设置目标为玩家

                // 添加到敌人列表
                enemies.push(minion);
            }
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
     * 执行地震技能
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
        // 此方法原用于绘制Boss头顶的自定义UI（如骷髅王名称和小红条）
        // 由于现在使用屏幕下方的大血条，此方法不再需要绘制任何内容。
        return; 

        // 原有代码保留在此注释下方，以备将来参考或恢复
        /*
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
        */
    }

    /**
     * 覆盖基类的onDeath方法，处理Boss死亡事件
     * @param {Character} killer - 击杀者
     */
    onDeath(killer) {
        // 如果死亡已处理，不再处理
        if (this.isGarbage) return;

        // --- 巨型僵尸死亡时特殊处理：移除玩家身上的毒圈减速 ---
        if (this.type.name === "巨型僵尸" && this.target && this.target.statusEffects && 
            this.target.statusEffects.slow && this.target.statusEffects.slow.source === this &&
            this.target.statusEffects.slow.isAuraEffect) {
            
            delete this.target.statusEffects.slow;
            // 恢复普通减速（如果有）或原速
            if (this.target._pendingNormalSlow) {
                this.target.statusEffects.slow = { ...this.target._pendingNormalSlow };
                this.target.speed = this.target.getStat('speed') * this.target._pendingNormalSlow.factor;
                delete this.target._pendingNormalSlow;
            } else if (this.target.getStat) { // 确保 getStat 方法存在
                this.target.speed = this.target.getStat('speed');
            }
            console.log("巨型僵尸死亡，移除了玩家的毒圈减速效果。Source check passed.");
        } else if (this.type.name === "巨型僵尸") {
            // 添加一些日志，帮助调试为什么没有移除减速
            console.log("巨型僵尸死亡，但未满足移除减速条件：");
            if (!this.target) console.log("- Boss没有目标 (this.target 为空)");
            if (this.target && !this.target.statusEffects) console.log("- 目标没有 statusEffects 属性");
            if (this.target && this.target.statusEffects && !this.target.statusEffects.slow) console.log("- 目标没有减速效果");
            if (this.target && this.target.statusEffects && this.target.statusEffects.slow && this.target.statusEffects.slow.source !== this) console.log("- 减速效果来源不是此Boss实例");
            if (this.target && this.target.statusEffects && this.target.statusEffects.slow && !this.target.statusEffects.slow.isAuraEffect) console.log("- 减速效果不是光环效果");
        }
        // --- 结束 巨型僵尸死亡特殊处理 ---

        // 通知BossManager处理Boss死亡
        if (bossManager && typeof bossManager.handleBossDeath === 'function') {
            bossManager.handleBossDeath(this, killer);
        } else if (window.handleBossDeath) {
            window.handleBossDeath(this, killer);
        } else {
            console.error("无法找到处理Boss死亡的方法！");
            // 掉落宝箱作为备选方案
            if (typeof Chest === 'function') {
                worldObjects.push(new Chest(this.x, this.y));
            }
        }

        // 调用父类的onDeath以处理通用逻辑
        super.onDeath(killer);
    }

    /**
     * 掉落Boss奖励
     */
    dropBossRewards() {
        // Boss必定掉落大量经验
        const xpValue = this.xpValue * 3; // Boss经验是普通经验的3倍
        for (let i = 0; i < 5; i++) {
            const offsetX = (Math.random() - 0.5) * this.size;
            const offsetY = (Math.random() - 0.5) * this.size;
            const gem = new ExperienceGem(this.x + offsetX, this.y + offsetY, Math.ceil(xpValue / 5));
            xpGems.push(gem);
        }

        // Boss必定掉落治疗物品
        for (let i = 0; i < 3; i++) {
            const offsetX = (Math.random() - 0.5) * this.size * 2;
            const offsetY = (Math.random() - 0.5) * this.size * 2;
            const pickup = new Pickup(this.x + offsetX, this.y + offsetY, EMOJI.HEART, 'heal', 30);
            pickup.lifetime = Infinity;
            worldObjects.push(pickup);
        }

        // 有概率掉落磁铁
        if (Math.random() < 0.8) { // 80%概率
            const pickup = new Pickup(this.x, this.y, EMOJI.MAGNET, 'magnet', 0);
            pickup.lifetime = Infinity;
            worldObjects.push(pickup);
        }
    }
} 