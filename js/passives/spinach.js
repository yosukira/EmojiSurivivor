/**
 * 菠菜被动道具
 * 增加伤害
 */
class Spinach extends PassiveItem {
    static Name = "菠菜";
    static Emoji = EMOJI.PASSIVE_SPINACH;

    /**
     * 构造函数
     */
    constructor() {
        // 修复伤害加成不生效的问题，确保使用 damageMultiplier 属性
        super(Spinach.Name, Spinach.Emoji, 5, {
            damageMultiplier: { mult: 0.1 } // 每级增加10%伤害
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `提升 10% 伤害。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再提升 10% 伤害 (总计: +${((this.level + 1) * 10).toFixed(0)}%)。`;
    }
}