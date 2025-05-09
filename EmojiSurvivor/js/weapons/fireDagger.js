/**
 * 火焰匕首武器类
 * 发射带有燃烧效果的匕首
 */
class FireDaggerWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "火焰匕首";
    static Emoji = EMOJI.WEAPON_FIRE_DAGGER;
    static MaxLevel = 8;
    static Evolution = {
        requires: "Candelabrador",
        evolvesTo: "Inferno"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(FireDaggerWeapon.Name, FireDaggerWeapon.Emoji, 1.1, FireDaggerWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 10 + (this.level - 1) * 2.5,
            projectileSpeed: 320 + (this.level - 1) * 12,
            cooldown: Math.max(0.2, this.baseCooldown - (this.level - 1) * 0.08),
            count: 1 + Math.floor((this.level - 1) / 3),
            pierce: 1 + Math.floor(this.level / 3),
            duration: 1.8,
            burnDamage: 2 + (this.level - 1) * 0.5,
            burnDuration: 2.0 + (this.level - 1) * 0.2,
            burnTick: 0.5,
            aoeRadius: 30 + (this.level - 1) * 5
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

        // 计算燃烧效果
        const burnDamage = this.stats.burnDamage * (ownerStats.damageMultiplier || 1);
        const burnDuration = this.stats.burnDuration * (ownerStats.durationMultiplier || 1);
        const burnTick = this.stats.burnTick;

        // 计算范围伤害半径
        const aoeRadius = this.stats.aoeRadius * (ownerStats.areaMultiplier || 1);
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
        const angleStep = count > 1 ? (Math.PI / 12) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);

        // 发射投射物
        for (let i = 0; i < count; i++) {
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // 使用对象池生成投射物
            const projectile = spawnProjectile(
                owner.x, 
                owner.y, 
                EMOJI.PROJECTILE_FIRE, 
                size, 
                vx, 
                vy, 
                damage, 
                pierce, 
                duration, 
                ownerStats
            );
            // 添加燃烧效果
            projectile.statusEffect = {
                type: 'burn',
                damage: burnDamage,
                duration: burnDuration,
                tick: burnTick
            };

            // 添加范围伤害
            projectile.aoeRadius = aoeRadius;
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;

        if (this.level % 3 === 0) {
            desc += "+1 投射物。";
        } else if (this.level % 3 === 2) {
            desc += "+1 穿透。";
        } else {
            desc += "+伤害/燃烧。";
        }

        return desc + ` (冷却: ${Math.max(0.2, this.baseCooldown - this.level * 0.08).toFixed(2)}s)`;
    }
    
    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `发射火焰匕首，造成伤害并使敌人燃烧。`;
    }
}