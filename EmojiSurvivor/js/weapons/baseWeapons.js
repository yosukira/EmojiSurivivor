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
            
            // 绘制光环
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.auraRadius, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 255, 255, 0.07)';
            ctx.fill();
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `Lv${this.level + 1}: +伤害/范围/击退。`;
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
        let desc = `Lv${this.level + 1}: +伤害/范围。`;
        
        if (this.level === 3) {
            desc += "+1 鞭击。";
        }
        
        return desc + ` (冷却: ${Math.max(0.65, this.baseCooldown - this.level * 0.13).toFixed(2)}s)`;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射鞭子攻击敌人。";
    }
}