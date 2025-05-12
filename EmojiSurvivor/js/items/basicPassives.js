/**
 * 菠菜被动物品类
 * 增加伤害
 */
class Spinach extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("菠菜", "🥬", "增加伤害。", 5);
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        this.bonuses = {
            damageMultiplier: {
                add: 0,
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        return [{
            item: this,
            type: 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +${10 * (this.level + 1)}% 伤害`;
    }
}

/**
 * 护甲被动物品类
 * 减少受到的伤害
 */
class Armor extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("护甲", "🛡️", "减少受到的伤害。", 5);
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        this.bonuses = {
            armor: {
                add: this.level,
                mult: 0
            }
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        return [{
            item: this,
            type: 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +${this.level + 1} 护甲`;
    }
}

/**
 * 翅膀被动物品类
 * 增加移动速度
 */
class Wings extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("翅膀", "🕊️", "增加移动速度。", 5);
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        this.bonuses = {
            speed: {
                add: 0,
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        return [{
            item: this,
            type: 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +${10 * (this.level + 1)}% 移动速度`;
    }
}

/**
 * 空白之书被动物品类
 * 减少武器冷却时间
 */
class EmptyTome extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("空白之书", "📖", "减少武器冷却时间。", 5);
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        this.bonuses = {
            cooldownMultiplier: {
                add: 0,
                mult: -0.08 * this.level
            }
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        return [{
            item: this,
            type: 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: -${8 * (this.level + 1)}% 武器冷却`;
    }
}

/**
 * 烛台被动物品类
 * 增加效果范围
 */
class CandelabradorPassive extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("烛台", "🕯️", "增加效果范围。", 5);
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        this.bonuses = {
            areaMultiplier: {
                add: 0,
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        return [{
            item: this,
            type: 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +${10 * (this.level + 1)}% 效果范围`;
    }
}

/**
 * 护腕被动物品类
 * 增加投射物速度
 */
class BracerPassive extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("护腕", "🥊", "增加投射物速度。", 5);
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        this.bonuses = {
            projectileSpeedMultiplier: {
                add: 0,
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        return [{
            item: this,
            type: 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +${10 * (this.level + 1)}% 投射物速度`;
    }
}

/**
 * 空虚之心被动物品类
 * 增加最大生命值
 */
class HollowHeartPassive extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("空虚之心", "❤️‍🔥", "增加最大生命值。", 5);
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        this.bonuses = {
            health: {
                add: 0,
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        return [{
            item: this,
            type: 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +${10 * (this.level + 1)}% 最大生命值`;
    }
}

/**
 * 番茄被动物品类
 * 增加生命恢复
 */
class PummarolaPassive extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("番茄", "🍅", "增加生命恢复。", 5);
    }

    /**
     * 计算加成
     */
    calculateBonuses() {
        this.bonuses = {
            regen: {
                add: 0.2 * this.level,
                mult: 0
            }
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        if (this.isMaxLevel()) return [];
        return [{
            item: this,
            type: 'upgrade_passive',
            text: `升级 ${this.name}`,
            description: this.getUpgradeDescription(),
            icon: this.emoji,
            level: this.level + 1,
            action: () => {
                this.upgrade();
            }
        }];
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +${0.2 * (this.level + 1)} 每秒生命恢复`;
    }
}
