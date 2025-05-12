/**
 * 被动物品基类
 * 所有被动物品的基础类
 */
class PassiveItem {
    /**
     * 构造函数
     * @param {string} name - 物品名称
     * @param {string} emoji - 表情符号
     * @param {string} description - 描述
     * @param {number} maxLevel - 最大等级
     */
    constructor(name, emoji, description, maxLevel) {
        // 物品名称
        this.name = name;
        // 表情符号
        this.emoji = emoji;

        // 描述
        this.description = description;
        // 等级
        this.level = 1;
        // 最大等级
        this.maxLevel = maxLevel || 5;
        // 拥有者
        this.owner = null;

        // 加成
        this.bonuses = {};

        // 计算加成
        this.calculateBonuses();
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        // 基类不做任何计算
        this.bonuses = {};
    }

    /**
     * 升级物品
     * @returns {boolean} 是否成功升级
     */
    upgrade() {
        // 如果已达到最大等级，不升级
        if (this.level >= this.maxLevel) {
            return false;
        }
        // 增加等级
        this.level++;

        // 重新计算加成
        this.calculateBonuses();
        return true;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        // 基类返回通用描述
        return `Lv${this.level + 1}: 提升物品属性。`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        // 基类返回通用描述
        return this.description;
    }

    /**
     * 检查是否达到最大等级
     * @returns {boolean} 是否达到最大等级
     */
    isMaxLevel() {
        return this.level >= this.maxLevel;
    }
}

// 定义可用被动物品类型 (此部分将被移至 passiveItems.js)
// const BASE_PASSIVES = [];
//
// // 检查并添加已定义的被动物品类
// // 确保这里的类名与 passiveItems.js 中定义的类名一致
// if (typeof Spinach !== 'undefined') BASE_PASSIVES.push(Spinach);
// if (typeof Armor !== 'undefined') BASE_PASSIVES.push(Armor);
// if (typeof Wings !== 'undefined') BASE_PASSIVES.push(Wings);
// if (typeof EmptyTome !== 'undefined') BASE_PASSIVES.push(EmptyTome);
// if (typeof Candelabrador !== 'undefined') BASE_PASSIVES.push(Candelabrador);
// if (typeof Bracer !== 'undefined') BASE_PASSIVES.push(Bracer);
// if (typeof HollowHeart !== 'undefined') BASE_PASSIVES.push(HollowHeart);
// if (typeof Pummarola !== 'undefined') BASE_PASSIVES.push(Pummarola);
// if (typeof Magnet !== 'undefined') BASE_PASSIVES.push(Magnet);
