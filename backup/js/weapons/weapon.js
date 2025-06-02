/**
 * 武器基类
 * 所有武器的基础类
 */
class Weapon {
    /**
     * 构造函数
     * @param {string} name - 武器名称
     * @param {string} emoji - 表情符号
     * @param {number} baseCooldown - 基础冷却时间
     * @param {number} maxLevel - 最大等级
     */
    constructor(name, emoji, baseCooldown, maxLevel) {
        // 武器名称
        this.name = name;
        // 表情符号
        this.emoji = emoji;
        // 基础冷却时间
        this.baseCooldown = baseCooldown;

        // 等级
        this.level = 1;
        // 最大等级
        this.maxLevel = maxLevel || 10;
        // 冷却计时器
        this.cooldownTimer = 0;
        // 拥有者
        this.owner = null;

        // 属性
        this.stats = {};
        // 计算属性
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        // 基类不做任何计算
        this.stats = {};
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 更新冷却计时器
        this.cooldownTimer -= dt;
        // 如果冷却结束，发射武器
        if (this.cooldownTimer <= 0) {
            // 发射武器
            this.fire(owner);
            // 重置冷却计时器
            this.cooldownTimer = this.stats.cooldown * (owner.getStat('cooldownMultiplier') || 1.0);
        }
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 基类不做任何操作
    }

    /**
     * 升级武器
     * @returns {boolean} 是否成功升级
     */
    upgrade() {
        // 如果已达到最大等级，不升级
        if (this.level >= this.maxLevel) {
            return false;
        }
        // 增加等级
        this.level++;
        // 重新计算属性
        this.calculateStats();
        return true;
    }

    /**
     * 获取拥有者属性
     * @param {Player} owner - 拥有者
     * @returns {Object} 拥有者属性
     */
    getOwnerStats(owner) {
        return {
            damageMultiplier: owner.getStat('damageMultiplier'),
            areaMultiplier: owner.getStat('areaMultiplier'),
            durationMultiplier: owner.getStat('durationMultiplier'),
            projectileSpeedMultiplier: owner.getStat('projectileSpeedMultiplier'),
            cooldownMultiplier: owner.getStat('cooldownMultiplier'),
            projectileCountBonus: owner.getStat('projectileCountBonus')
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        // 基类返回通用描述
        return `Lv${this.level + 1}: 提升武器属性。`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        // 基类返回通用描述
        return "一个基础武器。";
    }

    /**
     * 检查是否达到最大等级
     * @returns {boolean} 是否达到最大等级
     */
    isMaxLevel() {
        return this.level >= this.maxLevel;
    }
}

// --- 可用武器列表 ---
// const BASE_WEAPONS = [];

// 检查并添加已定义的武器类
// if (typeof DaggerWeapon !== 'undefined') BASE_WEAPONS.push(DaggerWeapon);
// if (typeof GarlicWeapon !== 'undefined') BASE_WEAPONS.push(GarlicWeapon);
// if (typeof WhipWeapon !== 'undefined') BASE_WEAPONS.push(WhipWeapon);

// --- 获取可用升级选项 ---
// function getAvailableUpgrades(player) { ... }
