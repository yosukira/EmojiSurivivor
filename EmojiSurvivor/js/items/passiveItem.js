/**
 * 被动物品基类
 * 所有被动物品的基础类
 */
class PassiveItem {
    /**
     * 构造函数
     * @param {string} name - 物品名称
     * @param {string} emoji - 表情符号
     * @param {number} maxLevel - 最大等级
     */
    constructor(name, emoji, maxLevel) {
        // 物品名称
        this.name = name;
        
        // 表情符号
        this.emoji = emoji;
        
        // 等级
        this.level = 1;
        
        // 最大等级
        this.maxLevel = maxLevel || 5;
        
        // 拥有者
        this.owner = null;
        
        // 属性加成
        this.bonuses = {};
        
        // 计算属性加成
        this.calculateBonuses();
    }

    /**
     * 计算属性加成
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
        
        // 重新计算属性加成
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
        return "一个基础被动物品。";
    }
}

// --- 可用被动物品列表 ---
const BASE_PASSIVES = [
    {
        name: "菠菜",
        emoji: "🥬",
        description: "增加伤害。",
        constructor: SpinachPassive
    },
    {
        name: "护甲",
        emoji: "🛡️",
        description: "减少受到的伤害。",
        constructor: ArmorPassive
    },
    {
        name: "翅膀",
        emoji: "🕊️",
        description: "增加移动速度。",
        constructor: WingsPassive
    },
    {
        name: "魔法书",
        emoji: "📖",
        description: "减少武器冷却时间。",
        constructor: TomePassive
    },
    {
        name: "烛台",
        emoji: "🕯️",
        description: "增加武器范围。",
        constructor: CandelabradorPassive
    },
    {
        name: "拳套",
        emoji: "🥊",
        description: "增加投射物速度。",
        constructor: BracerPassive
    },
    {
        name: "空心之心",
        emoji: "❤️‍🔥",
        description: "增加最大生命值。",
        constructor: HollowHeartPassive
    },
    {
        name: "番茄",
        emoji: "🍅",
        description: "增加生命恢复。",
        constructor: PummarolaPassive
    }
];