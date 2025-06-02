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
            if (typeof this.calculateStats === 'function') this.calculateStats();
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
    onLevelUp() {
        if (typeof this.calculateStats === 'function') this.calculateStats();
    }

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
            // 处理数值型属性
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
                else if (key.endsWith('Bonus') || key === 'armor' || key === 'regen' || 
                         key === 'pickupRadius' || key === 'projectileCountBonus' || 
                         key === 'projectilePierceBonus' || key === 'maxHealthBonus' || 
                         key === 'burnDamage' || key === 'burnChance' || key === 'burnDuration' ||
                         key === 'lightningDamage' || key === 'lightningChainCount' ||
                         key === 'slowStrength' || key === 'freezeChance' || key === 'poisonDamage' ||
                         key === 'poisonDuration' || key === 'critChance' || key === 'magnetRange' ||
                         key === 'magnetStrength' || key.includes('Count') || key.includes('Chance') || 
                         key.includes('Damage') || key.includes('Duration') || key.includes('Strength')) {
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
            // 处理布尔型属性
            else if (typeof value === 'boolean') {
                owner.stats[key] = value;
            }
        }
        
        // 确保玩家重新计算属性
        if (typeof owner.recalculateStats === 'function') {
            owner.recalculateStats();
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
        let description = `升级到${this.level + 1}级：`;
        
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
        let damageBonus = 0.15 + (this.level - 1) * 0.1;
        if (this.level === 10) {
            return {
                damageMultiplier: 1.0 + damageBonus + 0.15,
                critChance: 0.05
            };
        }
        return {
            damageMultiplier: 1.0 + damageBonus
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
        // 修改：确保1级就有明显的冷却减少效果
        let cooldownReduction = 0.08 + (this.level - 1) * 0.05; // 1级时8%冷却减少，每升一级再减少5%
        
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
        let healthBonus = 20 + (this.level - 1) * 10;
        if (this.level === 10) {
            return {
                maxHealth: healthBonus + 50,
                regenAmount: 0.5
            };
        }
        return {
            maxHealth: healthBonus
        };
    }
}

/**
 * 翅膀
 * 增加移动速度，提供减速抗性
 */
class Wings extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("翅膀", "🦋", 10, "增加移动速度，提供减速抗性");
        this.level = 1;
        this.calculateStats();
    }
    
    calculateStats() {
        this.speedBonus = this.level < 10 ? 10 * this.level : 10 * 9 + 20;
        this.slowResistance = this.level >= 5 ? 0.5 : 0;
        this.slowImmunity = this.level >= 10;
    }
    
    getBonuses() {
        return {
            speed: this.speedBonus,
            slowResistance: this.slowResistance,
            slowImmunity: this.slowImmunity
        };
    }

    getDescription() {
        if (this.level === 10) {
            return "提升移动速度，减速抗性+50%，10级：完全免疫所有减速";
        } else if (this.level >= 5) {
            return "提升移动速度，减速抗性+50%";
        } else {
            return "提升移动速度";
        }
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
        return {
            pickupRadiusBonus: this.level * 10
        };
    }
}

/**
 * 石像鬼
 * 增加投射物数量
 */
class Gargoyle extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("石像鬼", "👹", 10, "增加投射物数量");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        // 每级+1个投射物，10级+2个
        let projectileBonus = this.level;
        if (this.level === 10) {
            projectileBonus += 1; // 10级额外+1个，总共+2个
        }
        
        return {
            projectileCountBonus: projectileBonus
        };
    }
}

/**
 * 神秘卡片
 * 增加暴击率和暴击伤害
 */
