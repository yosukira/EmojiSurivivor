/**
 * 角色基类
 * 所有角色的基础类
 */
class Character extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {number} size - 大小
     * @param {Object} stats - 属性
     */
    constructor(x, y, emoji, size, stats) {
        // 调用父类构造函数
        super(x, y, emoji, size);

        // 属性
        this.stats = { ...stats };

        // 生命值
        this.health = stats.health;
        // 速度
        this.speed = stats.speed;
        // 伤害
        this.damage = stats.damage || 0;
        // 经验值
        this.xpValue = stats.xp || 0;
        // 状态效果
        this.statusEffects = {
            burn: null,
            slow: null,
            stun: null
        };

        // 无敌时间
        this.invincibleTime = 0;
    }

    /**
     * 更新角色状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果角色不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;

        // 更新无敌时间
        if (this.invincibleTime > 0) {
            this.invincibleTime -= dt;
        }
        // 更新状态效果
        this.updateStatusEffects(dt);
    }

    /**
     * 更新状态效果
     * @param {number} dt - 时间增量
     */
    updateStatusEffects(dt) {
        // 更新燃烧效果
        if (this.statusEffects.burn) {
            // 减少持续时间
            this.statusEffects.burn.duration -= dt;

            // 更新计时器
            this.statusEffects.burn.timer -= dt;

            // 如果计时器结束，造成伤害
            if (this.statusEffects.burn.timer <= 0) {
                // 造成伤害
                this.takeDamage(this.statusEffects.burn.damage, this.statusEffects.burn.source);
                // 重置计时器
                this.statusEffects.burn.timer = 0.5;
            }

            // 如果持续时间结束，清除效果
            if (this.statusEffects.burn.duration <= 0) {
                this.statusEffects.burn = null;
            }
        }
        // 更新减速效果
        if (this.statusEffects.slow) {
            // 减少持续时间
            this.statusEffects.slow.duration -= dt;

            // 如果持续时间结束，清除效果
            if (this.statusEffects.slow.duration <= 0) {
                this.statusEffects.slow = null;
            }
        }

        // 更新眩晕效果
        if (this.statusEffects.stun) {
            // 减少持续时间
            this.statusEffects.stun.duration -= dt;

            // 如果持续时间结束，清除效果
            if (this.statusEffects.stun.duration <= 0) {
                this.statusEffects.stun = null;
            }
        }
    }

    /**
     * 受到伤害
     * @param {number} amount - 伤害量
     * @param {GameObject} source - 伤害来源
     * @returns {boolean} 是否死亡
     */
    takeDamage(amount, source) {
        // 如果无敌，不受伤害
        if (this.invincibleTime > 0) return false;
        // 计算实际伤害
        const actualDamage = Math.max(1, Math.floor(amount - (this.stats.armor || 0)));
        // 减少生命值
        this.health -= actualDamage;
        // 创建伤害数字
        spawnDamageNumber(this.x, this.y - this.size / 2, actualDamage.toString());

        // 如果生命值小于等于0，死亡
        if (this.health <= 0) {
            this.onDeath(source);
            return true;
        }
        return false;
    }

    /**
     * 死亡处理
     * @param {GameObject} killer - 击杀者
     */
    onDeath(killer) {
        // 标记为垃圾和非活动
        this.isGarbage = true;
        this.isActive = false;
    }

    /**
     * 获取当前速度
     * @returns {number} 当前速度
     */
    getCurrentSpeed() {
        // 如果被眩晕，速度为0
        if (this.isStunned()) {
            return 0;
        }

        // 如果被减速，应用减速效果
        if (this.statusEffects.slow) {
            return this.speed * this.statusEffects.slow.factor;
        }

        // 否则返回正常速度
        return this.speed;
    }

    /**
     * 检查是否被眩晕
     * @returns {boolean} 是否被眩晕
     */
    isStunned() {
        return this.statusEffects.stun !== null;
    }

    /**
     * 绘制角色
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果角色不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;

        // 如果无敌，闪烁效果
        if (this.invincibleTime > 0 && Math.floor(this.invincibleTime * 10) % 2 === 0) {
            return;
        }
        // 绘制状态效果
        this.drawStatusEffects(ctx);
        // 调用父类绘制方法
        super.draw(ctx);
    }

    /**
     * 绘制状态效果
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawStatusEffects(ctx) {
        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);

        // 如果被眩晕，绘制眩晕效果
        if (this.statusEffects.stun) {
            // 绘制眩晕效果
            ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size / 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 如果被燃烧，绘制燃烧效果
        if (this.statusEffects.burn) {
            // 绘制燃烧效果
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size / 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 如果被减速，绘制减速效果
        if (this.statusEffects.slow) {
            // 绘制减速效果
            ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size / 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}
