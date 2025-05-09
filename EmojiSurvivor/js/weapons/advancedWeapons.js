/**
 * 燃烧刀武器类
 * 发射燃烧刀攻击敌人，造成燃烧效果
 */
class FireBladeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "燃烧刀";
    static Emoji = "🔥";
    static MaxLevel = 8;
    static Evolution = {
        requires: "Candelabrador",
        evolvesTo: "InfernoSword"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(FireBladeWeapon.Name, FireBladeWeapon.Emoji, 1.2, FireBladeWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15 + (this.level - 1) * 4,
            projectileSpeed: 300 + (this.level - 1) * 20,
            cooldown: Math.max(0.2, this.baseCooldown - (this.level - 1) * 0.1),
            count: 1 + Math.floor((this.level - 1) / 3),
            pierce: 1 + Math.floor(this.level / 3),
            duration: 1.8,
            burnDamage: 3 + (this.level - 1) * 1.5,
            burnDuration: 2 + (this.level - 1) * 0.5
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        // 计算实际投射物数量（基础数量 + 加成）
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage;
        const pierce = this.stats.pierce;
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        const burnDamage = this.stats.burnDamage;
        const burnDuration = this.stats.burnDuration * (ownerStats.durationMultiplier || 1);
        // 获取目标敌人
        let target = owner.findNearestEnemy(GAME_WIDTH * 1.5) || {
            x: owner.x + owner.lastMoveDirection.x * 100,
            y: owner.y + owner.lastMoveDirection.y * 100
        };
        // 计算方向
        const dx = target.x - owner.x;
        const dy = target.y - owner.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
        const dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
        // 计算角度间隔
        const angleStep = count > 1 ? (Math.PI / 12) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);
        // 发射多个投射物
        for (let i = 0; i < count; i++) {
            // 计算角度
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            // 创建燃烧刀投射物
            const projectile = new FireBladeProjectile(
                owner.x,
                owner.y,
                size,
                vx,
                vy,
                damage,
                pierce,
                duration,
                ownerStats,
                burnDamage,
                burnDuration
            );
            // 添加到投射物列表
            projectiles.push(projectile);
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;
        if (this.level % 3 === 0) {
            desc += "+1 投射物。";
        } else if (this.level % 3 === 2) {
            desc += "+1 穿透。";
        } else {
            desc += "+伤害/燃烧效果。";
        }
        return desc + ` (冷却: ${Math.max(0.2, this.baseCooldown - this.level * 0.1).toFixed(2)}s)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射燃烧刀攻击敌人，造成燃烧效果。";
    }
}

/**
 * 燃烧刀投射物类
 * 燃烧刀的投射物
 */
class FireBladeProjectile extends Projectile {
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
     * @param {number} burnDamage - 燃烧伤害
     * @param {number} burnDuration - 燃烧持续时间
     */
    constructor(x, y, size, vx, vy, damage, pierce, duration, ownerStats, burnDamage, burnDuration) {
        super(x, y, "🔥", size, vx, vy, damage, pierce, duration, ownerStats);
        // 燃烧效果
        this.burnDamage = burnDamage;
        this.burnDuration = burnDuration;
        // 粒子效果
        this.particleTimer = 0;
        this.particleInterval = 0.05;
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 更新位置
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // 更新生命周期
        this.lifetime += dt;
        // 如果生命周期结束或穿透次数用尽，标记为垃圾
        if (this.lifetime >= this.duration || this.pierce < 0) {
            this.isGarbage = true;
            this.isActive = false;
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
                enemy.takeDamage(this.damage, player);
                // 添加燃烧效果
                this.applyBurnEffect(enemy);
                // 添加到已命中列表
                this.hitTargets.add(enemy);
                // 减少穿透次数
                this.pierce--;
                // 如果穿透次数用尽，标记为垃圾
                if (this.pierce < 0) {
                    this.isGarbage = true;
                    this.isActive = false;
                }
            }
        });
        // 更新粒子效果
        this.particleTimer -= dt;
        if (this.particleTimer <= 0) {
            // 创建火焰粒子
            this.createFireParticle();
            // 重置计时器
            this.particleTimer = this.particleInterval;
        }
    }

    /**
     * 应用燃烧效果
     * @param {Enemy} enemy - 敌人
     */
    applyBurnEffect(enemy) {
        // 如果敌人已有燃烧效果，更新持续时间
        if (enemy.statusEffects.burn) {
            enemy.statusEffects.burn.duration = Math.max(
                enemy.statusEffects.burn.duration,
                this.burnDuration
            );
            enemy.statusEffects.burn.damage = Math.max(
                enemy.statusEffects.burn.damage,
                this.burnDamage
            );
        } else {
            // 否则添加新的燃烧效果
            enemy.statusEffects.burn = {
                damage: this.burnDamage,
                duration: this.burnDuration,
                tick: 0.5,
                timer: 0,
                source: player
            };
        }
    }

    /**
     * 创建火焰粒子
     */
    createFireParticle() {
        // 创建火焰粒子
        const particle = {
            x: this.x,
            y: this.y,
            size: this.size * 0.5 * (0.7 + Math.random() * 0.3),
            lifetime: 0.3 + Math.random() * 0.2,
            timer: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新计时器
                this.timer += dt;
                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            draw: function(ctx) {
                if (this.isGarbage) return;
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                // 计算透明度
                const alpha = 0.7 * (1 - (this.timer / this.lifetime));
                // 计算大小
                const particleSize = this.size * (1 - (this.timer / this.lifetime));
                // 绘制火焰粒子
                ctx.fillStyle = `rgba(255, 100, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, particleSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        // 添加到视觉效果列表
        visualEffects.push(particle);
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果投射物不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            // 绘制发光效果
            const glowSize = this.size * 1.5;
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, glowSize / 2, 0, Math.PI * 2);
            ctx.fill();
            // 设置字体
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            // 设置对齐方式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // 绘制表情符号
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        } catch (e) {
            console.error("绘制燃烧刀投射物时出错:", e);
        }
    }
}