class MysteryCard extends PassiveItem {
    /**
     * 构造函数
     */
    constructor() {
        super("神秘卡片", "🃏", 10, "增加暴击率和暴击伤害");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        let critChance = this.level * 0.03; // 每级增加3%暴击率
        let critMultiplier = this.level * 0.1; // 每级增加0.1倍暴击伤害
        
        // 10级特殊效果：额外增加10%暴击率和1倍暴击伤害
        if (this.level === 10) {
            return {
                critChance: critChance + 0.1, // 总共40%暴击率
                critMultiplier: critMultiplier + 1.0 // 总共2倍暴击伤害
            };
        }
        
        return {
            critChance: critChance,
            critMultiplier: critMultiplier
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
        super("结界符文", "🛡️", 10, "减少所受伤害");
    }

    /**
     * 获取增益
     * @returns {Object} - 增益
     */
    getBonuses() {
        return {
            damageReductionPercent: this.level < 10 ? 0.05 * this.level : 0.6
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
                burnDamage: burnDamage + 5, // 10级额外+5燃烧伤害，满级总共16点
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
        let regenAmount = 1.5 + (this.level - 1) * 0.3;
        let maxHealthPercent = 0.05 + (this.level - 1) * 0.03;
        if (this.level === 10) {
            return {
                regen: regenAmount + 1.5,
                maxHealthMultiplier: 1 + maxHealthPercent + 0.15,
                emergencyShield: 0.15
            };
        }
        return {
            regen: regenAmount,
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
        const randomRoll = Math.random();
        console.log(`[SoulRelic] Attempting reanimation. Chance: ${chance}, Roll: ${randomRoll}`);

        // 随机判断是否复活
        if (randomRoll < chance) {
            // 获取幽灵属性
            const duration = this.bonuses.ghostDuration || 5;
            const damage = this.bonuses.ghostDamage || 3;
            const hasAOE = this.bonuses.ghostAOE || false;
            console.log(`[SoulRelic] Reanimation success! Ghost params - Duration: ${duration}, Damage: ${damage}, AOE: ${hasAOE}`);
            
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
                        console.log(`[SoulRelic] Before push, activeGhosts.length: ${activeGhosts.length}`);
                        activeGhosts.push(ghost);
                        console.log(`[SoulRelic] After push, activeGhosts.length: ${activeGhosts.length}, Ghost created:`, ghost);
                    } else {
                        console.warn("[SoulRelic] activeGhosts数组未定义，无法添加幽灵!");
                    }
                    
                    // 创建复活特效
                    this.createReanimateEffect(x, y);
                    
                    return true;
                } else {
                    console.error("[SoulRelic] 无法创建幽灵: GhostEnemy类未定义");
                    return false;
                }
            } catch (error) {
                console.error("[SoulRelic] 创建幽灵时出错:", error);
                return false;
            }
        } else {
            console.log("[SoulRelic] Reanimation failed by chance.");
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
        let description = `升级到${this.level + 1}级：`;
        
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
    MysteryCard,
    BarrierRune,
    DragonSpice,
    AncientTreeSap
];

// 定义一个明确的函数，确保关键被动物品被添加到BASE_PASSIVES中
function registerCriticalPassives() {
    console.log("开始从passiveItems.js中注册关键被动物品...");
    
    // 确保BASE_PASSIVES存在
    if (typeof window.BASE_PASSIVES === 'undefined') {
        console.log("BASE_PASSIVES不存在，创建新数组");
        window.BASE_PASSIVES = [];
    }
    
    // 直接引用关键被动物品类
    const criticalClasses = [
        { ref: Spinach, name: "Spinach" },
        { ref: Wings, name: "Wings" },
        { ref: Bracer, name: "Bracer" },
        { ref: HollowHeart, name: "HollowHeart" },
        { ref: AncientTreeSap, name: "AncientTreeSap" }
    ];
    
    // 检查已有的类名
    const existingClassNames = BASE_PASSIVES.map(cls => cls.name);
    console.log("当前BASE_PASSIVES中的类:", existingClassNames);
    
    // 添加缺失的关键类
    criticalClasses.forEach(cls => {
        if (!cls.ref) {
            console.error(`错误：${cls.name}类引用无效`);
            return;
        }
        
        if (!existingClassNames.includes(cls.name)) {
            console.log(`添加关键被动物品到BASE_PASSIVES: ${cls.name}`);
            BASE_PASSIVES.push(cls.ref);
        } else {
            console.log(`类${cls.name}已存在于BASE_PASSIVES中`);
        }
    });

// 将新的被动道具添加到BASE_PASSIVES数组
    const otherClasses = [
        { ref: EmptyBottle, name: "EmptyBottle" },
        { ref: Gargoyle, name: "Gargoyle" },
        { ref: MysteryCard, name: "MysteryCard" },
        { ref: BarrierRune, name: "BarrierRune" },
        { ref: DragonSpice, name: "DragonSpice" },
        { ref: SoulRelic, name: "SoulRelic" }
    ];
    
    // 添加其他类
    otherClasses.forEach(cls => {
        if (cls.ref && !existingClassNames.includes(cls.name)) {
            console.log(`添加非关键被动物品到BASE_PASSIVES: ${cls.name}`);
            BASE_PASSIVES.push(cls.ref);
        }
    });
    
    console.log(`注册完成, BASE_PASSIVES现在有 ${BASE_PASSIVES.length} 个类`);
    return BASE_PASSIVES;
}

// 检查并添加被动物品到BASE_PASSIVES
if (typeof BASE_PASSIVES !== 'undefined') {
    // 调用注册函数
    registerCriticalPassives();
} else {
    console.error('BASE_PASSIVES未定义！确保先在game.js中创建此数组。');
    // 尝试在全局作用域创建
    window.BASE_PASSIVES = [];
    registerCriticalPassives();
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