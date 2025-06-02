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
