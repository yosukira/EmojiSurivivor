// 确保全局BASE_PASSIVES数组已初始化
if (typeof BASE_PASSIVES === 'undefined') {
    window.BASE_PASSIVES = [];
}

/**
 * 被动道具基类
 */
class PassiveItem {
    /**
     * 构造函数
     * @param {string} name - 名称
     * @param {string} emoji - 表情符号
     * @param {number} maxLevel - 最大等级
     * @param {string} description - 描述
     */
    constructor(name, emoji, maxLevel, description) {
        this.name = name;
        this.emoji = emoji;
        this.level = 1;
        this.maxLevel = maxLevel || 10; // 更新最大等级为10
        this.description = description;
        this.owner = null;
        this.bonuses = {}; // 初始化 bonuses 属性为空对象
    }

    /**
     * 升级
     * @returns {boolean} - 是否升级成功
     */
    levelUp() {
        if (this.level < this.maxLevel) {
            this.level++;
            this.onLevelUp();
            // 每次升级后更新 bonuses
            this.bonuses = this.getBonuses();
            return true;
        }
        return false;
    }

    /**
     * 别名方法，与 levelUp 功能相同
     * @returns {boolean} - 是否升级成功
     */
    upgrade() {
        return this.levelUp();
    }

    /**
     * 升级时回调
     */
    onLevelUp() {}

    /**
     * 获取描述
     * @returns {string} - 描述
     */
    getDescription() {
        return this.description;
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        return {};
    }

    /**
     * 应用效果
     * @param {Object} owner - 拥有者
     */
    apply(owner) {
        this.owner = owner;
        // 应用时更新 bonuses
        this.bonuses = this.getBonuses();
        
        // 确保owner有stats属性
        if (!owner.stats) {
            owner.stats = {};
        }
        
        // 将bonuses应用到owner的stats中
        for (const [key, value] of Object.entries(this.bonuses)) {
            if (typeof value === 'number') {
                // 如果是乘数类型的属性，确保正确应用
                if (key.endsWith('Multiplier')) {
                    // 初始化如果不存在
                    if (owner.stats[key] === undefined) {
                        owner.stats[key] = 1.0;
                    }
                    // 应用乘数效果
                    owner.stats[key] *= value;
                } 
                // 如果是加成类型的属性
                else if (key.endsWith('Bonus') || key.endsWith('Count') || key.endsWith('Chance') || key.endsWith('Damage') || key.endsWith('Duration') || key.endsWith('Strength')) {
                    // 初始化如果不存在
                    if (owner.stats[key] === undefined) {
                        owner.stats[key] = 0;
                    }
                    // 应用加成效果
                    owner.stats[key] += value;
                }
                // 其他情况直接赋值
                else {
                    owner.stats[key] = value;
                }
            }
        }
    }
    
    /**
     * 检查是否达到最大等级
     * @returns {boolean} - 是否达到最大等级
     */
    isMaxLevel() {
        return this.level >= this.maxLevel;
    }
    
