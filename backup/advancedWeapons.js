/**
 * 火焰匕首武器类
 * 发射火焰匕首攻击敌人，造成燃烧效果
 */
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

/**
 * 燃烧刀投射物类
 * 燃烧刀的投射物
 */
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

/**
 * 岚刀武器类
 * 发射岚刀攻击敌人，可以连续切割
 */
class StormBladeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "岚刀";
    static Emoji = "⚡";
    static MaxLevel = 10;
    static Evolution = {
        requires: "Wings",
        evolvesTo: "ThunderSword"
    };

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

/**
 * 岚刀投射物类
 * 岚刀的投射物
 */
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
                enemy.takeDamage(this.damage, player);
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

/**
 * 握握手武器类
 * 发射握手攻击敌人，造成眩晕效果
 */
class HandshakeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "握握手";
    static Emoji = "🤝";
    static MaxLevel = 10;
    static Evolution = {
        requires: "Spinach",
        evolvesTo: "DeathGrip"
    };

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
        // 获取目标敌人列表
        const targets = [];
        for (let i = 0; i < count; i++) {
            // 寻找随机敌人
            const target = owner.findRandomEnemy(GAME_WIDTH * 1.5);
            // 如果找到目标，添加到目标列表
            if (target) {
                targets.push(target);
            } else {
                // 如果没有找到目标，创建一个随机方向
                const angle = Math.random() * Math.PI * 2;
                const distance = 200 + Math.random() * 100;
                targets.push({
                    x: owner.x + Math.cos(angle) * distance,
                    y: owner.y + Math.sin(angle) * distance
                });
            }
        }
        // 为每个目标创建握手投射物
        targets.forEach(target => {
            // 计算方向
            const dx = target.x - owner.x;
            const dy = target.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const dirX = dist > 0 ? dx / dist : Math.cos(Math.random() * Math.PI * 2);
            const dirY = dist > 0 ? dy / dist : Math.sin(Math.random() * Math.PI * 2);
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
            // 添加到投射物列表
            projectiles.push(projectile);
        });
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
        return "发射握手攻击敌人，造成范围伤害和眩晕效果。";
    }
}

/**
 * 握手投射物类
 * 握手的投射物
 */
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
                enemy.takeDamage(this.damage, player);
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
                source: player
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

// 全局基础武器列表 (This is the one that should exist at the END)
// 此列表在所有基础和高级武器类定义之后创建
// const BASE_WEAPONS = []; // 删除这行，我们不应该重复声明BASE_WEAPONS

// 从 basicWeapons.js 添加武器 (假设这些类已通过 <script> 加载并在全局作用域中)
// 注意：这些武器应该已经通过basicWeapons.js添加，不需要重复添加
// if (typeof DaggerWeapon === 'function') BASE_WEAPONS.push(DaggerWeapon);
// if (typeof GarlicWeapon === 'function') BASE_WEAPONS.push(GarlicWeapon);
// if (typeof WhipWeapon === 'function') BASE_WEAPONS.push(WhipWeapon);

// 从 advancedWeapons.js 添加此文件中定义的非进化基础武器
// (确保只添加玩家可以直接选择获取的初始形态武器，而非进化形态)
if (typeof BASE_WEAPONS !== 'undefined') {
    // 确保BASE_WEAPONS已存在
    if (typeof FireBladeWeapon === 'function' && FireBladeWeapon.isEvolution === undefined) {
        BASE_WEAPONS.push(FireBladeWeapon); // 添加火刀
    }
    if (typeof StormBladeWeapon === 'function' && StormBladeWeapon.isEvolution === undefined) {
        BASE_WEAPONS.push(StormBladeWeapon); // 添加风暴刃
    }
    if (typeof HandshakeWeapon === 'function' && HandshakeWeapon.isEvolution === undefined) {
        BASE_WEAPONS.push(HandshakeWeapon); // 添加握手
    }
    // ... 为 advancedWeapons.js 中其他基础可选武器添加类似的行 ...

    console.log('Advanced weapons added to BASE_WEAPONS:', 
        BASE_WEAPONS.filter(w => w !== DaggerWeapon && w !== GarlicWeapon && w !== WhipWeapon)
            .map(w => w.name));
} else {
    console.error('BASE_WEAPONS not found! Make sure basicWeapons.js is loaded before advancedWeapons.js');
}
