/**
 * 投射物基类
 * 所有投射物的基础类
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
     * @param {number} pierce - 穿透
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
     * @param {number} pierce - 穿透
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
        this.width = size;
        this.height = size;
        
        // 速度
        this.vx = vx;
        this.vy = vy;
        
        // 伤害
        this.damage = damage * (ownerStats.damageMultiplier || 1.0);
        
        // 穿透
        this.pierce = pierce;
        
        // 持续时间
        this.duration = duration;
        
        // 生命周期
        this.lifetime = 0;
        
        // 已命中目标
        this.hitTargets = new Set();
        
        // 拥有者属性
        this.ownerStats = ownerStats || {};
        
        // 状态
        this.isActive = true;
        this.isGarbage = false;
        
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
        
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            
            // 设置字体
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            
            // 设置对齐方式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 绘制表情符号
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        } catch (e) {
            console.error("绘制投射物时出错:", e);
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
        this.hitTargets.clear();
    }
}