    /**
     * 获取初始描述（用于物品获取时显示）
     * @returns {string} - 初始描述
     */
    getInitialDescription() {
        const bonuses = this.getBonuses();
        const bonusDescriptions = [];
        
        for (const [key, value] of Object.entries(bonuses)) {
            if (key === 'damageMultiplier' && value > 1) {
                bonusDescriptions.push(`增加 ${Math.round((value - 1) * 100)}% 攻击伤害`);
            } else if (key === 'maxHealthBonus' && value > 0) {
                bonusDescriptions.push(`增加 ${value} 最大生命值`);
            } else if (key === 'speedMultiplier' && value > 1) {
                bonusDescriptions.push(`增加 ${Math.round((value - 1) * 100)}% 移动速度`);
            } else if (key === 'cooldownMultiplier' && value < 1) {
                bonusDescriptions.push(`减少 ${Math.round((1 - value) * 100)}% 攻击冷却时间`);
            } else if (key === 'pickupRadiusBonus' && value > 0) {
                bonusDescriptions.push(`增加 ${value} 拾取范围`);
            } else if (key === 'projectileCountBonus' && value > 0) {
                bonusDescriptions.push(`增加 ${value} 投射物数量`);
            } else if (key === 'regenAmount' && value > 0) {
                bonusDescriptions.push(`每秒恢复 ${value.toFixed(1)} 生命值`);
            } else if (key === 'burnDamage' && value > 0) {
                bonusDescriptions.push(`燃烧伤害 ${value.toFixed(1)} 点/秒`);
            } else if (key === 'burnChance' && value > 0) {
                bonusDescriptions.push(`${Math.round(value * 100)}% 几率引燃敌人`);
            } else if (key === 'lightningDamage' && value > 0) {
                bonusDescriptions.push(`闪电伤害 ${value.toFixed(1)} 点`);
            } else if (key === 'lightningChainCount' && value > 0) {
                bonusDescriptions.push(`闪电连锁攻击 ${value} 个敌人`);
            } else if (key === 'slowStrength' && value > 0) {
                bonusDescriptions.push(`减速敌人 ${Math.round(value * 100)}%`);
            } else if (key === 'freezeChance' && value > 0) {
                bonusDescriptions.push(`${Math.round(value * 100)}% 几率冻结敌人`);
            } else if (key === 'armorBonus' && value > 0) {
                bonusDescriptions.push(`增加 ${value} 护甲值`);
            } else if (key === 'damageReductionMultiplier' && value < 1) {
                bonusDescriptions.push(`减少 ${Math.round((1 - value) * 100)}% 受到的伤害`);
            } else if (key === 'poisonDamage' && value > 0) {
                bonusDescriptions.push(`毒素伤害 ${value.toFixed(1)} 点/秒`);
            } else if (key === 'poisonDuration' && value > 0) {
                bonusDescriptions.push(`毒素持续 ${value.toFixed(1)} 秒`);
            } else if (key === 'projectilePierceBonus' && value > 0) {
                bonusDescriptions.push(`投射物穿透 ${value} 个敌人`);
            } else if (key === 'projectileAreaMultiplier' && value > 1) {
                bonusDescriptions.push(`增加 ${Math.round((value - 1) * 100)}% 投射物范围`);
            } else if (key === 'critChance' && value > 0) {
                bonusDescriptions.push(`${Math.round(value * 100)}% 暴击几率`);
            }
        }
        
        if (bonusDescriptions.length > 0) {
            return `${this.description}：${bonusDescriptions.join('，')}。`;
        }
        
        return this.description;
    }
    
