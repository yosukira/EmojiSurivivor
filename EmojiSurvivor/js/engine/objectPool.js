/**
 * 对象池管理器
 * 用于管理和重用游戏对象，减少垃圾回收
 */
class ObjectPool {
    /**
     * 构造函数
     */
    constructor() {
        // 投射物对象池
        this.projectiles = [];

        // 伤害数字对象池
        this.damageNumbers = [];

        // 视觉效果对象池
        this.visualEffects = [];

        // 经验宝石对象池
        this.xpGems = [];

        // 拾取物对象池
        this.pickups = [];
    }

    /**
     * 获取投射物
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} pierce - 穿透次数
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @returns {Projectile} 投射物实例
     */
    getProjectile(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats) {
        let projectile;

        // 如果对象池中有可用对象，重用它
        if (this.projectiles.length > 0) {
            projectile = this.projectiles.pop();
            projectile.init(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats);
        } else {
            // 否则创建新对象
            projectile = new Projectile(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats);
        }

        return projectile;
    }

    /**
     * 回收投射物
     * @param {Projectile} projectile - 投射物实例
     */
    recycleProjectile(projectile) {
        if (!projectile) return;

        // 重置对象状态
        projectile.reset();

        // 添加到对象池
        this.projectiles.push(projectile);
    }

    /**
     * 获取伤害数字
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} text - 文本
     * @param {number} size - 大小
     * @param {string} color - 颜色
     * @param {number} duration - 持续时间
     * @returns {DamageNumber} 伤害数字实例
     */
    getDamageNumber(x, y, text, size = 20, color = 'white', duration = 0.8) {
        let damageNumber;

        // 如果对象池中有可用对象，重用它
        if (this.damageNumbers.length > 0) {
            damageNumber = this.damageNumbers.pop();
            damageNumber.init(x, y, text, color, duration);
        } else {
            // 否则创建新对象
            damageNumber = new DamageNumber(x, y, text, size, color, duration);
        }

        return damageNumber;
    }

    /**
     * 回收伤害数字
     * @param {DamageNumber} damageNumber - 伤害数字实例
     */
    recycleDamageNumber(damageNumber) {
        if (!damageNumber) return;

        // 重置对象状态
        damageNumber.reset();

        // 添加到对象池
        this.damageNumbers.push(damageNumber);
    }

    /**
     * 获取经验宝石
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} value - 经验值
     * @returns {ExperienceGem} 经验宝石实例
     */
    getXPGem(x, y, value) {
        let xpGem;

        // 如果对象池中有可用对象，重用它
        if (this.xpGems.length > 0) {
            xpGem = this.xpGems.pop();
            xpGem.x = x;
            xpGem.y = y;
            xpGem.value = value;
            xpGem.isActive = true;
            xpGem.isGarbage = false;
        } else {
            // 否则创建新对象
            xpGem = new ExperienceGem(x, y, value);
        }

        return xpGem;
    }

    /**
     * 回收经验宝石
     * @param {ExperienceGem} xpGem - 经验宝石实例
     */
    recycleXPGem(xpGem) {
        if (!xpGem) return;

        // 重置对象状态
        xpGem.reset();

        // 添加到对象池
        this.xpGems.push(xpGem);
    }

    /**
     * 获取拾取物
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {string} type - 类型
     * @param {number} value - 值
     * @returns {Pickup} 拾取物实例
     */
    getPickup(x, y, emoji, type, value) {
        let pickup;

        // 如果对象池中有可用对象，重用它
        if (this.pickups.length > 0) {
            pickup = this.pickups.pop();
            pickup.x = x;
            pickup.y = y;
            pickup.emoji = emoji;
            pickup.type = type;
            pickup.value = value;
            pickup.lifetime = 12;
            pickup.isActive = true;
            pickup.isGarbage = false;
        } else {
            // 否则创建新对象
            pickup = new Pickup(x, y, emoji, type, value);
        }

        return pickup;
    }

    /**
     * 回收拾取物
     * @param {Pickup} pickup - 拾取物实例
     */
    recyclePickup(pickup) {
        if (!pickup) return;

        // 重置对象状态
        pickup.reset();

        // 添加到对象池
        this.pickups.push(pickup);
    }

