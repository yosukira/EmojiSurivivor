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

    /**
     * 构造函数
     */
    constructor() {
        super(Spinach.Name, Spinach.Emoji, 5, {
            damageMultiplier: { mult: 0.1 }
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

/**
 * 盔甲类
 * 减少受到的伤害
 */
class Armor extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "盔甲";
    static Emoji = EMOJI.PASSIVE_ARMOR;

    /**
     * 构造函数
     */
    constructor() {
        super(Armor.Name, Armor.Emoji, 5, {
            armor: { add: 1 }
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `减少 1 点受到的伤害。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再减少 1 点伤害 (总计: ${this.level + 1})。`;
    }
}

/**
 * 翅膀类
 * 增加移动速度
 */
class Wings extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "翅膀";
    static Emoji = EMOJI.PASSIVE_WINGS;

    /**
     * 构造函数
     */
    constructor() {
        super(Wings.Name, Wings.Emoji, 5, {
            speed: { mult: 0.1 }
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `提升 10% 移动速度。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再提升 10% 移动速度 (总计: +${((this.level + 1) * 10).toFixed(0)}%)。`;
    }
}

/**
 * 空白之书类
 * 减少武器冷却时间
 */
class EmptyTome extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "空白之书";
    static Emoji = EMOJI.PASSIVE_TOME;

    /**
     * 构造函数
     */
    constructor() {
        super(EmptyTome.Name, EmptyTome.Emoji, 5, {
            cooldownMultiplier: { mult: -0.08 }
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `减少 8% 武器冷却。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再减少 8% 武器冷却 (总计: -${((this.level + 1) * 8).toFixed(0)}%)。`;
    }
}

/**
 * 烛台类
 * 增加效果范围
 */
class Candelabrador extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "烛台";
    static Emoji = EMOJI.PASSIVE_CANDELABRADOR;

    /**
     * 构造函数
     */
    constructor() {
        super(Candelabrador.Name, Candelabrador.Emoji, 5, {
            areaMultiplier: { mult: 0.1 }
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `提升 10% 效果范围。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再提升 10% 范围 (总计: +${((this.level + 1) * 10).toFixed(0)}%)。`;
    }
}

/**
 * 护腕类
 * 增加投射物速度
 */
class Bracer extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "护腕";
    static Emoji = EMOJI.PASSIVE_BRACER;

    /**
     * 构造函数
     */
    constructor() {
        super(Bracer.Name, Bracer.Emoji, 5, {
            projectileSpeedMultiplier: { mult: 0.1 }
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `提升 10% 投射物速度。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再提升 10% 投射物速度 (总计: +${((this.level + 1) * 10).toFixed(0)}%)。`;
    }
}

/**
 * 空虚之心类
 * 增加最大生命值
 */
class HollowHeart extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "空虚之心";
    static Emoji = EMOJI.PASSIVE_HOLLOW_HEART;

    /**
     * 构造函数
     */
    constructor() {
        super(HollowHeart.Name, HollowHeart.Emoji, 5, {
            health: { mult: 0.1 }
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `提升 10% 最大生命值。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再提升 10% 最大生命值 (总计: +${((this.level + 1) * 10).toFixed(0)}%)。`;
    }
}

/**
 * 番茄类
 * 增加生命恢复
 */
class Pummarola extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "番茄";
    static Emoji = EMOJI.PASSIVE_PUMMAROLA;

    /**
     * 构造函数
     */
    constructor() {
        super(Pummarola.Name, Pummarola.Emoji, 5, {
            regen: { add: 0.2 }
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `每秒恢复 0.2 生命值。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `每秒恢复量增加 0.2 (总计: ${((this.level + 1) * 0.2).toFixed(1)})。`;
    }
}

/**
 * 吸铁石类
 * 增加拾取范围和吸铁石效果
 */
class Magnet extends PassiveItem {
    /**
     * 静态属性
     */
    static Name = "吸铁石";
    static Emoji = EMOJI.PASSIVE_MAGNET;

    /**
     * 构造函数
     */
    constructor() {
        super(Magnet.Name, Magnet.Emoji, 5, {
            magnetBonus: { add: 0.2 }
        });
        
        // 吸铁石效果计时器
        this.magnetizeTimer = 0;
        this.magnetizeInterval = 15; // 15秒一次全图吸取
    }

    /**
     * 更新状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 更新吸铁石效果计时器
        this.magnetizeTimer += dt;
        
        // 如果计时器结束，触发吸铁石效果
        if (this.magnetizeTimer >= this.magnetizeInterval) {
            // 重置计时器
            this.magnetizeTimer = 0;
            
            // 触发吸铁石效果
            this.magnetizeAllXP();
        }
    }

    /**
     * 吸引所有经验宝石
     */
    magnetizeAllXP() {
        // 创建磁铁特效
        const effect = {
            x: player.x,
            y: player.y,
            radius: 0,
            maxRadius: 300,
            lifetime: 0.5,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                this.radius = (this.timer / this.lifetime) * this.maxRadius;
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const alpha = 0.5 - (this.timer / this.lifetime) * 0.5;
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                ctx.strokeStyle = `rgba(0, 100, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        };
        
        visualEffects.push(effect);
        
        // 将所有经验宝石移动到玩家位置
        xpGems.forEach(gem => {
            if (!gem.isGarbage && gem.isActive) {
                // 设置宝石位置为玩家位置
                gem.x = player.x;
                gem.y = player.y;
            }
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `提升 20% 拾取范围，每15秒自动吸取所有经验。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再提升 20% 拾取范围，减少吸取间隔 (总计: +${((this.level + 1) * 20).toFixed(0)}%)。`;
    }

    /**
     * 应用初始加成
     * @param {Player} player - 玩家
     */
    applyInitialBonus(player) {
        // 调用父类方法
        super.applyInitialBonus(player);
        
        // 减少吸取间隔
        this.magnetizeInterval = 15 - (this.level - 1) * 1.5;
    }

    /**
     * 升级处理
     */
    onUpgrade() {
        // 调用父类方法
        super.onUpgrade();
        
        // 减少吸取间隔
        this.magnetizeInterval = 15 - (this.level - 1) * 1.5;
    }
}