    /**
     * 获取升级描述（用于升级时显示）
     * @returns {string} - 升级描述
     */
    getUpgradeDescription() {
        if (this.isMaxLevel()) {
            return `${this.name} 已达到最大等级。`;
        }
        
        // 获取当前等级和下一等级的加成
        const currentBonuses = this.getBonuses();
        this.level++; // 临时增加等级
        const nextBonuses = this.getBonuses();
        this.level--; // 恢复等级
        
        const upgradeBenefits = [];
        
        // 比较两级之间的差异
        for (const key in nextBonuses) {
            const currentValue = currentBonuses[key] || 0;
            const nextValue = nextBonuses[key] || 0;
            
            // 处理各种不同类型的属性
            if (key === 'damageMultiplier' && nextValue > currentValue) {
                const increase = Math.round((nextValue - currentValue) * 100);
                if (increase > 0) {
                    upgradeBenefits.push(`攻击伤害 +${increase}%`);
                }
            } else if (key === 'maxHealthBonus' && nextValue > currentValue) {
                const increase = Math.round(nextValue - currentValue);
                if (increase > 0) {
                    upgradeBenefits.push(`最大生命值 +${increase}`);
                }
            } else if (key === 'speedMultiplier' && nextValue > currentValue) {
                const increase = Math.round((nextValue - currentValue) * 100);
                if (increase > 0) {
                    upgradeBenefits.push(`移动速度 +${increase}%`);
                }
            } else if (key === 'cooldownMultiplier' && nextValue < currentValue) {
                const decrease = Math.round((currentValue - nextValue) * 100);
                if (decrease > 0) {
                    upgradeBenefits.push(`攻击冷却 -${decrease}%`);
                }
            } else if (key === 'pickupRadiusBonus' && nextValue > currentValue) {
                const increase = Math.round(nextValue - currentValue);
                if (increase > 0) {
                    upgradeBenefits.push(`拾取范围 +${increase}`);
                }
            } else if (key === 'projectileCountBonus' && nextValue > currentValue) {
                const increase = Math.round(nextValue - currentValue);
                if (increase > 0) {
                    upgradeBenefits.push(`投射物数量 +${increase}`);
                }
            } else if (key === 'regenAmount' && nextValue > currentValue) {
                const increase = (nextValue - currentValue).toFixed(1);
                if (parseFloat(increase) > 0) {
                    upgradeBenefits.push(`生命恢复 +${increase}/秒`);
                }
            } else if (key === 'burnDamage' && nextValue > currentValue) {
                const increase = (nextValue - currentValue).toFixed(1);
                if (parseFloat(increase) > 0) {
                    upgradeBenefits.push(`燃烧伤害 +${increase}/秒`);
                }
            } else if (key === 'burnChance' && nextValue > currentValue) {
                const increase = Math.round((nextValue - currentValue) * 100);
                if (increase > 0) {
                    upgradeBenefits.push(`燃烧几率 +${increase}%`);
                }
            } else if (key === 'lightningDamage' && nextValue > currentValue) {
                const increase = (nextValue - currentValue).toFixed(1);
                if (parseFloat(increase) > 0) {
                    upgradeBenefits.push(`闪电伤害 +${increase}`);
                }
            } else if (key === 'lightningChainCount' && nextValue > currentValue) {
                const increase = Math.round(nextValue - currentValue);
                if (increase > 0) {
                    upgradeBenefits.push(`闪电连锁 +${increase}个敌人`);
                }
            } else if (key === 'slowStrength' && nextValue > currentValue) {
                const increase = Math.round((nextValue - currentValue) * 100);
                if (increase > 0) {
                    upgradeBenefits.push(`减速效果 +${increase}%`);
                }
            } else if (key === 'freezeChance' && nextValue > currentValue) {
                const increase = Math.round((nextValue - currentValue) * 100);
                if (increase > 0) {
                    upgradeBenefits.push(`冻结几率 +${increase}%`);
                }
            } else if (key === 'armorBonus' && nextValue > currentValue) {
                const increase = Math.round(nextValue - currentValue);
                if (increase > 0) {
                    upgradeBenefits.push(`护甲值 +${increase}`);
                }
            } else if (key === 'damageReductionMultiplier' && nextValue < currentValue) {
                const decrease = Math.round((currentValue - nextValue) * 100);
                if (decrease > 0) {
                    upgradeBenefits.push(`伤害减免 +${decrease}%`);
                }
            } else if (key === 'poisonDamage' && nextValue > currentValue) {
                const increase = (nextValue - currentValue).toFixed(1);
                if (parseFloat(increase) > 0) {
                    upgradeBenefits.push(`毒素伤害 +${increase}/秒`);
                }
            } else if (key === 'poisonDuration' && nextValue > currentValue) {
                const increase = (nextValue - currentValue).toFixed(1);
                if (parseFloat(increase) > 0) {
                    upgradeBenefits.push(`毒素持续 +${increase}秒`);
                }
            } else if (key === 'projectilePierceBonus' && nextValue > currentValue) {
                const increase = Math.round(nextValue - currentValue);
                if (increase > 0) {
                    upgradeBenefits.push(`穿透次数 +${increase}`);
                }
            } else if (key === 'projectileAreaMultiplier' && nextValue > currentValue) {
                const increase = Math.round((nextValue - currentValue) * 100);
                if (increase > 0) {
                    upgradeBenefits.push(`投射物范围 +${increase}%`);
                }
            } else if (key === 'critChance' && nextValue > currentValue) {
                const increase = Math.round((nextValue - currentValue) * 100);
                if (increase > 0) {
                    upgradeBenefits.push(`暴击几率 +${increase}%`);
                }
            }
        }
        
        // 如果是10级特殊效果，添加具体的特殊效果描述
        if (this.level === 9) {
            let specialEffectDesc = "";
            
            // 根据不同被动道具添加不同的10级特效描述
            if (this instanceof Spinach) {
                specialEffectDesc = "额外增加15%伤害和5%暴击率";
            } else if (this instanceof Bracer) {
                specialEffectDesc = "额外减少12%冷却时间，并增加5%投射物速度";
            } else if (this instanceof HollowHeart) {
                specialEffectDesc = "额外增加30点生命值和持续生命恢复";
            } else if (this instanceof Wings) {
                specialEffectDesc = "额外增加15%速度和10%闪避率";
            } else if (this instanceof EmptyBottle) {
                specialEffectDesc = "增加30点拾取范围和20%掉落率";
            } else if (this instanceof Gargoyle) {
                specialEffectDesc = "额外增加1个投射物和15%投射物大小";
            } else if (this instanceof MagicCrystal) {
                specialEffectDesc = "获得15%双倍经验几率";
            } else if (this instanceof MysteryCard) {
                specialEffectDesc = "增加稀有物品发现率";
            } else if (this instanceof OccultCharm) {
                specialEffectDesc = "额外增加2次穿透和20%投射物范围";
            } else if (this instanceof BarrierRune) {
                specialEffectDesc = "获得8%几率完全格挡伤害";
            } else if (this instanceof FrostHeart) {
                specialEffectDesc = "获得12%几率造成范围冻结";
            } else if (this instanceof DragonSpice) {
                specialEffectDesc = "15%几率使燃烧敌人爆炸";
            } else if (this instanceof ThunderAmulet) {
                specialEffectDesc = "20%几率触发范围电击";
            } else if (this instanceof PoisonOrb) {
                specialEffectDesc = "25%几率使毒素扩散到附近敌人";
            } else if (this instanceof MagnetSphere) {
                specialEffectDesc = "自动收集周围经验宝石";
            } else if (this instanceof AncientTreeSap) {
                specialEffectDesc = "生命危险时获得短暂无敌";
            } else if (this instanceof SoulRelic) {
                specialEffectDesc = "幽灵获得范围攻击能力";
            } else {
                specialEffectDesc = "解锁强力的特殊效果";
            }
            
            upgradeBenefits.push(`10级特效: ${specialEffectDesc}`);
        }
        
        if (upgradeBenefits.length > 0) {
            return `提升到 ${this.level + 1} 级：${upgradeBenefits.join("，")}`;
        }
        
        return `提升到 ${this.level + 1} 级，增强该道具的所有效果。`;
    }
}

