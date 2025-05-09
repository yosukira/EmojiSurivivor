/**
 * 进化武器
 * 包含所有进化后的武器
 */

/**
 * 千刃武器类
 * 匕首的进化武器，发射大量匕首
 */
class ThousandKnives extends DaggerWeapon {
    /**
     * 静态属性
     */
    static Name = "千刃";
    static Emoji = EMOJI.WEAPON_KNIVES;
    static MaxLevel = 8;

    /**
     * 构造函数
     * @param {DaggerWeapon} baseWeapon - 基础武器
     */
    constructor(baseWeapon) {
        super();
        this.name = ThousandKnives.Name;
        this.emoji = ThousandKnives.Emoji;
        this.level = baseWeapon.level;
        this.maxLevel = ThousandKnives.MaxLevel;
        this.isEvolved = true;
        this.baseCooldown = 0.1;
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 22 + (this.level - 1) * 4,
            projectileSpeed: 550 + (this.level - 1) * 20,
            cooldown: Math.max(0.1, this.baseCooldown - (this.level - 1) * 0.01),
            count: 6 + Math.floor((this.level - 1) / 2),
            pierce: 4 + Math.floor(this.level / 2),
            duration: 1.1
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +伤害/数量/穿透。`;
    }
}

/**
 * 灵魂吞噬者武器类
 * 大蒜的进化武器，创建一个吸引敌人的光环
 */
class SoulEater extends GarlicWeapon {
    /**
     * 静态属性
     */
    static Name = "灵魂吞噬者";
    static Emoji = EMOJI.WEAPON_SOUL_EATER;
    static MaxLevel = 8;

    /**
     * 构造函数
     * @param {GarlicWeapon} baseWeapon - 基础武器
     */
    constructor(baseWeapon) {
        super();
        this.name = SoulEater.Name;
        this.emoji = SoulEater.Emoji;
        this.level = baseWeapon.level;
        this.maxLevel = SoulEater.MaxLevel;
        this.isEvolved = true;
        this.baseCooldown = 0.8;
        this.damageTickInterval = 0.25;
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 8 + (this.level - 1) * 2,
            area: 90 + (this.level - 1) * 15,
            knockback: -10 - (this.level - 1) * 2, // 负值表示吸引而不是击退
            cooldown: 0.8,
            lifeSteal: 0.1 + (this.level - 1) * 0.02 // 生命偷取
        };
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 更新伤害计时器
        this.damageTickTimer -= dt;

        // 如果计时器结束，造成伤害
        if (this.damageTickTimer <= 0) {
            // 获取拥有者属性
            const ownerStats = this.getOwnerStats(owner);

            // 计算实际范围
            const radius = this.stats.area * (ownerStats.areaMultiplier || 1);
            const radiusSq = radius * radius;

            // 获取伤害和吸引力
            const damage = this.stats.damage;
            const knockback = this.stats.knockback;

            // 生命偷取总量
            let totalLifeSteal = 0;
            // 对范围内的敌人造成伤害
            enemies.forEach(enemy => {
                if (enemy.isGarbage || !enemy.isActive) return;

                // 计算距离
                const dx = owner.x - enemy.x;
                const dy = owner.y - enemy.y;
                const distSq = dx * dx + dy * dy;

                // 如果在范围内，造成伤害
                if (distSq <= radiusSq) {
                    // 造成伤害
                    const actualDamage = damage * (ownerStats.damageMultiplier || 1);
                    enemy.takeDamage(actualDamage, owner);

                    // 累计生命偷取
                    totalLifeSteal += actualDamage * this.stats.lifeSteal;

                    // 应用吸引力
                    if (knockback < 0 && distSq > 1) {
                        const dist = Math.sqrt(distSq);

                        // 吸引力随距离衰减
                        const pullFactor = knockback * (1 - dist / radius);

                        // 计算吸引方向和距离
                        const pullX = (enemy.x - owner.x) / dist * pullFactor * dt * 18;
                        const pullY = (enemy.y - owner.y) / dist * pullFactor * dt * 18;

                        // 应用吸引
                        enemy.x += pullX;
                        enemy.y += pullY;
                    }
                }
            });

            // 应用生命偷取
            if (totalLifeSteal > 0) {
                owner.heal(totalLifeSteal);
                // 创建治疗特效
                spawnDamageNumber(owner.x, owner.y - owner.size / 2, `+${Math.ceil(totalLifeSteal)}`, 20, 'green', 0.8);
            }

            // 重置计时器
            this.damageTickTimer += this.damageTickInterval;
        }

        // 更新光环半径
        this.auraRadius = this.stats.area * (this.getOwnerStats(owner).areaMultiplier || 1);
    }

    /**
     * 绘制光环
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Player} owner - 拥有者
     */
    drawAura(ctx, owner) {
        if (this.auraRadius <= 0) return;

        // 绘制光环
        const gradient = ctx.createRadialGradient(
            owner.x, owner.y, 0,
            owner.x, owner.y, this.auraRadius
        );

        gradient.addColorStop(0, 'rgba(100, 0, 100, 0.2)');
        gradient.addColorStop(0.7, 'rgba(100, 0, 100, 0.1)');
        gradient.addColorStop(1, 'rgba(100, 0, 100, 0.0)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(owner.x, owner.y, this.auraRadius, 0, Math.PI * 2);
        ctx.fill();

        // 绘制灵魂粒子
        if (Math.random() < 0.2) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.auraRadius;
            const x = owner.x + Math.cos(angle) * distance;
            const y = owner.y + Math.sin(angle) * distance;

            const soul = {
                x: x,
                y: y,
                targetX: owner.x,
                targetY: owner.y,
                size: GAME_FONT_SIZE * 0.5,
                lifetime: 0.8,
                timer: 0,
                isGarbage: false,

                update: function(dt) {
                    this.timer += dt;
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }

                    // 向玩家移动
                    const progress = this.timer / this.lifetime;
                    this.x = this.x + (this.targetX - this.x) * progress * dt * 5;
                    this.y = this.y + (this.targetY - this.y) * progress * dt * 5;
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    const alpha = 1 - (this.timer / this.lifetime);

                    ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.globalAlpha = alpha;
                    ctx.fillText('👻', this.x, this.y);
                    ctx.globalAlpha = 1.0;
                }
            };

            visualEffects.push(soul);
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +伤害/范围/生命偷取。`;
    }
}

