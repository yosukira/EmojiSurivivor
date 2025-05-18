/**
 * 摄像机管理器
 * 管理游戏摄像机（固定视角）
 */
const cameraManager = {
    // 相机位置
    x: 0,
    y: 0,
    // 目标位置
    targetX: 0,
    targetY: 0,

    // 平滑系数
    smoothFactor: 0.1,

    // 缩放比例
    zoom: 1.0,
    /**
     * 设置相机位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    },

    /**
     * 设置目标位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    },

    /**
     * 更新相机位置
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 平滑移动相机
        this.x += (this.targetX - this.x) * this.smoothFactor;
        this.y += (this.targetY - this.y) * this.smoothFactor;
    },

    /**
     * 应用相机变换
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    applyTransform(ctx) {
        // 固定视角，不需要变换
        ctx.save();
    },

    /**
     * 恢复相机变换
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    restoreTransform(ctx) {
        // 恢复上下文
        ctx.restore();
    },

    /**
     * 世界坐标转屏幕坐标
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @returns {Object} 屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        // 固定视角，世界坐标就是屏幕坐标
        return {
            x: worldX,
            y: worldY
        };
    },

    /**
     * 屏幕坐标转世界坐标
     * @param {number} screenX - 屏幕X坐标
     * @param {number} screenY - 屏幕Y坐标
     * @returns {Object} 世界坐标
     */
    screenToWorld(screenX, screenY) {
        // 固定视角，屏幕坐标就是世界坐标
        return {
            x: screenX,
            y: screenY
        };
    },

    /**
     * 检查对象是否在视野内
     * @param {GameObject} obj - 游戏对象
     * @returns {boolean} 是否在视野内
     */
    isVisible(obj) {
        // 固定视角，只要在屏幕范围内就可见
        return (
            obj.x + obj.size / 2 > 0 &&
            obj.x - obj.size / 2 < GAME_WIDTH &&
            obj.y + obj.size / 2 > 0 &&
            obj.y - obj.size / 2 < GAME_HEIGHT
        );
    },

    /**
     * 检查给定世界坐标是否在相机视图内（可带缓冲）
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @param {number} [buffer=0] - 边缘缓冲，也可以理解为物体的一半大小
     * @returns {boolean} 是否在视图内
     */
    isPositionInView(worldX, worldY, buffer = 0) {
        // 相机视图的边界
        const viewLeft = this.x - GAME_WIDTH / 2 / this.zoom;
        const viewRight = this.x + GAME_WIDTH / 2 / this.zoom;
        const viewTop = this.y - GAME_HEIGHT / 2 / this.zoom;
        const viewBottom = this.y + GAME_HEIGHT / 2 / this.zoom;

        // 检查点是否在视图边界内（考虑缓冲区）
        return (
            worldX + buffer > viewLeft &&
            worldX - buffer < viewRight &&
            worldY + buffer > viewTop &&
            worldY - buffer < viewBottom
        );
    }
};