/**
 * 菠菜
 * 增加伤害
 */
class Spinach extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("菠菜", "🥬", 10, "增加伤害");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        // 每级增加10%伤害，以乘法形式提供
        let damageBonus = (this.level - 1) * 0.1; 
        
        // 10级特殊效果：额外增加15%伤害和5%暴击率
        if (this.level === 10) {
            return {
                damageMultiplier: 1 + damageBonus + 0.15,
                critChance: 0.05
            };
        }
        
        return {
            damageMultiplier: 1 + damageBonus
        };
    }
}

/**
 * 护腕
 * 减少攻击间隔
 */
class Bracer extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("护腕", "🧤", 10, "减少攻击间隔");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let cooldownReduction = (this.level - 1) * 0.08; // 每级减少8%冷却时间
        
        // 10级特殊效果：额外减少12%冷却时间，增加5%攻速
        if (this.level === 10) {
            return {
                cooldownMultiplier: Math.max(0.3, 1 - cooldownReduction - 0.12),
                projectileSpeedMultiplier: 1.05
            };
        }
        
        return {
            cooldownMultiplier: Math.max(0.4, 1 - cooldownReduction)
        };
    }
}

/**
 * 空心胸甲
 * 增加最大生命值
 */
class HollowHeart extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("空心胸甲", "❤️", 10, "增加最大生命值");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let healthBonus = this.level * 20; // 每级增加20点生命值
        
        // 10级特殊效果：额外增加30点生命值和微量自动回血
        if (this.level === 10) {
            return {
                maxHealthBonus: healthBonus + 30,
                regenAmount: 0.5 // 每秒回复0.5点生命值
            };
        }
        
        return {
            maxHealthBonus: healthBonus
        };
    }
}

/**
 * 翅膀
 * 增加速度
 */
class Wings extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("翅膀", "🦋", 10, "增加速度");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let speedBonus = (this.level - 1) * 0.1; // 每级增加10%速度
        
        // 10级特殊效果：额外增加15%速度和闪避率
        if (this.level === 10) {
            return {
                speedMultiplier: 1 + speedBonus + 0.15,
                dodgeChance: 0.1 // 10%闪避率
            };
        }
        
        return {
            speedMultiplier: 1 + speedBonus
        };
    }
}

/**
 * 空瓶
 * 增加拾取范围
 */
class EmptyBottle extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("空瓶", "🧪", 10, "增加拾取范围");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let pickupRangeBonus = this.level * 15; // 每级增加15点拾取范围
        
        // 10级特殊效果：额外增加30点拾取范围和增加掉落率
        if (this.level === 10) {
            return {
                pickupRadiusBonus: pickupRangeBonus + 30,
                dropRateMultiplier: 1.2 // 20%掉落率增加
            };
        }
        
        return {
            pickupRadiusBonus: pickupRangeBonus
        };
    }
}

/**
 * 石像鬼雕像
 * 增加项目数量
 */
