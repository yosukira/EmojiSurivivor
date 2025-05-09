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
    static Evolution = {
        requires: "Bracer",
        evolvesTo: "Knives"
    };

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
            damage: 10 + (this.level - 1) * 3,
            projectileSpeed: 350 + (this.level - 1) * 20,
            cooldown: Math.max(0.1, this.baseCooldown - (this.level - 1) * 0.08),
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
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        
        // 计算实际投射物数量（基础数量 + 加成）
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage;
        const pierce = this.stats.pierce;
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        
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
        
        // 计算角度间隔
        const angleStep = count > 1 ? (Math.PI / 8) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);
        
        // 发射多个投射物
        for (let i = 0; i < count; i++) {
            // 计算角度
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // 创建投射物
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
        
        if (this.level % 2 === 0) {
            desc += "+1 投射物。";
        } else if (this.level % 3 === 0) {
            desc += "+1 穿透。";
        } else {
            desc += "+伤害/速度。";
        }
        
        return desc + ` (冷却: ${Math.max(0.1, this.baseCooldown - this.level * 0.08).toFixed(2)}s)`;
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
    static Name = "大蒜";
    static Emoji = "🧄";
    static MaxLevel = 8;
    static Evolution = {
        requires: "Pummarola",
        evolvesTo: "SoulEater"
    };

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
            // 跳过已命中的敌人
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
        
        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(owner.x, owner.y);
        
        // 计算透明度
        const alpha = 0.2 + 0.1 * Math.sin(performance.now() / 200);
        
        // 绘制光环
        ctx.fillStyle = `rgba(200, 255, 200, ${alpha})`;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius * cameraManager.zoom, 0, Math.PI * 2);
        ctx.fill();
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +伤害/范围/减速效果。`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "创建伤害光环，减速敌人。";
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
                const alpha = 0.7 * (1 - this.lifetime / this.duration);
                
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                // 保存上下文
                ctx.save();
                
                // 平移到玩家位置
                ctx.translate(screenPos.x, screenPos.y);
                
                // 旋转
                ctx.rotate(this.angle);
                
                // 绘制鞭子
                ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.lineWidth = this.width * cameraManager.zoom * (0.5 + 0.5 * (1 - this.lifetime / this.duration));
                
                // 绘制鞭子曲线
                ctx.beginPath();
                ctx.moveTo(0, 0);
                
                // 绘制贝塞尔曲线
                const progress = this.lifetime / this.duration;
                const controlX = this.length * 0.5;
                const controlY = this.width * 0.5 * Math.sin(progress * Math.PI);
                const endX = this.length * progress;
                const endY = 0;
                
                ctx.quadraticCurveTo(controlX, controlY, endX, endY);
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
        let desc = `Lv${this.level + 1}: `;
        
        if (this.level % 4 === 0) {
            desc += "+1 鞭子。";
        } else {
            desc += "+伤害/范围。";
        }
        
        return desc + ` (冷却: ${Math.max(0.3, this.baseCooldown - this.level * 0.15).toFixed(2)}s)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "横扫敌人。";
    }
}