/**
 * 岚刀武器类
 * 发射岚刀攻击敌人，可以连续切割
 */
class StormBladeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "岚刀";
    static Emoji = "⚡";
    static MaxLevel = 8;
    static Evolution = {
        requires: "Wings",
        evolvesTo: "ThunderSword"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(StormBladeWeapon.Name, StormBladeWeapon.Emoji, 1.5, StormBladeWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 18 + (this.level - 1) * 5,
            projectileSpeed: 400 + (this.level - 1) * 25,
            cooldown: Math.max(0.3, this.baseCooldown - (this.level - 1) * 0.12),
            count: 1 + Math.floor((this.level - 1) / 3),
            chainCount: 2 + Math.floor((this.level - 1) / 2),
            chainRange: 150 + (this.level - 1) * 20,
            duration: 1.2
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        // 计算实际投射物数量（基础数量 + 加成）
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage;
        const chainCount = this.stats.chainCount;
        const chainRange = this.stats.chainRange * (ownerStats.areaMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        // 获取目标敌人
        let target = owner.findNearestEnemy(GAME_WIDTH * 1.5) || {
            x: owner.x + owner.lastMoveDirection.x * 100,
            y: owner.y + owner.lastMoveDirection.y * 100
        };
        // 计算方向
        const dx = target.x - owner.x;
        const dy = target.y - owner.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
        const dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
        // 计算角度间隔
        const angleStep = count > 1 ? (Math.PI / 10) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);
        // 发射多个投射物
        for (let i = 0; i < count; i++) {
            // 计算角度
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            // 创建岚刀投射物
            const projectile = new StormBladeProjectile(
                owner.x,
                owner.y,
                size,
                vx,
                vy,
                damage,
                duration,
                ownerStats,
                chainCount,
                chainRange
            );
            // 添加到投射物列表
            projectiles.push(projectile);
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;
        if (this.level % 3 === 0) {
            desc += "+1 投射物。";
        } else if (this.level % 2 === 0) {
            desc += "+1 连锁次数。";
        } else {
            desc += "+伤害/连锁范围。";
        }
        return desc + ` (冷却: ${Math.max(0.3, this.baseCooldown - this.level * 0.12).toFixed(2)}s)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射岚刀攻击敌人，可以连续切割多个敌人。";
    }
}

/**
 * 岚刀投射物类
 * 岚刀的投射物
 */
class StormBladeProjectile extends Projectile {
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
     * @param {number} chainCount - 连锁次数
     * @param {number} chainRange - 连锁范围
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, chainCount, chainRange) {
        super(x, y, "⚡", size, vx, vy, damage, 1, duration, ownerStats);
        // 连锁属性
        this.chainCount = chainCount;
        this.chainRange = chainRange;
        this.chainingNow = false;
        // 粒子效果
        this.particleTimer = 0;
        this.particleInterval = 0.05;
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 如果正在连锁，不更新位置
        if (!this.chainingNow) {
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        // 更新生命周期
        this.lifetime += dt;
        // 如果生命周期结束，标记为垃圾
        if (this.lifetime >= this.duration) {
            this.isGarbage = true;
            this.isActive = false;
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
                enemy.takeDamage(this.damage, player);
                // 添加到已命中列表
                this.hitTargets.add(enemy);
                // 如果还有连锁次数，寻找下一个目标
                if (this.chainCount > 0) {
                    this.chainToNextTarget(enemy);
                } else {
                    // 否则标记为垃圾
                    this.isGarbage = true;
                    this.isActive = false;
                }
            }
        });
        // 更新粒子效果
        this.particleTimer -= dt;
        if (this.particleTimer <= 0) {
            // 创建闪电粒子
            this.createLightningParticle();
            // 重置计时器
            this.particleTimer = this.particleInterval;
        }
    }

    /**
     * 连锁到下一个目标
     * @param {Enemy} currentTarget - 当前目标
     */
    chainToNextTarget(currentTarget) {
        // 标记为正在连锁
        this.chainingNow = true;
        // 寻找范围内的下一个目标
        let nextTarget = null;
        let minDist = this.chainRange;
        enemies.forEach(enemy => {
            // 跳过已命中的敌人
            if (enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
            // 计算距离
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 如果在范围内且距离更近，更新下一个目标
            if (dist < minDist) {
                minDist = dist;
                nextTarget = enemy;
            }
        });
        // 如果找到下一个目标，创建连锁效果并移动到目标位置
        if (nextTarget) {
            // 创建连锁效果
            this.createChainEffect(currentTarget, nextTarget);
            // 减少连锁次数
            this.chainCount--;
            // 移动到目标位置
            this.x = nextTarget.x;
            this.y = nextTarget.y;
            // 标记为不再连锁
            this.chainingNow = false;
        } else {
            // 如果没有找到下一个目标，标记为垃圾
            this.isGarbage = true;
            this.isActive = false;
        }
    }

    /**
     * 创建连锁效果
     * @param {Enemy} from - 起始敌人
     * @param {Enemy} to - 目标敌人
     */
    createChainEffect(from, to) {
        // 创建连锁效果
        const effect = {
            fromX: from.x,
            fromY: from.y,
            toX: to.x,
            toY: to.y,
            lifetime: 0.2,
            timer: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新计时器
                this.timer += dt;
                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            draw: function(ctx) {
                if (this.isGarbage) return;
                // 获取屏幕坐标
                const fromPos = cameraManager.worldToScreen(this.fromX, this.fromY);
                const toPos = cameraManager.worldToScreen(this.toX, this.toY);
                // 计算透明度
                const alpha = 0.8 * (1 - (this.timer / this.lifetime));
                // 绘制闪电效果
                ctx.strokeStyle = `rgba(100, 100, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y);
                // 绘制锯齿状闪电
                const segments = 5;
                const dx = (toPos.x - fromPos.x) / segments;
                const dy = (toPos.y - fromPos.y) / segments;
                for (let i = 1; i < segments; i++) {
                    const x = fromPos.x + dx * i;
                    const y = fromPos.y + dy * i;
                    const offset = (Math.random() - 0.5) * 20;
                    ctx.lineTo(x + offset, y + offset);
                }
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();
            }
        };
        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 创建闪电粒子
     */
    createLightningParticle() {
        // 创建闪电粒子
        const particle = {
            x: this.x,
            y: this.y,
            size: this.size * 0.5 * (0.7 + Math.random() * 0.3),
            lifetime: 0.2 + Math.random() * 0.1,
            timer: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新计时器
                this.timer += dt;
                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            draw: function(ctx) {
                if (this.isGarbage) return;
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                // 计算透明度
                const alpha = 0.7 * (1 - (this.timer / this.lifetime));
                // 计算大小
                const particleSize = this.size * (1 - (this.timer / this.lifetime));
                // 绘制闪电粒子
                ctx.fillStyle = `rgba(100, 100, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, particleSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        // 添加到视觉效果列表
        visualEffects.push(particle);
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果投射物不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            // 绘制发光效果
            const glowSize = this.size * 1.5;
            ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, glowSize / 2, 0, Math.PI * 2);
            ctx.fill();
            // 设置字体
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            // 设置对齐方式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // 绘制表情符号
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        } catch (e) {
            console.error("绘制岚刀投射物时出错:", e);
        }
    }
}

/**
 * 握握手武器类
 * 发射握手攻击敌人，造成眩晕效果
 */
class HandshakeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "握握手";
    static Emoji = "🤝";
    static MaxLevel = 8;
    static Evolution = {
        requires: "Spinach",
        evolvesTo: "DeathGrip"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(HandshakeWeapon.Name, HandshakeWeapon.Emoji, 2.0, HandshakeWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 25 + (this.level - 1) * 8,
            projectileSpeed: 250 + (this.level - 1) * 15,
            cooldown: Math.max(0.5, this.baseCooldown - (this.level - 1) * 0.15),
            count: 1 + Math.floor((this.level - 1) / 4),
            area: 80 + (this.level - 1) * 15,
            stunDuration: 1.0 + (this.level - 1) * 0.2,
            duration: 1.5
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        // 计算实际投射物数量（基础数量 + 加成）
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage;
        const area = this.stats.area * (ownerStats.areaMultiplier || 1);
        const stunDuration = this.stats.stunDuration * (ownerStats.durationMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * 1.2 * (ownerStats.areaMultiplier || 1);
        // 获取目标敌人列表
        const targets = [];
        for (let i = 0; i < count; i++) {
            // 寻找随机敌人
            const target = owner.findRandomEnemy(GAME_WIDTH * 1.5);
            // 如果找到目标，添加到目标列表
            if (target) {
                targets.push(target);
            } else {
                // 如果没有找到目标，创建一个随机方向
                const angle = Math.random() * Math.PI * 2;
                const distance = 200 + Math.random() * 100;
                targets.push({
                    x: owner.x + Math.cos(angle) * distance,
                    y: owner.y + Math.sin(angle) * distance
                });
            }
        }
        // 为每个目标创建握手投射物
        targets.forEach(target => {
            // 计算方向
            const dx = target.x - owner.x;
            const dy = target.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const dirX = dist > 0 ? dx / dist : Math.cos(Math.random() * Math.PI * 2);
            const dirY = dist > 0 ? dy / dist : Math.sin(Math.random() * Math.PI * 2);
            // 计算速度
            const vx = dirX * speed;
            const vy = dirY * speed;
            // 创建握手投射物
            const projectile = new HandshakeProjectile(
                owner.x,
                owner.y,
                size,
                vx,
                vy,
                damage,
                duration,
                ownerStats,
                area,
                stunDuration
            );
            // 添加到投射物列表
            projectiles.push(projectile);
        });
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;
        if (this.level % 4 === 0) {
            desc += "+1 投射物。";
        } else {
            desc += "+伤害/范围/眩晕时间。";
        }
        return desc + ` (冷却: ${Math.max(0.5, this.baseCooldown - this.level * 0.15).toFixed(2)}s)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射握手攻击敌人，造成范围伤害和眩晕效果。";
    }
}

/**
 * 握手投射物类
 * 握手的投射物
 */
class HandshakeProjectile extends Projectile {
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
     * @param {number} area - 范围
     * @param {number} stunDuration - 眩晕持续时间
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, area, stunDuration) {
        super(x, y, "🤝", size, vx, vy, damage, 0, duration, ownerStats);
        // 范围和眩晕
        this.area = area;
        this.stunDuration = stunDuration;
        this.exploded = false;
        // 旋转
        this.rotation = Math.atan2(vy, vx);
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 如果已爆炸，不更新位置
        if (!this.exploded) {
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        // 更新生命周期
        this.lifetime += dt;
        // 如果生命周期结束，标记为垃圾
        if (this.lifetime >= this.duration) {
            this.isGarbage = true;
            this.isActive = false;
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
        if (!this.exploded) {
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
        // 标记为已爆炸
        this.exploded = true;
        // 创建爆炸效果
        this.createExplosionEffect();
        // 对范围内的敌人造成伤害
        enemies.forEach(enemy => {
            // 跳过已标记为垃圾的敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            // 计算距离
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            // 如果在范围内，造成伤害
            if (distSq <= this.area * this.area) {
                // 造成伤害
                enemy.takeDamage(this.damage, player);
                // 添加眩晕效果
                this.applyStunEffect(enemy);
                // 添加到已命中列表
                this.hitTargets.add(enemy);
            }
        });
        // 标记为垃圾
        this.isGarbage = true;
        this.isActive = false;
    }

    /**
     * 应用眩晕效果
     * @param {Enemy} enemy - 敌人
     */
    applyStunEffect(enemy) {
        // 如果敌人已有眩晕效果，更新持续时间
        if (enemy.statusEffects.stun) {
            enemy.statusEffects.stun.duration = Math.max(
                enemy.statusEffects.stun.duration,
                this.stunDuration
            );
        } else {
            // 否则添加新的眩晕效果
            enemy.statusEffects.stun = {
                duration: this.stunDuration,
                source: player
            };
        }
    }

    /**
     * 创建爆炸效果
     */
    createExplosionEffect() {
        // 创建爆炸效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.area,
            lifetime: 0.5,
            timer: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新计时器
                this.timer += dt;
                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.lifetime) {
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
                const alpha = 0.5 * (1 - (this.timer / this.lifetime));
                // 绘制爆炸效果
                ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                // 绘制边框
                ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 1.5})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
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
        // 如果投射物不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            // 保存上下文
            ctx.save();
            // 平移到投射物位置
            ctx.translate(screenPos.x, screenPos.y);
            // 旋转
            ctx.rotate(this.rotation);
            // 设置字体
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            // 设置对齐方式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // 绘制表情符号
            ctx.fillText(this.emoji, 0, 0);
            // 恢复上下文
            ctx.restore();
        } catch (e) {
            console.error("绘制握手投射物时出错:", e);
        }
    }
}