class Gargoyle extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("石像鬼", "👹", 10, "增加项目数量");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let projectileBonus = Math.floor(this.level / 2); // 每2级增加1个投射物
        
        // 10级特殊效果：额外增加1个投射物和增加投射物大小
        if (this.level === 10) {
            return {
                projectileCountBonus: projectileBonus + 1,
                projectileSizeMultiplier: 1.15 // 15%投射物大小增加
            };
        }
        
        return {
            projectileCountBonus: projectileBonus
        };
    }
}

/**
 * 魔法水晶
 * 增加经验获取
 */
class MagicCrystal extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("魔法水晶", "💎", 10, "增加经验获取");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let expBonus = (this.level - 1) * 0.1; // 每级增加10%经验获取
        
        // 10级特殊效果：额外增加20%经验获取和偶尔双倍经验
        if (this.level === 10) {
            return {
                experienceMultiplier: 1 + expBonus + 0.2,
                doubleExpChance: 0.15 // 15%几率获得双倍经验
            };
        }
        
        return {
            experienceMultiplier: 1 + expBonus
        };
    }
}

/**
 * 神秘卡片
 * 增加幸运值
 */
class MysteryCard extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("神秘卡片", "🃏", 10, "增加幸运值");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let luckBonus = this.level; // 每级增加1点幸运值
        
        // 10级特殊效果：额外增加3点幸运值和物品发现率
        if (this.level === 10) {
            return {
                luckBonus: luckBonus + 3,
                itemDiscoveryRate: 0.1 // 增加10%物品发现率
            };
        }
        
        return {
            luckBonus: luckBonus
        };
    }
}

/**
 * 咒术护符
 * 增加投射物穿透
 */
class OccultCharm extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("咒术护符", "🔮", 10, "增加投射物穿透");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let pierceBonus = Math.floor(this.level / 2); // 每2级增加1次穿透
        
        // 10级特殊效果：额外增加2次穿透和增加投射物范围
        if (this.level === 10) {
            return {
                projectilePierceBonus: pierceBonus + 2,
                projectileAreaMultiplier: 1.2 // 增加20%投射物范围
            };
        }
        
        return {
            projectilePierceBonus: pierceBonus
        };
    }
}

/**
 * 结界符文
 * 增加护盾值和减少伤害
 */
class BarrierRune extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("结界符文", "🛡️", 10, "增加护盾和减少伤害");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let armorBonus = this.level * 2; // 每级增加2点护甲
        let damageReduction = (this.level - 1) * 0.03; // 每级减少3%伤害
        
        // 10级特殊效果：额外护甲和伤害减免，并有几率完全格挡伤害
        if (this.level === 10) {
            return {
                armorBonus: armorBonus + 5,
                damageReductionMultiplier: 1 - (damageReduction + 0.07),
                blockChance: 0.08 // 8%几率完全格挡伤害
            };
        }
        
        return {
            armorBonus: armorBonus,
            damageReductionMultiplier: 1 - damageReduction
        };
    }
}

/**
 * 寒冰之心
 * 增加减速效果和冻结几率
 */
class FrostHeart extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("寒冰之心", "❄️", 10, "增加减速效果和冻结几率");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let slowStrength = 0.1 + (this.level - 1) * 0.05; // 基础10%减速，每级增加5%
        let freezeChance = (this.level - 1) * 0.02; // 每级增加2%冻结几率
        
        // 10级特殊效果：额外减速和冻结几率，偶尔造成范围冻结
        if (this.level === 10) {
            return {
                slowStrength: slowStrength + 0.1,
                freezeChance: freezeChance + 0.05,
                areaFreezeChance: 0.12 // 12%几率造成范围冻结
            };
        }
        
        return {
            slowStrength: slowStrength,
            freezeChance: freezeChance
        };
    }
}

/**
 * 龙息香料
 * 增加燃烧伤害和燃烧几率
 */
class DragonSpice extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("龙息香料", "🌶️", 10, "增加燃烧伤害和燃烧几率");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let burnDamage = 2 + (this.level - 1) * 1; // 基础2点燃烧伤害，每级增加1点
        let burnChance = 0.1 + (this.level - 1) * 0.05; // 基础10%燃烧几率，每级增加5%
        
        // 10级特殊效果：额外燃烧伤害和几率，并有几率造成爆炸
        if (this.level === 10) {
            return {
                burnDamage: burnDamage + 3,
                burnChance: burnChance + 0.1,
                explosionChance: 0.15 // 15%几率火焰爆炸
            };
        }
        
        return {
            burnDamage: burnDamage,
            burnChance: burnChance
        };
    }
}

