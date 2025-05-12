/**
 * 菠菜类
 * 增加伤害
 */
class Spinach extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "菠菜";
    static Emoji = EMOJI.PASSIVE_SPINACH;
    static MaxLevel = 5;

    constructor() {
        super(Spinach.Name, Spinach.Emoji, `提升伤害。`, Spinach.MaxLevel);
        this.baseDamageBonus = 0.10; // 10% damage bonus per level
        this.calculateBonuses();
    }

    calculateBonuses() {
        this.bonuses = {
            damageMultiplier: { add: this.level * this.baseDamageBonus }
        };
    }

    getInitialDescription() {
        return `提升 ${this.baseDamageBonus * 100}% 伤害。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextBonus = nextLevel * this.baseDamageBonus * 100;
        const currentBonus = this.level * this.baseDamageBonus * 100;
        return `Lv${nextLevel}: 伤害 +${currentBonus.toFixed(0)}% → +${nextBonus.toFixed(0)}%。`;
    }
}

/**
 * 盔甲类
 * 减少受到的伤害
 */
class Armor extends PassiveItem {
    static Name = "盔甲";
    static Emoji = EMOJI.PASSIVE_ARMOR;
    static MaxLevel = 5;

    constructor() {
        super(Armor.Name, Armor.Emoji, `提供防御。`, Armor.MaxLevel);
        this.baseArmorBonus = 1; // +1 armor per level
        this.calculateBonuses();
    }

    calculateBonuses() {
        this.bonuses = {
            armor: { add: this.level * this.baseArmorBonus }
        };
    }

    getInitialDescription() {
        return `提供 ${this.baseArmorBonus} 点盔甲。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextBonus = nextLevel * this.baseArmorBonus;
        const currentBonus = this.level * this.baseArmorBonus;
        return `Lv${nextLevel}: 盔甲 +${currentBonus} → +${nextBonus}。`;
    }
}

/**
 * 翅膀类
 * 增加移动速度
 */
class Wings extends PassiveItem {
    static Name = "翅膀";
    static Emoji = EMOJI.PASSIVE_WINGS;
    static MaxLevel = 5;

    constructor() {
        super(Wings.Name, Wings.Emoji, `提升移动速度。`, Wings.MaxLevel);
        this.baseSpeedBonus = 0.10; // +10% speed per level
        this.calculateBonuses();
    }

    calculateBonuses() {
        this.bonuses = {
            speed: { add: this.level * this.baseSpeedBonus } // Assuming speed is a value where additive % makes sense, or getStat handles it
        };
    }

    getInitialDescription() {
        return `提升 ${this.baseSpeedBonus * 100}% 移动速度。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextBonus = nextLevel * this.baseSpeedBonus * 100;
        const currentBonus = this.level * this.baseSpeedBonus * 100;
        return `Lv${nextLevel}: 移速 +${currentBonus.toFixed(0)}% → +${nextBonus.toFixed(0)}%。`;
    }
}

/**
 * 空白之书类
 * 减少武器冷却时间
 */
class EmptyTome extends PassiveItem {
    static Name = "空白之书";
    static Emoji = EMOJI.PASSIVE_TOME;
    static MaxLevel = 5;

    constructor() {
        super(EmptyTome.Name, EmptyTome.Emoji, `减少武器冷却。`, EmptyTome.MaxLevel);
        this.baseCooldownReduction = 0.08; // -8% cooldown per level
        this.calculateBonuses();
    }

    calculateBonuses() {
        // Cooldown multiplier: Player's getStat should handle this. Base is 1.0. A bonus of -0.08 makes it 0.92.
        // So, we 'add' a negative value to the multiplier accumulator in getStat if it starts at 0 for mult_bonus.
        // Or, if getStat's multiplier starts at 1.0, we add to that.
        // The current getStat: multiplier += item.bonuses[statName].mult;
        // So this.bonuses.cooldownMultiplier.mult should be the actual value that gets added to 1.0 (e.g. -0.08 for first level)
        this.bonuses = {
            // Effective cooldown = baseCooldown * (1 - totalReduction)
            // If getStat calculates multiplier = 1.0 + sum(item.bonuses.stat.mult), then .mult should be negative.
            cooldownMultiplier: { mult: this.level * -this.baseCooldownReduction }
        };
    }

    getInitialDescription() {
        return `减少 ${this.baseCooldownReduction * 100}% 武器冷却。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextReduction = nextLevel * this.baseCooldownReduction * 100;
        const currentReduction = this.level * this.baseCooldownReduction * 100;
        return `Lv${nextLevel}: 冷却 -${currentReduction.toFixed(0)}% → -${nextReduction.toFixed(0)}%。`;
    }
}

/**
 * 烛台类
 * 增加效果范围
 */
class Candelabrador extends PassiveItem {
    static Name = "烛台";
    static Emoji = EMOJI.PASSIVE_CANDELABRADOR;
    static MaxLevel = 5;

