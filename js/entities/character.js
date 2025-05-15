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
        this.stats = stats || {};
        // 生命值
        this.health = stats.health || 100;
        // 速度
        this.speed = stats.speed || 100;
        // 伤害
        this.damage = stats.damage || 10;
        // 经验值
        this.xpValue = stats.xp || 0;

        // 状态效果
        this.statusEffects = {
            stun: null,
            slow: null,
            burn: null,
            poison: null
        };
        // 无敌时间
        this.invincibleTime = 0;
    }

    /**
     * 应用状态效果
     * @param {string} type - 效果类型 ('stun', 'slow', 'burn', 'poison')
     * @param {Object} effectData - 效果数据 (例如 { duration: 1, factor: 0.5, damage: 5, tickInterval: 0.5, source: null })
     */
    applyStatusEffect(type, effectData) {
        if (!this.statusEffects.hasOwnProperty(type)) {
            console.warn(`Unknown status effect type: ${type}`);
            return;
        }

        // 对于减速和眩晕，如果已经存在效果，则选择持续时间更长的那个
        if (type === 'slow' || type === 'stun') {
            if (this.statusEffects[type] && this.statusEffects[type].duration > effectData.duration) {
                return; // 已有更强的同类效果
            }
        }
        
        this.statusEffects[type] = { ...effectData };
        if (type === 'slow') {
            this.statusEffects.slow.icon = '🐌'; // 添加图标属性
            console.log('Slow effect applied to:', this, 'New slow status:', this.statusEffects.slow);
        }
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
        // 更新眩晕效果
        if (this.statusEffects.stun) {
            this.statusEffects.stun.duration -= dt;
            if (this.statusEffects.stun.duration <= 0) {
                this.statusEffects.stun = null;
            }
        }

        // 更新减速效果
        if (this.statusEffects.slow) {
            this.statusEffects.slow.duration -= dt;
            if (this.statusEffects.slow.duration <= 0) {
                this.statusEffects.slow = null;
            }
        }

        // 更新燃烧效果
        if (this.statusEffects.burn) {
            this.statusEffects.burn.duration -= dt;
            this.statusEffects.burn.tickTimer -= dt;

            if (this.statusEffects.burn.tickTimer <= 0) {
                // 造成伤害
                this.takeDamage(this.statusEffects.burn.damage, this.statusEffects.burn.source);

                // 重置计时器
                this.statusEffects.burn.tickTimer = this.statusEffects.burn.tickInterval;
            }
            if (this.statusEffects.burn.duration <= 0) {
                this.statusEffects.burn = null;
            }
        }

        // 更新中毒效果
        if (this.statusEffects.poison) {
            this.statusEffects.poison.duration -= dt;
            this.statusEffects.poison.tickTimer -= dt;

            if (this.statusEffects.poison.tickTimer <= 0) {
                // 造成伤害
                this.takeDamage(this.statusEffects.poison.damage, this.statusEffects.poison.source);

                // 重置计时器
                this.statusEffects.poison.tickTimer = this.statusEffects.poison.tickInterval;
            }

            if (this.statusEffects.poison.duration <= 0) {
                this.statusEffects.poison = null;
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
        const actualDamage = Math.max(1, amount - this.getStat('armor'));
        // 减少生命值
        this.health -= actualDamage;

        // 创建伤害数字
        spawnDamageNumber(this.x, this.y - this.size / 2, actualDamage.toString(), GAME_FONT_SIZE, 'red');

        // 设置无敌时间
        this.invincibleTime = 0.1;
        // 如果生命值小于等于0，死亡
        if (this.health <= 0) {
            this.onDeath(source);
            return true;
        }

        return false;
    }

    /**
     * 治疗
     * @param {number} amount - 治疗量
     */
    heal(amount) {
        // 增加生命值
        this.health = Math.min(this.health + amount, this.getStat('health'));

        // 创建治疗数字
        spawnDamageNumber(this.x, this.y - this.size / 2, `+${Math.ceil(amount)}`, GAME_FONT_SIZE, 'green');
    }

    /**
     * 死亡处理
     * @param {GameObject} killer - 击杀者
     */
    onDeath(killer) {
        // 标记为垃圾
        this.isGarbage = true;
        this.isActive = false;
    }

    /**
     * 获取属性
     * @param {string} statName - 属性名称
     * @returns {number} 属性值
     */
    getStat(statName) {
        return this.stats[statName] || 0;
    }

    /**
     * 获取当前速度
     * @returns {number} 当前速度
     */
    getCurrentSpeed() {
        // 获取基础速度
        let speed = this.speed;
        // 如果被减速，应用减速效果
        if (this.statusEffects.slow) {
            speed *= this.statusEffects.slow.factor;
        }

        // 如果被眩晕，速度为0
        if (this.isStunned()) {
            speed = 0;
        }

        return speed;
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

        // --- 绘制主要角色Emoji ---
        ctx.save(); 
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        ctx.globalAlpha = 1.0; // 默认不透明
        
        if (this.isStunned()) { // Enemy.draw 中已有类似效果，但 Character 基类也可以有基础视觉
            // ctx.filter = 'opacity(0.6) drop-shadow(0 0 5px yellow)'; // Stun effect
        }
        
        if (this.invincibleTime > 0) {
            const blinkRate = 10; // 与 Player.js 中的闪烁率保持一致或协调
            // 使用 gameTime 或 Date.now() 确保独立于 dt 的稳定闪烁
            if (Math.sin(gameTime * blinkRate * Math.PI) > 0) { 
                ctx.globalAlpha = 0.7;
            }
        }
        
        ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        ctx.restore();

        // --- 绘制状态效果图标 --- (确保它们不透明)
        ctx.save();
        ctx.globalAlpha = 1.0; // 确保状态图标总是完全不透明
        this.drawStatusEffects(ctx); // screenPos 已在上面计算，drawStatusEffects内部会再次获取
        ctx.restore();
    }

    /**
     * 绘制状态效果
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawStatusEffects(ctx) {
        ctx.save(); // 为状态效果图标的绘制包裹 save/restore
        ctx.globalAlpha = 1.0; // 强制不透明

        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);

        // 状态效果图标
        const icons = [];
        let iconYOffset = -this.size * 0.7; // 图标初始Y偏移

        // 添加眩晕效果图标
        if (this.statusEffects.stun) {
            icons.push('💫'); // 眩晕图标
        }
        // 添加减速效果图标
        if (this.statusEffects.slow && this.statusEffects.slow.icon) {
            icons.push(this.statusEffects.slow.icon);
        }

        // 绘制图标
        if (icons.length > 0) {
            ctx.font = `${this.size * 0.4}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            icons.forEach(icon => {
                ctx.fillText(icon, screenPos.x, screenPos.y + iconYOffset);
                iconYOffset += this.size * 0.3; // 每个图标稍微向下偏移
            });
        }
        
        // 绘制燃烧效果 (如果 Character 基类需要处理，目前 Enemy 类自行处理)
        // if (this.statusEffects.burn) {
        //     const burnSize = this.size * 0.4;
        //     const burnX = screenPos.x;
        //     const burnY = screenPos.y - this.size * 0.6; 
        //     ctx.font = `${burnSize}px 'Segoe UI Emoji', Arial`;
        //     ctx.textAlign = 'center';
        //     ctx.textBaseline = 'middle';
        //     ctx.fillText('🔥', burnX + Math.random()*4-2, burnY + Math.random()*4-2);
        // }
        ctx.restore(); // 恢复状态
    }
}
