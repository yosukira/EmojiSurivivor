/**
 * 投射物类
 * 玩家和敌人的投射物
 */
class Projectile extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} pierce - 穿透次数
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     */
    constructor(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats) {
        super(x, y, emoji, size);

        // 初始化属性
        this.init(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats);
    }

    /**
     * 初始化投射物
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} pierce - 穿透次数
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @returns {Projectile} 投射物实例
     */
    init(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats) {
        // 位置和外观
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.size = size;

        // 速度
        this.vx = vx;
        this.vy = vy;

        // 伤害和穿透
        this.baseDamage = damage;
        this.pierce = pierce;

        // 持续时间
        this.duration = duration;
        this.lifetime = 0;

        // 拥有者属性
        this.ownerStats = ownerStats;
        // 计算实际伤害
        const damageMultiplier = this.ownerStats && typeof this.ownerStats.damageMultiplier === 'number' 
            ? this.ownerStats.damageMultiplier 
            : 1.0;
        this.damage = this.baseDamage * damageMultiplier;

        // 已命中目标
        this.hitTargets = new Set();

        // 状态
        this.isActive = true;
        this.isGarbage = false;

        // 状态效果
        this.statusEffect = null;

        // 范围伤害半径
        this.aoeRadius = 0;
        return this;
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

        // 检查是否过期
        if (this.lifetime >= this.duration || this.pierce < 0) {
            // 调用销毁处理
            this.onDestroy();

            // 标记为垃圾
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 检查是否超出屏幕
        if (!cameraManager.isObjectVisible(this, 100)) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 检查与敌人的碰撞
        this.checkEnemyCollisions();
    }

    /**
     * 检查与敌人的碰撞
     */
    checkEnemyCollisions() {
        // 遍历所有敌人
        for (let i = 0; i < enemies.length; i++) {
            const enemy = enemies[i];

            // 跳过不活动、已标记为垃圾或已命中的敌人
            if (enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) continue;
            // 检查碰撞
            if (this.checkCollision(enemy)) {
                // 命中敌人
                this.onHitEnemy(enemy);

                // 添加到已命中列表
                this.hitTargets.add(enemy);

                // 减少穿透次数
                this.pierce--;

                // 如果穿透次数用尽，标记为垃圾
                if (this.pierce < 0) {
                    this.isGarbage = true;
                    this.isActive = false;
                    break;
                }
            }
        }
    }

    /**
     * 命中敌人处理
     * @param {Enemy} enemy - 敌人
     */
    onHitEnemy(enemy) {
        // 造成伤害
        enemy.takeDamage(this.damage, player);
        // 应用状态效果
        if (this.statusEffect) {
            this.applyStatusEffect(enemy);
        }

        // 应用范围伤害
        if (this.aoeRadius > 0) {
            this.applyAreaDamage(enemy);
        }
    }

    /**
     * 应用状态效果
     * @param {Enemy} enemy - 敌人
     */
    applyStatusEffect(enemy) {
        // 确保敌人有状态效果对象
        if (!enemy.statusEffects) {
            enemy.statusEffects = {};
        }

        // 应用状态效果
        switch (this.statusEffect.type) {
            case 'burn':
                enemy.statusEffects.burn = {
                    damage: this.statusEffect.damage,
                    duration: this.statusEffect.duration,
                    tick: this.statusEffect.tick,
                    timer: 0,
                    source: player
                };
                break;
            case 'bleed':
                enemy.statusEffects.bleed = {
                    damage: this.statusEffect.damage,
                    duration: this.statusEffect.duration,
                    tick: this.statusEffect.tick,
                    timer: 0,
                    source: player
                };
                break;
            case 'stun':
                enemy.statusEffects.stun = {
                    duration: this.statusEffect.duration,
                    source: player
                };
                break;
        }
    }

    /**
     * 应用范围伤害
     * @param {Enemy} sourceEnemy - 源敌人
     */
    applyAreaDamage(sourceEnemy) {
        // 遍历所有敌人
        enemies.forEach(enemy => {
            // 跳过源敌人、不活动或已标记为垃圾的敌人
            if (enemy === sourceEnemy || enemy.isGarbage || !enemy.isActive) return;
            // 计算距离
            const dx = enemy.x - sourceEnemy.x;
            const dy = enemy.y - sourceEnemy.y;
            const distSq = dx * dx + dy * dy;
            // 如果在范围内，造成伤害
            if (distSq <= this.aoeRadius * this.aoeRadius) {
                // 计算伤害衰减
                const dist = Math.sqrt(distSq);
                const damageFactor = 1 - (dist / this.aoeRadius);

                // 造成伤害
                const areaDamage = this.damage * 0.5 * damageFactor;
                enemy.takeDamage(areaDamage, player);
                // 应用状态效果
                if (this.statusEffect) {
                    this.applyStatusEffect(enemy);
                }
            }
        });

        // 创建范围伤害视觉效果
        this.createAreaEffect(sourceEnemy.x, sourceEnemy.y);
    }

    /**
     * 创建范围伤害视觉效果
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    createAreaEffect(x, y) {
        // 创建爆炸效果
        const effect = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: this.aoeRadius,
            color: this.statusEffect && this.statusEffect.type === 'burn'
                ? 'rgba(255, 100, 0, 0.3)'
                : 'rgba(100, 100, 255, 0.3)',
            lifetime: 0.3,
            timer: 0,
            isGarbage: false,

            update: function(dt) {
                this.timer += dt;
                this.radius = (this.timer / this.lifetime) * this.maxRadius;

                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                }
            },

            draw: function(ctx) {
                if (this.isGarbage) return;

                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);

                // 计算透明度
                const alpha = 1 - (this.timer / this.lifetime);

                // 绘制圆形
                ctx.fillStyle = this.color.replace(')', `, ${alpha})`).replace('rgba', 'rgba');
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 销毁处理
     */
    onDestroy() {
        // 如果有范围伤害，创建爆炸效果
        if (this.aoeRadius > 0) {
            this.createAreaEffect(this.x, this.y);
        }
    }

    /**
     * 重置投射物状态
     */
    reset() {
        // 调用父类重置方法
        super.reset();

        // 重置投射物特有属性
        this.lifetime = 0;
        this.pierce = 0;
        this.hitTargets.clear();
        this.statusEffect = null;
        this.aoeRadius = 0;
    }
}