    constructor() {
        super(Candelabrador.Name, Candelabrador.Emoji, `提升效果范围。`, Candelabrador.MaxLevel);
        this.baseAreaBonus = 0.10; // +10% area per level
        this.calculateBonuses();
    }

    calculateBonuses() {
        this.bonuses = {
            areaMultiplier: { add: this.level * this.baseAreaBonus }
        };
    }

    getInitialDescription() {
        return `提升 ${this.baseAreaBonus * 100}% 效果范围。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextBonus = nextLevel * this.baseAreaBonus * 100;
        const currentBonus = this.level * this.baseAreaBonus * 100;
        return `Lv${nextLevel}: 范围 +${currentBonus.toFixed(0)}% → +${nextBonus.toFixed(0)}%。`;
    }
}

/**
 * 护腕类
 * 增加投射物速度
 */
class Bracer extends PassiveItem {
    static Name = "护腕";
    static Emoji = EMOJI.PASSIVE_BRACER;
    static MaxLevel = 5;

    constructor() {
        super(Bracer.Name, Bracer.Emoji, `提升投射物速度。`, Bracer.MaxLevel);
        this.baseProjectileSpeedBonus = 0.10; // +10% projectile speed per level
        this.calculateBonuses();
    }

    calculateBonuses() {
        this.bonuses = {
            projectileSpeedMultiplier: { add: this.level * this.baseProjectileSpeedBonus }
        };
    }

    getInitialDescription() {
        return `提升 ${this.baseProjectileSpeedBonus * 100}% 投射物速度。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextBonus = nextLevel * this.baseProjectileSpeedBonus * 100;
        const currentBonus = this.level * this.baseProjectileSpeedBonus * 100;
        return `Lv${nextLevel}: 射弹速度 +${currentBonus.toFixed(0)}% → +${nextBonus.toFixed(0)}%。`;
    }
}

/**
 * 空虚之心类
 * 增加最大生命值
 */
class HollowHeart extends PassiveItem {
    static Name = "空虚之心";
    static Emoji = EMOJI.PASSIVE_HOLLOW_HEART;
    static MaxLevel = 5;

    constructor() {
        super(HollowHeart.Name, HollowHeart.Emoji, `提升最大生命值。`, HollowHeart.MaxLevel);
        this.baseHealthBonus = 0.10; // +10% max health per level
        this.calculateBonuses();
    }

    calculateBonuses() {
        // This affects the 'health' stat, which is a base stat.
        // getStat will calculate (baseHealth + additiveFromBonuses) * multiplierFromBonuses
        // So we want to add to the 'multiplier' part of the 'health' stat.
        // PLAYER_DEFAULT_STATS.health is the base.
        this.bonuses = {
            // If we want to increase max health by 10% of base each level:
            // health: { add: PLAYER_DEFAULT_STATS.health * this.level * this.baseHealthBonus } // This would be flat addition
            // Or if it's a multiplier on the final value:
            health: { mult: this.level * this.baseHealthBonus } // This will be added to the multiplier sum in getStat
        };
    }

    getInitialDescription() {
        return `提升 ${this.baseHealthBonus * 100}% 最大生命值。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextBonus = nextLevel * this.baseHealthBonus * 100;
        const currentBonus = this.level * this.baseHealthBonus * 100;
        return `Lv${nextLevel}: 最大生命 +${currentBonus.toFixed(0)}% → +${nextBonus.toFixed(0)}%。`;
    }
}

/**
 * 番茄类
 * 增加生命恢复
 */
class Pummarola extends PassiveItem {
    static Name = "番茄";
    static Emoji = EMOJI.PASSIVE_PUMMAROLA;
    static MaxLevel = 5;

    constructor() {
        super(Pummarola.Name, Pummarola.Emoji, `增加生命恢复。`, Pummarola.MaxLevel);
        this.baseRegenBonus = 0.2; // +0.2 regen per second per level
        this.calculateBonuses();
    }

    calculateBonuses() {
        this.bonuses = {
            regen: { add: this.level * this.baseRegenBonus }
        };
    }

    getInitialDescription() {
        return `每秒恢复 ${this.baseRegenBonus.toFixed(1)} 生命值。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextBonus = nextLevel * this.baseRegenBonus;
        const currentBonus = this.level * this.baseRegenBonus;
        return `Lv${nextLevel}: 生命恢复 +${currentBonus.toFixed(1)}/s → +${nextBonus.toFixed(1)}/s。`;
    }
}

/**
 * 吸铁石类
 * 增加拾取范围
 */
class Magnet extends PassiveItem {
    static Name = "吸铁石";
    static Emoji = EMOJI.PASSIVE_MAGNET;
    static MaxLevel = 5;

