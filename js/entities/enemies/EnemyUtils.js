/**
 * EnemyUtils.js - 敌人相关工具函数
 * 从enemy.js中提取的工具函数
 */

/**
 * 通过名称获取敌人类型
 * @param {string} name - 敌人类型名称
 * @returns {Object} 敌人类型对象
 */
function getEnemyTypeByName(name) {
    return ENEMY_TYPES.find(type => type.name === name);
}

/**
 * 添加从点到线段距离的平方计算函数
 * @param {number} px - 点的X坐标
 * @param {number} py - 点的Y坐标
 * @param {number} x1 - 线段的起点X坐标
 * @param {number} y1 - 线段的起点Y坐标
 * @param {number} x2 - 线段的终点X坐标
 * @param {number} y2 - 线段的终点Y坐标
 * @returns {number} 从点到线段的距离平方
 */
function pointToLineDistanceSq(px, py, x1, y1, x2, y2) {
    const lengthSq = ((x2 - x1) * (x2 - x1)) + ((y2 - y1) * (y2 - y1));
    if (lengthSq === 0) return ((px - x1) * (px - x1)) + ((py - y1) * (py - y1));

    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / lengthSq;
    t = Math.max(0, Math.min(1, t));

    const nearestX = x1 + t * (x2 - x1);
    const nearestY = y1 + t * (y2 - y1);

    return ((px - nearestX) * (px - nearestX)) + ((py - nearestY) * (py - nearestY));
}

/**
 * 角度标准化函数
 * @param {number} angle - 需要标准化的角度
 * @returns {number} 标准化后的角度 (0 到 2π)
 */
function normalizeAngle(angle) {
    while (angle < 0) angle += Math.PI * 2;
    while (angle >= Math.PI * 2) angle -= Math.PI * 2;
    return angle;
} 