/**
 * 血泪 - 鞭子的进化武器
 * 由鞭子和空虚之心进化而来
 * 发射血色鞭子，造成更大范围的伤害
 */
class BloodyTear extends WhipWeapon {
    static Name = "血泪";
    static Emoji = EMOJI.WEAPON_BLOODY_TEAR;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {WhipWeapon} baseWeapon - 基础鞭子武器
     */
    constructor(baseWeapon) {
        super();
        this.name = BloodyTear.Name;
        this.emoji = BloodyTear.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = baseWeapon.maxLevel;
        this.isEvolved = true;
        this.whipHitboxes = [];
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 45,
            cooldown: 0.5,
            area: 180,
            count: 4,
            pierce: Infinity,
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 武器拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const area = this.stats.area * (ownerStats.areaMultiplier || 1);
        const count = this.stats.count + Math.floor((ownerStats.projectileCountBonus || 0) / 2);
        const width = 35 * (ownerStats.areaMultiplier || 1);
        // 创建多个鞭子攻击（围绕玩家）
        for (let i = 0; i < count; i++) {
            // 计算每个鞭子的角度
            const angle = (i * Math.PI * 2 / count) + (gameTime % 2) * Math.PI; // 旋转效果
            // 计算鞭子的位置
            const hitX = owner.x + Math.cos(angle) * (area / 2);
            const hitY = owner.y + Math.sin(angle) * (area / 2);
            // 创建鞭子碰撞箱
            const hitbox = {
                x: hitX,
                y: hitY,
                width: area,
                height: width,
                angle: angle,
                damage: damage,
                ownerStats: ownerStats,
                lifetime: 0.3,
                hitTargets: new Set(),
                isGarbage: false,
                // 更新鞭子状态
                update: function(dt) {
                    this.lifetime -= dt;
                    if (this.lifetime <= 0) {
                        this.isGarbage = true;
                        return;
                    }
                    // 检测与敌人的碰撞
                    enemies.forEach(enemy => {
                        if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) {
                            return;
                        }
                        // 旋转碰撞检测
                        const relX = enemy.x - this.x;
                        const relY = enemy.y - this.y;
                        // 将敌人坐标旋转到鞭子的坐标系
                        const rotatedX = relX * Math.cos(-this.angle) - relY * Math.sin(-this.angle);
                        const rotatedY = relX * Math.sin(-this.angle) + relY * Math.cos(-this.angle);
                        // 矩形碰撞检测
                        const halfWidth = this.width / 2;
                        const halfHeight = this.height / 2;
                        const enemyHalfSize = enemy.size / 2;
                        if (
                            rotatedX > -halfWidth - enemyHalfSize &&
                            rotatedX < halfWidth + enemyHalfSize &&
                            rotatedY > -halfHeight - enemyHalfSize &&
                            rotatedY < halfHeight + enemyHalfSize
                        ) {
                            // 造成伤害
                            enemy.takeDamage(this.damage, owner);
                            // 记录已命中的敌人
                            this.hitTargets.add(enemy);
                            // 添加流血效果
                            if (!enemy.statusEffects) {
                                enemy.statusEffects = {};
                            }
                            // 设置流血效果
                            enemy.statusEffects.bleed = {
                                damage: this.damage * 0.2,
                                duration: 3.0,
                                tick: 0.5,
                                timer: 0,
                                source: owner
                            };
                        }
                    });
                },
                // 绘制鞭子
                draw: function(ctx) {
                    if (!this.isGarbage) {
                        ctx.save();
                        ctx.translate(this.x, this.y);
                        ctx.rotate(this.angle);
                        ctx.fillStyle = 'rgba(200, 0, 0, 0.4)'; // 血色
                        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                        ctx.restore();
                    }
                }
            };
            // 添加到鞭子列表
            this.whipHitboxes.push(hitbox);
        }
    }

    /**
     * 获取当前升级选项
     * @returns {Array} 升级选项数组
     */
    getCurrentUpgradeOptions() {
        return []; // 进化武器无法升级
    }

    /**
     * 获取基础升级选项
     * @returns {Array} 升级选项数组
     */
    getBaseUpgradeOptions() {
        return []; // 进化武器无法作为基础选项
    }
}

