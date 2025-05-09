/**
 * 摄像机管理器
 * 管理游戏摄像机
 */
const cameraManager = {
    // 摄像机位置
    x: 0,
    y: 0,

    // 目标位置
    targetX: 0,
    targetY: 0,

    // 缓动系数
    easing: 0.1,

    // 缩放
    zoom: 1.0,

    // 视口
    viewport: {
        width: GAME_WIDTH,
        height: GAME_HEIGHT,
        left: 0,
        right: GAME_WIDTH,
        top: 0,
        bottom: GAME_HEIGHT
    },
    /**
     * 设置摄像机位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.updateViewport();
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
     * 更新摄像机
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 计算新位置
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;

        // 应用缓动
        this.x += dx * this.easing;
        this.y += dy * this.easing;

        // 更新视口
        this.updateViewport();
    },
    /**
     * 更新视口
     */
    updateViewport() {
        // 计算视口边界
        const halfWidth = GAME_WIDTH / 2 / this.zoom;
        const halfHeight = GAME_HEIGHT / 2 / this.zoom;

        this.viewport = {
            width: GAME_WIDTH / this.zoom,
            height: GAME_HEIGHT / this.zoom,
            left: this.x - halfWidth,
            right: this.x + halfWidth,
            top: this.y - halfHeight,
            bottom: this.y + halfHeight
        };
    },
    /**
     * 调整大小
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    resize(width, height) {
        // 更新视口
        this.updateViewport();
    },
    /**
     * 世界坐标转屏幕坐标
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @returns {Object} 屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom + GAME_WIDTH / 2,
            y: (worldY - this.y) * this.zoom + GAME_HEIGHT / 2
        };
    },
    /**
     * 屏幕坐标转世界坐标
     * @param {number} screenX - 屏幕X坐标
     * @param {number} screenY - 屏幕Y坐标
     * @returns {Object} 世界坐标
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - GAME_WIDTH / 2) / this.zoom + this.x,
            y: (screenY - GAME_HEIGHT / 2) / this.zoom + this.y
        };
    },
    /**
     * 应用摄像机变换
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    applyTransform(ctx) {
        ctx.save();
        ctx.translate(GAME_WIDTH / 2, GAME_HEIGHT / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    },
    /**
     * 恢复摄像机变换
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    restoreTransform(ctx) {
        ctx.restore();
    },

    /**
     * 获取视口
     * @returns {Object} 视口
     */
    getViewport() {
        return this.viewport;
    },

    /**
     * 设置缩放
     * @param {number} zoom - 缩放
     */
    setZoom(zoom) {
        this.zoom = zoom;
        this.updateViewport();
    },

    /**
     * 检查点是否在视口内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} margin - 边距
     * @returns {boolean} 是否在视口内
     */
    isPointVisible(x, y, margin = 0) {
        return (
            x >= this.viewport.left - margin &&
            x <= this.viewport.right + margin &&
            y >= this.viewport.top - margin &&
            y <= this.viewport.bottom + margin
        );
    },

    /**
     * 检查矩形是否在视口内
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     * @param {number} margin - 边距
     * @returns {boolean} 是否在视口内
     */
    isRectVisible(x, y, width, height, margin = 0) {
        return (
            x + width / 2 >= this.viewport.left - margin &&
            x - width / 2 <= this.viewport.right + margin &&
            y + height / 2 >= this.viewport.top - margin &&
            y - height / 2 <= this.viewport.bottom + margin
        );
    }
};
