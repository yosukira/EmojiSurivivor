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

/**
 * 武器基类
 * 基础武器类
 */
class BaseWeapon extends Weapon {
    /**
     * 构造函数
     * @param {string} name - 武器名称
     * @param {string} emoji - 表情符号
     * @param {number} baseCooldown - 基础冷却时间
     * @param {number} maxLevel - 最大等级
     */
    constructor(name, emoji, baseCooldown, maxLevel) {
        super(name, emoji, baseCooldown, maxLevel);
    }
}

/**
 * "太痛苦了"武器类
 * 忍者梗武器，发射"太痛苦了"弹幕
 */
class PainfulNinjaWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "太痛苦了";
    static Emoji = "😫";
    static MaxLevel = 8;
    static Description = "发射'太痛苦了'弹幕，伤害范围内的敌人。";
    static Evolution = {
        requires: "Spinach",
        evolvesTo: "NinjaMasterWeapon"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(PainfulNinjaWeapon.Name, PainfulNinjaWeapon.Emoji, 1.2, PainfulNinjaWeapon.MaxLevel);
        
        // 弹幕文本
        this.phrases = ["太痛苦了", "忍术", "啊这", "无语", "裂开", "绝绝子", "8太行"];
        
        // 当前使用的短语索引
        this.currentPhraseIndex = 0;
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15 + (this.level - 1) * 5,
            projectileSpeed: 250 + (this.level - 1) * 20,
            cooldown: Math.max(0.3, this.baseCooldown - (this.level - 1) * 0.12),
            count: 1 + Math.floor(this.level / 3),
            pierce: Math.floor(this.level / 2),
            duration: 1.8 + (this.level - 1) * 0.2,
            area: 30 + (this.level - 1) * 10
        };
    }

    /**
     * 初始化升级效果描述
     */
    initLevelUpEffects() {
        this.levelUpEffects = {
            1: "发射'太痛苦了'弹幕，造成范围伤害。\n伤害: 15, 范围: 30, 冷却: 1.2s",
            2: "提升伤害和范围。\n伤害: 20 (+5), 范围: 40 (+10), 冷却: 1.08s",
            3: "增加穿透和持续时间。\n穿透: 1 (+1), 持续: 2.0s (+0.2), 冷却: 0.96s",
            4: "增加弹幕数量和伤害。\n伤害: 30 (+5), 数量: 2 (+1), 冷却: 0.84s",
            5: "提升范围和穿透。\n范围: 70 (+10), 穿透: 2 (+1), 冷却: 0.72s",
            6: "提升伤害和持续时间。\n伤害: 40 (+5), 持续: 2.8s (+0.2), 冷却: 0.60s",
            7: "增加弹幕数量和范围。\n数量: 3 (+1), 范围: 90 (+10), 冷却: 0.48s",
            8: "全面提升所有属性。\n伤害: 50 (+5), 穿透: 4 (+1), 范围: 100 (+10), 冷却: 0.36s"
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);

        // 计算投射物数量
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);

        // 计算投射物速度
        const speed = Math.max(100, this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1));

        // 获取伤害和穿透
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const pierce = this.stats.pierce;

        // 计算持续时间
        const duration = Math.max(0.5, this.stats.duration * (ownerStats.durationMultiplier || 1));

        // 计算范围
        const area = this.stats.area * (ownerStats.areaMultiplier || 1);

        // 寻找目标 - 只寻找屏幕内的敌人
        let target = owner.findNearestEnemy(GAME_WIDTH * 0.8) || {
            x: owner.x + owner.lastMoveDirection.x * 100,
            y: owner.y + owner.lastMoveDirection.y * 100
        };

        // 计算方向
        const dx = target.x - owner.x;
        const dy = target.y - owner.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 确保有方向，防止投射物停留原地
        let dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
        let dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
        
        // 如果方向向量为零（极少发生），使用默认向右方向
        if (dirX === 0 && dirY === 0) {
            dirX = 1;
            dirY = 0;
        }

        // 计算角度
        const angleStep = count > 1 ? (Math.PI / 6) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);

        // 发射投射物
        for (let i = 0; i < count; i++) {
            // 更新当前短语索引
            this.currentPhraseIndex = (this.currentPhraseIndex + 1) % this.phrases.length;
            const phrase = this.phrases[this.currentPhraseIndex];
            
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // 确保投射物有速度
            if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
                continue; // 跳过无速度的投射物
            }

            // 创建特殊投射物
            const projectile = new TextProjectile(
                owner.x, 
                owner.y, 
                phrase, 
                area / 3, // 文本大小
                vx, 
                vy, 
                damage, 
                pierce, 
                duration,
                ownerStats,
                area // 爆炸范围
            );
            
            // 添加到投射物列表
            projectiles.push(projectile);
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        // 如果已经初始化了详细的升级效果描述，直接使用
        if (this.levelUpEffects[this.level + 1]) {
            return this.levelUpEffects[this.level + 1];
        }
        
        return `Lv${this.level + 1}: 提升太痛苦了弹幕的威力。`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射'太痛苦了'弹幕，对敌人造成范围伤害。忍者梗武器。";
    }
}

/**
 * 文本投射物类
 * 用于"太痛苦了"武器
 */
class TextProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} text - 文本
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} pierce - 穿透次数
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} aoeRadius - 范围伤害半径
     */
    constructor(x, y, text, size, vx, vy, damage, pierce, duration, ownerStats, aoeRadius) {
        super(x, y, text, size, vx, vy, damage, pierce, duration, ownerStats);
        
        // 设置文本
        this.text = text;
        
        // 设置范围伤害半径
        this.aoeRadius = aoeRadius;
        
        // 设置旋转
        this.rotation = 0;
        this.rotationSpeed = (Math.random() * 2 - 1) * Math.PI; // 随机旋转速度
    }
    
    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 更新旋转
        this.rotation += this.rotationSpeed * dt;
        
        // 调用父类更新方法
        super.update(dt);
    }
    
    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (!this.isActive || this.isGarbage) return;
        
        // 保存上下文
        ctx.save();
        
        // 设置字体
        ctx.font = `bold ${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 设置颜色
        ctx.fillStyle = 'white';
        
        // 应用旋转
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // 绘制文本
        ctx.fillText(this.text, 0, 0);
        
        // 恢复上下文
        ctx.restore();
    }
    
    /**
     * 销毁处理
     */
    onDestroy() {
        // 创建爆炸效果
        if (this.aoeRadius > 0) {
            // 使用新的 VisualEffect 类创建爆炸效果
            const effect = VisualEffect.createExplosion(
                this.x, 
                this.y, 
                this.aoeRadius, 
                'rgba(255, 100, 0, 0.5)', 
                0.5
            );
            visualEffects.push(effect);
            
            // 创建文本效果
            const textEffect = VisualEffect.createEmojiEffect(
                this.x, 
                this.y, 
                this.text, 
                this.size * 2, 
                0.8
            );
            visualEffects.push(textEffect);
        }
        
        // 调用父类销毁方法
        super.onDestroy();
    }
}