/**
 * 雷光护符
 * 增加闪电伤害和链接数
 */
class ThunderAmulet extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("雷光护符", "⚡", 10, "增加闪电伤害和链接");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let lightningDamage = 5 + (this.level - 1) * 2; // 基础5点闪电伤害，每级增加2点
        let chainCount = 1 + Math.floor((this.level - 1) / 2); // 基础1次链接，每2级增加1次
        
        // 10级特殊效果：额外闪电伤害和链接，并有几率触发范围电击
        if (this.level === 10) {
            return {
                lightningDamage: lightningDamage + 5,
                lightningChainCount: chainCount + 1,
                areaShockChance: 0.2 // 20%几率触发范围电击
            };
        }
        
        return {
            lightningDamage: lightningDamage,
            lightningChainCount: chainCount
        };
    }
}

/**
 * 毒素宝珠
 * 增加毒素伤害和持续时间
 */
class PoisonOrb extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("毒素宝珠", "☠️", 10, "增加毒素伤害和持续时间");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let poisonDamage = 1 + (this.level - 1) * 0.5; // 基础1点毒素伤害，每级增加0.5点
        let poisonDuration = 3 + (this.level - 1) * 0.3; // 基础3秒持续时间，每级增加0.3秒
        
        // 10级特殊效果：额外毒素伤害和持续时间，并有几率扩散
        if (this.level === 10) {
            return {
                poisonDamage: poisonDamage + 2,
                poisonDuration: poisonDuration + 1,
                spreadChance: 0.25 // 25%几率毒素扩散到附近敌人
            };
        }
        
        return {
            poisonDamage: poisonDamage,
            poisonDuration: poisonDuration
        };
    }
}

/**
 * 磁力球
 * 增加拾取吸引范围和吸引强度
 */
class MagnetSphere extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("磁力球", "🧲", 10, "增加拾取吸引范围和强度");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let magnetRange = 30 + (this.level - 1) * 20; // 基础30点吸引范围，每级增加20点
        let magnetStrength = 1 + (this.level - 1) * 0.2; // 基础1倍吸引强度，每级增加0.2倍
        
        // 10级特殊效果：额外吸引范围和强度，并自动收集经验宝石
        if (this.level === 10) {
            return {
                magnetRange: magnetRange + 50,
                magnetStrength: magnetStrength + 0.5,
                autoCollect: true // 自动收集30码范围内的经验宝石
            };
        }
        
        return {
            magnetRange: magnetRange,
            magnetStrength: magnetStrength
        };
    }
}

/**
 * 古树精华
 * 增加生命恢复和最大生命值百分比
 */
class AncientTreeSap extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("古树精华", "🌳", 10, "增加生命恢复和最大生命值");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let regenAmount = 0.2 + (this.level - 1) * 0.1; // 基础0.2点恢复，每级增加0.1点
        let maxHealthPercent = (this.level - 1) * 0.03; // 每级增加3%最大生命值
        
        // 10级特殊效果：额外恢复和生命值，并在生命危急时提供保护
        if (this.level === 10) {
            return {
                regenAmount: regenAmount + 0.5,
                maxHealthMultiplier: 1 + maxHealthPercent + 0.1,
                emergencyShield: 0.1 // 生命值低于10%时获得3秒无敌
            };
        }
        
        return {
            regenAmount: regenAmount,
            maxHealthMultiplier: 1 + maxHealthPercent
        };
    }
}

/**
 * 舍利子回魂类
 * 有几率使敌人死亡后变成友方幽灵
 */
