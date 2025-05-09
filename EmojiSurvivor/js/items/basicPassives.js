/**
 * 菠菜被动物品类
 * 增加伤害
 */
class SpinachPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "菠菜";
    static Emoji = "🥬";
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(SpinachPassive.Name, SpinachPassive.Emoji, SpinachPassive.MaxLevel);
    }

    /**
     * 计算属性加成
     */
    calculateBonuses() {
        this.bonuses = {
            damageMultiplier: {
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +10% 伤害 (总计 ${(this.level + 1) * 10}%)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "增加伤害。";
    }
}

/**
 * 护甲被动物品类
 * 减少受到的伤害
 */
class ArmorPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "护甲";
    static Emoji = "🛡️";
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(ArmorPassive.Name, ArmorPassive.Emoji, ArmorPassive.MaxLevel);
    }

    /**
     * 计算属性加成
     */
    calculateBonuses() {
        this.bonuses = {
            armor: {
                add: this.level
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +1 护甲 (总计 ${this.level + 1})`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "减少受到的伤害。";
    }
}

/**
 * 翅膀被动物品类
 * 增加移动速度
 */
class WingsPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "翅膀";
    static Emoji = "🕊️";
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(WingsPassive.Name, WingsPassive.Emoji, WingsPassive.MaxLevel);
    }

    /**
     * 计算属性加成
     */
    calculateBonuses() {
        this.bonuses = {
            speed: {
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +10% 移动速度 (总计 ${(this.level + 1) * 10}%)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "增加移动速度。";
    }
}

/**
 * 魔法书被动物品类
 * 减少武器冷却时间
 */
class TomePassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "魔法书";
    static Emoji = "📖";
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(TomePassive.Name, TomePassive.Emoji, TomePassive.MaxLevel);
    }

    /**
     * 计算属性加成
     */
    calculateBonuses() {
        this.bonuses = {
            cooldownMultiplier: {
                mult: -0.08 * this.level
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: -8% 冷却时间 (总计 -${(this.level + 1) * 8}%)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "减少武器冷却时间。";
    }
}

/**
 * 烛台被动物品类
 * 增加武器范围
 */
class CandelabradorPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "烛台";
    static Emoji = "🕯️";
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(CandelabradorPassive.Name, CandelabradorPassive.Emoji, CandelabradorPassive.MaxLevel);
    }

    /**
     * 计算属性加成
     */
    calculateBonuses() {
        this.bonuses = {
            areaMultiplier: {
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +10% 武器范围 (总计 ${(this.level + 1) * 10}%)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "增加武器范围。";
    }
}

/**
 * 拳套被动物品类
 * 增加投射物速度
 */
class BracerPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "拳套";
    static Emoji = "🥊";
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(BracerPassive.Name, BracerPassive.Emoji, BracerPassive.MaxLevel);
    }

    /**
     * 计算属性加成
     */
    calculateBonuses() {
        this.bonuses = {
            projectileSpeedMultiplier: {
                mult: 0.1 * this.level
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +10% 投射物速度 (总计 ${(this.level + 1) * 10}%)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "增加投射物速度。";
    }
}

/**
 * 空心之心被动物品类
 * 增加最大生命值
 */
class HollowHeartPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "空心之心";
    static Emoji = "❤️‍🔥";
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(HollowHeartPassive.Name, HollowHeartPassive.Emoji, HollowHeartPassive.MaxLevel);
    }

    /**
     * 计算属性加成
     */
    calculateBonuses() {
        this.bonuses = {
            health: {
                mult: 0.2 * this.level
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +20% 最大生命值 (总计 ${(this.level + 1) * 20}%)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "增加最大生命值。";
    }
}

/**
 * 番茄被动物品类
 * 增加生命恢复
 */
class PummarolaPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "番茄";
    static Emoji = "🍅";
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(PummarolaPassive.Name, PummarolaPassive.Emoji, PummarolaPassive.MaxLevel);
    }

    /**
     * 计算属性加成
     */
    calculateBonuses() {
        this.bonuses = {
            regen: {
                add: this.level
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +1 生命恢复/秒 (总计 ${this.level + 1}/秒)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "增加生命恢复。";
    }
}