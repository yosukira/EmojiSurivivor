/**
 * 大蒜武器
 * 在玩家周围创建伤害光环，对接触的敌人造成伤害并击退
 * 升级可增加伤害、范围和击退效果
 */
class GarlicWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "大蒜";
    static Emoji = EMOJI.WEAPON_GARLIC;
    static MaxLevel = 8;
    static Evolution = {
        requires: "Pummarola",
        evolvesTo: "SoulEater"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(GarlicWeapon.Name, GarlicWeapon.Emoji, 1.0, GarlicWeapon.MaxLevel);
        this.auraRadius = 0;
        this.damageTickTimer = 0;
        this.damageTickInterval = 0.35; // 降低伤害间隔
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 3 + (this.level - 1) * 1.5, // 提高伤害
            area: 65 + (this.level - 1) * 12,
            knockback: 6 + this.level * 1.5, // 提高击退
            cooldown: 1.0
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 大蒜武器不需要发射，在update中处理
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 更新伤害计时器
        this.damageTickTimer -= dt;

        // 如果计时器结束，造成伤害
        if (this.damageTickTimer <= 0) {
            // 获取拥有者属性
            const ownerStats = this.getOwnerStats(owner);

            // 计算实际范围
            const radius = this.stats.area * (ownerStats.areaMultiplier || 1);
            const radiusSq = radius * radius;

            // 获取伤害和击退
            const damage = this.stats.damage;
            const knockback = this.stats.knockback;
            // 对范围内的敌人造成伤害
            enemies.forEach(enemy => {
                if (enemy.isGarbage || !enemy.isActive) return;

                // 计算距离
                const dx = owner.x - enemy.x;
                const dy = owner.y - enemy.y;
                const distSq = dx * dx + dy * dy;

                // 如果在范围内，造成伤害
                if (distSq <= radiusSq) {
                    // 造成伤害
                    enemy.takeDamage(damage * (ownerStats.damageMultiplier || 1), owner);

                    // 应用击退
                    if (knockback > 0 && distSq > 1) {
                        const dist = Math.sqrt(distSq);

                        // 击退力随距离衰减
                        const pushFactor = knockback * (1 - dist / radius);
                        // 计算击退方向和距离
                        const pushX = (enemy.x - owner.x) / dist * pushFactor * dt * 18;
                        const pushY = (enemy.y - owner.y) / dist * pushFactor * dt * 18;
                        // 应用击退
                        enemy.x += pushX;
                        enemy.y += pushY;
                    }
                }
            });

            // 重置计时器
            this.damageTickTimer += this.damageTickInterval;
        }

        // 更新光环半径
        this.auraRadius = this.stats.area * (this.getOwnerStats(owner).areaMultiplier || 1);
    }

    /**
     * 绘制光环
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Player} owner - 拥有者
     */
    drawAura(ctx, owner) {
        if (this.auraRadius <= 0) return;

        // 绘制光环
        ctx.beginPath();
        ctx.arc(owner.x, owner.y, this.auraRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.fill();
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +伤害/范围/击退。`;
    }
}