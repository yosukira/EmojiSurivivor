/**
 * 伤害数字类
 * 显示伤害数字和其他文本
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
        this.init(x, y, text, color, duration);

        // 大小
        this.size = size;
    }

    /**
     * 初始化伤害数字
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} text - 文本
     * @param {string} color - 颜色
     * @param {number} duration - 持续时间
     * @returns {DamageNumber} 伤害数字实例
     */
    init(x, y, text, color, duration) {
        // 位置
        this.x = x;
        this.y = y;

        // 文本
        this.text = text;

        // 颜色
        this.color = color;

        // 持续时间
        this.duration = duration;
        // 生命周期
        this.lifetime = 0;
        // 垂直速度
        this.vy = -50;
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
        this.y += this.vy * dt;

        // 减少垂直速度
        this.vy += 50 * dt;
    }

    /**
     * 绘制伤害数字
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果伤害数字不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;

        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);

            // 计算透明度
            const alpha = 1 - (this.lifetime / this.duration);

            // 设置字体
            ctx.font = `bold ${this.size}px Arial`;

            // 设置对齐方式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 绘制描边
            ctx.strokeStyle = 'rgba(0, 0, 0, ' + alpha + ')';
            ctx.lineWidth = 3;
            ctx.strokeText(this.text, screenPos.x, screenPos.y);

            // 绘制文本
            ctx.fillStyle = 'rgba(' + this.getRGBFromColor(this.color) + ', ' + alpha + ')';
            ctx.fillText(this.text, screenPos.x, screenPos.y);
        } catch (e) {
            console.error("绘制伤害数字时出错:", e);
        }
    }

    /**
     * 从颜色名称获取RGB值
     * @param {string} color - 颜色名称
     * @returns {string} RGB值
     */
    getRGBFromColor(color) {
        switch (color.toLowerCase()) {
            case 'red':
                return '255, 0, 0';
            case 'green':
                return '0, 255, 0';
            case 'blue':
                return '0, 0, 255';
            case 'yellow':
                return '255, 255, 0';
            case 'orange':
                return '255, 165, 0';
            case 'purple':
                return '128, 0, 128';
            case 'cyan':
                return '0, 255, 255';
            case 'magenta':
                return '255, 0, 255';
            case 'white':
            default:
                return '255, 255, 255';
        }
    }

    /**
     * 重置伤害数字状态
     */
    reset() {
        // 重置状态
        this.lifetime = 0;
        this.isActive = true;
        this.isGarbage = false;
    }
}