/**
 * 地狱火 - 燃烧刀的进化武器
 * 由燃烧刀和烛台进化而来
 * 发射大量火焰，造成范围伤害
 */
class Inferno extends FireDaggerWeapon {
    static Name = "地狱火";
    static Emoji = EMOJI.WEAPON_INFERNO;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {FireDaggerWeapon} baseWeapon - 基础燃烧刀武器
     */
    constructor(baseWeapon) {
        super();
        this.name = Inferno.Name;
        this.emoji = Inferno.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = baseWeapon.maxLevel;
        this.isEvolved = true;
        this.baseCooldown = 0.2;
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15,
            projectileSpeed: 400,
            cooldown: this.baseCooldown,
            count: 8,
            pierce: 3,
            duration: 1.0,
            burnDamage: 8,
            burnDuration: 3.0,
            explosionRadius: 80,
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 武器拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        // 计算实际投射物数量（基础数量 + 加成）
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const pierce = this.stats.pierce;
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        const burnDamage = this.stats.burnDamage * (ownerStats.damageMultiplier || 1);
        const burnDuration = this.stats.burnDuration * (ownerStats.durationMultiplier || 1);
        const explosionRadius = this.stats.explosionRadius * (ownerStats.areaMultiplier || 1);
        // 发射多个投射物，围绕玩家
        const angleStep = Math.PI * 2 / count;
        for (let i = 0; i < count; i++) {
            const angle = i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            // 使用对象池生成弹射物
            const projectile = spawnProjectile(
                owner.x,
                owner.y,
                EMOJI.PROJECTILE_FIRE,
                size,
                vx,
                vy,
                damage,
                pierce,
                duration,
                ownerStats
            );
            // 添加燃烧和爆炸效果
            if (projectile) {
                projectile.burnDamage = burnDamage;
                projectile.burnDuration = burnDuration;
                projectile.burnTick = 0.5;
                projectile.explosionRadius = explosionRadius;
                // 重写命中处理
                const originalOnHit = projectile.onHit || function() {};
                projectile.onHit = function(enemy, owner) {
                    // 调用原始命中处理
                    originalOnHit.call(this, enemy, owner);
                    // 添加燃烧效果
                    if (!enemy.isGarbage && enemy.isActive) {
                        if (!enemy.statusEffects) {
                            enemy.statusEffects = {};
                        }
                        // 设置或刷新燃烧效果
                        enemy.statusEffects.burn = {
                            damage: this.burnDamage,
                            duration: this.burnDuration,
                            tick: this.burnTick,
                            timer: 0,
                            source: owner
                        };
                    }
                };
                // 重写销毁处理
                const originalOnDestroy = projectile.onDestroy || function() {};
                projectile.onDestroy = function(owner) {
                    // 调用原始销毁处理
                    originalOnDestroy.call(this, owner);
                    // 创建爆炸效果
                    const explosionRadius = this.explosionRadius;
                    const explosionDamage = this.damage * 0.7;
                    // 对范围内的敌人造成伤害
                    enemies.forEach(enemy => {
                        if (enemy.isGarbage || !enemy.isActive) return;
                        const dx = enemy.x - this.x;
                        const dy = enemy.y - this.y;
                        const distSq = dx * dx + dy * dy;
                        if (distSq <= explosionRadius * explosionRadius) {
                            // 计算伤害衰减
                            const dist = Math.sqrt(distSq);
                            const damageFactor = 1 - (dist / explosionRadius);
                            const actualDamage = explosionDamage * damageFactor;
                            // 造成伤害
                            enemy.takeDamage(actualDamage, owner);
                            // 添加燃烧效果
                            if (!enemy.statusEffects) {
                                enemy.statusEffects = {};
                            }
                            // 设置或刷新燃烧效果
                            enemy.statusEffects.burn = {
                                damage: this.burnDamage * 0.5,
                                duration: this.burnDuration * 0.7,
                                tick: this.burnTick,
                                timer: 0,
                                source: owner
                            };
                        }
                    });
                    // 创建爆炸视觉效果
                    createExplosionEffect(this.x, this.y, explosionRadius);
                };
            }
        }
    }

