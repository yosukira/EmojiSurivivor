/**
 * 千刃武器类
 * 匕首的进化武器，发射大量匕首
 */
class ThousandKnives extends DaggerWeapon {
    /**
     * 静态属性
     */
    static Name = "千刃";
    static Emoji = EMOJI.WEAPON_KNIVES;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {DaggerWeapon} baseWeapon - 基础武器
     */
    constructor(baseWeapon) {
        super();
        
        // 设置属性
        this.name = ThousandKnives.Name;
        this.emoji = ThousandKnives.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = ThousandKnives.MaxLevel;
        this.isEvolved = true;
        this.baseCooldown = 0.1;
        
        // 计算属性
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 22,
            projectileSpeed: 550,
            cooldown: this.baseCooldown,
            count: 6,
            pierce: 4,
            duration: 1.1
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        return [];
    }

    /**
     * 获取基础升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 基础升级选项
     */
    getBaseUpgradeOptions(player) {
        return [];
    }
}

/**
 * 魂噬武器类
 * 大蒜的进化武器，吸取敌人灵魂
 */
class SoulEater extends GarlicWeapon {
    /**
     * 静态属性
     */
    static Name = "魂噬";
    static Emoji = EMOJI.WEAPON_SOUL_EATER;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {GarlicWeapon} baseWeapon - 基础武器
     */
    constructor(baseWeapon) {
        super();
        
        // 设置属性
        this.name = SoulEater.Name;
        this.emoji = SoulEater.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = SoulEater.MaxLevel;
        this.isEvolved = true;
        
        // 计算属性
        this.calculateStats();
        
        // 灵魂计数
        this.soulCount = 0;
        
        // 灵魂效果
        this.souls = [];
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 8,
            area: 120,
            knockback: 15,
            cooldown: 1.0,
            healAmount: 0.5,
            soulDamage: 15,
            soulDuration: 5.0,
            maxSouls: 8
        };
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 调用父类更新方法
        super.update(dt, owner);
        
        // 更新灵魂效果
        this.updateSouls(dt, owner);
    }

    /**
     * 更新灵魂效果
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    updateSouls(dt, owner) {
        // 更新现有灵魂
        for (let i = this.souls.length - 1; i >= 0; i--) {
            const soul = this.souls[i];
            
            // 更新生命周期
            soul.lifetime += dt;
            
            // 检查是否过期
            if (soul.lifetime >= soul.duration) {
                this.souls.splice(i, 1);
                continue;
            }
            
            // 更新位置
            const angle = soul.baseAngle + gameTime * soul.rotationSpeed;
            const radius = soul.baseRadius + Math.sin(gameTime * 2) * 10;
            
            soul.x = owner.x + Math.cos(angle) * radius;
            soul.y = owner.y + Math.sin(angle) * radius;
            
            // 检查与敌人的碰撞
            soul.damageTimer -= dt;
            if (soul.damageTimer <= 0) {
                // 寻找范围内的敌人
                const hitRadius = 30 * (owner.getStat('areaMultiplier') || 1);
                
                enemies.forEach(enemy => {
                    if (enemy.isGarbage || !enemy.isActive) return;
                    
                    // 计算距离
                    const dx = enemy.x - soul.x;
                    const dy = enemy.y - soul.y;
                    const distSq = dx * dx + dy * dy;
                    
                    // 如果在范围内，造成伤害
                    if (distSq <= hitRadius * hitRadius) {
                        enemy.takeDamage(soul.damage * (owner.getStat('damageMultiplier') || 1), owner);
                    }
                });
                
                // 重置伤害计时器
                soul.damageTimer = 0.5;
            }
        }
    }

    /**
     * 绘制灵魂效果
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawEffects(ctx) {
        // 绘制灵魂效果
        this.souls.forEach(soul => {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(soul.x, soul.y);
            
            // 计算透明度
            const alpha = 1 - (soul.lifetime / soul.duration);
            
            // 绘制灵魂
            ctx.globalAlpha = alpha;
            ctx.font = `${soul.size}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(soul.emoji, screenPos.x, screenPos.y);
            ctx.globalAlpha = 1.0;
        });
    }

    /**
     * 火焰处理
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);
        
        // 获取范围内的敌人
        const radius = this.stats.area * (ownerStats.areaMultiplier || 1);
        const enemies = owner.findEnemiesInRadius(radius);
        
        // 对范围内的敌人造成伤害
        enemies.forEach(enemy => {
            // 造成伤害
            const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
            const killed = enemy.takeDamage(damage, owner);
            
            // 如果击杀敌人，有几率生成灵魂
            if (killed && this.souls.length < this.stats.maxSouls && Math.random() < 0.3) {
                this.addSoul(owner, enemy);
            }
            
            // 应用击退效果
            if (!enemy.isGarbage && enemy.isActive) {
                // 计算击退方向和距离
                const dx = enemy.x - owner.x;
                const dy = enemy.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist > 0) {
                    // 计算击退力度
                    const knockbackFactor = this.stats.knockback * (1 - dist / radius);
                    
                    // 应用击退
                    const knockbackX = dx / dist * knockbackFactor;
                    const knockbackY = dy / dist * knockbackFactor;
                    
                    enemy.x += knockbackX;
                    enemy.y += knockbackY;
                }
            }
        });
        
        // 如果有灵魂，恢复生命
        if (this.souls.length > 0 && owner.health < owner.maxHealth) {
            owner.heal(this.stats.healAmount);
        }
    }

    /**
     * 添加灵魂
     * @param {Player} owner - 拥有者
     * @param {Enemy} enemy - 敌人
     */
    addSoul(owner, enemy) {
        // 计算基础角度
        const baseAngle = Math.random() * Math.PI * 2;
        
        // 计算基础半径
        const baseRadius = 50 + Math.random() * 30;
        
        // 创建灵魂
        const soul = {
            x: enemy.x,
            y: enemy.y,
            baseAngle: baseAngle,
            baseRadius: baseRadius,
            rotationSpeed: 0.5 + Math.random() * 0.5,
            size: GAME_FONT_SIZE,
            emoji: EMOJI.WEAPON_SOUL_EATER,
            damage: this.stats.soulDamage,
            duration: this.stats.soulDuration,
            lifetime: 0,
            damageTimer: 0
        };
        
        // 添加到灵魂列表
        this.souls.push(soul);
        this.soulCount++;
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        return [];
    }

    /**
     * 获取基础升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 基础升级选项
     */
    getBaseUpgradeOptions(player) {
        return [];
    }
}

