/**
 * 匕首武器类
 * 发射匕首攻击敌人
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
        const angleStep = count > 1 ? (Math.PI / 18) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);
        
        // 发射多个投射物
        for (let i = 0; i < count; i++) {
            // 计算角度
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // 使用对象池生成弹射物
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
        const nextLevel = this.level + 1;
        const currentDamage = 12 + (this.level - 1) * 3;
        const nextDamage = 12 + nextLevel * 3;
        const damageIncrease = nextDamage - currentDamage;
        
        const currentSpeed = 350 + (this.level - 1) * 15;
        const nextSpeed = 350 + nextLevel * 15;
        const speedIncrease = nextSpeed - currentSpeed;
        
        const currentCooldown = Math.max(0.16, this.baseCooldown - (this.level - 1) * 0.09);
        const nextCooldown = Math.max(0.16, this.baseCooldown - nextLevel * 0.09);
        
        let desc = `Lv${nextLevel}: `;
        
        if (this.level % 2 === 1) {
            const currentCount = 1 + Math.floor((this.level - 1) / 2);
            const nextCount = 1 + Math.floor(nextLevel / 2);
            desc += `+1 投射物 (${currentCount} → ${nextCount})`;
        } else if (this.level === 3 || this.level === 7) {
            const currentPierce = Math.floor(this.level / 4);
            const nextPierce = Math.floor(nextLevel / 4);
            desc += `+1 穿透 (${currentPierce} → ${nextPierce})`;
        } else {
            desc += `伤害 +${damageIncrease} (${currentDamage} → ${nextDamage})`;
            desc += `，速度 +${speedIncrease} (${currentSpeed} → ${nextSpeed})`;
        }
        
        desc += `，冷却: ${currentCooldown.toFixed(2)}s → ${nextCooldown.toFixed(2)}s`;
        
        return desc;
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
 * 创建伤害光环攻击周围敌人
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
        
        // 光环半径
        this.auraRadius = 0;
        
        // 伤害计时器
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
            knockback: 6 + this.level * 1.5,
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
            
            // 获取属性
            const radius = this.stats.area * (ownerStats.areaMultiplier || 1);
            const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
            const knockback = this.stats.knockback;
            
            // 对范围内的敌人造成伤害
            enemies.forEach(enemy => {
                // 跳过不活动或已标记为垃圾的敌人
                if (enemy.isGarbage || !enemy.isActive) return;
                
                // 计算距离
                const dx = owner.x - enemy.x;
                const dy = owner.y - enemy.y;
                const distSq = dx * dx + dy * dy;
                
                // 如果在范围内，造成伤害
                if (distSq <= radius * radius) {
                    // 造成伤害
                    enemy.takeDamage(damage, owner);
                    
                    // 应用击退效果
                    if (knockback > 0 && distSq > 1) {
                        const dist = Math.sqrt(distSq);
                        const pushFactor = knockback * (1 - dist / radius);
                        const pushX = (enemy.x - owner.x) / dist * pushFactor * dt * 18;
                        const pushY = (enemy.y - owner.y) / dist * pushFactor * dt * 18;
                        
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
        // 如果光环半径大于0，绘制光环
        if (this.auraRadius > 0) {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(owner.x, owner.y);
            
            // 创建径向渐变
            const gradient = ctx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, this.auraRadius
            );
            
            // 设置颜色渐变
            gradient.addColorStop(0, 'rgba(180, 255, 180, 0.25)');
            gradient.addColorStop(0.7, 'rgba(100, 255, 100, 0.15)');
            gradient.addColorStop(1, 'rgba(50, 255, 50, 0.05)');
            
            // 绘制光环
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.auraRadius, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // 绘制边缘
            ctx.strokeStyle = 'rgba(100, 255, 100, 0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const nextLevel = this.level + 1;
        const currentDamage = 3 + (this.level - 1) * 1.5;
        const nextDamage = 3 + nextLevel * 1.5;
        const damageIncrease = (nextDamage - currentDamage).toFixed(1);
        
        const currentArea = 65 + (this.level - 1) * 12;
        const nextArea = 65 + nextLevel * 12;
        const areaIncrease = Math.round(nextArea - currentArea);
        
        const currentKnockback = 6 + this.level * 1.5;
        const nextKnockback = 6 + (nextLevel) * 1.5;
        const knockbackIncrease = (nextKnockback - currentKnockback).toFixed(1);
        
        let desc = `Lv${nextLevel}: `;
        
        if (nextLevel == 2) {
            desc += `增加范围 +${areaIncrease}，伤害 +${damageIncrease}`;
        } else if (nextLevel == 3) {
            desc += `增加击退力 +${knockbackIncrease}，伤害 +${damageIncrease}`;
        } else if (nextLevel == 4) {
            desc += `增加毒性效果，伤害 +${damageIncrease}`;
        } else if (nextLevel == 5) {
            desc += `范围 +${areaIncrease}，减少伤害间隔`;
        } else if (nextLevel == 6) {
            desc += `增加击退范围，伤害 +${damageIncrease}`;
        } else if (nextLevel == 7) {
            desc += `增加减速效果，范围 +${areaIncrease}`;
        } else if (nextLevel == 8) {
            desc += `大幅增强全部属性，伤害 +${damageIncrease}，范围 +${areaIncrease}`;
        }
        
        return desc;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "创建伤害光环攻击周围敌人。";
    }
}

/**
 * 鞭子武器类
 * 发射鞭子攻击敌人
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
        
        // 鞭击效果
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
            pierce: Infinity
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        
        // 获取属性
        const damage = this.stats.damage;
        const area = this.stats.area * (ownerStats.areaMultiplier || 1);
        const count = this.stats.count + Math.floor((ownerStats.projectileCountBonus || 0) / 2);
        const whipWidth = 25 * (ownerStats.areaMultiplier || 1);
        
        // 计算角度间隔
        const angleStep = Math.PI * 2 / count;
        const startAngle = Math.random() * Math.PI * 2;
        
        // 创建多个鞭击
        for (let i = 0; i < count; i++) {
            // 计算角度
            const angle = startAngle + i * angleStep;
            
            // 计算位置
            const hitX = owner.x + Math.cos(angle) * area / 2;
            const hitY = owner.y + Math.sin(angle) * area / 2;
            
            // 创建鞭击效果
            const hitbox = {
                x: hitX,
                y: hitY,
                width: area,
                height: whipWidth,
                damage: damage,
                ownerStats: ownerStats,
                lifetime: 0.25,
                hitTargets: new Set(),
                isGarbage: false,
                angle: angle,
                
                update: function(dt) {
                    // 更新生命周期
                    this.lifetime -= dt;
                    
                    // 检查是否过期
                    if (this.lifetime <= 0) {
                        this.isGarbage = true;
                        return;
                    }
                    
                    // 检查与敌人的碰撞
                    enemies.forEach(enemy => {
                        // 跳过已命中的敌人
                        if (this.isGarbage || enemy.isGarbage || !enemy.isActive || this.hitTargets.has(enemy)) return;
                        
                        // 计算碰撞
                        const halfWidth = this.width / 2;
                        const halfHeight = this.height / 2;
                        const enemyHalfSize = enemy.size / 2;
                        
                        // 检查碰撞
                        if (
                            this.x - halfWidth < enemy.x + enemyHalfSize &&
                            this.x + halfWidth > enemy.x - enemyHalfSize &&
                            this.y - halfHeight < enemy.y + enemyHalfSize &&
                            this.y + halfHeight > enemy.y - enemyHalfSize
                        ) {
                            // 造成伤害
                            enemy.takeDamage(this.damage * (this.ownerStats.damageMultiplier || 1), owner);
                            
                            // 添加到已命中列表
                            this.hitTargets.add(enemy);
                        }
                    });
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    // 获取屏幕坐标
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    
                    // 保存上下文
                    ctx.save();
                    
                    // 平移到鞭击位置
                    ctx.translate(screenPos.x, screenPos.y);
                    
                    // 旋转
                    ctx.rotate(this.angle);
                    
                    // 绘制鞭击效果
                    ctx.fillStyle = 'rgba(210, 210, 210, 0.35)';
                    ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
                    
                    // 恢复上下文
                    ctx.restore();
                }
            };
            
            // 添加到鞭击列表
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
        
        // 更新鞭击效果
        this.whipHitboxes = this.whipHitboxes.filter(hitbox => {
            hitbox.update(dt);
            return !hitbox.isGarbage;
        });
    }

    /**
     * 绘制鞭击效果
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawHitboxes(ctx) {
        // 绘制鞭击效果
        this.whipHitboxes.forEach(hitbox => hitbox.draw(ctx));
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const nextLevel = this.level + 1;
        const currentDamage = 20 + (this.level - 1) * 7;
        const nextDamage = 20 + (nextLevel - 1) * 7;
        const damageIncrease = nextDamage - currentDamage;
        
        const currentArea = 110 + (this.level - 1) * 18;
        const nextArea = 110 + (nextLevel - 1) * 18;
        const areaIncrease = nextArea - currentArea;
        
        const currentCooldown = Math.max(0.65, this.baseCooldown - (this.level - 1) * 0.13);
        const nextCooldown = Math.max(0.65, this.baseCooldown - (nextLevel - 1) * 0.13);
        
        const currentCount = 1 + Math.floor(this.level / 4);
        const nextCount = 1 + Math.floor(nextLevel / 4);
        
        let desc = `Lv${nextLevel}: `;
        
        if (nextLevel % 4 === 0) {
            desc += `+1 鞭击 (${currentCount} → ${nextCount})`;
        } else {
            desc += `伤害 +${damageIncrease} (${currentDamage} → ${nextDamage})`;
            desc += `，范围 +${areaIncrease} (${currentArea} → ${nextArea})`;
        }
        
        if (nextLevel == 3) {
            desc += `\n额外效果: 鞭击使敌人减速`;
        } else if (nextLevel == 5) {
            desc += `\n额外效果: 鞭击有几率暴击，造成1.5倍伤害`;
        } else if (nextLevel == 7) {
            desc += `\n额外效果: 鞭击范围增加，并有几率连锁打击`;
        } else if (nextLevel == 8) {
            desc += `\n额外效果: 全面增强，冷却时间减少`;
        }
        
        desc += `，冷却: ${currentCooldown.toFixed(2)}s → ${nextCooldown.toFixed(2)}s`;
        
        return desc;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射鞭子攻击敌人。";
    }
}

/**
 * 激光剑武器类
 * 发射穿透性激光束
 */
class LaserSwordWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "激光剑";
    static Emoji = EMOJI.WEAPON_THUNDER_SWORD;
    static MaxLevel = 8;
    static EvolvesFrom = null;
    static EvolvesInto = null;

    /**
     * 构造函数
     */
    constructor() {
        super(LaserSwordWeapon.Name, LaserSwordWeapon.Emoji, LaserSwordWeapon.MaxLevel);
        // 基础冷却时间
        this.baseCooldown = 1.5;
        // 当前冷却时间
        this.cooldown = this.baseCooldown;
        // 基础伤害
        this.baseDamage = 25;
        // 基础速度
        this.baseSpeed = 400;
        // 基础持续时间
        this.baseDuration = 0.6;
        // 基础穿透次数
        this.basePierce = 3;
        // 激光宽度
        this.laserWidth = 15;
        // 激光长度
        this.laserLength = 300;
        // 当前激光
        this.activeLasers = [];
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 更新冷却
        if (this.cooldown > 0) {
            this.cooldown -= dt;
        }

        // 如果冷却结束，发射激光
        if (this.cooldown <= 0) {
            // 发射激光
            this.fire(owner);
            // 重置冷却
            this.cooldown = this.getActualCooldown(owner);
        }
        
        // 更新激光
        for (let i = this.activeLasers.length - 1; i >= 0; i--) {
            const laser = this.activeLasers[i];
            laser.lifetime += dt;
            
            if (laser.lifetime >= laser.duration) {
                this.activeLasers.splice(i, 1);
            }
        }
    }

    /**
     * 发射激光
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取实际伤害
        const damage = this.getActualDamage(owner);
        
        // 获取实际穿透次数
        const pierce = this.basePierce + Math.floor(this.level / 2);
        
        // 获取实际持续时间
        const duration = this.baseDuration * owner.stats.durationMultiplier;
        
        // 获取实际激光长度
        const laserLength = this.laserLength * (1 + (this.level - 1) * 0.15);
        
        // 计算激光数量
        const laserCount = 1 + Math.floor(this.level / 3);
        
        // 发射激光
        const angleStep = Math.PI * 2 / laserCount;
        const startAngle = Math.random() * Math.PI * 2;
        
        for (let i = 0; i < laserCount; i++) {
            const angle = startAngle + i * angleStep;
            const dirX = Math.cos(angle);
            const dirY = Math.sin(angle);
            
            // 创建激光
            const laser = {
                x: owner.x,
                y: owner.y,
                dirX: dirX,
                dirY: dirY,
                length: laserLength,
                width: this.laserWidth,
                damage: damage,
                pierce: pierce,
                lifetime: 0,
                duration: duration,
                hitTargets: new Set()
            };
            
            this.activeLasers.push(laser);
        }
    }

    /**
     * 绘制武器效果
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawHitboxes(ctx) {
        // 绘制激光
        for (const laser of this.activeLasers) {
            // 计算激光透明度
            const alpha = 1 - (laser.lifetime / laser.duration);
            
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(laser.x, laser.y);
            
            // 计算激光终点
            const endX = laser.x + laser.dirX * laser.length;
            const endY = laser.y + laser.dirY * laser.length;
            const screenEndPos = cameraManager.worldToScreen(endX, endY);
            
            // 创建渐变
            const gradient = ctx.createLinearGradient(
                screenPos.x, screenPos.y,
                screenEndPos.x, screenEndPos.y
            );
            
            gradient.addColorStop(0, `rgba(50, 200, 255, ${alpha})`);
            gradient.addColorStop(0.5, `rgba(100, 150, 255, ${alpha * 0.8})`);
            gradient.addColorStop(1, `rgba(150, 100, 255, ${alpha * 0.5})`);
            
            // 绘制激光
            ctx.save();
            ctx.beginPath();
            ctx.strokeStyle = gradient;
            ctx.lineWidth = laser.width;
            ctx.lineCap = 'round';
            ctx.moveTo(screenPos.x, screenPos.y);
            ctx.lineTo(screenEndPos.x, screenEndPos.y);
            ctx.stroke();
            
            // 绘制激光核心
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = laser.width * 0.3;
            ctx.moveTo(screenPos.x, screenPos.y);
            ctx.lineTo(screenEndPos.x, screenEndPos.y);
            ctx.stroke();
            ctx.restore();
            
            // 检查与敌人的碰撞
            this.checkLaserCollisions(laser);
        }
    }
    
    /**
     * 检查激光与敌人的碰撞
     * @param {Object} laser - 激光对象
     */
    checkLaserCollisions(laser) {
        // 如果已经达到穿透上限，不再检查碰撞
        if (laser.pierce <= 0) return;
        
        // 遍历敌人
        for (const enemy of enemies) {
            // 跳过已命中的敌人
            if (laser.hitTargets.has(enemy) || enemy.isGarbage || !enemy.isActive) continue;
            
            // 计算激光与敌人的距离
            const dx = enemy.x - laser.x;
            const dy = enemy.y - laser.y;
            
            // 计算投影距离
            const projDist = dx * laser.dirX + dy * laser.dirY;
            
            // 如果投影距离为负或超出激光长度，跳过
            if (projDist < 0 || projDist > laser.length) continue;
            
            // 计算垂直距离
            const perpX = dx - projDist * laser.dirX;
            const perpY = dy - projDist * laser.dirY;
            const perpDist = Math.sqrt(perpX * perpX + perpY * perpY);
            
            // 如果垂直距离小于敌人半径加激光宽度的一半，发生碰撞
            if (perpDist <= enemy.size / 2 + laser.width / 2) {
                // 造成伤害
                enemy.takeDamage(laser.damage, player);
                
                // 添加到已命中列表
                laser.hitTargets.add(enemy);
                
                // 减少穿透次数
                laser.pierce--;
                
                // 创建命中特效
                this.createHitEffect(laser.x + laser.dirX * projDist, laser.y + laser.dirY * projDist);
                
                // 如果穿透次数用完，结束检查
                if (laser.pierce <= 0) break;
            }
        }
    }
    
    /**
     * 创建命中特效
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    createHitEffect(x, y) {
        // 创建命中特效
        const effect = {
            x: x,
            y: y,
            radius: 0,
            maxRadius: 20,
            lifetime: 0.3,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                this.radius = (this.timer / this.lifetime) * this.maxRadius;
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.7 - (this.timer / this.lifetime) * 0.7;
                
                ctx.fillStyle = `rgba(100, 150, 255, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        visualEffects.push(effect);
    }

    /**
     * 获取实际伤害
     * @param {Player} owner - 拥有者
     * @returns {number} 实际伤害
     */
    getActualDamage(owner) {
        return (this.baseDamage + (this.level - 1) * 10) * owner.stats.damageMultiplier;
    }

    /**
     * 获取实际冷却时间
     * @param {Player} owner - 拥有者
     * @returns {number} 实际冷却时间
     */
    getActualCooldown(owner) {
        return Math.max(0.5, this.baseCooldown - (this.level - 1) * 0.15) * owner.stats.cooldownMultiplier;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        const nextLevel = this.level + 1;
        const currentDamage = this.baseDamage + (this.level - 1) * 10;
        const nextDamage = this.baseDamage + nextLevel * 10;
        
        const currentCooldown = Math.max(0.5, this.baseCooldown - (this.level - 1) * 0.15);
        const nextCooldown = Math.max(0.5, this.baseCooldown - nextLevel * 0.15);
        
        const currentPierce = this.basePierce + Math.floor(this.level / 2);
        const nextPierce = this.basePierce + Math.floor(nextLevel / 2);
        
        const currentCount = 1 + Math.floor(this.level / 3);
        const nextCount = 1 + Math.floor(nextLevel / 3);
        
        let desc = `Lv${nextLevel}: `;
        
        if (nextLevel % 3 === 0) {
            desc += `+1 激光束 (${currentCount} → ${nextCount})`;
        } else if (nextLevel % 2 === 0) {
            desc += `+1 穿透 (${currentPierce} → ${nextPierce})`;
        } else {
            desc += `伤害 +10 (${currentDamage} → ${nextDamage})`;
        }
        
        desc += `，冷却: ${currentCooldown.toFixed(2)}s → ${nextCooldown.toFixed(2)}s`;
        
        return desc;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射穿透性激光束，可以穿透多个敌人。";
    }
}