    constructor() {
        super(Magnet.Name, Magnet.Emoji, "扩大经验和物品的拾取范围。", Magnet.MaxLevel);
        this.baseRadiusBonus = 0.20; // +20% pickup radius per level (of base player pickup radius)
        this.calculateBonuses();
    }

    calculateBonuses() {
        // We will make this increase the player's 'pickupRadius' stat by a percentage
        // Player's getStat('pickupRadius') will be base * (1 + sum of these mult bonuses)
        this.bonuses = {
            pickupRadius: { mult: this.level * this.baseRadiusBonus }
        };
    }

    getInitialDescription() {
        return `扩大 ${this.baseRadiusBonus * 100}% 拾取范围。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级。";
        }
        const nextLevel = this.level + 1;
        const nextBonus = nextLevel * this.baseRadiusBonus * 100;
        const currentBonus = this.level * this.baseRadiusBonus * 100;
        return `Lv${nextLevel}: 拾取范围 +${currentBonus.toFixed(0)}% → +${nextBonus.toFixed(0)}%。`;
    }
}

/**
 * 舍利子回魂
 * 击杀敌人后召唤幽灵盟友
 */
class RelicSoulPassive extends PassiveItem {
    static Name = "舍利子回魂";
    static Emoji = "👻"; // Or find a better emoji like ☯️ or ☸️ ? Using ghost for now.
    static MaxLevel = 5;

    constructor() {
        super(RelicSoulPassive.Name, RelicSoulPassive.Emoji, `击杀敌人时召唤幽灵盟友为你作战。`, RelicSoulPassive.MaxLevel);
        this.calculateBonuses();
    }

    calculateBonuses() {
        // These are not direct player stat bonuses, but control the summoned ghosts.
        this.ghostDamage = 3 + (this.level - 1) * 2;
        this.ghostDuration = 3 + (this.level - 1) * 1;
        this.maxGhosts = 1 + Math.floor((this.level - 1) / 2); // Lv1:1, Lv2:1, Lv3:2, Lv4:2, Lv5:3
        this.canConvertBoss = this.level >= this.maxLevel; // Only at max level
        // Store these on the item instance for Enemy.onDeath to access
        this.bonuses = {
            // No direct stat changes for the player
        };
    }

    getInitialDescription() {
        this.calculateBonuses(); // Ensure stats are calculated for description
        return `击杀敌人时召唤幽灵盟友 (持续${this.ghostDuration}s, 伤害${this.ghostDamage}, 最多${this.maxGhosts}个)。 (当前 Lv1)`;
    }

    getUpgradeDescription() {
        if (this.level >= this.maxLevel) {
            return "已达最大等级 (可以转化Boss!)。";
        }
        const nextLevel = this.level + 1;
        
        // Calculate next level stats
        const nextDamage = 3 + nextLevel * 2;
        const nextDuration = 3 + nextLevel * 1;
        const nextMaxGhosts = 1 + Math.floor(nextLevel / 2);
        const nextCanConvertBoss = nextLevel >= this.maxLevel;
        
        const descParts = [];
        if (nextDamage > this.ghostDamage) descParts.push(`伤害:${this.ghostDamage}→${nextDamage}`);
        if (nextDuration > this.ghostDuration) descParts.push(`持续:${this.ghostDuration}s→${nextDuration}s`);
        if (nextMaxGhosts > this.maxGhosts) descParts.push(`数量:${this.maxGhosts}→${nextMaxGhosts}`);
        if (nextCanConvertBoss && !this.canConvertBoss) descParts.push(`可转化Boss`);

        return `Lv${nextLevel}: ${descParts.join(', ')}。`;
    }
}

// 全局基础被动物品列表
// 此列表在所有被动类定义之后创建，以确保所有类都可用
const BASE_PASSIVES = [];

// 添加已定义的被动物品类到 BASE_PASSIVES 数组
// 这里直接引用类名，因为它们应该已经在这个文件或之前加载的文件中定义了
if (typeof Spinach === 'function') BASE_PASSIVES.push(Spinach);
if (typeof Armor === 'function') BASE_PASSIVES.push(Armor);
if (typeof Wings === 'function') BASE_PASSIVES.push(Wings);
if (typeof EmptyTome === 'function') BASE_PASSIVES.push(EmptyTome);
if (typeof Candelabrador === 'function') BASE_PASSIVES.push(Candelabrador);
if (typeof Bracer === 'function') BASE_PASSIVES.push(Bracer);
if (typeof HollowHeart === 'function') BASE_PASSIVES.push(HollowHeart);
if (typeof Pummarola === 'function') BASE_PASSIVES.push(Pummarola);
if (typeof Magnet === 'function') BASE_PASSIVES.push(Magnet);
if (typeof RelicSoulPassive === 'function') BASE_PASSIVES.push(RelicSoulPassive);

console.log('BASE_PASSIVES initialized in passiveItems.js:', BASE_PASSIVES.map(p => p.name));