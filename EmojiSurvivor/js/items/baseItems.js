/**
 * 可升级物品基类
 * 所有可升级物品的基础类
 */
class UpgradeableItem {
    /**
     * 构造函数
     * @param {string} name - 名称
     * @param {string} emoji - 表情符号
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
     * 检查是否达到最大等级
     * @returns {boolean} 是否达到最大等级
     */
    isMaxLevel() {
        return this.level >= this.maxLevel;
    }

    /**
     * 升级物品
     * @returns {boolean} 是否成功升级
     */
    upgrade() {
        if (!this.isMaxLevel()) {
            this.level++;
            console.log(`${this.name} 升级到 ${this.level}级`);
            this.onUpgrade();
            return true;
        }
        return false;
    }

    /**
     * 升级处理
     */
    onUpgrade() {
        // 子类实现
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
     * @param {Player} player - 玩家
     * @returns {Array} 基础升级选项
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
     * @param {Player} player - 玩家
     * @returns {Array} 当前升级选项
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
                if (this instanceof Weapon || this instanceof PassiveItem) {
                    checkEvolution(player, this);
                }
            }
        }];
    }
}

/**
 * 武器基类
 * 所有武器的基础类
 */
class Weapon extends UpgradeableItem {
    /**
     * 构造函数
     * @param {string} name - 名称
     * @param {string} emoji - 表情符号
     * @param {number} baseCooldown - 基础冷却时间
     * @param {number} maxLevel - 最大等级
     */
    constructor(name, emoji, baseCooldown, maxLevel) {
        super(name, emoji, maxLevel);
        
        // 基础冷却时间
        this.baseCooldown = baseCooldown;
        
        // 冷却计时器
        this.cooldownTimer = 0;
        
        // 属性
        this.stats = {};
        
        // 计算属性
        this.calculateStats();
        
        // 初始化冷却计时器
        if (this.stats && this.stats.cooldown && !isNaN(this.stats.cooldown) && this.stats.cooldown > 0) {
            this.cooldownTimer = this.stats.cooldown;
        } else {
            console.error(`!!! ${this.name} 无法计算初始属性, 使用基础冷却 ${this.baseCooldown}`);
            this.cooldownTimer = this.baseCooldown;
        }
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 检查属性是否已计算
        if (!this.stats || Object.keys(this.stats).length === 0) {
            this.calculateStats();
            if (!this.stats || Object.keys(this.stats).length === 0) {
                console.error(`!!! ${this.name} 无法计算属性。无法攻击。`);
                return;
            }
        }
        
        // 检查冷却计时器是否有效
        if (isNaN(this.cooldownTimer)) {
            console.warn(`!!! ${this.name} 计时器为 NaN。重置。`);
            this.cooldownTimer = this.stats?.cooldown || this.baseCooldown;
        }
        
        // 更新冷却计时器
        const cooldownMultiplier = owner.getStat('cooldownMultiplier');
        if (isNaN(cooldownMultiplier) || cooldownMultiplier <= 0) {
            this.cooldownTimer -= dt * 1.0;
        } else {
            this.cooldownTimer -= dt * cooldownMultiplier;
        }
        
        // 如果冷却结束，发射武器
        if (this.cooldownTimer <= 0) {
            // 发射武器
            if (typeof this.fire === 'function') {
                this.fire(owner);
            } else {
                console.error(`!!! ${this.name} 未找到 fire 方法`);
            }
            
            // 重置冷却计时器
            const resetValue = this.stats?.cooldown;
            if (isNaN(resetValue) || resetValue <= 0) {
                console.error(`!!! ${this.name} 冷却值无效: ${resetValue}。使用基础冷却: ${this.baseCooldown} 重置。`);
                this.cooldownTimer += this.baseCooldown;
            } else {
                this.cooldownTimer += resetValue;
            }
        }
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        console.warn(`${this.name} fire() 未在子类中实现`);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        console.warn(`${this.name} calculateStats() 未在子类中实现`);
    }

