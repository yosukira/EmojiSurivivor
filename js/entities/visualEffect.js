/**
 * 视觉特效类
 * 用于创建和管理游戏中的各种视觉特效
 */
class VisualEffect {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号（可选）
     * @param {number} size - 大小
     * @param {number} duration - 持续时间
     * @param {string} color - 颜色（可选）
     */
    constructor(x, y, emoji = null, size = 50, duration = 0.5, color = null) {
        // 位置
        this.x = x;
        this.y = y;
        
        // 表情符号
        this.emoji = emoji;
        
        // 大小
        this.size = size;
        this.initialSize = size;
        
        // 持续时间
        this.duration = duration;
        this.lifetime = 0;
        
        // 颜色
        this.color = color || 'rgba(255, 255, 255, 0.7)';
        
        // 状态
        this.isGarbage = false;
        
        // 类型
        this.type = emoji ? 'emoji' : 'circle';
        
        // 旋转
        this.rotation = 0;
        this.rotationSpeed = Math.random() * Math.PI;
    }
    
    /**
     * 更新特效状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 更新生命周期
        this.lifetime += dt;
        
        // 如果生命周期结束，标记为垃圾
        if (this.lifetime >= this.duration) {
            this.isGarbage = true;
            return;
        }
        
        // 更新旋转
        this.rotation += this.rotationSpeed * dt;
        
        // 根据类型更新
        if (this.type === 'circle') {
            // 圆形特效逐渐扩大
            this.size = this.initialSize * (this.lifetime / this.duration);
        } else if (this.type === 'emoji') {
            // Emoji特效逐渐缩小
            this.size = this.initialSize * (1 - this.lifetime / this.duration * 0.5);
        }
    }
    
    /**
     * 绘制特效
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage) return;
        
        // 计算透明度
        const alpha = 1 - (this.lifetime / this.duration);
        
        // 保存上下文
        ctx.save();
        
        // 根据类型绘制
        if (this.type === 'circle') {
            // 绘制圆形
            const color = this.color.replace(/rgba?\(([^)]+)\)/, (_, p) => {
                return `rgba(${p.split(',').slice(0, 3).join(',')}, ${alpha})`;
            });
            
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'emoji' && this.emoji) {
            // 绘制表情符号
            ctx.globalAlpha = alpha;
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // 应用旋转
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);
            ctx.fillText(this.emoji, 0, 0);
        }
        
        // 恢复上下文
        ctx.restore();
    }
    
    /**
     * 创建爆炸特效
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} radius - 爆炸半径
     * @param {string} color - 爆炸颜色
     * @param {number} duration - 持续时间
     * @returns {VisualEffect} 爆炸特效
     */
    static createExplosion(x, y, radius = 100, color = 'rgba(255, 100, 0, 0.7)', duration = 0.5) {
        return new VisualEffect(x, y, null, radius, duration, color);
    }
    
    /**
     * 创建文本特效
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {number} size - 大小
     * @param {number} duration - 持续时间
     * @returns {VisualEffect} 文本特效
     */
    static createEmojiEffect(x, y, emoji, size = 50, duration = 0.5) {
        return new VisualEffect(x, y, emoji, size, duration);
    }
} 