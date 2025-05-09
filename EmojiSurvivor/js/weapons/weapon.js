/**
 * 武器基类
 * 所有武器的基础类
 */
class Weapon {
    /**
     * 构造函数
     * @param {string} name - 武器名称
     * @param {string} emoji - 表情符号
     * @param {number} baseCooldown - 基础冷却时间
     * @param {number} maxLevel - 最大等级
     */
    constructor(name, emoji, baseCooldown, maxLevel) {
        // 武器名称
        this.name = name;
        
        // 表情符号
        this.emoji = emoji;
        
        // 等级
        this.level = 1;
        
        // 基础冷却时间
        this.baseCooldown = baseCooldown;
        
        // 最大等级
        this.maxLevel = maxLevel || 8;
        
        // 冷却计时器
        this.cooldownTimer = 0;
        
        // 拥有者
        this.owner = null;
        
        // 是否进化
        this.isEvolved = false;
        
        // 计算属性
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        // 基类不做任何计算
        this.stats = {
            damage: 10,
            projectileSpeed: 300,
            cooldown: this.baseCooldown,
            count: 1,
            pierce: 0,
            duration: 1.0
        };
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 更新冷却计时器
        this.cooldownTimer -= dt;
        
        // 如果冷却结束，发射武器
        if (this.cooldownTimer <= 0) {
            // 发射武器
            this.fire(owner);
            
            // 重置冷却计时器
            this.cooldownTimer = this.stats.cooldown * (owner.getStat('cooldownMultiplier') || 1.0);
        }
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 基类不做任何发射
        console.warn("武器基类的fire方法被调用，应该由子类实现");
    }

    /**
     * 升级武器
     * @returns {boolean} 是否成功升级
     */
    upgrade() {
        // 如果已达到最大等级，不升级
        if (this.level >= this.maxLevel) {
            return false;
        }
        
        // 增加等级
        this.level++;
        
        // 重新计算属性
        this.calculateStats();
        
        return true;
    }

    /**
     * 进化武器
     * @param {string} newName - 新武器名称
     * @param {string} newEmoji - 新表情符号
     * @returns {boolean} 是否成功进化
     */
    evolve(newName, newEmoji) {
        // 如果已进化，不进化
        if (this.isEvolved) {
            return false;
        }
        
        // 标记为已进化
        this.isEvolved = true;
        
        // 更新名称和表情符号
        this.name = newName;
        this.emoji = newEmoji;
        
        // 重新计算属性
        this.calculateStats();
        
        return true;
    }