class SoulRelic extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("舍利子回魂", "👻", 10, "有几率使敌人死亡后变成友方幽灵");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let reanimateChance = 0.05 + (this.level - 1) * 0.03; // 基础5%几率，每级增加3%
        let ghostDuration = 5 + (this.level - 1) * 1; // 基础5秒持续时间，每级增加1秒
        let ghostDamage = 3 + (this.level - 1) * 0.5; // 基础3点伤害，每级增加0.5点
        
        // 10级特殊效果：几率和伤害大幅提升，幽灵持续更久
        if (this.level === 10) {
            return {
                reanimateChance: reanimateChance + 0.15,
                ghostDuration: ghostDuration + 5,
                ghostDamage: ghostDamage * 1.5,
                ghostAOE: true // 幽灵获得范围攻击能力
            };
        }
        
        return {
            reanimateChance: reanimateChance,
            ghostDuration: ghostDuration,
            ghostDamage: ghostDamage
        };
    }
    
    /**
     * 尝试复活敌人为幽灵
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Player} owner - 拥有者
     * @returns {boolean} - 是否成功复活
     */
    tryReanimate(x, y, owner) {
        // 获取复活几率
        const chance = this.bonuses.reanimateChance || 0.05;
        
        // 随机判断是否复活
        if (Math.random() < chance) {
            // 获取幽灵属性
            const duration = this.bonuses.ghostDuration || 5;
            const damage = this.bonuses.ghostDamage || 3;
            const hasAOE = this.bonuses.ghostAOE || false;
            
            // 创建幽灵效果
            const effects = {};
            if (hasAOE) {
                effects.aoe = true;
                effects.aoeRadius = 50;
            }
            
            // 创建幽灵
            try {
                // 检查GhostEnemy类是否存在
                if (typeof GhostEnemy === 'function') {
                    const ghost = new GhostEnemy(x, y, owner, damage, duration, 150, effects);
                    
                    // 将幽灵添加到全局数组
                    if (typeof activeGhosts !== 'undefined') {
                        activeGhosts.push(ghost);
                    } else {
                        console.warn("activeGhosts数组未定义，无法添加幽灵!");
                    }
                    
                    // 创建复活特效
                    this.createReanimateEffect(x, y);
                    
                    return true;
                } else {
                    console.error("无法创建幽灵: GhostEnemy类未定义");
                    return false;
                }
            } catch (error) {
                console.error("创建幽灵时出错:", error);
                return false;
            }
        }
        
        return false;
    }
    
    /**
     * 创建复活特效
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    createReanimateEffect(x, y) {
        const effect = {
            x: x,
            y: y,
            size: 20,
            maxSize: 60,
            alpha: 0.7,
            lifetime: 0.8,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 更新大小和透明度
                const progress = this.timer / this.lifetime;
                this.size = this.maxSize * progress;
                this.alpha = 0.7 * (1 - progress);
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                // 绘制幽灵光环
                ctx.save();
                ctx.globalAlpha = this.alpha;
                
                // 发光环
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, this.size
                );
                
                gradient.addColorStop(0, 'rgba(200, 255, 255, 0.7)');
                gradient.addColorStop(0.5, 'rgba(100, 200, 255, 0.3)');
                gradient.addColorStop(1, 'rgba(50, 100, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制幽灵符号
                ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(255, 255, 255, ' + this.alpha + ')';
                ctx.fillText('👻', screenPos.x, screenPos.y);
                
                ctx.restore();
            }
        };
        
        // 添加特效到视觉效果列表
        if (typeof visualEffects !== 'undefined') {
            visualEffects.push(effect);
        }
    }
    
    /**
     * 获取当前描述
     * @returns {string} - 当前描述
     */
    getInitialDescription() {
        // 确保有正确的bonuses值
        const bonuses = this.getBonuses();
        const chance = bonuses.reanimateChance ? Math.round(bonuses.reanimateChance * 100) : 5;
        const damage = bonuses.ghostDamage ? bonuses.ghostDamage.toFixed(1) : "3.0";
        const duration = bonuses.ghostDuration ? Math.round(bonuses.ghostDuration) : 5;
        return `有${chance}%几率使敌人死亡后变成友方幽灵，造成${damage}点伤害，持续${duration}秒。`;
    }
    
    /**
     * 获取升级描述
     * @returns {string} - 升级描述
     */
    getUpgradeDescription() {
        if (this.isMaxLevel()) {
            return `${this.name}已达到最大等级。`;
        }
        
        // 计算当前和下一级的几率
        const currentChance = (this.bonuses.reanimateChance * 100).toFixed(0);
        
        // 临时提升等级计算下一级
        this.level++;
        const nextBonuses = this.getBonuses();
        this.level--;
        
        const nextChance = (nextBonuses.reanimateChance * 100).toFixed(0);
        const chanceIncrease = nextChance - currentChance;
        
        // 计算其他属性提升
        const durationIncrease = nextBonuses.ghostDuration - this.bonuses.ghostDuration;
        const damageIncrease = nextBonuses.ghostDamage - this.bonuses.ghostDamage;
        
        // 构建描述
        let description = `提升到${this.level + 1}级：`;
        
        if (chanceIncrease > 0) {
            description += `复活几率+${chanceIncrease}%`;
        }
        
        if (durationIncrease > 0) {
            description += `，持续时间+${durationIncrease}秒`;
        }
        
        if (damageIncrease > 0) {
            description += `，伤害+${damageIncrease.toFixed(1)}`;
        }
        
        // 10级特殊效果
        if (this.level === 9) {
            description += "。10级解锁：幽灵获得范围攻击能力！";
        }
        
        return description;
    }
}

