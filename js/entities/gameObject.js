/**
 * 游戏对象基类
 * 所有游戏对象的基础类
 */
class GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {number} size - 大小
     */
    constructor(x, y, emoji, size) {
        // 位置
        this.x = x;
        this.y = y;

        // 表情符号
        this.emoji = emoji;

        // 大小
        this.size = size;
        // 状态
        this.isActive = true;
        this.isGarbage = false;
    }

    /**
     * 更新游戏对象状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 基类不做任何更新
    }

    /**
     * 绘制游戏对象
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果游戏对象不活动或已标记为垃圾，不绘制
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
        } catch (error) {
            console.error("绘制游戏对象时出错:", error);
        }
    }

    /**
     * 检查与另一个游戏对象的碰撞
     * @param {GameObject} other - 另一个游戏对象
     * @returns {boolean} 是否碰撞
     */
    checkCollision(other) {
        // 计算两个对象之间的距离
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 如果距离小于两个对象大小的一半之和，则碰撞
        return distance < (this.size + other.size) / 2;
    }

    /**
     * 重置游戏对象状态
     */
    reset() {
        // 重置状态
        this.isActive = true;
        this.isGarbage = false;
    }

    /**
     * 标记为垃圾
     */
    markAsGarbage() {
        this.isGarbage = true;
        this.isActive = false;
    }
}