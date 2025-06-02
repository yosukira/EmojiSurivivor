/**
 * 投射物类
 * 武器发射的投射物
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
        // 调用父类构造函数
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
        // 位置
        this.x = x;
        this.y = y;
        // 表情符号
        this.emoji = emoji;
        // 大小
        this.size = size;
        // 速度
        this.vx = vx;
        this.vy = vy;
        // 伤害
        this.damage = damage;

        // 穿透次数
        this.pierce = pierce;
        // 持续时间
        this.duration = duration;
        // 生命周期
        this.lifetime = 0;

        // 拥有者属性
        this.ownerStats = ownerStats;

        // 拥有者
        this.owner = null;
        // 已命中目标
        this.hitTargets = new Set();
        // 状态
        this.isActive = true;
        this.isGarbage = false;

        // --- 新增：重置子类可能添加的特殊属性 ---
        this.onHit = null;          // 重置命中回调
        this.drawEffect = null;     // 重置特殊绘制效果回调
        this.chainCount = 0;      // 重置链式攻击计数
        this.chainRange = 0;      // 重置链式攻击范围
        this.stunDuration = 0;    // 重置眩晕持续时间
        this.burnDamage = 0;      // 重置燃烧伤害
        this.burnDuration = 0;    // 重置燃烧持续时间
        this.chainingNow = false; // 重置岚刀属性
        this.exploded = false;    // 重置握握手属性
        this.rotation = 0;        // 重置握握手旋转
        this.particleTimer = 0;   // 重置粒子计时器
        // ---

        // 支持链式调用
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

        // 如果生命周期结束，标记为垃圾
        if (this.lifetime >= this.duration) {
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
                enemy.takeDamage(this.damage, this.owner);
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
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果投射物不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;

        ctx.save(); // 保存状态
        ctx.globalAlpha = 1.0; // 确保投射物绘制时不透明

        // 调用父类(GameObject)的绘制方法来绘制基础 emoji
        // super.draw(ctx); 
        // GameObject.draw 内部没有 save/restore，所以如果在这里调用 super.draw, 
        // 它会使用我们刚设置的 globalAlpha = 1.0，这是好的。
        // 但是，为了更清晰地控制，我们可以直接复制代码或者重写绘制逻辑。
        // 鉴于 Projectile 可能有特殊绘制（如岚刀的闪电），我们最好在这里完全控制绘制。

        const screenPos = cameraManager.worldToScreen(this.x, this.y);

        if (this.drawEffect) {
            // 如果有特殊绘制效果 (例如岚刀的闪电)，则调用它
            this.drawEffect(ctx, screenPos);
        } else {
            // 默认绘制：绘制 emoji
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        }
        
        ctx.restore(); // 恢复状态
    }

    /**
     * 重置投射物状态
     */
    reset() {
        // 调用父类重置方法
        super.reset();

        // 重置特定状态
        this.lifetime = 0;
        this.hitTargets.clear();
    }
}