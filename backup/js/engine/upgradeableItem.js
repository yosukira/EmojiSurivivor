/**
 * 可升级物品基类
 * 所有可升级的物品（武器和被动道具）都继承自这个基类
 */
class UpgradeableItem {
    /**
     * 构造函数
     * @param {string} name - 物品名称
     * @param {string} emoji - 物品表情符号
     * @param {number} maxLevel - 最大等级
     */
    constructor(name, emoji, maxLevel = 8) {
        this.name = name;
        this.emoji = emoji;
        this.level = 1;
        this.maxLevel = maxLevel;
        this.owner = null;
    }

    /**
     * 获取当前等级
     * @returns {number} 当前等级
     */
    getLevel() {
        return this.level;
    }

    /**
     * 检查是否已达到最大等级
     * @returns {boolean} 是否已达到最大等级
     */
    isMaxLevel() {
        return this.level >= this.maxLevel;
    }

    /**
     * 升级物品
     * @returns {boolean} 是否升级成功
     */
    upgrade() {
        if (!this.isMaxLevel()) {
            this.level++;
            this.onUpgrade();
            return true;
        }
        return false;
    }

    /**
     * 升级后的回调（子类可以覆盖）
     */
    onUpgrade() {
        // 子类可以覆盖此方法
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `提升 ${this.name} 效果。`;
    }

    /**
     * 获取基础升级选项
     * @param {Player} player - 玩家对象
     * @returns {Array} 升级选项数组
     */
    getBaseUpgradeOptions(player) {
        return [{
            item: this,
            type: this instanceof Weapon ? 'new_weapon' : 'new_passive',
            text: `获得 ${this.name}`,
            description: this.getInitialDescription ? this.getInitialDescription() : `添加 ${this.name}。`,
            icon: this.emoji,
            action: () => {
                if (this instanceof Weapon) {
                    player.addWeapon(this);
                } else {
                    player.addPassive(this);
                }
            }
        }];
    }

    /**
     * 获取当前升级选项
     * @param {Player} player - 玩家对象
     * @returns {Array} 升级选项数组
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        
        return [{
            item: this,
            type: this instanceof Weapon ? 'upgrade_weapon' : 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }
}