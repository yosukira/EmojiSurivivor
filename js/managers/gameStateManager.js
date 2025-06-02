/**
 * 游戏状态管理器
 * 负责管理游戏的各种状态和全局变量
 */

// 游戏状态
let isGameRunning = false;
let isGameOver = false;
let isPaused = false;
let isLevelUp = false; // 这里必须是let，不能是const
let gameTime = 0;
let lastTime = 0;
let deltaTime = 0;
let killCount = 0;
let animationFrameId = null;
let playerImage = null; // 用于存储玩家图片
let backgroundImage = null; // 用于存储背景图片

// 屏幕震动相关变量
let screenShakeIntensity = 0;
let screenShakeDuration = 0;
let screenShakeTimer = 0;

// 游戏对象
let player;
let enemies = [];
let projectiles = [];
let enemyProjectiles = []; // 敌人投射物
let xpGems = [];
let worldObjects = [];
let visualEffects = [];
let damageNumbers = [];
// let activeGhosts = []; // 旧的声明将被替换
window.activeGhosts = []; // 新增：使其成为 window 的属性，以便 SoulRelic 可以正确访问
let hazards = []; // 新增：用于存储持续性危害物，如藤蔓、火山等
let particles = []; // 粒子效果

// 鼠标隐藏相关
let lastMouseMoveTime = Date.now(); // 最后一次鼠标移动的时间
let mouseIdleTime = 2000; // 鼠标不动多少毫秒后隐藏（2秒）
let isMouseHidden = false; // 鼠标是否已隐藏

// 对象池
let inactiveProjectiles = [];
let inactiveDamageNumbers = [];

// 按键状态
let keys = {};

// 画布相关
let canvas, ctx;
let offscreenCanvas, offscreenCtx;

/**
 * 重置游戏状态
 */
function resetGameState() {
    isGameRunning = false;
    isGameOver = false;
    isPaused = false;
    isLevelUp = false;
    gameTime = 0;
    lastTime = 0;
    deltaTime = 0;
    killCount = 0;
    
    // 重置屏幕震动
    screenShakeIntensity = 0;
    screenShakeDuration = 0;
    screenShakeTimer = 0;
    
    // 清空游戏对象数组
    enemies.length = 0;
    projectiles.length = 0;
    enemyProjectiles.length = 0;
    xpGems.length = 0;
    worldObjects.length = 0;
    visualEffects.length = 0;
    damageNumbers.length = 0;
    window.activeGhosts.length = 0;
    hazards.length = 0;
    particles.length = 0;
    
    // 重置对象池
    inactiveProjectiles.length = 0;
    inactiveDamageNumbers.length = 0;
    
    // 重置按键状态
    keys = {};
    
    // 重置鼠标状态
    lastMouseMoveTime = Date.now();
    isMouseHidden = false;
}

/**
 * 获取当前游戏状态
 */
function getGameState() {
    return {
        isGameRunning,
        isGameOver,
        isPaused,
        isLevelUp,
        gameTime,
        killCount
    };
}

/**
 * 触发屏幕震动
 */
function triggerScreenShake(intensity, duration) {
    screenShakeIntensity = intensity;
    screenShakeDuration = duration;
    screenShakeTimer = 0;
} 