/**
 * 血泪武器类
 * 鞭子的进化武器，发射血泪攻击
 */
class BloodyTear extends WhipWeapon {
    /**
     * 静态属性
     */
    static Name = "血泪";
    static Emoji = EMOJI.WEAPON_BLOODY_TEAR;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {WhipWeapon} baseWeapon - 基础武器
     */
    constructor(baseWeapon) {
        super();
        
        // 设置属性
        this.name = BloodyTear.Name;
        this.emoji = BloodyTear.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = BloodyTear.MaxLevel;
        this.isEvolved = true;
        
        // 计算属性
        this.calculateStats();
        
        // 鞭击效果
        this.whipHitboxes = [];
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 50,
            cooldown: 0.5,
            area: 200,
            count: 3,
            pierce: Infinity,
            bleedDamage: 10,
            bleedDuration: 3.0,
            bleedTick: 0.5
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
                            
                            // 添加流血效果
                            if (!enemy.statusEffects) {
                                enemy.statusEffects = {};
                            }
                            
                            enemy.statusEffects.bleed = {
                                damage: owner.weapon.stats.bleedDamage,
                                duration: owner.weapon.stats.bleedDuration,
                                tick: owner.weapon.stats.bleedTick,
                                timer: 0,
                                source: owner
                            };
                            
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
                    ctx.fillStyle = 'rgba(200, 0, 0, 0.35)';
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
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        return [];
    }

    /**
     * 获取基础升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 基础升级选项
     */
    getBaseUpgradeOptions(player) {
        return [];
    }
}

/**
 * 地狱火武器类
 * 燃烧刀的进化武器，发射地狱火
 */