    /**
     * 获取当前升级选项
     * @returns {Array} 升级选项数组
     */
    getCurrentUpgradeOptions() {
        return []; // 进化武器无法升级
    }

    /**
     * 获取基础升级选项
     * @returns {Array} 升级选项数组
     */
    getBaseUpgradeOptions() {
        return []; // 进化武器无法作为基础选项
    }
}

/**
 * 闪电风暴 - 岚刀的进化武器
 * 由岚刀和空白之书进化而来
 * 发射强大的闪电，可以连锁更多目标
 */
class Lightning extends StormBladeWeapon {
    static Name = "闪电风暴";
    static Emoji = EMOJI.WEAPON_LIGHTNING;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {StormBladeWeapon} baseWeapon - 基础岚刀武器
     */
    constructor(baseWeapon) {
        super();
        this.name = Lightning.Name;
        this.emoji = Lightning.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = baseWeapon.maxLevel;
        this.isEvolved = true;
        this.lightningEffects = [];
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 35,
            cooldown: 0.3,
            chainCount: 6,
            chainRange: 200,
            attackCount: 3,
        };
    }

    /**
     * 获取当前升级选项
     * @returns {Array} 升级选项数组
     */
    getCurrentUpgradeOptions() {
        return []; // 进化武器无法升级
    }

    /**
     * 获取基础升级选项
     * @returns {Array} 升级选项数组
     */
    getBaseUpgradeOptions() {
        return []; // 进化武器无法作为基础选项
    }
}

/**
 * 击掌 - 握握手的进化武器
 * 由握握手和翅膀进化而来
 * 发射更大的手掌，造成范围伤害
 */
