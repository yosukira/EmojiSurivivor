/**
 * 握手武器类
 * 发射环绕玩家的手掌，对接触的敌人造成伤害
 */
class HandshakeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "握手";
    static Emoji = EMOJI.WEAPON_HANDSHAKE;
    static MaxLevel = 8;
    static Evolution = {
        requires: "Spinach",
        evolvesTo: "HighFive"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(HandshakeWeapon.Name, HandshakeWeapon.Emoji, 1.0, HandshakeWeapon.MaxLevel);
        this.hands = [];
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 18 + (this.level - 1) * 4,
            count: 2 + Math.floor(this.level / 2),
            radius: 80 + (this.level - 1) * 10,
            speed: 180 + (this.level - 1) * 15,
            cooldown: Math.max(0.5, this.baseCooldown - (this.level - 1) * 0.05),
            duration: 3.0,
            knockback: 5 + (this.level - 1) * 1
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);

        // 计算手掌数量
        const count = this.stats.count + Math.floor((ownerStats.projectileCountBonus || 0) / 2);

        // 计算半径
        const radius = this.stats.radius * (ownerStats.areaMultiplier || 1);

        // 计算旋转速度
        const speed = this.stats.speed * (ownerStats.projectileSpeedMultiplier || 1);

        // 获取伤害
        const damage = this.stats.damage;

        // 计算持续时间
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);

        // 计算击退
        const knockback = this.stats.knockback;

        // 计算大小
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);

        // 计算角度间隔
        const angleStep = (Math.PI * 2) / count;

        // 创建手掌
        for (let i = 0; i < count; i++) {
            // 计算初始角度
            const startAngle = i * angleStep;

            // 创建手掌
            const hand = {
                owner: owner,
                ownerStats: ownerStats,
                x: owner.x + Math.cos(startAngle) * radius,
                y: owner.y + Math.sin(startAngle) * radius,
                angle: startAngle,
                radius: radius,
                speed: speed,
                damage: damage,
                knockback: knockback,
                size: size,
                lifetime: duration,
                hitCooldown: 0.5,
                hitTimer: 0,
                hitEnemies: new Set(),
                isGarbage: false,

                update: function(dt) {
                    // 更新生命周期
                    this.lifetime -= dt;

                    // 检查是否过期
                    if (this.lifetime <= 0) {
                        this.isGarbage = true;
                        return;
                    }

                    // 更新角度
                    this.angle += (this.speed / this.radius) * dt;

                    // 更新位置
                    this.x = this.owner.x + Math.cos(this.angle) * this.radius;
                    this.y = this.owner.y + Math.sin(this.angle) * this.radius;

                    // 更新命中计时器
                    this.hitTimer -= dt;

                    // 检查与敌人的碰撞
                    if (this.hitTimer <= 0) {
                        enemies.forEach(enemy => {
                            if (enemy.isGarbage || !enemy.isActive) return;

                            // 计算距离
                            const dx = enemy.x - this.x;
                            const dy = enemy.y - this.y;
                            const distSq = dx * dx + dy * dy;

                            // 如果在范围内，造成伤害
                            if (distSq <= (enemy.size / 2 + this.size / 2) * (enemy.size / 2 + this.size / 2)) {
                                // 造成伤害
                                enemy.takeDamage(this.damage * (this.ownerStats.damageMultiplier || 1), this.owner);

                                // 应用击退
                                if (this.knockback > 0 && distSq > 1) {
                                    const dist = Math.sqrt(distSq);

                                    // 计算击退方向和距离
                                    const pushX = (enemy.x - this.x) / dist * this.knockback * dt * 20;
                                    const pushY = (enemy.y - this.y) / dist * this.knockback * dt * 20;

                                    // 应用击退
                                    enemy.x += pushX;
                                    enemy.y += pushY;
                                }

                                // 添加到已命中列表
                                this.hitEnemies.add(enemy);

                                // 重置命中计时器
                                this.hitTimer = this.hitCooldown;
                            }
                        });
                    }
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    // 计算手掌方向
                    const handAngle = this.angle + Math.PI / 2;

                    // 保存上下文
                    ctx.save();

                    // 移动到手掌位置
                    ctx.translate(this.x, this.y);

                    // 旋转手掌
                    ctx.rotate(handAngle);

                    // 绘制手掌
                    ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(EMOJI.PROJECTILE_HANDSHAKE, 0, 0);

                    // 恢复上下文
                    ctx.restore();

                    // 绘制轨迹
                    if (Math.random() < 0.2) {
                        const trail = {
                            x: this.x,
                            y: this.y,
                            size: this.size * 0.8,
                            lifetime: 0.3,
                            timer: 0,
                            isGarbage: false,

                            update: function(dt) {
                                this.timer += dt;
                                if (this.timer >= this.lifetime) {
                                    this.isGarbage = true;
                                }
                            },

                            draw: function(ctx) {
                                if (this.isGarbage) return;

                                const alpha = 1 - (this.timer / this.lifetime);

                                ctx.save();
                                ctx.translate(this.x, this.y);
                                ctx.rotate(handAngle);
                                ctx.globalAlpha = alpha * 0.5;
                                ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                                ctx.textAlign = 'center';
                                ctx.textBaseline = 'middle';
                                ctx.fillText(EMOJI.PROJECTILE_HANDSHAKE, 0, 0);
                                ctx.globalAlpha = 1.0;
                                ctx.restore();
                            }
                        };

                        visualEffects.push(trail);
                    }
                }
            };

            // 添加到手掌列表
            this.hands.push(hand);
        }
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 调用父类更新方法
        super.update(dt, owner);

        // 更新手掌
        this.hands = this.hands.filter(hand => {
            hand.update(dt);
            return !hand.isGarbage;
        });
    }

    /**
     * 绘制特效
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawEffects(ctx) {
        // 绘制手掌
        this.hands.forEach(hand => hand.draw(ctx));
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;
        if (this.level % 2 === 1) {
            desc += "+1 手掌。";
        } else {
            desc += "+伤害/范围/速度。";
        }

        return desc + ` (冷却: ${Math.max(0.5, this.baseCooldown - this.level * 0.05).toFixed(2)}s)`;
    }
    
    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `发射环绕玩家的手掌，对接触的敌人造成伤害。`;
    }
}