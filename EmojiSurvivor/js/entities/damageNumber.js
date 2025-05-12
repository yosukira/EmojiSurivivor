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
     */
    constructor(x, y, text, size = 20, color = 'white', duration = 0.8) {
        // 初始化属性
        this.init(x, y, text, size, color, duration);
    }

    /**
     * 初始化伤害数字
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} text - 文本
     * @param {number} size - 大小
     * @param {string} color - 颜色
     * @param {number} duration - 持续时间
     * @returns {DamageNumber} 伤害数字实例
     */
    init(x, y, text, size = 20, color = 'white', duration = 0.8) {
        // 位置
        this.x = x;
        this.y = y;
        // 初始位置
        this.startX = x;
        this.startY = y;

        // 文本处理 - 如果是数字，处理格式
        if (!isNaN(parseFloat(text)) && isFinite(text)) {
            // 将文本转换为数值并限制小数点后位数为1位
            const num = parseFloat(text);
            this.text = Math.abs(num) < 0.1 ? "0.1" : num.toFixed(1);
        } else {
            this.text = text;
        }

        // 大小
        this.size = size;

        // 颜色
        this.color = color;

        // 持续时间
        this.duration = duration;
        // 生命周期
        this.lifetime = 0;
        // 垂直速度
        this.vy = -50;
        // 水平速度
        this.vx = (Math.random() - 0.5) * 30;
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
        // 减少垂直速度（模拟重力）
        this.vy += 100 * dt;
    }

    /**
     * 绘制伤害数字
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage) return;

        // 使用 lifetime 计算 Y 偏移和透明度
        const progress = this.lifetime / this.duration;
        const yOffset = progress * 40; // 伤害数字上升的高度
        const alpha = 1 - progress; // 透明度逐渐减小

        // 获取屏幕坐标，并应用 Y 偏移
        const screenPos = cameraManager.worldToScreen(this.x, this.y - yOffset);

        ctx.font = `${this.size}px Arial`; // 使用更通用的 Arial 字体
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 红色描边
        ctx.strokeStyle = 'rgb(255, 80, 80)';
        ctx.lineWidth = Math.max(1, this.size / 10);
        ctx.globalAlpha = alpha;
        ctx.strokeText(this.text, screenPos.x, screenPos.y);

        // 白色填充
        ctx.fillStyle = 'white';
        ctx.globalAlpha = alpha;
        ctx.fillText(this.text, screenPos.x, screenPos.y);

        ctx.globalAlpha = 1.0; // 重置透明度
    }

    /**
     * 重置伤害数字状态
     */
    reset() {
        // 重置状态
        this.isActive = true;
        this.isGarbage = false;
        this.lifetime = 0;
    }
}