class Inferno extends FireDaggerWeapon {
    /**
     * 静态属性
     */
    static Name = "地狱火";
    static Emoji = EMOJI.WEAPON_INFERNO;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {FireDaggerWeapon} baseWeapon - 基础武器
     */
    constructor(baseWeapon) {
        super();
        
        // 设置属性
        this.name = Inferno.Name;
        this.emoji = Inferno.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = Inferno.MaxLevel;
        this.isEvolved = true;
        
        // 计算属性
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 30,
            projectileSpeed: 400,
            cooldown: 0.15,
            count: 3,
            pierce: 3,
            duration: 1.5,
            burnDamage: 8,
            burnDuration: 3.0,
            burnTick: 0.4,
            explosionRadius: 80
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
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const pierce = this.stats.pierce;
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        const burnDamage = this.stats.burnDamage;
        const burnDuration = this.stats.burnDuration * (ownerStats.durationMultiplier || 1);
        const explosionRadius = this.stats.explosionRadius * (ownerStats.areaMultiplier || 1);
        
        // 获取目标敌人
        let targets = [];
        
        // 尝试获取多个目标
        for (let i = 0; i < count; i++) {
            const target = owner.findRandomEnemy(GAME_WIDTH) || owner.findNearestEnemy(GAME_WIDTH);
            if (target) {
                targets.push(target);
            }
        }
        
        // 如果没有目标，使用默认方向
        if (targets.length === 0) {
            // 计算角度间隔
            const angleStep = Math.PI * 2 / count;
            const startAngle = Math.random() * Math.PI * 2;
            
            // 发射多个投射物
            for (let i = 0; i < count; i++) {
                // 计算角度
                const angle = startAngle + i * angleStep;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                
                // 使用对象池生成弹射物
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
                if (projectile) {
                    // 设置状态效果
                    projectile.statusEffect = {
                        type: 'burn',
                        damage: burnDamage,
                        duration: burnDuration,
                        tick: this.stats.burnTick
                    };
                    
                    // 设置爆炸半径
                    projectile.aoeRadius = explosionRadius;
                    
                    // 添加粒子效果
                    this.addFireParticles(projectile);
                }
            }
        } else {
            // 对每个目标发射投射物
            targets.forEach(target => {
                // 计算方向
                const dx = target.x - owner.x;
                const dy = target.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
                const dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
                
                // 计算速度
                const vx = dirX * speed;
                const vy = dirY * speed;
                
                // 使用对象池生成弹射物
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
                if (projectile) {
                    // 设置状态效果
                    projectile.statusEffect = {
                        type: 'burn',
                        damage: burnDamage,
                        duration: burnDuration,
                        tick: this.stats.burnTick
                    };
                    
                    // 设置爆炸半径
                    projectile.aoeRadius = explosionRadius;
                    
                    // 添加粒子效果
                    this.addFireParticles(projectile);
                }
            });
        }
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        return [];
    }

    /**
     * 获取基础升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 基础升级选项
     */
    getBaseUpgradeOptions(player) {
        return [];
    }
}

/**
 * 闪电武器类
 * 岚刀的进化武器，发射强大的闪电
 */
class Lightning extends StormBladeWeapon {
    /**
     * 静态属性
     */
    static Name = "闪电";
    static Emoji = EMOJI.WEAPON_LIGHTNING;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {StormBladeWeapon} baseWeapon - 基础武器
     */
    constructor(baseWeapon) {
        super();
        
        // 设置属性
        this.name = Lightning.Name;
        this.emoji = Lightning.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = Lightning.MaxLevel;
        this.isEvolved = true;
        
        // 计算属性
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 50,
            cooldown: 0.5,
            chainCount: 8,
            chainDamage: 30,
            chainRange: 200,
            attackCount: 3,
            stunChance: 0.5,
            stunDuration: 1.0
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        return [];
    }

    /**
     * 获取基础升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 基础升级选项
     */
    getBaseUpgradeOptions(player) {
        return [];
    }
}

/**
 * 击掌武器类
 * 握手的进化武器，发射强大的击掌攻击
 */
class HighFive extends HandshakeWeapon {
    /**
     * 静态属性
     */
    static Name = "击掌";
    static Emoji = EMOJI.WEAPON_HIGH_FIVE;
    static MaxLevel = 1;

    /**
     * 构造函数
     * @param {HandshakeWeapon} baseWeapon - 基础武器
     */
    constructor(baseWeapon) {
        super();
        
        // 设置属性
        this.name = HighFive.Name;
        this.emoji = HighFive.Emoji;
        this.level = baseWeapon.maxLevel;
        this.maxLevel = HighFive.MaxLevel;
        this.isEvolved = true;
        
        // 计算属性
        this.calculateStats();
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 40,
            count: 8,
            radius: 120,
            speed: 300,
            cooldown: 0.3,
            duration: 3.0,
            knockback: 20,
            explosionRadius: 80,
            stunChance: 0.3,
            stunDuration: 1.0
        };
    }

    /**
     * 获取升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 升级选项
     */
    getCurrentUpgradeOptions(player) {
        return [];
    }

    /**
     * 获取基础升级选项
     * @param {Player} player - 玩家
     * @returns {Array} 基础升级选项
     */
    getBaseUpgradeOptions(player) {
        return [];
    }
}