/**
 * 相机管理器
 * 负责相机的移动和渲染，实现无限地图
 */
class CameraManager {
    /**
     * 构造函数
     */
    constructor() {
        // 相机位置
        this.x = 0;
        this.y = 0;

        // 目标位置
        this.targetX = 0;
        this.targetY = 0;

        // 平滑系数
        this.smoothFactor = 0.1;

        // 相机抖动
        this.shakeIntensity = 0;
        this.shakeTimer = 0;
        this.shakeDuration = 0;
    }

    /**
     * 更新相机位置
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标对象
     */
    update(dt, target) {
        // 更新目标位置
        this.targetX = target.x;
        this.targetY = target.y;
        // 平滑移动相机
        this.x += (this.targetX - this.x) * this.smoothFactor;
        this.y += (this.targetY - this.y) * this.smoothFactor;

        // 更新相机抖动
        this.updateShake(dt);
    }

    /**
     * 更新相机抖动
     * @param {number} dt - 时间增量
     */
    updateShake(dt) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;

            if (this.shakeTimer <= 0) {
                this.shakeIntensity = 0;
            }
        }
    }

    /**
     * 添加相机抖动
     * @param {number} intensity - 抖动强度
     * @param {number} duration - 抖动持续时间
     */
    addShake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeTimer = duration;
        this.shakeDuration = duration;
    }

    /**
     * 获取相机位置
     * @returns {Object} 相机位置
     */
    getPosition() {
        // 计算抖动偏移
        let offsetX = 0;
        let offsetY = 0;

        if (this.shakeIntensity > 0) {
            const progress = this.shakeTimer / this.shakeDuration;
            const currentIntensity = this.shakeIntensity * progress;

            offsetX = (Math.random() * 2 - 1) * currentIntensity;
            offsetY = (Math.random() * 2 - 1) * currentIntensity;
        }

        return {
            x: this.x + offsetX,
            y: this.y + offsetY
        };
    }

    /**
     * 世界坐标转屏幕坐标
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @returns {Object} 屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        const position = this.getPosition();

        return {
            x: worldX - position.x + GAME_WIDTH / 2,
            y: worldY - position.y + GAME_HEIGHT / 2
        };
    }

    /**
     * 屏幕坐标转世界坐标
     * @param {number} screenX - 屏幕X坐标
     * @param {number} screenY - 屏幕Y坐标
     * @returns {Object} 世界坐标
     */
    screenToWorld(screenX, screenY) {
        const position = this.getPosition();

        return {
            x: screenX + position.x - GAME_WIDTH / 2,
            y: screenY + position.y - GAME_HEIGHT / 2
        };
    }

    /**
     * 检查对象是否在屏幕内
     * @param {GameObject} obj - 游戏对象
     * @param {number} margin - 边距
     * @returns {boolean} 是否在屏幕内
     */
    isObjectVisible(obj, margin = 0) {
        const screen = this.worldToScreen(obj.x, obj.y);
        const size = obj.size || 0;
        return (
            screen.x + size + margin >= 0 &&
            screen.x - size - margin <= GAME_WIDTH &&
            screen.y + size + margin >= 0 &&
            screen.y - size - margin <= GAME_HEIGHT
        );
    }

    /**
     * 绘制背景
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawBackground(ctx) {
        // 绘制背景颜色
        ctx.fillStyle = '#2d2d3a';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

        // 绘制网格
        this.drawGrid(ctx);
    }

    /**
     * 绘制网格
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawGrid(ctx) {
        const gridSize = 100;
        const position = this.getPosition();

        // 计算网格起始位置
        const startX = Math.floor(position.x / gridSize) * gridSize;
        const startY = Math.floor(position.y / gridSize) * gridSize;

        // 计算屏幕上的起始位置
        const screenStartX = startX - position.x + GAME_WIDTH / 2;
        const screenStartY = startY - position.y + GAME_HEIGHT / 2;

        // 设置网格样式
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.1)';
        ctx.lineWidth = 1;

        // 绘制垂直线
        for (let x = screenStartX; x <= GAME_WIDTH; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }

        // 绘制水平线
        for (let y = screenStartY; y <= GAME_HEIGHT; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }
    }
}

// 创建全局相机管理器实例
const cameraManager = new CameraManager();