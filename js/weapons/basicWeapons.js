/**
 * 匕首武器类
 * 发射匕首攻击敌人
 */
class DaggerWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "匕首";
    static Emoji = "🔪";
    static MaxLevel = 8;

    /**
     * 构造函数
     */
    constructor() {
        super(DaggerWeapon.Name, DaggerWeapon.Emoji, 1.0, DaggerWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 8 + (this.level - 1) * 3,  // 提高基础伤害
            projectileSpeed: 350 + (this.level - 1) * 20,
            cooldown: Math.max(0.3, this.baseCooldown - (this.level - 1) * 0.08),
            count: 1 + Math.floor((this.level - 1) / 2),
            pierce: Math.floor(this.level / 3),
            duration: 1.0
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        const projectileCount = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const pierce = this.stats.pierce;
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);

        // 1. 获取并排序敌人
        let sortedEnemies = [];
        if (typeof enemies !== 'undefined' && enemies.length > 0) {
            sortedEnemies = enemies.filter(e => e && !e.isGarbage && e.isActive && !(e instanceof GhostEnemy)) // 排除幽灵
                .map(enemy => ({
                    enemy,
                    distSq: (enemy.x - owner.x) * (enemy.x - owner.x) + (enemy.y - owner.y) * (enemy.y - owner.y)
                }))
                .sort((a, b) => a.distSq - b.distSq)
                .map(item => item.enemy);
        }

        // 2. 为每个投射物确定目标并发射
        for (let i = 0; i < projectileCount; i++) {
            let dirX, dirY;

            if (sortedEnemies.length > 0) {
                // 循环选择目标敌人
                const targetEnemy = sortedEnemies[i % sortedEnemies.length];
                const dx = targetEnemy.x - owner.x;
                const dy = targetEnemy.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
                dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
            } else {
                // 没有敌人时的后备行为：向玩家最后移动方向发射
                // 或者，如果之前有 target 的概念，可以像之前一样找一个大致的目标点
                let fallbackTargetX = owner.x + owner.lastMoveDirection.x * 100;
                let fallbackTargetY = owner.y + owner.lastMoveDirection.y * 100;
                
                // 如果鼠标位置可用且更合适作为无目标时的方向，可以使用 (需引入 mousePos)
                // if (typeof mousePos !== 'undefined' && mousePos.x !== undefined) {
                // fallbackTargetX = mousePos.x;
                // fallbackTargetY = mousePos.y;
                // }


                const dx = fallbackTargetX - owner.x;
                const dy = fallbackTargetY - owner.y;

                // 对于匕首这种单向武器，如果只有一个投射物且无敌人，应该直接按玩家朝向
                // 如果有多个投射物且无敌人，匕首原来的扇形逻辑可能更合适
                if (projectileCount === 1 || sortedEnemies.length === 0) {
                     dirX = owner.lastMoveDirection.x;
                     dirY = owner.lastMoveDirection.y;
                     // 如果 lastMoveDirection 是 (0,0) (例如玩家静止)，给一个默认方向，比如向上
                     if (dirX === 0 && dirY === 0) {
                         dirX = 0;
                         dirY = -1;
                     }
                } else {
                    // 当有多个投射物但无敌人时，可以恢复扇形发射，或都朝一个方向
                    // 这里为了简化，暂时也使其朝向 lastMoveDirection，或者可以引入之前的扇形逻辑
                     const angleStep = Math.PI / 8; // 与之前匕首逻辑类似
                     const baseAngle = Math.atan2(owner.lastMoveDirection.y, owner.lastMoveDirection.x);
                     const startAngle = baseAngle - (angleStep * (projectileCount - 1) / 2);
                     const currentAngle = startAngle + i * angleStep;
                     dirX = Math.cos(currentAngle);
                     dirY = Math.sin(currentAngle);
                }

                // 确保方向向量不是0,0，如果玩家完全静止且没有lastMoveDirection
                if (dirX === 0 && dirY === 0) {
                    dirX = 0; dirY = -1; // 默认向上
                }
            }

            const vx = dirX * speed;
            const vy = dirY * speed;

            const proj = new Projectile(
                owner.x,
                owner.y,
                this.emoji,
                size,
                vx,
                vy,
                damage,
                pierce,
                duration,
                ownerStats
            );
            if (typeof projectiles !== 'undefined') {
                projectiles.push(proj);
            } else {
                console.error('全局 projectiles 数组未定义!');
            }
            proj.owner = owner;
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const nextLevel = this.level + 1;
        if (nextLevel > this.maxLevel) return "已达最高等级";

        if (!this.stats) {
            this.calculateStats();
        }
        console.log('DaggerWeapon this.stats after calculate:', JSON.stringify(this.stats)); // 调试日志

        const tempStats = JSON.parse(JSON.stringify(this.stats));
        const originalLevel = this.level;
        this.level = nextLevel;
        this.calculateStats();
        const nextLevelCalculatedStats = this.stats;
        const descParts = [];

        if (nextLevelCalculatedStats.damage > tempStats.damage) {
            descParts.push(`伤害: ${tempStats.damage.toFixed(0)} → ${nextLevelCalculatedStats.damage.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.projectileSpeed > tempStats.projectileSpeed) {
            descParts.push(`速度: ${tempStats.projectileSpeed.toFixed(0)} → ${nextLevelCalculatedStats.projectileSpeed.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.count > tempStats.count) {
            descParts.push(`投射物: ${tempStats.count} → ${nextLevelCalculatedStats.count}`);
        }
        if (nextLevelCalculatedStats.pierce > tempStats.pierce) {
            descParts.push(`穿透: ${tempStats.pierce} → ${nextLevelCalculatedStats.pierce}`);
        }
        if (nextLevelCalculatedStats.cooldown < tempStats.cooldown) {
            descParts.push(`冷却: ${tempStats.cooldown.toFixed(2)}s → ${nextLevelCalculatedStats.cooldown.toFixed(2)}s`);
        }

        this.level = originalLevel;
        this.calculateStats();

        if (descParts.length === 0) {
            return `Lv${nextLevel}: 属性小幅提升。`;
        }
        return `Lv${nextLevel}: ${descParts.join(', ')}。`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射匕首攻击敌人。";
    }
}

/**
 * 大蒜武器类
 * 创建伤害光环
 */
class GarlicWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "痛苦力场";
    static Emoji = "🧄";
    static MaxLevel = 8;

    /**
     * 构造函数
     */
    constructor() {
        super(GarlicWeapon.Name, GarlicWeapon.Emoji, 0.5, GarlicWeapon.MaxLevel);
        // 已命中敌人
        this.hitEnemies = new Set();
        // 命中冷却
        this.hitCooldown = 0.5;
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 5 + (this.level - 1) * 2,
            radius: 60 + (this.level - 1) * 10,
            cooldown: this.baseCooldown,
            knockback: 50 + (this.level - 1) * 5,
            slowFactor: 0.7 - (this.level - 1) * 0.05,
            slowDuration: 0.5 + (this.level - 1) * 0.1
        };
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 更新冷却计时器
        this.cooldownTimer -= dt;
        // 如果冷却结束，发射武器
        if (this.cooldownTimer <= 0) {
            // 发射武器
            this.fire(owner);
            // 重置冷却计时器
            this.cooldownTimer = this.stats.cooldown * (owner.getStat('cooldownMultiplier') || 1.0);
        }
        // 清除已命中敌人
        this.hitEnemies.clear();
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        // 计算实际属性
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1.0);
        const radius = this.stats.radius * (ownerStats.areaMultiplier || 1.0);
        const knockback = this.stats.knockback;
        const slowFactor = this.stats.slowFactor;
        const slowDuration = this.stats.slowDuration * (ownerStats.durationMultiplier || 1.0);
        // 获取范围内的敌人
        const enemies = owner.findEnemiesInRadius(radius);
        // 对范围内的敌人造成伤害
        enemies.forEach(enemy => {
            // 跳过已命中敌人
            if (this.hitEnemies.has(enemy)) return;
            // 造成伤害
            enemy.takeDamage(damage, owner);
            // 添加到已命中列表
            this.hitEnemies.add(enemy);
            // 计算击退方向
            const dx = enemy.x - owner.x;
            const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 如果距离不为0，应用击退
            if (dist > 0) {
                // 计算击退距离
                const knockbackDist = knockback * (1 - dist / radius);
                // 应用击退
                enemy.x += (dx / dist) * knockbackDist;
                enemy.y += (dy / dist) * knockbackDist;
            }
            // 添加减速效果
            if (!enemy.statusEffects.slow || enemy.statusEffects.slow.factor > slowFactor) {
                enemy.statusEffects.slow = {
                    factor: slowFactor,
                    duration: slowDuration,
                    source: owner
                };
            } else if (enemy.statusEffects.slow) {
                // 更新持续时间
                enemy.statusEffects.slow.duration = Math.max(
                    enemy.statusEffects.slow.duration,
                    slowDuration
                );
            }
        });
    }

    /**
     * 绘制光环
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Player} owner - 拥有者
     */
    drawAura(ctx, owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        // 计算实际半径
        const radius = this.stats.radius * (ownerStats.areaMultiplier || 1.0);
        // 绘制光环
        ctx.fillStyle = 'rgba(200, 255, 200, 0.2)';
        ctx.beginPath();
        ctx.arc(owner.x, owner.y, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const nextLevel = this.level + 1;
        if (nextLevel > this.maxLevel) return "已达最高等级";

        if (!this.stats) {
            this.calculateStats();
        }

        const tempStats = JSON.parse(JSON.stringify(this.stats));
        const originalLevel = this.level;
        this.level = nextLevel;
        this.calculateStats();
        const nextLevelCalculatedStats = this.stats;
        const descParts = [];

        if (nextLevelCalculatedStats.damage > tempStats.damage) {
            descParts.push(`伤害: ${tempStats.damage.toFixed(0)} → ${nextLevelCalculatedStats.damage.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.radius > tempStats.radius) {
            descParts.push(`范围: ${tempStats.radius.toFixed(0)} → ${nextLevelCalculatedStats.radius.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.knockback > tempStats.knockback) {
            descParts.push(`击退: ${tempStats.knockback.toFixed(0)} → ${nextLevelCalculatedStats.knockback.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.slowFactor < tempStats.slowFactor) { // 注意减速因子是越小越强
            descParts.push(`减速: ${(tempStats.slowFactor * 100).toFixed(0)}% → ${(nextLevelCalculatedStats.slowFactor * 100).toFixed(0)}%`);
        }
        if (nextLevelCalculatedStats.slowDuration > tempStats.slowDuration) {
            descParts.push(`减速持续: ${tempStats.slowDuration.toFixed(1)}s → ${nextLevelCalculatedStats.slowDuration.toFixed(1)}s`);
        }
        // Cooldown for Garlic is fixed (this.baseCooldown), so no change expected.

        this.level = originalLevel;
        this.calculateStats();

        if (descParts.length === 0) {
            return `Lv${nextLevel}: 属性小幅提升。`;
        }
        return `Lv${nextLevel}: ${descParts.join(', ')}。`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "在你周围产生一个伤害光环，并减速敌人。";
    }
}

/**
 * 鞭子武器类
 * 横扫敌人
 */
class WhipWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "鞭子";
    static Emoji = "〰️";
    static MaxLevel = 8;
    static Evolution = {
        requires: "HollowHeart",
        evolvesTo: "BloodyTear"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(WhipWeapon.Name, WhipWeapon.Emoji, 1.5, WhipWeapon.MaxLevel);
        // 命中框
        this.hitboxes = [];
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15 + (this.level - 1) * 5,
            width: 100 + (this.level - 1) * 15,
            length: 120 + (this.level - 1) * 20,
            cooldown: Math.max(0.3, this.baseCooldown - (this.level - 1) * 0.15),
            count: 1 + Math.floor(this.level / 4),
            duration: 0.3
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        // 计算实际属性
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1.0);
        const width = this.stats.width * (ownerStats.areaMultiplier || 1.0);
        const length = this.stats.length * (ownerStats.areaMultiplier || 1.0);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1.0);
        // 清除命中框
        this.hitboxes = [];
        // 获取目标敌人
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
        const angle = Math.atan2(dirY, dirX);
        // 计算角度间隔
        const angleStep = Math.PI / (count + 1);
        const startAngle = angle - (angleStep * (count - 1) / 2);
        // 创建多个鞭子
        for (let i = 0; i < count; i++) {
            // 计算角度
            const whipAngle = startAngle + i * angleStep;
            // 创建鞭子
            this.createWhip(owner, whipAngle, damage, width, length, duration);
        }
    }

    /**
     * 创建鞭子
     * @param {Player} owner - 拥有者
     * @param {number} angle - 角度
     * @param {number} damage - 伤害
     * @param {number} width - 宽度
     * @param {number} length - 长度
     * @param {number} duration - 持续时间
     */
    createWhip(owner, angle, damage, width, length, duration) {
        // 计算方向
        const dirX = Math.cos(angle);
        const dirY = Math.sin(angle);
        // 计算中心点
        const centerX = owner.x + dirX * length / 2;
        const centerY = owner.y + dirY * length / 2;
        // 计算垂直方向
        const perpX = -dirY;
        const perpY = dirX;
        // 计算四个角点
        const points = [
            { x: centerX - dirX * length / 2 - perpX * width / 2, y: centerY - dirY * length / 2 - perpY * width / 2 },
            { x: centerX + dirX * length / 2 - perpX * width / 2, y: centerY + dirY * length / 2 - perpY * width / 2 },
            { x: centerX + dirX * length / 2 + perpX * width / 2, y: centerY + dirY * length / 2 + perpY * width / 2 },
            { x: centerX - dirX * length / 2 + perpX * width / 2, y: centerY - dirY * length / 2 + perpY * width / 2 }
        ];
        // 创建命中框
        const hitbox = {
            points: points,
            damage: damage,
            duration: duration,
            lifetime: 0,
            hitEnemies: new Set(),
            isGarbage: false,
            update: function(dt) {
                // 更新生命周期
                this.lifetime += dt;
                // 如果生命周期结束，标记为垃圾
                if (this.lifetime >= this.duration) {
                    this.isGarbage = true;
                    return;
                }
                // 检查与敌人的碰撞
                enemies.forEach(enemy => {
                    // 跳过已命中的敌人
                    if (enemy.isGarbage || !enemy.isActive || this.hitEnemies.has(enemy)) return;
                    // 检查碰撞
                    if (this.checkCollision(enemy)) {
                        // 造成伤害
                        enemy.takeDamage(this.damage, owner);
                        // 添加到已命中列表
                        this.hitEnemies.add(enemy);
                    }
                });
            },
            checkCollision: function(enemy) {
                // 检查点是否在多边形内
                return this.isPointInPolygon(enemy.x, enemy.y, this.points);
            },
            isPointInPolygon: function(x, y, polygon) {
                let inside = false;
                for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
                    const xi = polygon[i].x, yi = polygon[i].y;
                    const xj = polygon[j].x, yj = polygon[j].y;
                    const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                    if (intersect) inside = !inside;
                }
                return inside;
            },
            draw: function(ctx) {
                if (this.isGarbage) return;
                // 计算透明度
                const alpha = 0.3 * (1 - this.lifetime / this.duration);
                // 绘制命中框
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.beginPath();
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.points[0].x, this.points[0].y);
                ctx.moveTo(screenPos.x, screenPos.y);
                for (let i = 1; i < this.points.length; i++) {
                    const screenPos = cameraManager.worldToScreen(this.points[i].x, this.points[i].y);
                    ctx.lineTo(screenPos.x, screenPos.y);
                }
                ctx.closePath();
                ctx.fill();
                // 绘制边框
                ctx.strokeStyle = `rgba(200, 200, 200, ${alpha * 2})`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
        };
        // 添加到命中框列表
        this.hitboxes.push(hitbox);
        // 创建视觉效果
        const effect = {
            x: owner.x,
            y: owner.y,
            angle: angle,
            length: length,
            width: width,
            duration: duration,
            lifetime: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新生命周期
                this.lifetime += dt;
                // 如果生命周期结束，标记为垃圾
                if (this.lifetime >= this.duration) {
                    this.isGarbage = true;
                    return;
                }
            },
            draw: function(ctx) {
                if (this.isGarbage) return;
                // 计算透明度
                const alpha = 0.6 * (1 - this.lifetime / this.duration); // 稍微降低基础透明度
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                // 保存上下文
                ctx.save();
                // 平移到玩家位置
                ctx.translate(screenPos.x, screenPos.y);
                // 旋转
                ctx.rotate(this.angle + Math.PI / 2); // 旋转90度，使其与攻击方向垂直

                // 绘制鞭子
                ctx.strokeStyle = `rgba(220, 220, 220, ${alpha})`; // 鞭子颜色调为浅灰
                // 调整 lineWidth 使其更细，并随动画变化
                const baseLineWidth = Math.max(2, this.width * cameraManager.zoom * 0.15); // 更细的基础宽度
                const progress = this.lifetime / this.duration;
                // 鞭子宽度从中间向两端逐渐变细的效果
                ctx.lineWidth = baseLineWidth * (1 - Math.abs(progress - 0.5) * 1.5);

                ctx.beginPath();
                ctx.moveTo(-this.length / 2, 0);
                // 使用更平滑的曲线，或者简单的直线
                // ctx.lineTo(this.length / 2, 0); // 简单直线
                // 贝塞尔曲线，使其有挥舞感
                const controlY = this.length * 0.2 * Math.sin(progress * Math.PI); // 控制点Y随动画变化
                ctx.quadraticCurveTo(0, controlY, this.length / 2, 0);
                ctx.stroke();
                
                // 恢复上下文
                ctx.restore();
            }
        };
        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 调用父类更新方法
        super.update(dt, owner);
        // 更新命中框
        for (let i = this.hitboxes.length - 1; i >= 0; i--) {
            // 更新命中框
            this.hitboxes[i].update(dt);
            // 如果命中框已标记为垃圾，移除
            if (this.hitboxes[i].isGarbage) {
                this.hitboxes.splice(i, 1);
            }
        }
    }

    /**
     * 绘制命中框
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawHitboxes(ctx) {
        // 绘制命中框
        this.hitboxes.forEach(hitbox => hitbox.draw(ctx));
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const nextLevel = this.level + 1;
        if (nextLevel > this.maxLevel) return "已达最高等级";

        if (!this.stats) {
            this.calculateStats();
        }

        const tempStats = JSON.parse(JSON.stringify(this.stats));
        const originalLevel = this.level;
        this.level = nextLevel;
        this.calculateStats();
        const nextLevelCalculatedStats = this.stats;
        const descParts = [];

        if (nextLevelCalculatedStats.damage > tempStats.damage) {
            descParts.push(`伤害: ${tempStats.damage.toFixed(0)} → ${nextLevelCalculatedStats.damage.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.width > tempStats.width || nextLevelCalculatedStats.length > tempStats.length) {
            // 将宽度和长度合并为范围描述
            const currentArea = tempStats.width * tempStats.length;
            const nextArea = nextLevelCalculatedStats.width * nextLevelCalculatedStats.length;
             if (nextArea > currentArea) {
                // 简单地表示范围提升，或者可以更具体
                descParts.push(`范围提升`);
                // 或者更具体: descParts.push(`范围: ${tempStats.width.toFixed(0)}x${tempStats.length.toFixed(0)} → ${nextLevelCalculatedStats.width.toFixed(0)}x${nextLevelCalculatedStats.length.toFixed(0)}`);
             }
        }
        if (nextLevelCalculatedStats.count > tempStats.count) {
            descParts.push(`鞭挞次数: ${tempStats.count} → ${nextLevelCalculatedStats.count}`);
        }
        if (nextLevelCalculatedStats.cooldown < tempStats.cooldown) {
            descParts.push(`冷却: ${tempStats.cooldown.toFixed(2)}s → ${nextLevelCalculatedStats.cooldown.toFixed(2)}s`);
        }
        // duration is fixed

        this.level = originalLevel;
        this.calculateStats();

        if (descParts.length === 0) {
            return `Lv${nextLevel}: 属性小幅提升。`;
        }
        return `Lv${nextLevel}: ${descParts.join(', ')}。`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "横扫敌人。";
    }
}