    /**
     * 获取拥有者属性
     * @param {Player} owner - 拥有者
     * @returns {Object} 拥有者属性
     */
    getOwnerStats(owner) {
        // 如果没有拥有者，返回空对象
        if (!owner) {
            return {};
        }
        
        // 返回拥有者属性
        return {
            damageMultiplier: owner.getStat('damageMultiplier'),
            areaMultiplier: owner.getStat('areaMultiplier'),
            durationMultiplier: owner.getStat('durationMultiplier'),
            projectileSpeedMultiplier: owner.getStat('projectileSpeedMultiplier'),
            projectileCountBonus: owner.getStat('projectileCountBonus')
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        // 基类返回通用描述
        return `Lv${this.level + 1}: 提升武器属性。`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        // 基类返回通用描述
        return "一个基础武器。";
    }
}

// --- 可用武器列表 ---
const BASE_WEAPONS = [
    {
        name: "匕首",
        emoji: "🔪",
        description: "发射匕首攻击敌人。",
        constructor: DaggerWeapon
    },
    {
        name: "大蒜",
        emoji: "🧄",
        description: "创建伤害光环。",
        constructor: GarlicWeapon
    },
    {
        name: "鞭子",
        emoji: "〰️",
        description: "横扫敌人。",
        constructor: WhipWeapon
    },
    {
        name: "燃烧刀",
        emoji: "🔥",
        description: "发射燃烧刀攻击敌人，造成燃烧效果。",
        constructor: FireBladeWeapon
    },
    {
        name: "岚刀",
        emoji: "⚡",
        description: "发射岚刀攻击敌人，可以连续切割多个敌人。",
        constructor: StormBladeWeapon
    },
    {
        name: "握握手",
        emoji: "🤝",
        description: "发射握手攻击敌人，造成范围伤害和眩晕效果。",
        constructor: HandshakeWeapon
    }
];

// --- 获取可用升级选项 ---
function getAvailableUpgrades(player) {
    const options = [];
    
    // 获取可升级武器
    const upgradeableWeapons = player.weapons.filter(w => w.level < w.maxLevel);
    
    // 获取可升级被动物品
    const upgradeablePassives = player.passiveItems.filter(p => p.level < p.maxLevel);
    
    // 获取可添加武器
    const availableNewWeapons = BASE_WEAPONS.filter(w => {
        // 检查玩家是否已有该武器
        return !player.weapons.some(pw => pw.constructor.name === w.constructor.name);
    });
    
    // 获取可添加被动物品
    const availableNewPassives = BASE_PASSIVES.filter(p => {
        // 检查玩家是否已有该被动物品
        return !player.passiveItems.some(pp => pp.constructor.name === p.constructor.name);
    });
    
    // 添加武器升级选项
    upgradeableWeapons.forEach(weapon => {
        options.push({
            icon: weapon.emoji,
            text: `升级 ${weapon.name}`,
            level: weapon.level,
            description: weapon.getUpgradeDescription(),
            action: () => {
                weapon.upgrade();
                player.recalculateStats();
            }
        });
    });
    
    // 添加被动物品升级选项
    upgradeablePassives.forEach(passive => {
        options.push({
            icon: passive.emoji,
            text: `升级 ${passive.name}`,
            level: passive.level,
            description: passive.getUpgradeDescription(),
            action: () => {
                passive.upgrade();
                player.recalculateStats();
            }
        });
    });
    
    // 添加新武器选项
    if (player.weapons.length < player.maxWeapons && availableNewWeapons.length > 0) {
        // 随机选择3个武器
        const weaponOptions = [];
        const availableWeapons = [...availableNewWeapons];
        
        for (let i = 0; i < Math.min(3, availableWeapons.length); i++) {
            // 随机选择武器
            const index = Math.floor(Math.random() * availableWeapons.length);
            const weapon = availableWeapons.splice(index, 1)[0];
            
            // 添加到选项
            weaponOptions.push({
                icon: weapon.emoji,
                text: `获得 ${weapon.name}`,
                description: weapon.description,
                action: () => {
                    const newWeapon = new weapon.constructor();
                    player.addWeapon(newWeapon);
                }
            });
        }
        
        // 添加到选项
        options.push(...weaponOptions);
    }
    
    // 添加新被动物品选项
    if (player.passiveItems.length < player.maxPassives && availableNewPassives.length > 0) {
        // 随机选择3个被动物品
        const passiveOptions = [];
        const availablePassives = [...availableNewPassives];
        
        for (let i = 0; i < Math.min(3, availablePassives.length); i++) {
            // 随机选择被动物品
            const index = Math.floor(Math.random() * availablePassives.length);
            const passive = availablePassives.splice(index, 1)[0];
            
            // 添加到选项
            passiveOptions.push({
                icon: passive.emoji,
                text: `获得 ${passive.name}`,
                description: passive.description,
                action: () => {
                    const newPassive = new passive.constructor();
                    player.addPassive(newPassive);
                }
            });
        }
        
        // 添加到选项
        options.push(...passiveOptions);
    }
    
    // 如果没有选项，添加恢复生命选项
    if (options.length === 0) {
        options.push({
            icon: "❤️",
            text: "恢复生命",
            description: "恢复50%的生命值。",
            action: () => {
                player.heal(player.getStat('health') * 0.5);
            }
        });
    }
    
    // 随机选择3个选项
    const selectedOptions = [];
    const availableOptions = [...options];
    
    for (let i = 0; i < Math.min(3, availableOptions.length); i++) {
        // 随机选择选项
        const index = Math.floor(Math.random() * availableOptions.length);
        const option = availableOptions.splice(index, 1)[0];
        
        // 添加到选项
        selectedOptions.push(option);
    }
    
    return selectedOptions;
}