// 导出被动道具类
const PASSIVE_ITEMS = [
    Spinach,
    Bracer,
    HollowHeart,
    Wings,
    EmptyBottle,
    Gargoyle,
    MagicCrystal,
    MysteryCard,
    OccultCharm,
    BarrierRune,
    FrostHeart,
    DragonSpice,
    ThunderAmulet,
    PoisonOrb,
    MagnetSphere,
    AncientTreeSap
];

// 将新的被动道具添加到BASE_PASSIVES数组
if (typeof BASE_PASSIVES !== 'undefined') {
    // 添加新的被动道具
    if (typeof EmptyBottle === 'function') BASE_PASSIVES.push(EmptyBottle);
    if (typeof Gargoyle === 'function') BASE_PASSIVES.push(Gargoyle);
    if (typeof MagicCrystal === 'function') BASE_PASSIVES.push(MagicCrystal);
    if (typeof MysteryCard === 'function') BASE_PASSIVES.push(MysteryCard);
    if (typeof OccultCharm === 'function') BASE_PASSIVES.push(OccultCharm);
    if (typeof BarrierRune === 'function') BASE_PASSIVES.push(BarrierRune);
    if (typeof FrostHeart === 'function') BASE_PASSIVES.push(FrostHeart);
    if (typeof DragonSpice === 'function') BASE_PASSIVES.push(DragonSpice);
    if (typeof ThunderAmulet === 'function') BASE_PASSIVES.push(ThunderAmulet);
    if (typeof PoisonOrb === 'function') BASE_PASSIVES.push(PoisonOrb);
    if (typeof MagnetSphere === 'function') BASE_PASSIVES.push(MagnetSphere);
    if (typeof AncientTreeSap === 'function') BASE_PASSIVES.push(AncientTreeSap);
    if (typeof SoulRelic === 'function') BASE_PASSIVES.push(SoulRelic); // 添加 SoulRelic

    console.log('New passive items added to BASE_PASSIVES:', 
        BASE_PASSIVES.filter(p => 
            p !== Spinach && 
            p !== Bracer && 
            p !== HollowHeart && 
            p !== Wings
        ).map(p => p.name)
    );
} else {
    console.error('BASE_PASSIVES not found! Make sure passiveItem.js is loaded first.');
}

/**
 * 注释：关于特殊效果的实现说明
 * 
 * 1. 燃烧效果：
 *    - 相关属性：burnDamage, burnChance
 *    - 由拥有此效果的武器触发，如龙息香料增强的武器
 *    - 当武器命中敌人时，有几率使敌人进入燃烧状态，造成持续伤害
 * 
 * 2. 闪电效果：
 *    - 相关属性：lightningDamage, lightningChainCount
 *    - 由拥有此效果的武器触发，如雷光护符增强的武器
 *    - 当武器命中敌人时，闪电向附近敌人链接，造成额外伤害
 * 
 * 3. 冰冻效果：
 *    - 相关属性：slowStrength, freezeChance
 *    - 由拥有此效果的武器触发，如寒冰之心增强的武器
 *    - 当武器命中敌人时，减慢敌人移动速度，有几率完全冻结
 * 
 * 4. 护盾效果：
 *    - 相关属性：armorBonus, damageReductionMultiplier, blockChance
 *    - 减少玩家受到的伤害，提高生存能力
 *    - 10级特效可获得完全格挡伤害的几率
 * 
 * 5. 毒素效果：
 *    - 相关属性：poisonDamage, poisonDuration
 *    - 由拥有此效果的武器触发，如毒素宝珠增强的武器
 *    - 当武器命中敌人时，施加毒素状态，造成持续伤害
 * 
 * 6. 幽灵效果：
 *    - 相关属性：reanimateChance, ghostDuration, ghostDamage
 *    - 由舍利子回魂被动触发
 *    - 当敌人死亡时，有几率将其变为友方幽灵，攻击其他敌人
 * 
 * 注意：
 * 这些特殊效果通常需要武器支持才能生效。被动道具本身提供属性加成，
 * 但真正的效果触发是在武器的伤害计算和效果应用中完成的。
 */