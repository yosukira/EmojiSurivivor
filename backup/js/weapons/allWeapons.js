/**
 * 所有武器的整合文件
 * 包含基础武器、高级武器、新武器和调试武器
 * 已移除所有进化相关的代码
 */

class DaggerWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "匕首";
    static Emoji = "🔪";
    static MaxLevel = 10;

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
        let pierce = Math.floor(this.level / 3);
        if (this.level === 10) {
            pierce += 2; // 10级时额外+2穿透
        }
        
        this.stats = {
            damage: 8 + (this.level - 1) * 3,  // 提高基础伤害
            projectileSpeed: 350 + (this.level - 1) * 20,
            cooldown: Math.max(0.3, this.baseCooldown - (this.level - 1) * 0.08),
            count: 1 + Math.floor((this.level - 1) / 2),
            pierce: pierce,
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
        const tempStats = JSON.parse(JSON.stringify(this.stats));
        const originalLevel = this.level;
        this.level = nextLevel;
        this.calculateStats();
        const nextLevelCalculatedStats = this.stats;
        const descParts = [];
        
        // 特别处理10级效果
        if (nextLevel === 10) {
            descParts.push("额外获得+2穿透能力");
        }

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

class GarlicWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "痛苦力场";
    static Emoji = "🧄";
    static MaxLevel = 10;

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
            knockback: this.level === 10 ? 30 : 0, // 10级才有少量击退效果
            slowFactor: 1.0, // 移除减速效果
            slowDuration: 0
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
            
            // 10级才有击退效果
            if (knockback > 0) {
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
        
        // 直接使用玩家的世界坐标，让相机管理器处理转换
        // 这确保光环始终跟随玩家，而不是固定在某个位置
        const screenPos = cameraManager.worldToScreen(owner.x, owner.y);
        
        // 创建径向渐变
        const gradient = ctx.createRadialGradient(
            screenPos.x, screenPos.y, 0,
            screenPos.x, screenPos.y, radius * cameraManager.zoom // 适应缩放
        );
        
        // 设置颜色渐变
        gradient.addColorStop(0, 'rgba(180, 255, 180, 0.3)');
        gradient.addColorStop(0.7, 'rgba(100, 255, 100, 0.2)');
        gradient.addColorStop(1, 'rgba(50, 255, 50, 0.1)');
        
        // 绘制光环 - 使用屏幕坐标和半径
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius * cameraManager.zoom, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // 添加边缘线
        ctx.strokeStyle = 'rgba(100, 255, 100, 0.4)';
        ctx.lineWidth = 2;
        ctx.stroke();
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
        return "在你周围产生一个伤害光环，持续伤害接触到的敌人。";
    }
}

class WhipWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "鞭子";
    static Emoji = "〰️";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(WhipWeapon.Name, WhipWeapon.Emoji, 1.5, WhipWeapon.MaxLevel);
        // 命中框
        this.hitboxes = [];
        // 记录上次攻击方向（-1为左，1为右）
        this.lastDirection = 1;
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15 + (this.level - 1) * 6,
            width: 30,
            length: 160 + (this.level - 1) * 20,
            cooldown: Math.max(0.15, this.baseCooldown - (this.level - 1) * 0.1),
            count: 1 + Math.floor((this.level - 1) / 3),
            slowEffect: this.level === 10,  // 10级才有减速效果
            slowFactor: 0.7,  // 减速30%
            slowDuration: 1.0,  // 减速持续1秒
            critChance: this.level === 10 ? 0.3 : 0,  // 10级才有30%暴击率
            critMultiplier: 1.5,  // 暴击伤害1.5倍
            chainAttack: this.level === 10,  // 10级才有连锁攻击
            chainCount: 2,  // 连锁攻击2个目标
            chainRange: 150  // 连锁范围
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
        
        // 交替左右攻击
        this.lastDirection = -this.lastDirection; // 切换方向
        
        // 固定左右方向的水平角度
        const horizontalAngle = this.lastDirection > 0 ? 0 : Math.PI; // 0代表右侧，Math.PI代表左侧
        
        // 如果有多个鞭子，计算每个鞭子的角度偏移
        const angleStep = Math.PI / 20; // 很小的角度步长，确保都在水平方向
        
        // 创建多个鞭子
        for (let i = 0; i < count; i++) {
            // 基于主方向稍微偏移一点角度，保持在水平方向
            const whipAngle = horizontalAngle + (i - Math.floor(count/2)) * angleStep;
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
        
        // 计算起点
        const startX = owner.x;
        const startY = owner.y;
        
        // 创建击打点
        const hitX = startX + dirX * length;
        const hitY = startY + dirY * length;
        
        // 创建碰撞点数组
        const points = [
            { x: startX, y: startY },
            { x: hitX, y: hitY }
        ];
        
        // 创建命中框
        const hitbox = {
            points: points,
            x: startX,
            y: startY,
            width: width,
            length: length,
            angle: angle,
            damage: damage,
            duration: duration,
            timer: 0,
            hitEnemies: new Set(),
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.duration) {
                    this.isGarbage = true;
                    return;
                }
                
                // 击中检测
                enemies.forEach(enemy => {
                    if (enemy.isGarbage || !enemy.isActive || this.hitEnemies.has(enemy.id)) return;
                    
                    // 计算鞭子到敌人的距离
                    const dist = pointToLineDistanceSq(
                        enemy.x, enemy.y,
                        this.points[0].x, this.points[0].y,
                        this.points[1].x, this.points[1].y
                    );
                    
                    if (dist <= (this.width * this.width) / 4 + (enemy.size * enemy.size) / 4) {
                        // 击中敌人
                        enemy.takeDamage(this.damage, this.owner);
                        
                        // 记录已击中的敌人
                        this.hitEnemies.add(enemy.id);
                    }
                });
            },
            
            // 添加空的draw方法以避免TypeError
            draw: function(ctx) {
                // 空方法，只是为了避免错误
            }
        };
        
        // 将碰撞箱加入列表
        this.hitboxes.push(hitbox);
        
        // 创建视觉效果
        const whipEffect = {
            x: startX,
            y: startY,
            targetX: hitX,
            targetY: hitY,
            width: width,
            angle: angle,
            duration: 0.3, // 效果持续0.3秒
            timer: 0,
            progress: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                
                // 计算动画进度 (0-1)
                this.progress = Math.min(1.0, this.timer / this.duration);
                
                if (this.timer >= this.duration) {
                    this.isGarbage = true;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                // 获取屏幕坐标
                const startPos = cameraManager.worldToScreen(this.x, this.y);
                const endPos = cameraManager.worldToScreen(this.targetX, this.targetY);
                
                // 使用平滑的缓动函数计算当前进度
                let animProgress;
                if (this.progress < 0.5) {
                    // 加速阶段 (0-0.5)
                    animProgress = 2 * this.progress * this.progress;
                } else {
                    // 减速阶段 (0.5-1.0)
                    const t = this.progress * 2 - 1;
                    animProgress = 1 - (1 - t) * (1 - t);
                }
                
                // 计算当前位置
                const currentX = startPos.x + (endPos.x - startPos.x) * animProgress;
                const currentY = startPos.y + (endPos.y - startPos.y) * animProgress;
                
                // 绘制鞭子线条
                ctx.save();
                
                // 设置线条样式
                ctx.strokeStyle = 'white';
                ctx.lineWidth = this.width * (1 - this.progress * 0.3); // 线条宽度随时间略微变细
                ctx.lineCap = 'round';
                
                // 绘制主线条
                ctx.beginPath();
                ctx.moveTo(startPos.x, startPos.y);
                ctx.lineTo(currentX, currentY);
                ctx.stroke();
                
                // 在鞭子头部添加光效
                const glowSize = this.width * 0.8;
                const gradient = ctx.createRadialGradient(
                    currentX, currentY, 0,
                    currentX, currentY, glowSize
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(currentX, currentY, glowSize, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.restore();
            }
        };
        
        // 将视觉效果添加到全局效果列表
        visualEffects.push(whipEffect);
        
        return hitbox;
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
        
        // 特别处理10级效果
        if (nextLevel === 10) {
            descParts.push("极大提升攻击速度，攻击间隔减少为0.15秒");
        }
        if (nextLevelCalculatedStats.damage > tempStats.damage) {
            descParts.push(`伤害: ${tempStats.damage.toFixed(0)} → ${nextLevelCalculatedStats.damage.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.length > tempStats.length) {
            // 只描述长度，因为宽度不再增长
            descParts.push(`长度: ${tempStats.length.toFixed(0)} → ${nextLevelCalculatedStats.length.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.count > tempStats.count) {
            descParts.push(`鞭挞次数: ${tempStats.count} → ${nextLevelCalculatedStats.count}`);
        }
        if (nextLevel < 10 && nextLevelCalculatedStats.cooldown < tempStats.cooldown) {
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
        return "左右连续击打敌人，攻击范围长但窄。";
    }
}

class FireBladeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "燃烧刀";
    static Emoji = "🔥";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(FireBladeWeapon.Name, FireBladeWeapon.Emoji, 1.2, FireBladeWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 6 + (this.level - 1) * 1.5,  // 降低成长
            projectileSpeed: 300 + (this.level - 1) * 10,  // 降低成长
            cooldown: Math.max(0.4, this.baseCooldown - (this.level - 1) * 0.06),  // 降低成长
            count: 1 + Math.floor((this.level - 1) / 3),
            pierce: Math.floor(this.level / 4),
            duration: 1.2,
            burnDamage: 2 + Math.floor(this.level / 3),  // 降低成长
            burnDuration: 2 + Math.floor(this.level / 3),
            aoeEffect: this.level === 10,  // 10级获得群体燃烧效果
            aoeRange: 80  // 群体效果范围
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
        const burnDamage = this.stats.burnDamage * (ownerStats.damageMultiplier || 1);
        const burnDuration = this.stats.burnDuration * (ownerStats.durationMultiplier || 1);
        const hasAoe = this.stats.aoeEffect;
        const aoeRange = this.stats.aoeRange * (ownerStats.areaMultiplier || 1);

        let sortedEnemies = [];
        if (typeof enemies !== 'undefined' && enemies.length > 0) {
            sortedEnemies = enemies.filter(e => e && !e.isGarbage && e.isActive && !(e instanceof GhostEnemy))
                .map(enemy => ({
                    enemy,
                    distSq: (enemy.x - owner.x) * (enemy.x - owner.x) + (enemy.y - owner.y) * (enemy.y - owner.y)
                }))
                .sort((a, b) => a.distSq - b.distSq)
                .map(item => item.enemy);
        }

        for (let i = 0; i < projectileCount; i++) {
            let dirX, dirY;

            if (sortedEnemies.length > 0) {
                const targetEnemy = sortedEnemies[i % sortedEnemies.length];
                const dx = targetEnemy.x - owner.x;
                const dy = targetEnemy.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
                dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
            } else {
                // 无敌人时，保持原有的扇形发射逻辑，以玩家朝向为中心
                const baseAngle = Math.atan2(owner.lastMoveDirection.y, owner.lastMoveDirection.x);
                const angleStep = projectileCount > 1 ? (Math.PI / 6) : 0; // FireBlade 原有的 angleStep
                const startAngle = baseAngle - (angleStep * (projectileCount - 1) / 2);
                const currentAngle = startAngle + i * angleStep;
                dirX = Math.cos(currentAngle);
                dirY = Math.sin(currentAngle);
                // 如果 lastMoveDirection 是 (0,0)，给一个默认方向，比如向上
                if (owner.lastMoveDirection.x === 0 && owner.lastMoveDirection.y === 0 && dirX === 0 && dirY === 0) {
                    dirX = Math.cos(angleStep * (i - (projectileCount -1) / 2)); // 默认向上为0度开始扇形
                    dirY = Math.sin(angleStep * (i - (projectileCount -1) / 2));
                }
                if (dirX === 0 && dirY === 0) { // 再次检查，确保有方向
                    dirX = 0; dirY = -1;
                }
            }

            const vx = dirX * speed;
            const vy = dirY * speed;

            // 创建具有额外属性的燃烧刀投射物
            const proj = new FireBladeProjectile(
                owner.x, owner.y, size, vx, vy, damage, pierce, duration, ownerStats, burnDamage, burnDuration
            );
            
            // 增加10级特殊效果：群体燃烧
            if (hasAoe) {
                proj.aoeEffect = true;
                proj.aoeRange = aoeRange;
            }
            
            proj.owner = owner;
            projectiles.push(proj);
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

        const tempStats = JSON.parse(JSON.stringify(this.stats));
        const originalLevel = this.level;
        this.level = nextLevel;
        
        this.calculateStats();
        const nextLevelCalculatedStats = this.stats;

        const descParts = [];
        
        // 10级特殊效果描述
        if (nextLevel === 10) {
            descParts.push("获得群体燃烧效果：命中敌人时，附近敌人也会被点燃");
        }

        if (nextLevelCalculatedStats.damage > tempStats.damage) {
            descParts.push(`伤害: ${tempStats.damage.toFixed(0)} → ${nextLevelCalculatedStats.damage.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.count > tempStats.count) {
            descParts.push(`投射物: ${tempStats.count} → ${nextLevelCalculatedStats.count}`);
        }
        if (nextLevelCalculatedStats.pierce > tempStats.pierce) {
            descParts.push(`穿透: ${tempStats.pierce} → ${nextLevelCalculatedStats.pierce}`);
        }
        if (nextLevelCalculatedStats.burnDamage > tempStats.burnDamage) {
            descParts.push(`燃烧伤害: ${tempStats.burnDamage.toFixed(0)} → ${nextLevelCalculatedStats.burnDamage.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.burnDuration > tempStats.burnDuration) {
            descParts.push(`燃烧持续: ${tempStats.burnDuration.toFixed(1)}s → ${nextLevelCalculatedStats.burnDuration.toFixed(1)}s`);
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
        return "发射燃烧刀攻击敌人，造成燃烧效果。";
    }
}

class StormBladeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "岚刀";
    static Emoji = "⚡";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(StormBladeWeapon.Name, StormBladeWeapon.Emoji, 1.5, StormBladeWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 8 + (this.level - 1) * 3,  // 降低伤害成长
            projectileSpeed: 400 + (this.level - 1) * 15,  // 降低速度成长
            cooldown: Math.max(0.3, this.baseCooldown - (this.level - 1) * 0.08),  // 降低冷却缩减
            count: 1 + Math.floor(this.level === 10 ? (this.level) / 3 : (this.level - 1) / 3),  // 10级才能多发射一把
            chainCount: 1 + Math.floor((this.level - 1) / 2),
            chainRange: 150 + (this.level - 1) * 15,  // 降低范围成长
            duration: 1.2
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
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        const chainCount = this.stats.chainCount;
        const chainRange = this.stats.chainRange * (ownerStats.areaMultiplier || 1); // 连锁范围也受范围影响

        let sortedEnemies = [];
        if (typeof enemies !== 'undefined' && enemies.length > 0) {
            sortedEnemies = enemies.filter(e => e && !e.isGarbage && e.isActive && !(e instanceof GhostEnemy))
                .map(enemy => ({
                    enemy,
                    distSq: (enemy.x - owner.x) * (enemy.x - owner.x) + (enemy.y - owner.y) * (enemy.y - owner.y)
                }))
                .sort((a, b) => a.distSq - b.distSq)
                .map(item => item.enemy);
        }

        for (let i = 0; i < projectileCount; i++) {
            let dirX, dirY;

            if (sortedEnemies.length > 0) {
                const targetEnemy = sortedEnemies[i % sortedEnemies.length];
                const dx = targetEnemy.x - owner.x;
                const dy = targetEnemy.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
                dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
            } else {
                // 无敌人时，保持原有的扇形发射逻辑，以玩家朝向为中心
                const baseAngle = Math.atan2(owner.lastMoveDirection.y, owner.lastMoveDirection.x);
                const angleStep = projectileCount > 1 ? (Math.PI / 4) : 0; // StormBlade 原有的 angleStep
                const startAngle = baseAngle - (angleStep * (projectileCount - 1) / 2);
                const currentAngle = startAngle + i * angleStep;
                dirX = Math.cos(currentAngle);
                dirY = Math.sin(currentAngle);
                // 如果 lastMoveDirection 是 (0,0)，给一个默认方向，比如向上
                if (owner.lastMoveDirection.x === 0 && owner.lastMoveDirection.y === 0 && dirX === 0 && dirY === 0) {
                     dirX = Math.cos(angleStep * (i - (projectileCount -1) / 2)); 
                     dirY = Math.sin(angleStep * (i - (projectileCount -1) / 2));
                }
                 if (dirX === 0 && dirY === 0) { // 再次检查，确保有方向
                    dirX = 0; dirY = -1;
                }
            }

            const vx = dirX * speed;
            const vy = dirY * speed;

            const proj = new StormBladeProjectile(
                owner.x, owner.y, size, vx, vy, damage, duration, ownerStats, chainCount, chainRange
            );
            proj.owner = owner;
            projectiles.push(proj);
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

        const tempStats = JSON.parse(JSON.stringify(this.stats));
        const originalLevel = this.level;
        this.level = nextLevel;
        
        this.calculateStats();
        const nextLevelCalculatedStats = this.stats;

        const descParts = [];

        if (nextLevelCalculatedStats.damage > tempStats.damage) {
            descParts.push(`伤害: ${tempStats.damage.toFixed(0)} → ${nextLevelCalculatedStats.damage.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.count > tempStats.count) {
            descParts.push(`投射物: ${tempStats.count} → ${nextLevelCalculatedStats.count}`);
        }
        if (nextLevelCalculatedStats.chainCount > tempStats.chainCount) {
            descParts.push(`连锁次数: ${tempStats.chainCount} → ${nextLevelCalculatedStats.chainCount}`);
        }
        if (nextLevelCalculatedStats.chainRange > tempStats.chainRange) {
            descParts.push(`连锁范围: ${tempStats.chainRange.toFixed(0)} → ${nextLevelCalculatedStats.chainRange.toFixed(0)}`);
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
        return "发射岚刀攻击敌人，可以连续切割多个敌人。";
    }
}

class HandshakeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "握握手";
    static Emoji = "🤝";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(HandshakeWeapon.Name, HandshakeWeapon.Emoji, 2.0, HandshakeWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 5 + (this.level - 1) * 5,  // 降低伤害成长
            projectileSpeed: 250 + (this.level - 1) * 15,
            cooldown: Math.max(0.5, this.baseCooldown - (this.level - 1) * 0.15),
            count: 1 + Math.floor((this.level - 1) / 4),
            area: 80 + (this.level - 1) * 15,
            stunDuration: this.level === 10 ? 1.0 : 0,  // 10级才有眩晕效果
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
        // 计算实际投射物数量（基础数量 + 加成）
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage;
        const area = this.stats.area * (ownerStats.areaMultiplier || 1);
        const stunDuration = this.stats.stunDuration * (ownerStats.durationMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * 1.2 * (ownerStats.areaMultiplier || 1);
        
        // 改用和飞刀一样的索敌逻辑：获取并排序敌人
        let sortedEnemies = [];
        if (typeof enemies !== 'undefined' && enemies.length > 0) {
            sortedEnemies = enemies.filter(e => e && !e.isGarbage && e.isActive && !(e instanceof GhostEnemy))
                .map(enemy => ({
                    enemy,
                    distSq: (enemy.x - owner.x) * (enemy.x - owner.x) + (enemy.y - owner.y) * (enemy.y - owner.y)
                }))
                .sort((a, b) => a.distSq - b.distSq)
                .map(item => item.enemy);
        }

        // 为每个投射物确定目标并发射
        for (let i = 0; i < count; i++) {
            let dirX, dirY;

            if (sortedEnemies.length > 0) {
                // 循环选择目标敌人（优先最近的）
                const targetEnemy = sortedEnemies[i % sortedEnemies.length];
                const dx = targetEnemy.x - owner.x;
                const dy = targetEnemy.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
                dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
            } else {
                // 没有敌人时的后备行为：向玩家最后移动方向发射
                dirX = owner.lastMoveDirection.x;
                dirY = owner.lastMoveDirection.y;
                // 如果lastMoveDirection是(0,0)，给一个默认方向
                if (dirX === 0 && dirY === 0) {
                    dirX = 0;
                    dirY = -1; // 默认向上
                }
            }

            // 计算速度
            const vx = dirX * speed;
            const vy = dirY * speed;
            
            // 创建握手投射物
            const projectile = new HandshakeProjectile(
                owner.x,
                owner.y,
                size,
                vx,
                vy,
                damage,
                duration,
                ownerStats,
                area,
                stunDuration
            );
            // 设置所有者
            projectile.owner = owner;
            // 添加到投射物列表
            projectiles.push(projectile);
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

        const tempStats = JSON.parse(JSON.stringify(this.stats));
        const originalLevel = this.level;
        this.level = nextLevel;

        this.calculateStats();
        const nextLevelCalculatedStats = this.stats;
        
        const descParts = [];

        if (nextLevelCalculatedStats.damage > tempStats.damage) {
            descParts.push(`伤害: ${tempStats.damage.toFixed(0)} → ${nextLevelCalculatedStats.damage.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.count > tempStats.count) {
            descParts.push(`投射物: ${tempStats.count} → ${nextLevelCalculatedStats.count}`);
        }
        if (nextLevelCalculatedStats.area > tempStats.area) {
            descParts.push(`范围: ${tempStats.area.toFixed(0)} → ${nextLevelCalculatedStats.area.toFixed(0)}`);
        }
        if (nextLevelCalculatedStats.stunDuration > tempStats.stunDuration) {
            descParts.push(`眩晕: ${tempStats.stunDuration.toFixed(1)}s → ${nextLevelCalculatedStats.stunDuration.toFixed(1)}s`);
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
        return "发射握手攻击敌人，造成范围伤害。在10级时获得眩晕效果。";
    }
}

class BubbleWandWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "泡泡魔棒";
    static Emoji = "🧼";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(BubbleWandWeapon.Name, BubbleWandWeapon.Emoji, 1.2, BubbleWandWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 3 + (this.level - 1) * 2,  // 基础伤害较低
            projectileSpeed: 150 + (this.level - 1) * 10,  // 速度缓慢
            cooldown: Math.max(0.8, this.baseCooldown - (this.level - 1) * 0.07),
            count: 1 + Math.floor((this.level - 1) / 2),  // 每2级增加一个泡泡
            trapDuration: 2 + (this.level - 1) * 0.4,  // 困住敌人的时间
            splitOnBurst: this.level === 10,  // 10级时泡泡爆炸分裂
            duration: 3.5  // 泡泡存在时间
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        if (!owner) return; // 确保owner存在
        
        const ownerStats = this.getOwnerStats(owner);
        const projectileCount = Math.min(this.stats.count + (ownerStats.projectileCountBonus || 0), 8); // 限制最大数量为8个
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const trapDuration = this.stats.trapDuration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * 1.2 * (ownerStats.areaMultiplier || 1);
        const splitOnBurst = this.stats.splitOnBurst;
        
        // 限制屏幕上泡泡总数
        const currentBubbleCount = projectiles.filter(p => p instanceof BubbleProjectile).length;
        if (currentBubbleCount > 50) return; // 降低限制从100到50
        
        // 获取玩家精确位置，作为所有泡泡的发射起点
        const startX = owner.x;
        const startY = owner.y;

        // 寻找目标，与匕首武器索敌逻辑一致
        let target = owner.findNearestEnemy(GAME_WIDTH * 1.5) || {
            x: owner.x + owner.lastMoveDirection.x * 100,
            y: owner.y + owner.lastMoveDirection.y * 100
        };
        
        // 计算方向
        const dx = target.x - startX;
        const dy = target.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
        const dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
        
        // 计算角度和扇形范围
        const baseAngle = Math.atan2(dirY, dirX);
        const angleSpread = Math.PI * 0.6;

        // 随机方向发射泡泡
        for (let i = 0; i < projectileCount; i++) {
            // 计算发射角度，在敌人方向的扇形范围内
            const randomAngle = baseAngle + (Math.random() - 0.5) * angleSpread;
            
            const dirX = Math.cos(randomAngle);
            const dirY = Math.sin(randomAngle);
            
            // 添加一点随机性到速度
            const speedVariation = 0.8 + Math.random() * 0.4; // 速度在80%-120%之间变化
            const vx = dirX * speed * speedVariation;
            const vy = dirY * speed * speedVariation;
            
            // 创建泡泡投射物，确保从玩家位置发射
            const bubble = new BubbleProjectile(
                startX, startY, size, vx, vy, damage, duration, 
                ownerStats, trapDuration, splitOnBurst
            );
            
            // 设置所有者和初始位置确认
            bubble.owner = owner;
            bubble.sourceX = startX;
            bubble.sourceY = startY;
            projectiles.push(bubble);
        }
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `发射${this.stats.count}个泡泡，困住敌人${this.stats.trapDuration.toFixed(1)}秒，造成${this.stats.damage}伤害。`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "发射魔法泡泡，困住敌人数秒并造成伤害。";
    }
}

class ChaosDiceWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "混沌骰子";
    static Emoji = "🎲";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(ChaosDiceWeapon.Name, ChaosDiceWeapon.Emoji, 1.5, ChaosDiceWeapon.MaxLevel);
        
        // 可能的效果
        this.effects = [
            { id: "fire", name: "火焰" },    // 火焰
            { id: "ice", name: "冰冻" },     // 冰冻
            { id: "lightning", name: "雷电" }, // 雷电
            { id: "knockback", name: "击退" }, // 击退
            { id: "shield", name: "护盾" },  // 护盾
            { id: "heal", name: "治疗" }     // 治疗
        ];
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 8 + (this.level - 1) * 3,  // 基础伤害
            projectileSpeed: 250 + (this.level - 1) * 15,  // 投掷速度
            cooldown: Math.max(0.65, 1.5 - (this.level - 1) * 0.08),  // 冷却时间
            count: 1 + Math.floor((this.level - 1) / 3),  // 每3级额外投一个骰子
            area: 70 + (this.level - 1) * 10,  // 影响范围
            effectPower: 1 + (this.level - 1) * 0.15,  // 效果强度
            dualEffect: this.level === 10,  // 10级时同时触发两种效果
            duration: 2.5  // 骰子持续时间
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
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const area = this.stats.area * (ownerStats.areaMultiplier || 1);
        const effectPower = this.stats.effectPower;
        const dualEffect = this.stats.dualEffect;
        const size = GAME_FONT_SIZE * 1.2;
        
        // 投掷多个骰子
        enemies.forEach(enemy => {
            if (projectiles.length >= projectileCount || !enemy || enemy.isGarbage || !enemy.isActive) return;
            
            // 计算方向
            const dx = enemy.x - owner.x;
            const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 如果敌人太远，跳过
            if (dist > 600) return;
            
            // 计算方向
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            // 添加随机性
            const randomAngle = (Math.random() - 0.5) * Math.PI * 0.2;
            const finalDirX = Math.cos(randomAngle) * dirX - Math.sin(randomAngle) * dirY;
            const finalDirY = Math.sin(randomAngle) * dirX + Math.cos(randomAngle) * dirY;
            
            // 计算速度
            const vx = finalDirX * speed;
            const vy = finalDirY * speed;
            
            // 随机选择效果
            const effect1 = this.effects[Math.floor(Math.random() * this.effects.length)];
            
            // 第二个效果不能与第一个相同
            let effect2;
                do {
                    effect2 = this.effects[Math.floor(Math.random() * this.effects.length)];
            } while (effect2.id === effect1.id);
            
            // 创建骰子投射物
            const dice = new ChaosDiceProjectile(
                owner.x, owner.y, size, vx, vy, damage, duration,
                ownerStats, area, effectPower, effect1, dualEffect ? effect2 : null
            );
            
            dice.owner = owner;
            projectiles.push(dice);
        });
        
        // 如果没有找到合适的敌人目标，向随机方向投掷
        if (projectiles.length === 0) {
            for (let i = 0; i < projectileCount; i++) {
                // 随机角度
                const angle = Math.random() * Math.PI * 2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                
                // 随机效果
                const effect1 = this.effects[Math.floor(Math.random() * this.effects.length)];
                
                // 第二个效果不能与第一个相同
                let effect2;
                do {
                    effect2 = this.effects[Math.floor(Math.random() * this.effects.length)];
                } while (effect2.id === effect1.id);
                
                // 创建骰子投射物
                const dice = new ChaosDiceProjectile(
                    owner.x, owner.y, size, vx, vy, damage, duration,
                    ownerStats, area, effectPower, effect1, dualEffect ? effect2 : null
                );
                
                dice.owner = owner;
                projectiles.push(dice);
            }
        }
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        let desc = `投掷${this.stats.count}个骰子，造成${this.stats.damage}伤害并在半径${this.stats.area}范围内触发随机效果。`;
        if (this.stats.dualEffect) {
            desc += " 每个骰子同时触发两种效果。";
        }
        return desc;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "投掷骰子，随机触发六种效果之一：火焰、冰冻、雷电、击退、护盾或治疗。";
    }
}

class MagnetGunWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "磁力枪";
    static Emoji = "🧲";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(MagnetGunWeapon.Name, MagnetGunWeapon.Emoji, 1.2, MagnetGunWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 4 + (this.level - 1) * 2,  // 基础伤害
            projectileSpeed: 220 + (this.level - 1) * 20,  // 投射物速度
            cooldown: Math.max(0.85, 1.3 - (this.level - 1) * 0.05),  // 冷却时间
            count: 1 + Math.floor((this.level - 1) / 2.5),  // 每3级增加一个投射物
            pullRadius: 100 + (this.level - 1) * 10,  // 吸引半径
            pullStrength: 50 + (this.level - 1) * 10,  // 吸引强度
            stun: this.level === 10,  // 10级才有晕眩效果
            stunDuration: 0.5,  // 晕眩持续时间
            duration: 3,  // 持续时间
            pierce: Math.min(3, 1 + Math.floor((this.level - 1) / 3))  // 穿透数量
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
        const pullRadius = this.stats.pullRadius * (ownerStats.areaMultiplier || 1);
        const pullStrength = this.stats.pullStrength;
        const stun = this.stats.stun;
        const stunDuration = this.stats.stunDuration * (ownerStats.durationMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const pierce = this.stats.pierce + (ownerStats.pierceBonus || 0);
        const size = GAME_FONT_SIZE * 1.2;
        
        // 改用和飞刀一样的索敌逻辑：获取并排序敌人
        let sortedEnemies = [];
        if (typeof enemies !== 'undefined' && enemies.length > 0) {
            sortedEnemies = enemies.filter(e => e && !e.isGarbage && e.isActive && !(e instanceof GhostEnemy))
                .map(enemy => ({
                    enemy,
                    distSq: (enemy.x - owner.x) * (enemy.x - owner.x) + (enemy.y - owner.y) * (enemy.y - owner.y)
                }))
                .sort((a, b) => a.distSq - b.distSq)
                .map(item => item.enemy);
        }

        // 为每个投射物确定目标并发射
        for (let i = 0; i < projectileCount; i++) {
            let dirX, dirY;

            if (sortedEnemies.length > 0) {
                // 循环选择目标敌人（优先最近的）
                const targetEnemy = sortedEnemies[i % sortedEnemies.length];
                const dx = targetEnemy.x - owner.x;
                const dy = targetEnemy.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
                dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
            } else {
                // 没有敌人时的后备行为：向玩家最后移动方向发射
                dirX = owner.lastMoveDirection.x;
                dirY = owner.lastMoveDirection.y;
                // 如果lastMoveDirection是(0,0)，给一个默认方向
                if (dirX === 0 && dirY === 0) {
                    dirX = 0;
                    dirY = -1; // 默认向上
                }
            }

            // 计算速度
            const vx = dirX * speed;
            const vy = dirY * speed;
            
            // 创建磁力波投射物
            const wave = new MagnetWaveProjectile(
                owner.x, owner.y, size, vx, vy, damage, duration,
                ownerStats, pullRadius, pullStrength, stun ? stunDuration : 0
            );
            
            wave.owner = owner;
            wave.pierce = pierce;
            projectiles.push(wave);
        }
    }

    /**
     * 获取最近的敌人
     * @param {number} maxRange - 最大范围
     * @returns {Enemy|null} 敌人对象或null
     */
    getClosestEnemy(maxRange) {
        let closestEnemy = null;
        let minDistanceSq = maxRange * maxRange;

        // 确保this.owner存在，防止空指针异常
        if (!this.owner) return null;

        enemies.forEach(enemy => {
            if (!enemy || enemy.isGarbage || !enemy.isActive) return;

            const distanceSq = (enemy.x - this.owner.x) * (enemy.x - this.owner.x) +
                             (enemy.y - this.owner.y) * (enemy.y - this.owner.y);
            
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `发射${this.stats.count}个磁力波，造成${this.stats.damage}伤害并吸引${this.stats.pullRadius}范围内的敌人。${this.stats.stun ? `吸引后晕眩敌人${this.stats.stunDuration.toFixed(1)}秒。` : ''}`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "发射磁力波，吸引敌人并造成范围伤害。";
    }
}

class FrostStaffWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "冰晶杖";
    static Emoji = "❄️";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(FrostStaffWeapon.Name, FrostStaffWeapon.Emoji, 1.5, FrostStaffWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 9 + (this.level - 1) * 3,
            cooldown: Math.max(1.0, 1.5 - (this.level - 1) * 0.06),
            count: 1 + Math.floor((this.level - 1) / 2),
            freezeDuration: 0.7 + (this.level - 1) * 0.1,
            slowFactor: 0.3 + (this.level - 1) * 0.03,
            projectileSpeed: 300 + (this.level - 1) * 10,
            pierce: Math.floor((this.level - 1) / 3),
            split: this.level >= 8
        };
    }
    
    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 如果没有统计信息，计算统计信息
        if (!this.stats) {
            this.calculateStats();
        }
        
        // 增加冷却计时器
        this.cooldownTimer += dt;
        
        // 如果冷却结束，发射冰晶
        if (this.cooldownTimer >= this.stats.cooldown) {
            // 重置冷却计时器
            this.cooldownTimer = 0;
            
            // 发射冰晶
            this.shootFrostCrystal(owner);
        }
    }
    
    /**
     * 发射冰晶
     * @param {Player} owner - 拥有者
     */
    shootFrostCrystal(owner) {
        // 获取基础伤害乘数
        const damageMultiplier = owner.getStat ? owner.getStat('damageMultiplier') : 1;
        const finalDamage = this.stats.damage * damageMultiplier;
        
        // 获取穿透加成
        const pierceBonus = owner.getStat ? owner.getStat('pierceBonus') || 0 : 0;
        const finalPierce = this.stats.pierce + pierceBonus;
        
        // 获取持续时间乘数
        const durationMultiplier = owner.getStat ? owner.getStat('durationMultiplier') : 1;
        const finalFreezeDuration = this.stats.freezeDuration * durationMultiplier;
        
        // 获取速度乘数
        const speedMultiplier = owner.getStat ? owner.getStat('projectileSpeedMultiplier') : 1;
        const finalSpeed = this.stats.projectileSpeed * speedMultiplier;
        
        // 寻找附近敌人而不是考虑玩家朝向
        const targets = [];
        
        // 如果有enemies数组
        if (typeof enemies !== 'undefined') {
            // 获取可视范围内的敌人
            const maxRange = 300; // 最大索敌范围，改为300与飞刀一致
            
            // 筛选视野内的敌人
            const visibleEnemies = enemies.filter(enemy => {
                if (!enemy || enemy.isGarbage || !enemy.isActive) return false;
                
                const dx = enemy.x - owner.x;
                const dy = enemy.y - owner.y;
                const distSq = dx * dx + dy * dy;
                
                return distSq <= maxRange * maxRange;
            });
            
            // 按距离排序
            const sortedEnemies = visibleEnemies.sort((a, b) => {
                const distA = (a.x - owner.x) * (a.x - owner.x) + (a.y - owner.y) * (a.y - owner.y);
                const distB = (b.x - owner.x) * (b.x - owner.x) + (b.y - owner.y) * (b.y - owner.y);
                return distA - distB;
            });
            
            // 取最近的几个敌人作为目标
            targets.push(...sortedEnemies.slice(0, this.stats.count));
        }
        
        // 对每个目标发射冰晶
        for (let i = 0; i < this.stats.count; i++) {
            let vx, vy;
            
            // 如果有目标，瞄准目标
            if (i < targets.length) {
                const target = targets[i];
                const dx = target.x - owner.x;
                const dy = target.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                vx = dx / dist * finalSpeed;
                vy = dy / dist * finalSpeed;
            } else {
                // 没有目标时随机方向
                const angle = Math.random() * Math.PI * 2;
                vx = Math.cos(angle) * finalSpeed;
                vy = Math.sin(angle) * finalSpeed;
            }
            
            // 创建冰晶投射物
            if (typeof FrostCrystalProjectile === 'function') {
                const crystal = new FrostCrystalProjectile(
                    owner.x,
                    owner.y,
                    24, // 大小
                    vx,
                    vy,
                    finalDamage,
                    finalPierce,
                    4.0, // 存在时间
                    damageMultiplier,
                    finalFreezeDuration,
                    this.stats.slowFactor,
                    this.stats.split
                );
                
                // 添加到投射物数组
                if (typeof projectiles !== 'undefined') {
                    projectiles.push(crystal);
                }
            }
        }
    }

    getInitialDescription() {
        return "发射冰晶，冻结并减速敌人。";
    }

    getCurrentDescription() {
        return `发射${this.stats.count}个冰晶，造成${this.stats.damage}伤害，冻结敌人${this.stats.freezeDuration.toFixed(1)}秒并减速${Math.round(this.stats.slowFactor * 100)}%。${this.stats.split ? '冰晶碰撞后分裂成多个碎片。' : ''}`;
    }
}

class VineSeedWeapon extends Weapon {
        static Name = "藤蔓种子";
        static Emoji = "🌱";
        static MaxLevel = 10;

        constructor() {
            super(VineSeedWeapon.Name, VineSeedWeapon.Emoji, 2.0, VineSeedWeapon.MaxLevel);
        }

        calculateStats() {
            this.stats = {
                damage: 4 + (this.level - 1) * 1.5,
                cooldown: Math.max(1.8, 2.0 - (this.level - 1) * 0.03),
                count: Math.floor(1 + (this.level - 1) / 3),
                radius: 45 + (this.level - 1) * 3,
                slowFactor: 0.15 + (this.level - 1) * 0.03,
                duration: 3.5
            };
        }
        
        /**
         * 更新武器状态
         * @param {number} dt - 时间增量
         * @param {Player} owner - 拥有者
         */
        update(dt, owner) {
            // 如果没有统计信息，计算统计信息
            if (!this.stats) {
                this.calculateStats();
            }
            
            // 增加冷却计时器
            this.cooldownTimer += dt;
            
            // 如果冷却结束，发射藤蔓
            if (this.cooldownTimer >= this.stats.cooldown) {
                // 重置冷却计时器
                this.cooldownTimer = 0;
                
                // 发射藤蔓攻击
                this.castVine(owner);
            }
        }
        
        /**
         * 发射藤蔓攻击
         * @param {Player} owner - 拥有者
         */
        castVine(owner) {
            // 获取基础伤害乘数
            const damageMultiplier = owner.getStat ? owner.getStat('damageMultiplier') : 1;
            const finalDamage = this.stats.damage * damageMultiplier;
            
            // 获取范围乘数
            const areaMultiplier = owner.getStat ? owner.getStat('areaMultiplier') : 1;
            const finalRadius = this.stats.radius * areaMultiplier;
            
            // 获取持续时间乘数
            const durationMultiplier = owner.getStat ? owner.getStat('durationMultiplier') : 1;
            const finalDuration = this.stats.duration * durationMultiplier;
            
            // 寻找目标位置
            for (let i = 0; i < this.stats.count; i++) {
                // 寻找随机敌人
                let targetEnemy = owner.findRandomEnemy(400);
                
                if (targetEnemy) {
                    // 如果找到敌人，在敌人位置创建藤蔓
                    if (typeof VineHazard === 'function') {
                        const vine = new VineHazard(
                            targetEnemy.x,
                            targetEnemy.y,
                            finalRadius,
                            finalDamage,
                            0.5, // 攻击间隔
                            this.stats.slowFactor,
                            finalDuration,
                            owner
                        );
                        
                        // 添加到全局数组
                        if (typeof hazards !== 'undefined') {
                            hazards.push(vine);
                        }
                    }
                }
            }
        }

        getInitialDescription() {
            return "种植藤蔓，减速并伤害范围内敌人。";
        }

        getCurrentDescription() {
            return `种植${this.stats.count}个藤蔓，减速敌人${Math.round(this.stats.slowFactor * 100)}%并造成${this.stats.damage}伤害。`;
        }
    }

class LaserPrismWeapon extends Weapon {
        static Name = "光棱塔";
        static Emoji = "🔆";
        static MaxLevel = 10;

        constructor() {
            super(LaserPrismWeapon.Name, LaserPrismWeapon.Emoji, 1.5, LaserPrismWeapon.MaxLevel);
        }

        calculateStats() {
            this.stats = {
                damage: 15 + (this.level - 1) * 5,
                cooldown: Math.max(0.8, 1.5 - (this.level - 1) * 0.07),
                count: 1 + Math.floor((this.level - 1) / 2),
                beamWidth: 15, // 固定宽度，不随等级增加
                duration: 1.0 + (this.level - 1) * 0.1,
                piercing: this.level >= 5
            };
        }
        
        /**
         * 更新武器状态
         * @param {number} dt - 时间增量
         * @param {Player} owner - 拥有者
         */
        update(dt, owner) {
            // 如果没有统计信息，计算统计信息
            if (!this.stats) {
                this.calculateStats();
            }
            
            // 增加冷却计时器
            this.cooldownTimer += dt;
            
            // 如果冷却结束，发射激光
            if (this.cooldownTimer >= this.stats.cooldown) {
                // 重置冷却计时器
                this.cooldownTimer = 0;
                
                // 发射激光攻击
                this.fireLaser(owner);
            }
        }
        
        /**
         * 发射激光攻击
         * @param {Player} owner - 拥有者
         */
        fireLaser(owner) {
            // 获取基础伤害乘数
            const damageMultiplier = owner.getStat ? owner.getStat('damageMultiplier') : 1;
            const finalDamage = this.stats.damage * damageMultiplier;
            
            // 获取持续时间乘数
            const durationMultiplier = owner.getStat ? owner.getStat('durationMultiplier') : 1;
            const finalDuration = this.stats.duration * durationMultiplier;
            
            // 计算激光方向，确保数量固定 - 修复闪烁问题
            const beamCount = this.stats.count;
            
            // 使用固定的起始角度，而不是随机角度，这样每次生成的激光位置都固定
            const startAngle = (gameTime * 0.5) % (Math.PI * 2); // 随时间缓慢旋转
            const angleStep = Math.PI * 2 / beamCount;
            
            for (let i = 0; i < beamCount; i++) {
                const angle = startAngle + angleStep * i;
                const dirX = Math.cos(angle);
                const dirY = Math.sin(angle);
                
                // 使用LaserBeamAttack类创建激光
                if (typeof LaserBeamAttack === 'function') {
                    const beam = new LaserBeamAttack(
                        owner,
                        dirX,
                        dirY,
                        200, // 激光长度缩短为200（从300减少）
                        this.stats.beamWidth,
                        finalDamage,
                        finalDuration,
                        2.0, // 旋转速度
                        this.stats.piercing // 是否穿透
                    );
                    
                    // 添加到投射物数组
                    if (typeof projectiles !== 'undefined') {
                        projectiles.push(beam);
                    }
                }
            }
        }

        getInitialDescription() {
            return "发射激光光束，造成持续伤害。";
        }

        getCurrentDescription() {
            return `发射${this.stats.count}束激光，造成${this.stats.damage}伤害。${this.stats.piercing ? '激光可以穿透敌人。' : ''}`;
        }
    }

class PoisonVialWeapon extends Weapon {
        static Name = "毒瓶";
        static Emoji = "🧪";
        static MaxLevel = 10;

        constructor() {
            super(PoisonVialWeapon.Name, PoisonVialWeapon.Emoji, 1.8, PoisonVialWeapon.MaxLevel);
        }

        calculateStats() {
            this.stats = {
                damage: 8 + (this.level - 1) * 2,
                cooldown: Math.max(1.0, 1.8 - (this.level - 1) * 0.08),
                count: 1 + Math.floor((this.level - 1) / 3),
                poisonDamage: 3 + (this.level - 1) * 1,
                poisonDuration: Math.min(5, 3 + (this.level - 1) * 0.3),
                area: 60 + (this.level - 1) * 5,
                projectileSpeed: 250 + (this.level - 1) * 10,
                toxicCloud: this.level >= 7
            };
        }
        
        /**
         * 更新武器状态
         * @param {number} dt - 时间增量
         * @param {Player} owner - 拥有者
         */
        update(dt, owner) {
            // 如果没有统计信息，计算统计信息
            if (!this.stats) {
                this.calculateStats();
            }
            
            // 增加冷却计时器
            this.cooldownTimer += dt;
            
            // 如果冷却结束，投掷毒瓶
            if (this.cooldownTimer >= this.stats.cooldown) {
                // 重置冷却计时器
                this.cooldownTimer = 0;
                
                // 投掷毒瓶
                this.throwPoisonVial(owner);
            }
        }
        
        /**
         * 投掷毒瓶
         * @param {Player} owner - 拥有者
         */
        throwPoisonVial(owner) {
            // 获取基础伤害乘数
            const damageMultiplier = owner.getStat ? owner.getStat('damageMultiplier') : 1;
            const finalDamage = this.stats.damage * damageMultiplier;
            const finalPoisonDamage = this.stats.poisonDamage * damageMultiplier;
            
            // 获取范围乘数
            const areaMultiplier = owner.getStat ? owner.getStat('areaMultiplier') : 1;
            const finalArea = this.stats.area * areaMultiplier;
            
            // 获取持续时间乘数
            const durationMultiplier = owner.getStat ? owner.getStat('durationMultiplier') : 1;
            const finalPoisonDuration = this.stats.poisonDuration * durationMultiplier;
            
            // 获取投射物速度乘数
            const projSpeedMultiplier = owner.getStat ? owner.getStat('projectileSpeedMultiplier') : 1;
            const finalSpeed = this.stats.projectileSpeed * projSpeedMultiplier;
            
            // 对每个毒瓶
            for (let i = 0; i < this.stats.count; i++) {
                // 寻找目标
                const target = owner.findRandomEnemy(300);
                
                // 确定方向
                let dirX, dirY;
                
                if (target) {
                    // 计算方向
                    const dx = target.x - owner.x;
                    const dy = target.y - owner.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        dirX = dx / dist;
                        dirY = dy / dist;
                    } else {
                        // 随机方向
                        const angle = Math.random() * Math.PI * 2;
                        dirX = Math.cos(angle);
                        dirY = Math.sin(angle);
                    }
                } else {
                    // 随机方向
                    const angle = Math.random() * Math.PI * 2;
                    dirX = Math.cos(angle);
                    dirY = Math.sin(angle);
                }
                
                // 计算速度
                const vx = dirX * finalSpeed;
                const vy = dirY * finalSpeed;
                
                // 创建毒瓶投射物
                if (typeof PoisonVialProjectile === 'function') {
                    const vial = new PoisonVialProjectile(
                        owner.x,
                        owner.y,
                        24, // 大小
                        vx,
                        vy,
                        finalDamage,
                        4.0, // 存在时间
                        damageMultiplier,
                        finalArea,
                        finalPoisonDamage,
                        finalPoisonDuration,
                        this.stats.toxicCloud
                    );
                    
                    // 添加到投射物数组
                    if (typeof projectiles !== 'undefined') {
                        projectiles.push(vial);
                    }
                }
            }
        }

        getInitialDescription() {
            return "投掷毒瓶，造成毒素伤害。";
        }

        getCurrentDescription() {
            return `投掷${this.stats.count}个毒瓶，造成${this.stats.damage}伤害并使敌人中毒，每秒造成${this.stats.poisonDamage}点伤害，持续${this.stats.poisonDuration.toFixed(1)}秒。${this.stats.toxicCloud ? '毒瓶爆炸后留下毒云。' : ''}`;
        }
    }

class FireBladeProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} pierce - 穿透
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} burnDamage - 燃烧伤害
     * @param {number} burnDuration - 燃烧持续时间
     */
    constructor(x, y, size, vx, vy, damage, pierce, duration, ownerStats, burnDamage, burnDuration) {
        super(x, y, "🔥", size, vx, vy, damage, pierce, duration, ownerStats);
        // 燃烧效果
        this.burnDamage = burnDamage;
        this.burnDuration = burnDuration;
        // 群体效果
        this.aoeEffect = false;
        this.aoeRange = 0;
        // 粒子效果
        this.particleTimer = 0;
        this.particleInterval = 0.05;
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 更新位置
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        // 更新生命周期
        this.lifetime += dt;
        // 如果生命周期结束或穿透次数用尽，标记为垃圾
        if (this.lifetime >= this.duration || this.pierce < 0) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 如果超出屏幕，标记为垃圾
        if (
            this.x < -this.width ||
            this.x > GAME_WIDTH + this.width ||
            this.y < -this.height ||
            this.y > GAME_HEIGHT + this.height
        ) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 检查与敌人的碰撞
        enemies.forEach(enemy => {
            // 跳过已命中的敌人
            if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
            // 检查碰撞
            if (this.checkCollision(enemy)) {
                // 造成伤害
                enemy.takeDamage(this.damage, this.owner);
                // 添加燃烧效果
                this.applyBurnEffect(enemy, this.owner);
                
                // 10级特殊效果：群体燃烧
                if (this.aoeEffect) {
                    this.applyAoeBurnEffect(enemy, this.owner);
                }
                
                // 添加到已命中列表
                this.hitTargets.add(enemy);
                // 减少穿透次数
                this.pierce--;
                // 如果穿透次数用尽，标记为垃圾
                if (this.pierce < 0) {
                    this.isGarbage = true;
                    this.isActive = false;
                }
            }
        });
        // 更新粒子效果
        this.particleTimer -= dt;
        if (this.particleTimer <= 0) {
            // 创建火焰粒子
            this.createFireParticle();
            // 重置计时器
            this.particleTimer = this.particleInterval;
        }
    }

    /**
     * 应用燃烧效果
     * @param {Enemy} enemy - 敌人
     * @param {Player} source - 伤害来源
     */
    applyBurnEffect(enemy, source) {
        if (!enemy.statusEffects) {
            enemy.statusEffects = {};
        }
        
        // 使用武器类中计算好的燃烧伤害和持续时间
        const burnDamagePerTick = this.burnDamage / 4; // 假设燃烧分4次伤害
        const burnDuration = this.burnDuration;
        const tickInterval = burnDuration / 4; // 配合4次伤害

        // 如果敌人已有燃烧效果，叠加持续时间或取最大值，取最高伤害
        if (enemy.statusEffects.burn) {
            enemy.statusEffects.burn.duration = Math.max(enemy.statusEffects.burn.duration, burnDuration);
            enemy.statusEffects.burn.damage = Math.max(enemy.statusEffects.burn.damage, burnDamagePerTick);
            enemy.statusEffects.burn.tickInterval = tickInterval; // 更新间隔
            enemy.statusEffects.burn.source = source; // 更新来源
        } else {
            // 否则添加新的燃烧效果
            enemy.statusEffects.burn = {
                damage: burnDamagePerTick,
                duration: burnDuration,
                tickInterval: tickInterval, 
                tickTimer: tickInterval, // 立即开始计时
                source: source // 记录伤害来源
            };
        }
    }
    
    /**
     * 应用群体燃烧效果
     * @param {Enemy} hitEnemy - 被击中的敌人
     * @param {Player} source - 伤害来源
     */
    applyAoeBurnEffect(hitEnemy, source) {
        // 对周围敌人应用燃烧效果
        enemies.forEach(nearbyEnemy => {
            // 跳过被直接命中的敌人和无效敌人
            if (nearbyEnemy === hitEnemy || nearbyEnemy.isGarbage || !nearbyEnemy.isActive) return;
            
            // 计算与被击中敌人的距离
            const dx = nearbyEnemy.x - hitEnemy.x;
            const dy = nearbyEnemy.y - hitEnemy.y;
            const distSq = dx * dx + dy * dy;
            
            // 如果在范围内，添加较弱的燃烧效果
            if (distSq <= this.aoeRange * this.aoeRange) {
                if (!nearbyEnemy.statusEffects) {
                    nearbyEnemy.statusEffects = {};
                }
                
                const reducedDamage = this.burnDamage * 0.7; // 70%的伤害
                const reducedDuration = this.burnDuration * 0.8; // 80%的持续时间
                const burnDamagePerTick = reducedDamage / 4;
                const tickInterval = reducedDuration / 4;
                
                // 添加或更新燃烧效果
                if (nearbyEnemy.statusEffects.burn) {
                    if (nearbyEnemy.statusEffects.burn.damage < burnDamagePerTick) {
                        nearbyEnemy.statusEffects.burn.damage = burnDamagePerTick;
                    }
                    if (nearbyEnemy.statusEffects.burn.duration < reducedDuration) {
                        nearbyEnemy.statusEffects.burn.duration = reducedDuration;
                    }
                } else {
                    nearbyEnemy.statusEffects.burn = {
                        damage: burnDamagePerTick,
                        duration: reducedDuration,
                        tickInterval: tickInterval,
                        tickTimer: tickInterval,
                        source: source
                    };
                }
                
                // 创建视觉效果：从命中敌人到周围敌人的火焰粒子
                this.createFireSpreadEffect(hitEnemy, nearbyEnemy);
            }
        });
    }
    
    /**
     * 创建火焰蔓延视觉效果
     * @param {Enemy} from - 起始敌人
     * @param {Enemy} to - 目标敌人
     */
    createFireSpreadEffect(from, to) {
        // 创建5个粒子沿路径移动
        for (let i = 0; i < 5; i++) {
            if (typeof particles === 'undefined') return;
            
            const progress = i / 4; // 0到1的分布
            const x = from.x + (to.x - from.x) * progress;
            const y = from.y + (to.y - from.y) * progress;
            
            particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5 - 10,
                size: this.size * 0.3,
                lifetime: 0.3 + Math.random() * 0.2,
                timer: 0,
                color: 'rgba(255, 50, 0, 0.7)',
                isGarbage: false,
                update: function(dt) {
                    this.timer += dt;
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.size -= dt * 10;
                    if (this.timer >= this.lifetime || this.size <= 0) {
                        this.isGarbage = true;
                    }
                },
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    const alpha = 1 - this.timer / this.lifetime;
                    ctx.globalAlpha = alpha;
                    ctx.fillStyle = this.color;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            });
        }
    }

    /**
     * 创建火焰粒子
     */
    createFireParticle() {
        // 创建火焰粒子
        const particle = {
            x: this.x,
            y: this.y,
            size: this.size * 0.5 * (0.7 + Math.random() * 0.3),
            lifetime: 0.3 + Math.random() * 0.2,
            timer: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新计时器
                this.timer += dt;
                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            draw: function(ctx) {
                if (this.isGarbage) return;

                ctx.save();
                try {
                    // 计算不透明度
                    const alpha = 1 - this.timer / this.lifetime;
                    // 设置不透明度
                    ctx.globalAlpha = alpha;
                    // 设置字体
                    ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                    // 设置对齐方式
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    // 绘制火焰
                    ctx.fillText("🔥", this.x, this.y);
                } catch (e) {
                    console.error('Error drawing fire particle:', e);
                }
                ctx.restore();
            }
        };
        // 添加到粒子列表
        if (typeof particles !== 'undefined') {
            particles.push(particle);
        }
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;
        
        ctx.save();
        // 计算屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        // 设置字体
        ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
        // 设置对齐方式
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 绘制投射物
        ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        ctx.restore();
    }
}

class StormBladeProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} chainCount - 连锁次数
     * @param {number} chainRange - 连锁范围
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, chainCount, chainRange) {
        super(x, y, "⚡", size, vx, vy, damage, 1, duration, ownerStats);
        // 连锁属性
        this.chainCount = chainCount;
        this.chainRange = chainRange;
        this.chainingNow = false;
        // 粒子效果
        this.particleTimer = 0;
        this.particleInterval = 0.05;
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 如果正在连锁，不更新位置
        if (!this.chainingNow) {
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        // 更新生命周期
        this.lifetime += dt;
        // 如果生命周期结束，标记为垃圾
        if (this.lifetime >= this.duration) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 如果超出屏幕，标记为垃圾
        if (
            this.x < -this.width ||
            this.x > GAME_WIDTH + this.width ||
            this.y < -this.height ||
            this.y > GAME_HEIGHT + this.height
        ) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 检查与敌人的碰撞
        enemies.forEach(enemy => {
            // 跳过已命中的敌人
            if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
            // 检查碰撞
            if (this.checkCollision(enemy)) {
                // 造成伤害
                enemy.takeDamage(this.damage, this.owner);
                // 添加到已命中列表
                this.hitTargets.add(enemy);
                // 如果还有连锁次数，寻找下一个目标
                if (this.chainCount > 0) {
                    this.chainToNextTarget(enemy);
                } else {
                    // 否则标记为垃圾
                    this.isGarbage = true;
                    this.isActive = false;
                }
            }
        });
        // 更新粒子效果
        this.particleTimer -= dt;
        if (this.particleTimer <= 0) {
            // 创建闪电粒子
            this.createLightningParticle();
            // 重置计时器
            this.particleTimer = this.particleInterval;
        }
    }

    /**
     * 连锁到下一个目标
     * @param {Enemy} currentTarget - 当前目标
     */
    chainToNextTarget(currentTarget) {
        // 标记为正在连锁
        this.chainingNow = true;
        // 寻找范围内的下一个目标
        let nextTarget = null;
        let minDist = this.chainRange;
        enemies.forEach(enemy => {
            // 跳过已命中的敌人
            if (enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
            // 计算距离
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // 如果在范围内且距离更近，更新下一个目标
            if (dist < minDist) {
                minDist = dist;
                nextTarget = enemy;
            }
        });
        // 如果找到下一个目标，创建连锁效果并移动到目标位置
        if (nextTarget) {
            // 创建连锁效果
            this.createChainEffect(currentTarget, nextTarget);
            // 减少连锁次数
            this.chainCount--;
            // 移动到目标位置
            this.x = nextTarget.x;
            this.y = nextTarget.y;
            // 标记为不再连锁
            this.chainingNow = false;
        } else {
            // 如果没有找到下一个目标，标记为垃圾
            this.isGarbage = true;
            this.isActive = false;
        }
    }

    /**
     * 创建连锁效果
     * @param {Enemy} from - 起始敌人
     * @param {Enemy} to - 目标敌人
     */
    createChainEffect(from, to) {
        // 创建连锁效果
        const effect = {
            fromX: from.x,
            fromY: from.y,
            toX: to.x,
            toY: to.y,
            lifetime: 0.2,
            timer: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新计时器
                this.timer += dt;
                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            draw: function(ctx) {
                if (this.isGarbage) return;
                // 获取屏幕坐标
                const fromPos = cameraManager.worldToScreen(this.fromX, this.fromY);
                const toPos = cameraManager.worldToScreen(this.toX, this.toY);
                // 计算透明度
                const alpha = 0.9 * (1 - (this.timer / this.lifetime)); // 增加基础透明度
                
                ctx.save(); // 保存状态，用于发光
                
                // --- 添加发光效果 ---
                ctx.shadowColor = 'cyan'; 
                ctx.shadowBlur = 10; 
                // --- 结束发光效果 ---
                
                // 绘制闪电效果
                ctx.strokeStyle = `rgba(180, 220, 255, ${alpha})`; // 更亮的蓝白色
                ctx.lineWidth = 5; // 增加宽度
                ctx.beginPath();
                ctx.moveTo(fromPos.x, fromPos.y);
                // 绘制锯齿状闪电
                const segments = 5;
                const dx = (toPos.x - fromPos.x) / segments;
                const dy = (toPos.y - fromPos.y) / segments;
                const zigZagAmount = 15; // 增加锯齿幅度
                for (let i = 1; i < segments; i++) {
                    const x = fromPos.x + dx * i;
                    const y = fromPos.y + dy * i;
                    const offsetX = (Math.random() - 0.5) * zigZagAmount;
                    const offsetY = (Math.random() - 0.5) * zigZagAmount;
                    ctx.lineTo(x + offsetX, y + offsetY);
                }
                ctx.lineTo(toPos.x, toPos.y);
                ctx.stroke();
                
                ctx.restore(); // 恢复状态，清除发光设置
            }
        };
        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 创建闪电粒子
     */
    createLightningParticle() {
        // 创建闪电粒子
        const particle = {
            x: this.x,
            y: this.y,
            size: this.size * 0.5 * (0.7 + Math.random() * 0.3),
            lifetime: 0.2 + Math.random() * 0.1,
            timer: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新计时器
                this.timer += dt;
                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            draw: function(ctx) {
                if (this.isGarbage) return;
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                // 计算透明度
                const alpha = 0.7 * (1 - (this.timer / this.lifetime));
                // 计算大小
                const particleSize = this.size * (1 - (this.timer / this.lifetime));
                // 绘制闪电粒子
                ctx.fillStyle = `rgba(100, 100, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, particleSize / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        // 添加到视觉效果列表
        visualEffects.push(particle);
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;

        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        const size = this.size * (this.ownerStats.areaMultiplier || 1);
        
        ctx.save();
        ctx.translate(screenPos.x, screenPos.y);
        ctx.rotate(this.rotation); // 使用 projectile 的旋转角度

        // 绘制闪电 Emoji
        ctx.font = `${size}px 'Segoe UI Emoji', Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // --- 添加发光效果 ---
        ctx.shadowColor = 'cyan'; // 发光颜色
        ctx.shadowBlur = 15; // 发光模糊半径
        // --- 结束发光效果 ---

        ctx.fillText('⚡', 0, 0); // 在旋转后的原点绘制

        ctx.restore(); // 恢复旋转和发光设置
    }
}

class HandshakeProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} size - 大小
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {number} duration - 持续时间
     * @param {Object} ownerStats - 拥有者属性
     * @param {number} area - 范围
     * @param {number} stunDuration - 眩晕持续时间
     */
    constructor(x, y, size, vx, vy, damage, duration, ownerStats, area, stunDuration) {
        super(x, y, "🤝", size, vx, vy, damage, 0, duration, ownerStats);
        // 范围和眩晕
        this.area = area;
        this.stunDuration = stunDuration;
        this.exploded = false;
        // 旋转
        this.rotation = Math.atan2(vy, vx);
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 如果已爆炸，不更新位置
        if (!this.exploded) {
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        // 更新生命周期
        this.lifetime += dt;
        // 如果生命周期结束，标记为垃圾
        if (this.lifetime >= this.duration) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 如果超出屏幕，标记为垃圾
        if (
            this.x < -this.width ||
            this.x > GAME_WIDTH + this.width ||
            this.y < -this.height ||
            this.y > GAME_HEIGHT + this.height
        ) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 检查与敌人的碰撞
        if (!this.exploded) {
            enemies.forEach(enemy => {
                // 跳过已命中的敌人
                if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
                // 检查碰撞
                if (this.checkCollision(enemy)) {
                    // 爆炸
                    this.explode();
                    return;
                }
            });
        }
    }

    /**
     * 爆炸
     */
    explode() {
        // 标记为已爆炸
        this.exploded = true;
        // 创建爆炸效果
        this.createExplosionEffect();
        // 对范围内的敌人造成伤害
        enemies.forEach(enemy => {
            // 跳过已标记为垃圾的敌人
            if (enemy.isGarbage || !enemy.isActive) return;
            // 计算距离
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;
            // 如果在范围内，造成伤害
            if (distSq <= this.area * this.area) {
                // 造成伤害
                enemy.takeDamage(this.damage, this.owner);
                // 添加眩晕效果
                this.applyStunEffect(enemy);
                // 添加到已命中列表
                this.hitTargets.add(enemy);
            }
        });
        // 标记为垃圾
        this.isGarbage = true;
        this.isActive = false;
    }

    /**
     * 应用眩晕效果
     * @param {Enemy} enemy - 敌人
     */
    applyStunEffect(enemy) {
        // 如果敌人已有眩晕效果，更新持续时间
        if (enemy.statusEffects.stun) {
            enemy.statusEffects.stun.duration = Math.max(
                enemy.statusEffects.stun.duration,
                this.stunDuration
            );
        } else {
            // 否则添加新的眩晕效果
            enemy.statusEffects.stun = {
                duration: this.stunDuration,
                source: this.owner
            };
        }
    }

    /**
     * 创建爆炸效果
     */
    createExplosionEffect() {
        // 创建爆炸效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: this.area * 0.7,
            lifetime: 0.5,
            timer: 0,
            isGarbage: false,
            update: function(dt) {
                // 更新计时器
                this.timer += dt;
                // 如果计时器结束，标记为垃圾
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                // 更新半径
                this.radius = (this.timer / this.lifetime) * this.maxRadius;
            },
            draw: function(ctx) {
                if (this.isGarbage) return;
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                // 计算透明度
                const alpha = 0.5 * (1 - (this.timer / this.lifetime));
                // 绘制爆炸效果
                ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                // 绘制边框
                ctx.strokeStyle = `rgba(255, 200, 0, ${alpha * 1.5})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        };
        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果投射物不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;
        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            // 保存上下文
            ctx.save();
            // 平移到投射物位置
            ctx.translate(screenPos.x, screenPos.y);
            // 旋转
            ctx.rotate(this.rotation);
            // 设置字体
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            // 设置对齐方式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            // 绘制表情符号
            ctx.fillText(this.emoji, 0, 0);
            // 恢复上下文
            ctx.restore();
        } catch (e) {
            console.error("绘制握手投射物时出错:", e);
        }
    }
}

/**
 * 火山法杖
 * 召唤小型火山爆发，造成区域伤害和燃烧效果
 */
class VolcanoStaffWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "火山法杖";
    static Emoji = "🌋";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(VolcanoStaffWeapon.Name, VolcanoStaffWeapon.Emoji, 1.8, VolcanoStaffWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 12 + (this.level - 1) * 3,  // 基础伤害
            cooldown: Math.max(1.0, 1.8 - (this.level - 1) * 0.08),  // 冷却时间
            count: 1 + Math.floor((this.level - 1) / 3),  // 每3级增加一个火山
            radius: 70 + (this.level - 1) * 5,  // 爆发半径
            eruptions: 3 + Math.floor((this.level - 1) / 2),  // 爆发次数
            eruptionDelay: 0.5,  // 爆发间隔
            burnDamage: 2 + Math.floor((this.level - 1) * 0.5),  // 燃烧伤害
            burnDuration: 3.0,  // 燃烧持续时间固定为3秒
            lavaPuddle: this.level === 10,  // 10级才有熔岩池
            lavaDuration: 2.0  // 熔岩池持续时间固定为2秒
        };
        
        // 10级额外效果
        if (this.level === 10) {
            this.stats.eruptions += 2;  // 额外爆发次数
            this.stats.burnDamage *= 1.5;  // 燃烧伤害提升
        }
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        const volcanoCount = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const radius = this.stats.radius * (ownerStats.areaMultiplier || 1);
        const eruptions = this.stats.eruptions;
        const eruptionDelay = this.stats.eruptionDelay / (ownerStats.attackSpeedMultiplier || 1);
        const burnDamage = this.stats.burnDamage * (ownerStats.damageMultiplier || 1);
        const burnDuration = this.stats.burnDuration * (ownerStats.durationMultiplier || 1);
        const lavaPuddle = this.stats.lavaPuddle;
        const lavaDuration = this.stats.lavaDuration * (ownerStats.durationMultiplier || 1);
        
        // 创建多个火山
        for (let i = 0; i < volcanoCount; i++) {
            let x, y;
            
            // 找到随机敌人
            const enemy = owner.findRandomEnemy(500);
            
            if (enemy) {
                // 在敌人附近创建火山
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 100;
                x = enemy.x + offsetX;
                y = enemy.y + offsetY;
            } else {
                // 在玩家周围随机位置创建火山
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 150;
                x = owner.x + Math.cos(angle) * distance;
                y = owner.y + Math.sin(angle) * distance;
            }
            
            // 创建火山爆发
            const volcano = new VolcanoEruption(
                x, y, radius, damage, eruptions, eruptionDelay,
                burnDamage, burnDuration, lavaPuddle, lavaDuration,
                owner
            );
            
            // 添加到危险区域列表
            if (typeof hazards !== 'undefined') {
                hazards.push(volcano);
            } else {
                console.error('hazards 数组未定义!');
            }
        }
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `召唤${this.stats.count}个火山，造成${this.stats.damage}伤害并引发${this.stats.eruptions}次爆发。燃烧敌人造成每秒${this.stats.burnDamage}伤害，持续${this.stats.burnDuration.toFixed(1)}秒。${this.stats.lavaPuddle ? `留下持续${this.stats.lavaDuration.toFixed(1)}秒的熔岩池。` : ''}`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "召唤小型火山爆发，造成区域伤害和燃烧效果。";
    }
}

class BlackHoleBallWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "黑洞球";
    static Emoji = "⚫";
    static MaxLevel = 10;

    /**
     * 构造函数
     */
    constructor() {
        super(BlackHoleBallWeapon.Name, BlackHoleBallWeapon.Emoji, 5.0, BlackHoleBallWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15 + (this.level - 1) * 5,
            cooldown: Math.max(2.0, this.baseCooldown - (this.level - 1) * 0.3),
            projectileSpeed: 120 + (this.level - 1) * 10,
            blackHoleDuration: 3 + (this.level - 1) * 0.3,
            blackHoleRadius: 80 + (this.level - 1) * 10,
            pullStrength: 0.3 + (this.level - 1) * 0.05,
            tickDamage: 3 + (this.level - 1) * 1,
            tickInterval: 0.3,
            collapse: this.level >= 10 // 10级特殊效果：黑洞结束时爆炸
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const blackHoleDuration = this.stats.blackHoleDuration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * 1.5 * (ownerStats.areaMultiplier || 1);
        const blackHoleRadius = this.stats.blackHoleRadius * (ownerStats.areaMultiplier || 1);
        const tickDamage = this.stats.tickDamage * (ownerStats.damageMultiplier || 1);
        const pullStrength = this.stats.pullStrength;
        const collapse = this.stats.collapse;
        
        // 寻找最近的敌人
        const enemy = this.getClosestEnemy(800);
        
        if (enemy) {
            // 计算方向朝向敌人
            const dx = enemy.x - owner.x;
            const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            let dirX = dx / dist;
            let dirY = dy / dist;
            
            // 添加一些随机性
            dirX += (Math.random() - 0.5) * 0.2;
            dirY += (Math.random() - 0.5) * 0.2;
            
            // 规范化方向
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            dirX /= length;
            dirY /= length;

            // 计算速度
            const vx = dirX * speed;
            const vy = dirY * speed;
            
            // 创建黑洞球投射物
            const ball = new BlackHoleBallProjectile(
                owner.x, owner.y, size, vx, vy, damage, 1.5, 
                ownerStats, blackHoleDuration, blackHoleRadius, 
                tickDamage, this.stats.tickInterval, pullStrength, collapse
            );
            
            ball.owner = owner;
            projectiles.push(ball);
        } else {
            // 没有敌人时，随机方向
            const angle = Math.random() * Math.PI * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
        
            // 创建黑洞球投射物
            const ball = new BlackHoleBallProjectile(
                owner.x, owner.y, size, vx, vy, damage, 1.5, 
                ownerStats, blackHoleDuration, blackHoleRadius, 
                tickDamage, this.stats.tickInterval, pullStrength, collapse
            );
            
            ball.owner = owner;
            projectiles.push(ball);
        }
    }

    /**
     * 获取最近的敌人
     * @param {number} maxRange - 最大范围
     * @returns {Enemy|null} 敌人对象或null
     */
    getClosestEnemy(maxRange) {
        let closestEnemy = null;
        let minDistanceSq = maxRange * maxRange;

        // 确保this.owner存在，防止空指针异常
        if (!this.owner) return null;

        enemies.forEach(enemy => {
            if (!enemy || enemy.isGarbage || !enemy.isActive) return;

            const distanceSq = (enemy.x - this.owner.x) * (enemy.x - this.owner.x) +
                             (enemy.y - this.owner.y) * (enemy.y - this.owner.y);
            
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `发射黑洞球，吸引${this.stats.blackHoleRadius}范围内的敌人并造成每${this.stats.tickInterval.toFixed(1)}秒${this.stats.tickDamage}点伤害。${this.stats.collapse ? '黑洞结束时爆炸，造成额外伤害。' : ''}`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "发射会变成黑洞的能量球，吸引并伤害敌人。";
    }
}

// 武器列表初始化
const BASE_WEAPONS = [];

// 添加所有武器类到列表中
if (typeof DaggerWeapon === 'function') BASE_WEAPONS.push(DaggerWeapon);
if (typeof GarlicWeapon === 'function') BASE_WEAPONS.push(GarlicWeapon);
if (typeof WhipWeapon === 'function') BASE_WEAPONS.push(WhipWeapon);
if (typeof FireBladeWeapon === 'function') BASE_WEAPONS.push(FireBladeWeapon);
if (typeof StormBladeWeapon === 'function') BASE_WEAPONS.push(StormBladeWeapon);
if (typeof HandshakeWeapon === 'function') BASE_WEAPONS.push(HandshakeWeapon);
if (typeof BubbleWandWeapon === 'function') BASE_WEAPONS.push(BubbleWandWeapon);
if (typeof ChaosDiceWeapon === 'function') BASE_WEAPONS.push(ChaosDiceWeapon);
if (typeof MagnetGunWeapon === 'function') BASE_WEAPONS.push(MagnetGunWeapon);
if (typeof VolcanoStaffWeapon === 'function') BASE_WEAPONS.push(VolcanoStaffWeapon);
if (typeof BlackHoleBallWeapon === 'function') BASE_WEAPONS.push(BlackHoleBallWeapon);
if (typeof FrostStaffWeapon === 'function') BASE_WEAPONS.push(FrostStaffWeapon);
if (typeof VineSeedWeapon === 'function') BASE_WEAPONS.push(VineSeedWeapon);
if (typeof LaserPrismWeapon === 'function') BASE_WEAPONS.push(LaserPrismWeapon);
if (typeof PoisonVialWeapon === 'function') BASE_WEAPONS.push(PoisonVialWeapon);

console.log('所有武器已整合到 BASE_WEAPONS:', BASE_WEAPONS.map(w => w.Name || w.name));
