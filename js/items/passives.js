/**
 * 磁铁被动道具类
 * 增加拾取范围
 */
class MagnetPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "磁铁";
    static Emoji = EMOJI.PASSIVE_MAGNET;
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(MagnetPassive.Name, MagnetPassive.Emoji, MagnetPassive.MaxLevel);
    }

    /**
     * 计算属性
     */
    calculateStats() {
        this.stats = {
            pickupRadius: 30 + (this.level - 1) * 30
        };
    }

    /**
     * 更新状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 磁铁不再有自动吸取效果，只增加拾取范围
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const currentRadius = 30 + (this.level - 1) * 30;
        const nextRadius = 30 + this.level * 30;
        return `Lv${this.level + 1}: 拾取范围 +30 (${currentRadius} → ${nextRadius})`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "增加拾取范围，更容易拾取经验宝石。";
    }
}

/**
 * 心脏被动道具类
 * 增加最大生命值
 */
class HeartPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "心脏";
    static Emoji = EMOJI.PASSIVE_HOLLOW_HEART;
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(HeartPassive.Name, HeartPassive.Emoji, HeartPassive.MaxLevel);
    }

    /**
     * 计算属性
     */
    calculateStats() {
        this.stats = {
            health: 20 * this.level
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const currentHealth = 20 * this.level;
        const nextHealth = 20 * (this.level + 1);
        return `Lv${this.level + 1}: 最大生命值 +20 (${currentHealth} → ${nextHealth})`;
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
 * 番茄被动道具类
 * 增加生命恢复
 */
class TomatoPassive extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "番茄";
    static Emoji = EMOJI.PASSIVE_PUMMAROLA;
    static MaxLevel = 5;

    /**
     * 构造函数
     */
    constructor() {
        super(TomatoPassive.Name, TomatoPassive.Emoji, TomatoPassive.MaxLevel);
    }

    /**
     * 计算属性
     */
    calculateStats() {
        // 降低恢复率，原来是0.3 * this.level
        this.stats = {
            regen: 0.15 * this.level
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const currentRegen = (0.15 * this.level).toFixed(2);
        const nextRegen = (0.15 * (this.level + 1)).toFixed(2);
        return `Lv${this.level + 1}: 生命恢复 +0.15 (${currentRegen} → ${nextRegen})/秒`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "增加生命恢复速度。";
    }
} 