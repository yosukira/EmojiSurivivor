/**
 * 鞭子武器类
 * 创建一个扇形攻击区域，对范围内敌人造成伤害
 */
class WhipWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "鞭子";
    static Emoji = EMOJI.WEAPON_WHIP;
    static MaxLevel = 8;
    static Evolution = {
        requires: "HollowHeart",
        evolvesTo: "BloodyTear"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(WhipWeapon.Name, WhipWeapon.Emoji, 1.6, WhipWeapon.MaxLevel);
        this.whipHitboxes = [];
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 20 + (this.level - 1) * 7,
            cooldown: Math.max(0.65, this.baseCooldown - (this.level - 1) * 0.13),
            area: 110 + (this.level - 1) * 18,
            count: 1 + Math.floor(this.level / 4),
            pierce: Infinity,
            angle: Math.PI / 3 // 扇形角度
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);

        // 获取伤害
        const damage = this.stats.damage;

        // 计算实际范围
        const area = this.stats.area * (ownerStats.areaMultiplier || 1);

        // 计算实际数量
        const count = this.stats.count + Math.floor((ownerStats.projectileCountBonus || 0) / 2);

        // 计算宽度
        const width = 25 * (ownerStats.areaMultiplier || 1);

        // 获取目标敌人
        const targetEnemy = owner.findNearestEnemy(area * 1.5);

        // 确定攻击方向
        let attackDirection;
        if (targetEnemy) {
            // 如果有目标敌人，攻击方向指向敌人
            const dx = targetEnemy.x - owner.x;
            const dy = targetEnemy.y - owner.y;
            attackDirection = Math.atan2(dy, dx);
        } else {
            // 否则使用玩家最后移动方向
            attackDirection = Math.atan2(owner.lastMoveDirection.y, owner.lastMoveDirection.x);
        }

        // 计算扇形角度
        const angleStep = (Math.PI * 2) / count;

        // 创建多个鞭子攻击
        for (let i = 0; i < count; i++) {
            // 计算当前鞭子角度
            const currentAngle = attackDirection + (i * angleStep);

            // 计算鞭子终点
            const hitX = owner.x + Math.cos(currentAngle) * area;
            const hitY = owner.y + Math.sin(currentAngle) * area;
            // 创建鞭子碰撞箱
            const hitbox = {
                x: owner.x,
                y: owner.y,
                targetX: hitX,
                targetY: hitY,
                width: width,
                length: area,
                angle: currentAngle,
                damage: damage,
                ownerStats: ownerStats,
                lifetime: 0.25,
                progress: 0, // 攻击进度 (0-1)
                hitTargets: new Set(),
                isGarbage: false,
                update: function(dt) {
                    // 更新生命周期
                    this.lifetime -= dt;

                    // 更新进度
                    this.progress = Math.min(1, 1 - (this.lifetime / 0.25));

                    // 检查是否过期
                    if (this.lifetime <= 0) {
                        this.isGarbage = true;
                        return;
                    }

                    // 检查与敌人的碰撞
                    enemies.forEach(enemy => {
                        if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;

                        // 计算敌人到鞭子线段的距离
                        const dist = this.distanceToLine(enemy.x, enemy.y);

                        // 如果在鞭子范围内，造成伤害
                        if (dist <= enemy.size / 2 + this.width / 2) {
                            enemy.takeDamage(this.damage * (this.ownerStats.damageMultiplier || 1), owner);
                            this.hitTargets.add(enemy);
                        }
                    });
                },

                distanceToLine: function(x, y) {
                    // 计算鞭子当前长度
                    const currentLength = this.length * this.progress;

                    // 计算鞭子终点
                    const endX = this.x + Math.cos(this.angle) * currentLength;
                    const endY = this.y + Math.sin(this.angle) * currentLength;

                    // 计算向量
                    const lineVecX = endX - this.x;
                    const lineVecY = endY - this.y;
                    const lineLength = Math.sqrt(lineVecX * lineVecX + lineVecY * lineVecY);

                    // 如果鞭子长度为0，直接返回到起点的距离
                    if (lineLength === 0) {
                        return Math.sqrt((x - this.x) * (x - this.x) + (y - this.y) * (y - this.y));
                    }

                    // 计算点到线段的投影
                    const t = Math.max(0, Math.min(1, ((x - this.x) * lineVecX + (y - this.y) * lineVecY) / (lineLength * lineLength)));

                    // 计算投影点
                    const projX = this.x + t * lineVecX;
                    const projY = this.y + t * lineVecY;

                    // 返回点到投影点的距离
                    return Math.sqrt((x - projX) * (x - projX) + (y - projY) * (y - projY));
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    // 计算当前鞭子长度
                    const currentLength = this.length * this.progress;

                    // 计算鞭子终点
                    const endX = this.x + Math.cos(this.angle) * currentLength;
                    const endY = this.y + Math.sin(this.angle) * currentLength;

                    // 绘制鞭子
                    ctx.strokeStyle = 'rgba(210, 210, 210, 0.7)';
                    ctx.lineWidth = this.width;
                    ctx.lineCap = 'round';

                    ctx.beginPath();
                    ctx.moveTo(this.x, this.y);
                    ctx.lineTo(endX, endY);
                    ctx.stroke();

                    // 绘制鞭子头部
                    ctx.fillStyle = 'rgba(210, 210, 210, 0.9)';
                    ctx.beginPath();
                    ctx.arc(endX, endY, this.width / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            // 添加到鞭子列表
            this.whipHitboxes.push(hitbox);
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

        // 更新鞭子碰撞箱
        this.whipHitboxes = this.whipHitboxes.filter(hitbox => {
            hitbox.update(dt);
            return !hitbox.isGarbage;
        });
    }

    /**
     * 绘制鞭子碰撞箱
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawHitboxes(ctx) {
        this.whipHitboxes.forEach(hitbox => hitbox.draw(ctx));
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: +伤害/范围。`;

        if (this.level === 3) {
            desc += "+1 鞭击。";
        }

        return desc + ` (冷却: ${Math.max(0.65, this.baseCooldown - this.level * 0.13).toFixed(2)}s)`;
    }
}