    /**
     * 获取拥有者属性
     * @param {Player} owner - 拥有者
     * @returns {Object} 拥有者属性
     */
    getOwnerStats(owner) {
        return {
            x: owner.x,
            y: owner.y,
            damageMultiplier: owner.getStat('damageMultiplier'),
            areaMultiplier: owner.getStat('areaMultiplier'),
            durationMultiplier: owner.getStat('durationMultiplier'),
            projectileSpeedMultiplier: owner.getStat('projectileSpeedMultiplier'),
            projectileCountBonus: owner.getStat('projectileCountBonus') || 0,
            luck: owner.luck,
            lastMoveDirection: owner.lastMoveDirection
        };
    }
}

/**
 * 被动物品基类
 * 所有被动物品的基础类
 */
class PassiveItem extends UpgradeableItem {
    /**
     * 构造函数
     * @param {string} name - 名称
     * @param {string} emoji - 表情符号
     * @param {number} maxLevel - 最大等级
     * @param {Object} baseBonuses - 基础加成
     */
    constructor(name, emoji, maxLevel, baseBonuses = {}) {
        super(name, emoji, maxLevel);
        
        // 基础加成
        this.baseBonuses = baseBonuses;
        
        // 当前加成
        this.bonuses = {};
        
        // 计算属性
        this.calculateStats();
    }

    /**
     * 应用初始加成
     * @param {Player} player - 玩家
     */
    applyInitialBonus(player) {
        // 计算属性
        this.calculateStats();
        
        // 重新计算玩家属性
        player.recalculateStats();
    }

    /**
     * 升级处理
     */
    onUpgrade() {
        // 计算属性
        this.calculateStats();
        
        // 如果有拥有者，重新计算拥有者属性
        if (this.owner) {
            this.owner.recalculateStats();
            checkEvolution(this.owner, this);
        }
    }

    /**
     * 计算属性
     */
    calculateStats() {
        // 清空当前加成
        this.bonuses = {};
        
        // 计算每个属性的加成
        for (const statName in this.baseBonuses) {
            const baseBonus = this.baseBonuses[statName];
            this.bonuses[statName] = {};
            
            // 计算加法加成
            if (baseBonus.add !== undefined) {
                this.bonuses[statName].add = baseBonus.add * this.level;
            }
            
            // 计算乘法加成
            if (baseBonus.mult !== undefined) {
                this.bonuses[statName].mult = baseBonus.mult * this.level;
            }
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `提升 ${this.name}。`;
        
        // 计算下一级属性
        const nextLevelBonuses = {};
        for (const statName in this.baseBonuses) {
            const baseBonus = this.baseBonuses[statName];
            nextLevelBonuses[statName] = {};
            
            // 计算加法加成
            if (baseBonus.add !== undefined) {
                nextLevelBonuses[statName].add = baseBonus.add * (this.level + 1);
            }
            
            // 计算乘法加成
            if (baseBonus.mult !== undefined) {
                nextLevelBonuses[statName].mult = baseBonus.mult * (this.level + 1);
            }
        }
        
        // 添加特定属性描述
        if (nextLevelBonuses.damageMultiplier?.mult) {
            desc += ` (总伤害+${(nextLevelBonuses.damageMultiplier.mult * 100).toFixed(0)}%)`;
        }
        
        if (nextLevelBonuses.health?.mult) {
            desc += ` (总生命+${(nextLevelBonuses.health.mult * 100).toFixed(0)}%)`;
        }
        
        if (nextLevelBonuses.armor?.add) {
            desc += ` (总护甲 ${nextLevelBonuses.armor.add})`;
        }
        
        return desc;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        let desc = `获得 ${this.name}。`;
        
        // 添加特定属性描述
        if (this.bonuses.damageMultiplier?.mult) {
            desc += ` (伤害+${(this.bonuses.damageMultiplier.mult * 100).toFixed(0)}%)`;
        }
        
        if (this.bonuses.health?.mult) {
            desc += ` (生命+${(this.bonuses.health.mult * 100).toFixed(0)}%)`;
        }
        
        if (this.bonuses.armor?.add) {
            desc += ` (护甲 ${this.bonuses.armor.add})`;
        }
        
        return desc;
    }
}