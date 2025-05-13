/**
 * 游戏对象基类
 * 所有游戏中的实体都继承自这个类
 */

class GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {number} size - 大小
     */
    constructor(x, y, emoji, size = GAME_FONT_SIZE) {
        this.x = x;
        this.y = y;
        this.emoji = emoji;
        this.size = size;
        this.width = size;
        this.height = size;
        this.isGarbage = false; // 标记是否可以被清理
        this.isActive = true;   // 标记是否处于活动状态
    }

    /**
     * 绘制游戏对象
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果对象不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;
        try {
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, this.x, this.y);
        } catch (e) {
            console.error("绘制 GameObject 时出错:", e);
            ctx.fillStyle = 'magenta';
            ctx.fillRect(this.x - this.size / 4, this.y - this.size / 4, this.size / 2, this.size / 2);
        }
    }

    /**
     * 检查与另一个游戏对象的碰撞
     * @param {GameObject} other - 另一个游戏对象
     * @returns {boolean} 是否碰撞
     */
    checkCollision(other) {
        // 如果任一对象不活动，不检测碰撞
        if (!this.isActive || !other.isActive) return false;

        const halfSize1 = this.size / 2;
        const halfSize2 = other.size / 2;
        return (
            this.x - halfSize1 < other.x + halfSize2 &&
            this.x + halfSize1 > other.x - halfSize2 &&
            this.y - halfSize1 < other.y + halfSize2 &&
            this.y + halfSize1 > other.y - halfSize2
        );
    }

    /**
     * 更新游戏对象状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 基类不做任何更新，由子类实现
    }

    /**
     * 重置游戏对象状态
     * 用于对象池回收再利用
     */
    reset() {
        this.isGarbage = false;
        this.isActive = true;
    }
}