/**
 * 被动道具基类
 * 所有被动道具都继承自这个基类
 */
class PassiveItem extends UpgradeableItem {
    /**
     * 构造函数
     * @param {string} name - 道具名称
     * @param {string} emoji - 道具表情符号
     * @param {number} maxLevel - 最大等级
     * @param {Object} baseBonuses - 基础加成
     */
    constructor(name, emoji, maxLevel, baseBonuses = {}) {
        super(name, emoji, maxLevel);
        this.baseBonuses = baseBonuses;
        this.bonuses = {};
        this.calculateStats();
    }

    /**
     * 应用初始加成
     * @param {Player} player - 玩家对象
     */
    applyInitialBonus(player) {
        this.calculateStats();
        player.recalculateStats();
    }

    /**
     * 升级后的回调
     */
    onUpgrade() {
        this.calculateStats();
        if (this.owner) {
            this.owner.recalculateStats();
            checkEvolution(this.owner, this);
        }
    }

    /**
     * 计算道具属性
     * 确保加成是累加的，而不是覆盖的
     */
    calculateStats() {
        this.bonuses = {};
        
        for (const statName in this.baseBonuses) {
            const bonus = this.baseBonuses[statName];
            this.bonuses[statName] = {};
            
            // 加法加成 (add) 随等级线性增长
            if (bonus.add !== undefined) {
                this.bonuses[statName].add = bonus.add * this.level;
            }
            
            // 乘法加成 (mult) 随等级线性增长
            if (bonus.mult !== undefined) {
                this.bonuses[statName].mult = bonus.mult * this.level;
            }
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let description = `提升 ${this.name}。`;
        
        // 计算下一级的加成
        const nextLevelBonuses = {};
        for (const statName in this.baseBonuses) {
            const bonus = this.baseBonuses[statName];
            nextLevelBonuses[statName] = {};
            
            if (bonus.add !== undefined) {
                nextLevelBonuses[statName].add = bonus.add * (this.level + 1);
            }
            
            if (bonus.mult !== undefined) {
                nextLevelBonuses[statName].mult = bonus.mult * (this.level + 1);
            }
        }
        
        // 添加特定属性的描述
        if (nextLevelBonuses.damageMultiplier?.mult) {
            description += ` (总伤害+${(nextLevelBonuses.damageMultiplier.mult * 100).toFixed(0)}%)`;
        }
        
        if (nextLevelBonuses.health?.mult) {
            description += ` (总生命+${(nextLevelBonuses.health.mult * 100).toFixed(0)}%)`;
        }
        
        if (nextLevelBonuses.armor?.add) {
            description += ` (总护甲 ${nextLevelBonuses.armor.add})`;
        }
        
        return description;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        let description = `获得 ${this.name}。`;
        
        if (this.bonuses.damageMultiplier?.mult) {
            description += ` (伤害+${(this.bonuses.damageMultiplier.mult * 100).toFixed(0)}%)`;
        }
        
        if (this.bonuses.health?.mult) {
            description += ` (生命+${(this.bonuses.health.mult * 100).toFixed(0)}%)`;
        }
        
        if (this.bonuses.armor?.add) {
            description += ` (护甲 ${this.bonuses.armor.add})`;
        }
        
        return description;
    }
}