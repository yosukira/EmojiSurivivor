/**
 * 伤害数字类
 * 显示伤害数值
 */
class DamageNumber {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} text - 文本
     * @param {number} size - 大小
     * @param {string} color - 颜色
     * @param {number} duration - 持续时间
     * @param {boolean} isCrit - 是否暴击
     */
    constructor(x, y, text, size = 20, color = 'white', duration = 0.8, isCrit = false) {
        // 初始化属性
        this.init(x, y, text, size, color, duration, isCrit);
    }

    /**
     * 初始化伤害数字
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} text - 文本
     * @param {number} size - 大小
     * @param {string} color - 颜色
     * @param {number} duration - 持续时间
     * @param {boolean} isCrit - 是否暴击
     * @returns {DamageNumber} 伤害数字实例
     */
    init(x, y, text, size = 20, color = 'white', duration = 0.8, isCrit = false) {
        // 位置 - 添加随机偏移，让伤害数字不会完全重叠
        this.x = x + (Math.random() - 0.5) * 20;
        this.y = y;
        // 初始位置
        this.startX = this.x;
        this.startY = this.y;

        // 文本处理 - 如果是数字，处理格式
        if (!isNaN(parseFloat(text)) && isFinite(text)) {
            const num = parseFloat(text);
            this.text = Math.abs(num) < 0.1 ? "0.1" : Math.floor(num).toString();
        } else {
            this.text = text;
        }

        // 暴击属性
        this.isCrit = isCrit;
        
        // 大小 - 暴击时增加40%
        this.size = isCrit ? size * 1.4 : size;
        this.baseSize = this.size;

        // 颜色系统
        if (isCrit) {
            this.color = '#FFD700'; // 金色
            this.strokeColor = '#000000'; // 黑色描边
        } else {
            this.color = color;
            this.strokeColor = '#000000'; // 黑色描边
        }

        // 持续时间 - 暴击持续时间稍长
        this.duration = isCrit ? duration * 1.2 : duration;
        // 生命周期
        this.lifetime = 0;
        
        // 运动参数 - 暴击有更强的弹出效果
        this.vy = isCrit ? -80 : -60; // 初始向上速度
        this.vx = (Math.random() - 0.5) * (isCrit ? 50 : 30); // 水平随机速度
        this.gravity = 120; // 重力加速度
        
        // 缩放动画（暴击专用）
        this.scale = isCrit ? 1.5 : 1.0; // 暴击开始时更大
        this.targetScale = 1.0;
        
        // 状态
        this.isActive = true;
        this.isGarbage = false;
        
        // 支持链式调用
        return this;
    }

    /**
     * 更新伤害数字状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果伤害数字不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        
        // 更新生命周期
        this.lifetime += dt;

        // 如果生命周期结束，标记为垃圾
        if (this.lifetime >= this.duration) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        
        // 更新位置
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // 应用重力
        this.vy += this.gravity * dt;
        
        // 更新缩放动画（暴击专用）
        if (this.isCrit && this.scale > this.targetScale) {
            this.scale = Math.max(this.targetScale, this.scale - dt * 2); // 快速缩小到目标尺寸
        }
        
        // 水平阻力
        this.vx *= Math.pow(0.95, dt * 60); // 模拟空气阻力
    }

    /**
     * 绘制伤害数字
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage) return;

        // 计算透明度和位置 - 去掉渐隐效果，保持固定透明度
        const progress = this.lifetime / this.duration;
        const alpha = 1.0; // 固定透明度，不再渐隐
        
        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        
        // 计算最终大小
        const finalSize = this.baseSize * this.scale;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // 设置字体 - 所有伤害数字都使用粗体
        const fontWeight = 'bold'; // 改为统一使用粗体，而不是只有暴击才粗体
        ctx.font = `${fontWeight} ${finalSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 绘制描边 - 增加描边粗细
        ctx.strokeStyle = this.strokeColor;
        ctx.lineWidth = Math.max(3, finalSize / 8); // 进一步增加描边粗细，从2和/10改为3和/8
        ctx.strokeText(this.text, screenPos.x, screenPos.y);
        
        // 绘制填充文本
        ctx.fillStyle = this.color;
        ctx.fillText(this.text, screenPos.x, screenPos.y);
        
        // 暴击额外效果：闪光 - 保持原有的闪光效果，但不依赖透明度变化
        if (this.isCrit && progress < 0.3) {
            ctx.save();
            ctx.globalAlpha = 0.8 * (1 - progress / 0.3); // 闪光效果可以保留渐变
            ctx.shadowColor = this.color;
            ctx.shadowBlur = finalSize / 2;
            ctx.fillStyle = this.color;
            ctx.fillText(this.text, screenPos.x, screenPos.y);
            ctx.restore();
        }
        
        ctx.restore();
    }

    /**
     * 重置伤害数字状态
     */
    reset() {
        // 重置状态
        this.isActive = true;
        this.isGarbage = false;
        this.lifetime = 0;
        this.scale = 1.0;
        this.isCrit = false;
    }
}