class HighFive extends HandshakeWeapon {
    static Name = "击掌";
    static Emoji = EMOJI.WEAPON_HIGH_FIVE;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {HandshakeWeapon} baseWeapon - 基础握握手武器
     */
    constructor(baseWeapon) {
        super();
        this.name = HighFive.Name;
        this.emoji = HighFive.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = baseWeapon.maxLevel;
        this.isEvolved = true;
        this.baseCooldown = 0.2;
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 40,
            projectileSpeed: 350,
            cooldown: this.baseCooldown,
            count: 5,
            knockback: 30,
            size: 1.8,
            duration: 1.0,
            explosionRadius: 100,
        };
    }

    /**
     * 生成手掌投射物
     * @param {Player} owner - 武器拥有者
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} knockback - 击退力度
     * @param {number} duration - 持续时间
     * @param {number} size - 大小
     * @param {Object} ownerStats - 拥有者属性
     */
    spawnHand(owner, x, y, vx, vy, damage, knockback, duration, size, ownerStats) {
        // 使用对象池生成弹射物
        const projectile = spawnProjectile(
            x,
            y,
            EMOJI.PROJECTILE_HANDSHAKE,
            size,
            vx,
            vy,
            damage,
            1, // 只能命中一个敌人
            duration,
            ownerStats
        );
        // 添加击退和爆炸效果
        if (projectile) {
            projectile.knockback = knockback;
            projectile.explosionRadius = this.stats.explosionRadius * (ownerStats.areaMultiplier || 1);
            // 重写命中处理
            const originalOnHit = projectile.onHit || function() {};
            projectile.onHit = function(enemy, owner) {
                // 调用原始命中处理
                originalOnHit.call(this, enemy, owner);
                // 应用击退效果
                if (!enemy.isGarbage && enemy.isActive) {
                    // 计算击退方向和距离
                    const knockbackX = this.vx / Math.sqrt(this.vx * this.vx + this.vy * this.vy) * this.knockback;
                    const knockbackY = this.vy / Math.sqrt(this.vx * this.vx + this.vy * this.vy) * this.knockback;
                    // 应用击退
                    enemy.x += knockbackX;
                    enemy.y += knockbackY;
                    // 添加眩晕效果
                    if (!enemy.statusEffects) {
                        enemy.statusEffects = {};
                    }
                    // 设置眩晕效果
                    enemy.statusEffects.stun = {
                        duration: 1.0, // 眩晕1秒
                        timer: 0,
                        source: owner
                    };
                }
                // 创建爆炸效果
                this.onDestroy(owner);
                this.isGarbage = true;
                this.isActive = false;
            };
            // 重写销毁处理
            projectile.onDestroy = function(owner) {
                // 创建爆炸效果
                const explosionRadius = this.explosionRadius;
                const explosionDamage = this.damage * 0.8;
                // 对范围内的敌人造成伤害
                enemies.forEach(enemy => {
                    if (enemy.isGarbage || !enemy.isActive) return;
                    const dx = enemy.x - this.x;
                    const dy = enemy.y - this.y;
                    const distSq = dx * dx + dy * dy;
                    if (distSq <= explosionRadius * explosionRadius) {
                        // 计算伤害衰减
                        const dist = Math.sqrt(distSq);
                        const damageFactor = 1 - (dist / explosionRadius);
                        const actualDamage = explosionDamage * damageFactor;
                        // 造成伤害
                        enemy.takeDamage(actualDamage, owner);
                        // 应用击退效果
                        const knockbackFactor = this.knockback * 0.5 * damageFactor;
                        const knockbackX = dx / dist * knockbackFactor;
                        const knockbackY = dy / dist * knockbackFactor;
                        // 应用击退
                        enemy.x += knockbackX;
                        enemy.y += knockbackY;
                    }
                });
                // 创建爆炸视觉效果
                createExplosionEffect(this.x, this.y, explosionRadius, 'rgba(255, 255, 255, 0.7)');
            };
            // 添加旋转效果
            projectile.rotation = 0;
            projectile.rotationSpeed = (Math.random() * 2 - 1) * Math.PI * 4; // 更快的旋转速度
            // 重写绘制方法
            projectile.draw = function(ctx) {
                if (this.isGarbage || !this.isActive) return;
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                try {
                    ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(this.emoji, 0, 0);
                    // 添加光晕效果
                    ctx.globalAlpha = 0.3;
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(0, 0, this.size * 0.6, 0, Math.PI * 2);
                    ctx.fill();
                } catch (e) {
                    console.error("绘制击掌时出错:", e);
                    ctx.fillStyle = 'magenta';
                    ctx.fillRect(-this.size/4, -this.size/4, this.size/2, this.size/2);
                }
                ctx.restore();
            };
            // 重写更新方法
            const originalUpdate = projectile.update || function() {};
            projectile.update = function(dt) {
                // 调用原始更新方法
                originalUpdate.call(this, dt);
                // 更新旋转
                this.rotation += this.rotationSpeed * dt;
            };
        }
    }

    /**
     * 获取当前升级选项
     * @returns {Array} 升级选项数组
     */
    getCurrentUpgradeOptions() {
        return []; // 进化武器无法升级
    }

    /**
     * 获取基础升级选项
     * @returns {Array} 升级选项数组
     */
    getBaseUpgradeOptions() {
        return []; // 进化武器无法作为基础选项
    }
}

/**
 * 创建爆炸视觉效果
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} radius - 爆炸半径
 * @param {string} color - 爆炸颜色
 */
function createExplosionEffect(x, y, radius, color = 'rgba(255, 100, 0, 0.7)') {
    // 创建爆炸特效对象
    const explosion = {
        x: x,
        y: y,
        radius: radius,
        color: color,
        lifetime: 0.5,
        timer: 0,
        isGarbage: false,
        update: function(dt) {
            this.timer += dt;
            if (this.timer >= this.lifetime) {
                this.isGarbage = true;
            }
        },
        draw: function(ctx) {
            if (this.isGarbage) return;
            const progress = this.timer / this.lifetime;
            const currentRadius = this.radius * progress;
            const alpha = 1 - progress;
            ctx.beginPath();
            ctx.arc(this.x, this.y, currentRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgba', 'rgba');
            ctx.fill();
        }
    };
    // 添加到特效列表
    visualEffects.push(explosion);
}
