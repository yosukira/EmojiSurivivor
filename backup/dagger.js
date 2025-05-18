/**
 * 匕首武器类
 * 发射直线飞行的匕首
 */
class DaggerWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "匕首";
    static Emoji = EMOJI.WEAPON_DAGGER;
    static MaxLevel = 8;
    static Evolution = {
        requires: "Bracer",
        evolvesTo: "ThousandKnives"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(DaggerWeapon.Name, DaggerWeapon.Emoji, 0.95, DaggerWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 12 + (this.level - 1) * 3,
            projectileSpeed: 350 + (this.level - 1) * 15,
            cooldown: Math.max(0.16, this.baseCooldown - (this.level - 1) * 0.09),
            count: 1 + Math.floor((this.level - 1) / 2),
            pierce: 0 + Math.floor(this.level / 4),
            duration: 1.5
        };
    }

    /**
     * 初始化升级效果描述
     */
    initLevelUpEffects() {
        this.levelUpEffects = {
            1: "基础匕首，发射单个投射物。\n伤害: 12, 速度: 350, 冷却: 0.95s",
            2: "提升伤害和投射物速度。\n伤害: 15 (+3), 速度: 365 (+15), 冷却: 0.86s",
            3: "增加投射物数量。\n伤害: 18, 投射物: 2 (+1), 冷却: 0.77s",
            4: "增加穿透能力。\n伤害: 21, 穿透: 1 (+1), 冷却: 0.68s",
            5: "提升伤害和投射物速度。\n伤害: 24 (+3), 速度: 410 (+15), 冷却: 0.59s",
            6: "增加投射物数量。\n伤害: 27, 投射物: 3 (+1), 冷却: 0.50s",
            7: "提升伤害和投射物速度。\n伤害: 30 (+3), 速度: 440 (+15), 冷却: 0.41s",
            8: "增加穿透能力。\n伤害: 33, 穿透: 2 (+1), 投射物: 4 (+1), 冷却: 0.32s"
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
        const damage = this.stats.damage;
        const pierce = this.stats.pierce;

        // 计算持续时间
        const duration = Math.max(0.5, this.stats.duration * (ownerStats.durationMultiplier || 1));

        // 计算大小
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        
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
        const angleStep = count > 1 ? (Math.PI / 18) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);

        // 发射投射物
        for (let i = 0; i < count; i++) {
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // 确保投射物有速度
            if (Math.abs(vx) < 0.1 && Math.abs(vy) < 0.1) {
                continue; // 跳过无速度的投射物
            }

            // 使用对象池生成投射物
            spawnProjectile(
                owner.x, 
                owner.y, 
                EMOJI.PROJECTILE_DAGGER, 
                size, 
                vx, 
                vy, 
                damage, 
                pierce, 
                duration, 
                ownerStats
            );
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
        
        // 否则使用旧的逻辑
        let desc = `Lv${this.level + 1}: `;
        if (this.level % 2 === 1) {
            desc += `+1 投射物 (共${1 + Math.floor(this.level / 2)}个)。`;
        } else if (this.level === 3 || this.level === 7) {
            desc += `+1 穿透 (共${1 + Math.floor((this.level + 1) / 4)}次)。`;
        } else {
            desc += `+3 伤害 (共${12 + this.level * 3}), +15 速度 (共${350 + this.level * 15})。`;
        }

        return desc + ` 冷却: ${Math.max(0.16, this.baseCooldown - this.level * 0.09).toFixed(2)}s`;
    }
}