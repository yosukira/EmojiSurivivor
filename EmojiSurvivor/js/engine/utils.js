/**
 * 工具函数
 */

// 格式化时间为 m:ss 格式
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// 随机打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 计算两点之间的距离
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

// 计算两点之间的距离的平方 (性能优化)
function distanceSq(x1, y1, x2, y2) {
    return (x2 - x1) ** 2 + (y2 - y1) ** 2;
}

// 计算角度 (弧度)
function angle(x1, y1, x2, y2) {
    return Math.atan2(y2 - y1, x2 - x1);
}

// 线性插值
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// 限制值在范围内
function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

// 随机整数 (包含 min 和 max)
function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 随机浮点数 (包含 min, 不包含 max)
function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

// 随机选择数组中的一个元素
function randomChoice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

// 检查概率是否命中
function chance(probability) {
    return Math.random() < probability;
}

// 计算世界坐标到屏幕坐标的转换
function worldToScreen(worldX, worldY, cameraX, cameraY) {
    return {
        x: worldX - cameraX + GAME_WIDTH / 2,
        y: worldY - cameraY + GAME_HEIGHT / 2
    };
}

// 计算屏幕坐标到世界坐标的转换
function screenToWorld(screenX, screenY, cameraX, cameraY) {
    return {
        x: screenX + cameraX - GAME_WIDTH / 2,
        y: screenY + cameraY - GAME_HEIGHT / 2
    };
}

// 检查对象是否在屏幕内
function isOnScreen(worldX, worldY, cameraX, cameraY, padding = 100) {
    const screen = worldToScreen(worldX, worldY, cameraX, cameraY);
    return screen.x >= -padding && 
           screen.x <= GAME_WIDTH + padding && 
           screen.y >= -padding && 
           screen.y <= GAME_HEIGHT + padding;
}

// 生成随机位置 (在屏幕外围)
function getRandomSpawnPosition(cameraX, cameraY) {
    // 选择一个边缘
    const edge = Math.floor(Math.random() * 4);
    let x, y;
    
    switch(edge) {
        case 0: // 上边缘
            x = randomFloat(cameraX - GAME_WIDTH/2 - SPAWN_PADDING, cameraX + GAME_WIDTH/2 + SPAWN_PADDING);
            y = cameraY - GAME_HEIGHT/2 - SPAWN_PADDING;
            break;
        case 1: // 右边缘
            x = cameraX + GAME_WIDTH/2 + SPAWN_PADDING;
            y = randomFloat(cameraY - GAME_HEIGHT/2 - SPAWN_PADDING, cameraY + GAME_HEIGHT/2 + SPAWN_PADDING);
            break;
        case 2: // 下边缘
            x = randomFloat(cameraX - GAME_WIDTH/2 - SPAWN_PADDING, cameraX + GAME_WIDTH/2 + SPAWN_PADDING);
            y = cameraY + GAME_HEIGHT/2 + SPAWN_PADDING;
            break;
        case 3: // 左边缘
            x = cameraX - GAME_WIDTH/2 - SPAWN_PADDING;
            y = randomFloat(cameraY - GAME_HEIGHT/2 - SPAWN_PADDING, cameraY + GAME_HEIGHT/2 + SPAWN_PADDING);
            break;
    }
    
    return { x, y };
}

// 生成随机位置 (在世界范围内)
function getRandomWorldPosition() {
    return {
        x: randomFloat(-WORLD_SIZE/2, WORLD_SIZE/2),
        y: randomFloat(-WORLD_SIZE/2, WORLD_SIZE/2)
    };
}

// 检查是否为暴击
function isCriticalHit(critChance) {
    return Math.random() < critChance;
}

// 计算暴击伤害
function calculateCriticalDamage(damage, critDamage) {
    return Math.round(damage * critDamage);
}

// 创建HTML元素
function createElement(tag, className, parent, text = '') {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    if (parent) parent.appendChild(element);
    return element;
}

// 防抖函数
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}