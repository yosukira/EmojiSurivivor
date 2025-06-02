/**
 * 游戏主脚本 - 重构版
 * 主要包含全局变量声明和一些特定的游戏逻辑
 * 大部分功能已经模块化到其他文件中
 */

// Conditional Debug Panel Loader
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const DEBUG_MODE = urlParams.get('debug') === 'true';

    if (DEBUG_MODE) {
        console.log("Debug mode activated. Loading debug panel...");
        const script = document.createElement('script');
        script.src = 'js/debug.js';
        script.onload = () => {
            if (window.DebugPanel && typeof window.DebugPanel.init === 'function') {
                window.DebugPanel.init();
            } else {
                console.error("Failed to initialize Debug Panel. DebugPanel.init not found.");
            }
        };
        script.onerror = () => {
            console.error("Failed to load js/debug.js. Ensure the file exists and path is correct.");
        };
        document.body.appendChild(script);
    }
})();

// 注意：游戏对象数组已在gameStateManager.js中声明
// 包括：player, enemies, projectiles, enemyProjectiles, xpGems, worldObjects, 
//      visualEffects, damageNumbers, particles, activeGhosts, hazards

// 被动物品基础数组 - 初始化为空数组，passiveItems.js会自动填充
const BASE_PASSIVES = [];

// 注意：BASE_PASSIVES数组会在passiveItems.js中自动初始化和填充
// passiveItems.js中的registerCriticalPassives()函数会自动添加所有被动物品类

console.log("Emoji 幸存者 - 重构版 已加载完成！");

// 游戏主类
class Game {
    constructor() {
        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        this.pickups = [];
        this.damageNumbers = [];
        
        // 输入处理器
        this.inputHandler = new InputHandler();
        
        // 游戏统计
        this.startTime = Date.now();
        this.gameTime = 0;
        this.killCount = 0;
        
        // 初始化组件
        this.initializeComponents();
        
        // 强制重新注册被动物品
        this.forceRegisterPassiveItems();
    }
    
    /**
     * 强制重新注册被动物品到BASE_PASSIVES数组
     */
    forceRegisterPassiveItems() {
        console.log("强制重新注册被动物品...");
        
        // 清空BASE_PASSIVES数组
        if (typeof window.BASE_PASSIVES !== 'undefined') {
            window.BASE_PASSIVES.length = 0;
        } else {
            window.BASE_PASSIVES = [];
        }
        
        // 检查并重新添加被动物品类
        const passiveClasses = [
            'Spinach', 'Wings', 'Bracer', 'HollowHeart', 'AncientTreeSap',
            'EmptyBottle', 'Gargoyle', 'BarrierRune', 'FrostHeart', 
            'DragonSpice', 'ThunderAmulet', 'PoisonOrb', 'MagnetSphere', 'SoulRelic'
        ];
        
        let addedCount = 0;
        passiveClasses.forEach(className => {
            if (typeof window[className] === 'function') {
                window.BASE_PASSIVES.push(window[className]);
                addedCount++;
                console.log(`已添加被动物品类: ${className}`);
            } else {
                console.warn(`被动物品类${className}未找到`);
            }
        });
        
        console.log(`被动物品注册完成，共添加${addedCount}个类，BASE_PASSIVES现在有${window.BASE_PASSIVES.length}个类`);
        console.log('最终BASE_PASSIVES:', window.BASE_PASSIVES.map(p => p.name || p.constructor.name));
    }
}