    /**
     * 清理对象池
     * 当对象池过大时调用，减少内存占用
     */
    cleanup() {
        // 限制对象池大小
        const maxPoolSize = 100;

        if (this.projectiles.length > maxPoolSize) {
            this.projectiles.length = maxPoolSize;
        }

        if (this.damageNumbers.length > maxPoolSize) {
            this.damageNumbers.length = maxPoolSize;
        }

        if (this.xpGems.length > maxPoolSize) {
            this.xpGems.length = maxPoolSize;
        }

        if (this.pickups.length > maxPoolSize) {
            this.pickups.length = maxPoolSize;
        }
    }
}

// 创建全局对象池实例
const objectPool = new ObjectPool();

/**
 * 生成投射物
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {string} emoji - 表情符号
 * @param {number} size - 大小
 * @param {number} vx - X速度
 * @param {number} vy - Y速度
 * @param {number} damage - 伤害
 * @param {number} pierce - 穿透次数
 * @param {number} duration - 持续时间
 * @param {Object} ownerStats - 拥有者属性
 * @returns {Projectile} 投射物实例
 */
function spawnProjectile(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats) {
    const projectile = objectPool.getProjectile(x, y, emoji, size, vx, vy, damage, pierce, duration, ownerStats);
    projectiles.push(projectile);
    return projectile;
}

/**
 * 生成伤害数字
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {string} text - 文本
 * @param {number} size - 大小
 * @param {string} color - 颜色
 * @param {number} duration - 持续时间
 * @returns {DamageNumber} 伤害数字实例
 */
function spawnDamageNumber(x, y, text, size = 20, color = 'white', duration = 0.8) {
    const damageNumber = objectPool.getDamageNumber(x, y, text, size, color, duration);
    damageNumbers.push(damageNumber);
    return damageNumber;
}

/**
 * 生成经验宝石
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {number} value - 经验值
 * @returns {ExperienceGem} 经验宝石实例
 */
function spawnXPGem(x, y, value) {
    const xpGem = objectPool.getXPGem(x, y, value);
    xpGems.push(xpGem);
    return xpGem;
}

/**
 * 生成拾取物
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 * @param {string} emoji - 表情符号
 * @param {string} type - 类型
 * @param {number} value - 值
 * @returns {Pickup} 拾取物实例
 */
function spawnPickup(x, y, emoji, type, value) {
    const pickup = objectPool.getPickup(x, y, emoji, type, value);
    worldObjects.push(pickup);
    return pickup;
}

/**
 * 回收垃圾对象
 * 在每帧更新后调用，回收标记为垃圾的对象
 */
function recycleGarbage() {
    // 回收投射物
    for (let i = projectiles.length - 1; i >= 0; i--) {
        if (projectiles[i].isGarbage) {
            const projectile = projectiles.splice(i, 1)[0];
            objectPool.recycleProjectile(projectile);
        }
    }

    // 回收伤害数字
    for (let i = damageNumbers.length - 1; i >= 0; i--) {
        if (damageNumbers[i].isGarbage) {
            const damageNumber = damageNumbers.splice(i, 1)[0];
            objectPool.recycleDamageNumber(damageNumber);
        }
    }

    // 回收经验宝石
    for (let i = xpGems.length - 1; i >= 0; i--) {
        if (xpGems[i].isGarbage) {
            const xpGem = xpGems.splice(i, 1)[0];
            objectPool.recycleXPGem(xpGem);
        }
    }

    // 回收拾取物
    for (let i = worldObjects.length - 1; i >= 0; i--) {
        if (worldObjects[i].isGarbage && worldObjects[i] instanceof Pickup) {
            const pickup = worldObjects.splice(i, 1)[0];
            objectPool.recyclePickup(pickup);
        }
    }

    // 移除其他垃圾对象
    worldObjects = worldObjects.filter(obj => !obj.isGarbage);
    visualEffects = visualEffects.filter(effect => !effect.isGarbage);

    // 定期清理对象池
    if (gameTime % 60 < 1) {
        objectPool.cleanup();
    }
}
