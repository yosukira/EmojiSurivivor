/**
 * 火焰匕首武器类
 * 发射燃烧的匕首，可以点燃敌人
 */
class FireDaggerWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "燃烧刀";
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
        super(FireDaggerWeapon.Name, FireDaggerWeapon.Emoji, 1.2, FireDaggerWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15 + (this.level - 1) * 3,
            projectileSpeed: 300 + (this.level - 1) * 15,
            cooldown: Math.max(0.2, this.baseCooldown - (this.level - 1) * 0.1),
            count: 1 + Math.floor((this.level - 1) / 3),
            pierce: 1 + Math.floor(this.level / 3),
            duration: 2.0,
            burnDamage: 3 + (this.level - 1) * 0.5,
            burnDuration: 2.0 + (this.level - 1) * 0.2,
            burnTick: 0.5,
            explosionRadius: 0 + (this.level >= 5 ? 50 : 0)
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
        const burnDamage = this.stats.burnDamage;
        const burnDuration = this.stats.burnDuration * (ownerStats.durationMultiplier || 1);
        const explosionRadius = this.stats.explosionRadius * (ownerStats.areaMultiplier || 1);
        
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
                    tick: 0.5
                };
                
                // 设置爆炸半径
                projectile.aoeRadius = explosionRadius;
                
                // 添加粒子效果
                this.addFireParticles(projectile);
            }
        }
    }

    /**
     * 添加火焰粒子效果
     * @param {Projectile} projectile - 投射物
     */
    addFireParticles(projectile) {
        // 添加更新钩子
        const originalUpdate = projectile.update;
        
        projectile.update = function(dt) {
            // 调用原始更新方法
            originalUpdate.call(this, dt);
            
            // 添加火焰粒子
            if (Math.random() < 0.3) {
                const effect = {
                    x: this.x,
                    y: this.y,
                    size: this.size * 0.4,
                    lifetime: 0.3,
                    timer: 0,
                    isGarbage: false,
                    
                    update: function(dt) {
                        this.timer += dt;
                        if (this.timer >= this.lifetime) {
                            this.isGarbage = true;
                            return;
                        }
                    },
                    
                    draw: function(ctx) {
                        if (this.isGarbage) return;
                        
                        const alpha = 1 - (this.timer / this.lifetime);
                        const screenPos = cameraManager.worldToScreen(this.x, this.y);
                        
                        ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.globalAlpha = alpha;
                        ctx.fillText('🔥', screenPos.x, screenPos.y);
                        ctx.globalAlpha = 1.0;
                    }
                };
                
                visualEffects.push(effect);
            }
        };
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;
        
        if (this.level % 3 === 0) {
            desc += "+1 投射物。";
        } else if (this.level % 3 === 1) {
            desc += "+1 穿透。";
        } else {
            desc += "+伤害/燃烧效果。";
        }
        
        if (this.level === 4) {
            desc += " 获得爆炸效果!";
        }
        
        return desc;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射燃烧的匕首，可以点燃敌人。";
    }
}

/**
 * 岚刀武器类
 * 发射闪电刀刃，可以连锁攻击敌人
 */
class StormBladeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "岚刀";
    static Emoji = EMOJI.WEAPON_STORM_BLADE;
    static MaxLevel = 8;
    static Evolution = {
        requires: "EmptyTome",
        evolvesTo: "Lightning"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(StormBladeWeapon.Name, StormBladeWeapon.Emoji, 2.0, StormBladeWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 25 + (this.level - 1) * 5,
            cooldown: Math.max(0.8, this.baseCooldown - (this.level - 1) * 0.15),
            chainCount: 2 + Math.floor(this.level / 2),
            chainDamage: 15 + (this.level - 1) * 3,
            chainRange: 120 + (this.level - 1) * 10,
            attackCount: 1 + Math.floor(this.level / 4),
            stunChance: 0.1 + (this.level - 1) * 0.05,
            stunDuration: 0.5 + (this.level - 1) * 0.1
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
        const chainCount = this.stats.chainCount + Math.floor((ownerStats.projectileCountBonus || 0) / 2);
        const chainDamage = this.stats.chainDamage;
        const chainRange = this.stats.chainRange * (ownerStats.areaMultiplier || 1);
        const attackCount = this.stats.attackCount;
        const stunChance = this.stats.stunChance;
        const stunDuration = this.stats.stunDuration * (ownerStats.durationMultiplier || 1);
        
        // 执行多次攻击
        for (let attack = 0; attack < attackCount; attack++) {
            // 获取随机敌人
            const target = owner.findRandomEnemy(GAME_WIDTH) || owner.findNearestEnemy(GAME_WIDTH);
            
            // 如果没有目标，跳过
            if (!target) continue;
            
            // 创建闪电链
            this.createLightningChain(owner, target, damage, chainDamage, chainCount, chainRange, stunChance, stunDuration);
            
            // 添加延迟
            if (attack < attackCount - 1) {
                setTimeout(() => {
                    const newTarget = owner.findRandomEnemy(GAME_WIDTH) || owner.findNearestEnemy(GAME_WIDTH);
                    if (newTarget) {
                        this.createLightningChain(owner, newTarget, damage, chainDamage, chainCount, chainRange, stunChance, stunDuration);
                    }
                }, 200 * (attack + 1));
            }
        }
    }

    /**
     * 创建闪电链
     * @param {Player} owner - 拥有者
     * @param {Enemy} target - 目标敌人
     * @param {number} damage - 伤害
     * @param {number} chainDamage - 链式伤害
     * @param {number} chainCount - 链式数量
     * @param {number} chainRange - 链式范围
     * @param {number} stunChance - 眩晕几率
     * @param {number} stunDuration - 眩晕持续时间
     */
    createLightningChain(owner, target, damage, chainDamage, chainCount, chainRange, stunChance, stunDuration) {
        // 已命中的敌人
        const hitEnemies = new Set();
        
        // 造成初始伤害
        target.takeDamage(damage * (owner.getStat('damageMultiplier') || 1), owner);
        hitEnemies.add(target);
        
        // 应用眩晕效果
        if (Math.random() < stunChance) {
            if (!target.statusEffects) {
                target.statusEffects = {};
            }
            
            target.statusEffects.stun = {
                duration: stunDuration,
                source: owner
            };
        }
        
        // 创建闪电效果
        this.createLightningEffect(owner.x, owner.y, target.x, target.y);
        
        // 当前目标
        let currentTarget = target;
        
        // 链式攻击
        for (let i = 0; i < chainCount; i++) {
            // 寻找下一个目标
            const nextTarget = this.findNextChainTarget(currentTarget, chainRange, hitEnemies);
            
            // 如果没有下一个目标，结束链式攻击
            if (!nextTarget) break;
            
            // 造成链式伤害
            nextTarget.takeDamage(chainDamage * (owner.getStat('damageMultiplier') || 1), owner);
            hitEnemies.add(nextTarget);
            
            // 应用眩晕效果
            if (Math.random() < stunChance) {
                if (!nextTarget.statusEffects) {
                    nextTarget.statusEffects = {};
                }
                
                nextTarget.statusEffects.stun = {
                    duration: stunDuration,
                    source: owner
                };
            }
            
            // 创建闪电效果
            this.createLightningEffect(currentTarget.x, currentTarget.y, nextTarget.x, nextTarget.y);
            
            // 更新当前目标
            currentTarget = nextTarget;
        }
    }

    /**
     * 寻找下一个链式目标
     * @param {Enemy} currentTarget - 当前目标
     * @param {number} range - 范围
     * @param {Set} hitEnemies - 已命中的敌人
     * @returns {Enemy} 下一个目标
     */
    findNextChainTarget(currentTarget, range, hitEnemies) {
        // 最近的敌人
        let nearestEnemy = null;
        let minDistSq = range * range;
        
        // 遍历所有敌人
        enemies.forEach(enemy => {
            // 跳过已命中的敌人
            if (hitEnemies.has(enemy) || enemy.isGarbage || !enemy.isActive) return;
            
            // 计算距离
            const dx = enemy.x - currentTarget.x;
            const dy = enemy.y - currentTarget.y;
            const distSq = dx * dx + dy * dy;
            
            // 如果在范围内且更近，更新最近的敌人
            if (distSq < minDistSq) {
                minDistSq = distSq;
                nearestEnemy = enemy;
            }
        });
        
        return nearestEnemy;
    }

    /**
     * 创建闪电效果
     * @param {number} x1 - 起点X坐标
     * @param {number} y1 - 起点Y坐标
     * @param {number} x2 - 终点X坐标
     * @param {number} y2 - 终点Y坐标
     */
    createLightningEffect(x1, y1, x2, y2) {
        // 计算距离
        const dx = x2 - x1;
        const dy = y2 - y1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 计算段数
        const segments = Math.max(3, Math.floor(dist / 30));
        
        // 计算每段长度
        const segmentLength = dist / segments;
        
        // 计算方向
        const dirX = dx / dist;
        const dirY = dy / dist;
        
        // 创建闪电点
        const points = [];
        points.push({ x: x1, y: y1 });
        
        // 生成中间点
        for (let i = 1; i < segments; i++) {
            // 计算基准点
            const baseX = x1 + dirX * segmentLength * i;
            const baseY = y1 + dirY * segmentLength * i;
            
            // 添加随机偏移
            const perpX = -dirY;
            const perpY = dirX;
            const offset = (Math.random() - 0.5) * segmentLength * 0.8;
            
            // 添加点
            points.push({
                x: baseX + perpX * offset,
                y: baseY + perpY * offset
            });
        }
        
        // 添加终点
        points.push({ x: x2, y: y2 });
        
        // 创建闪电效果
        const effect = {
            points: points,
            width: 3,
            lifetime: 0.3,
            timer: 0,
            isGarbage: false,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const alpha = 1 - (this.timer / this.lifetime);
                
                // 绘制闪电
                ctx.strokeStyle = `rgba(100, 180, 255, ${alpha})`;
                ctx.lineWidth = this.width;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                
                ctx.beginPath();
                
                // 移动到第一个点
                const firstScreenPos = cameraManager.worldToScreen(this.points[0].x, this.points[0].y);
                ctx.moveTo(firstScreenPos.x, firstScreenPos.y);
                
                // 连接所有点
                for (let i = 1; i < this.points.length; i++) {
                    const screenPos = cameraManager.worldToScreen(this.points[i].x, this.points[i].y);
                    ctx.lineTo(screenPos.x, screenPos.y);
                }
                
                ctx.stroke();
                
                // 绘制发光效果
                ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.7})`;
                ctx.lineWidth = this.width * 0.5;
                ctx.stroke();
            }
        };
        
        visualEffects.push(effect);
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;
        
        if (this.level % 2 === 0) {
            desc += "+1 链式攻击。";
        } else if (this.level % 4 === 3) {
            desc += "+1 攻击次数。";
        } else {
            desc += "+伤害/范围。";
        }
        
        return desc;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射闪电刀刃，可以连锁攻击敌人。";
    }
}

/**
 * 握手武器类
 * 发射握手攻击，可以击退敌人
 */
class HandshakeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "握手";
    static Emoji = EMOJI.WEAPON_HANDSHAKE;
    static MaxLevel = 8;
    static Evolution = {
        requires: "Wings",
        evolvesTo: "HighFive"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(HandshakeWeapon.Name, HandshakeWeapon.Emoji, 1.5, HandshakeWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 20 + (this.level - 1) * 4,
            count: 2 + Math.floor(this.level / 2),
            radius: 60 + (this.level - 1) * 10,
            speed: 200 + (this.level - 1) * 15,
            cooldown: Math.max(0.5, this.baseCooldown - (this.level - 1) * 0.1),
            duration: 3.0,
            knockback: 10 + (this.level - 1) * 2,
            explosionRadius: 40 + (this.level - 1) * 5,
            stunChance: 0.1 + (this.level - 1) * 0.03
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
        const radius = this.stats.radius * (ownerStats.areaMultiplier || 1);
        const speed = this.stats.speed * (ownerStats.projectileSpeedMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const knockback = this.stats.knockback;
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);
        
        // 计算角度间隔
        const angleStep = Math.PI * 2 / count;
        
        // 发射多个握手
        for (let i = 0; i < count; i++) {
            // 计算角度
            const angle = i * angleStep + gameTime % (Math.PI * 2);
            
            // 计算位置
            const x = owner.x + Math.cos(angle) * radius;
            const y = owner.y + Math.sin(angle) * radius;
            
            // 计算速度
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            // 使用对象池生成弹射物
            const projectile = spawnProjectile(
                x, 
                y, 
                EMOJI.PROJECTILE_HANDSHAKE, 
                size, 
                vx, 
                vy, 
                damage, 
                1, // 只能命中一个敌人
                duration, 
                ownerStats
            );
            
            // 添加击退和爆炸效果
            if (projectile) {
                projectile.knockback = knockback;
                projectile.explosionRadius = this.stats.explosionRadius * (ownerStats.areaMultiplier || 1);
                
                // 重写命中处理
                const originalOnHit = projectile.onHitEnemy || function() {};
                
                projectile.onHitEnemy = function(enemy) {
                    // 调用原始命中处理
                    originalOnHit.call(this, enemy);
                    
                    // 应用击退效果
                    if (!enemy.isGarbage && enemy.isActive) {
                        // 计算击退方向和距离
                        const knockbackX = this.vx / Math.sqrt(this.vx * this.vx + this.vy * this.vy) * this.knockback;
                        const knockbackY = this.vy / Math.sqrt(this.vx * this.vx + this.vy * this.vy) * this.knockback;
                        
                        // 应用击退
                        enemy.x += knockbackX;
                        enemy.y += knockbackY;
                        
                        // 添加眩晕效果
                        if (Math.random() < owner.weapon.stats.stunChance) {
                            if (!enemy.statusEffects) {
                                enemy.statusEffects = {};
                            }
                            
                            enemy.statusEffects.stun = {
                                duration: 0.5,
                                source: owner
                            };
                        }
                    }
                    
                    // 创建爆炸效果
                    this.onDestroy();
                    
                    // 标记为垃圾
                    this.isGarbage = true;
                    this.isActive = false;
                };
                
                // 重写销毁处理
                projectile.onDestroy = function() {
                    // 创建爆炸效果
                    const explosionRadius = this.explosionRadius;
                    const explosionDamage = this.damage * 0.8;
                    
                    // 对范围内的敌人造成伤害
                    enemies.forEach(enemy => {
                        if (enemy.isGarbage || !enemy.isActive) return;
                        
                        const dx = enemy.x - this.x;
                        const dy = enemy.y - this.y;
                        const distSq = dx * dx + dy * dy;
                        
                        if (distSq <= explosionRadius * explosionRadius) {
                            // 计算伤害衰减
                            const dist = Math.sqrt(distSq);
                            const damageFactor = 1 - (dist / explosionRadius);
                            const actualDamage = explosionDamage * damageFactor;
                            
                            // 造成伤害
                            enemy.takeDamage(actualDamage, player);
                            
                            // 应用击退效果
                            const knockbackFactor = this.knockback * 0.5 * damageFactor;
                            const knockbackX = dx / dist * knockbackFactor;
                            const knockbackY = dy / dist * knockbackFactor;
                            
                            // 应用击退
                            enemy.x += knockbackX;
                            enemy.y += knockbackY;
                        }
                    });
                    
                    // 创建爆炸视觉效果
                    const effect = {
                        x: this.x,
                        y: this.y,
                        radius: 0,
                        maxRadius: explosionRadius,
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
                            
                            const alpha = 0.5 - (this.timer / this.lifetime) * 0.5;
                            const screenPos = cameraManager.worldToScreen(this.x, this.y);
                            
                            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                            ctx.beginPath();
                            ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                            ctx.fill();
                        }
                    };
                    
                    visualEffects.push(effect);
                };
                
                // 添加旋转效果
                projectile.rotation = 0;
                projectile.rotationSpeed = (Math.random() * 2 - 1) * Math.PI * 4; // 更快的旋转速度
                
                // 重写绘制方法
                const originalDraw = projectile.draw;
                
                projectile.draw = function(ctx) {
                    if (this.isGarbage || !this.isActive) return;
                    
                    // 获取屏幕坐标
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    
                    // 保存上下文
                    ctx.save();
                    
                    // 平移到投射物位置
                    ctx.translate(screenPos.x, screenPos.y);
                    
                    // 旋转
                    ctx.rotate(this.rotation);
                    
                    // 绘制投射物
                    ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(this.emoji, 0, 0);
                    
                    // 恢复上下文
                    ctx.restore();
                };
                
                // 重写更新方法
                const originalUpdate = projectile.update;
                
                projectile.update = function(dt) {
                    // 调用原始更新方法
                    originalUpdate.call(this, dt);
                    
                    // 更新旋转
                    this.rotation += this.rotationSpeed * dt;
                };
            }
        }
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;
        
        if (this.level % 2 === 1) {
            desc += "+1 握手。";
        } else {
            desc += "+伤害/击退。";
        }
        
        return desc;
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return "发射握手攻击，可以击退敌人。";
    }
}