/**
 * 武器系统基类
 * 所有武器都继承自这个基类
 */
class Weapon extends UpgradeableItem {
    constructor(name, emoji, baseCooldown, maxLevel) {
        super(name, emoji, maxLevel);
        this.baseCooldown = baseCooldown;
        this.cooldownTimer = 0;
        this.stats = {};
        this.calculateStats();
        
        // 确保初始冷却时间正确设置
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
     * @param {Player} owner - 武器拥有者
     */
    update(dt, owner) {
        // 确保属性已计算
        if (!this.stats || Object.keys(this.stats).length === 0) {
            this.calculateStats();
            if (!this.stats || Object.keys(this.stats).length === 0) {
                console.error(`!!! ${this.name} 无法计算属性。无法攻击。`);
                return;
            }
        }

        // 处理冷却计时器
        if (isNaN(this.cooldownTimer)) {
            console.warn(`!!! ${this.name} 计时器为 NaN。重置。`);
            this.cooldownTimer = this.stats?.cooldown || this.baseCooldown;
        }

        // 应用冷却减少效果
        const cooldownMultiplier = owner.getStat('cooldownMultiplier');
        if (isNaN(cooldownMultiplier) || cooldownMultiplier <= 0) {
            this.cooldownTimer -= dt * 1.0;
        } else {
            this.cooldownTimer -= dt * cooldownMultiplier;
        }

        // 当冷却结束时发射武器
        if (this.cooldownTimer <= 0) {
            if (typeof this.fire === 'function') {
                this.fire(owner);
            } else {
                console.error(`!!! ${this.name} 未找到 fire 方法`);
            }

            // 重置冷却时间
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
     * 发射武器（子类必须实现）
     * @param {Player} owner - 武器拥有者
     */
    fire(owner) {
        console.warn(`${this.name} fire() 未在子类中实现`);
    }

    /**
     * 计算武器属性（子类必须实现）
     */
    calculateStats() {
        console.warn(`${this.name} calculateStats() 未在子类中实现`);
    }

    /**
     * 获取拥有者的属性
     * @param {Player} owner - 武器拥有者
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
            lastMoveDirection: owner.lastMoveDirection,
            critChance: owner.getStat('critChance') || 0.05,
            critDamage: owner.getStat('critDamage') || 1.5
        };
    }
}