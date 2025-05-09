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
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);

        // 计算投射物数量
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);

        // 计算投射物速度
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);

        // 获取伤害和穿透
        const damage = this.stats.damage;
        const pierce = this.stats.pierce;

        // 计算持续时间
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);

        // 计算大小
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        // 寻找目标
        let target = owner.findNearestEnemy(GAME_WIDTH * 1.5) || {
            x: owner.x + owner.lastMoveDirection.x * 100,
            y: owner.y + owner.lastMoveDirection.y * 100
        };
        // 计算方向
        const dx = target.x - owner.x;
        const dy = target.y - owner.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
        const dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;

        // 计算角度
        const angleStep = count > 1 ? (Math.PI / 18) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);

        // 发射投射物
        for (let i = 0; i < count; i++) {
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

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
        let desc = `Lv${this.level + 1}: `;
        if (this.level % 2 === 1) {
            desc += "+1 投射物。";
        } else if (this.level === 3 || this.level === 7) {
            desc += "+1 穿透。";
        } else {
            desc += "+伤害/速度。";
        }

        return desc + ` (冷却: ${Math.max(0.16, this.baseCooldown - this.level * 0.09).toFixed(2)}s)`;
    }
}