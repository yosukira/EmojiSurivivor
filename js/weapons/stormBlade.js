/**
 * 岚刀武器类
 * 发射带有闪电链效果的刀刃
 */
class StormBladeWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "岚刀";
    static Emoji = EMOJI.WEAPON_STORM_BLADE;
    static MaxLevel = 8;
    static Evolution = {
        requires: "Wings",
        evolvesTo: "Lightning"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(StormBladeWeapon.Name, StormBladeWeapon.Emoji, 1.3, StormBladeWeapon.MaxLevel);
        this.lightningChains = [];
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15 + (this.level - 1) * 3,
            projectileSpeed: 380 + (this.level - 1) * 15,
            cooldown: Math.max(0.3, this.baseCooldown - (this.level - 1) * 0.1),
            count: 1 + Math.floor((this.level - 1) / 3),
            pierce: 2 + Math.floor(this.level / 4),
            duration: 1.2,
            chainCount: 1 + Math.floor(this.level / 2),
            chainDamage: 8 + (this.level - 1) * 2,
            chainRange: 120 + (this.level - 1) * 10,
            stunChance: 0.1 + (this.level - 1) * 0.05,
            stunDuration: 0.5
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        // 获取拥有者属性
        const ownerStats = this.getOwnerStats(owner);

        // 计算投射物数量
        const count = this.stats.count + (ownerStats.projectileCountBonus || 0);

        // 计算投射物速度
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);

        // 获取伤害和穿透
        const damage = this.stats.damage;
        const pierce = this.stats.pierce;

        // 计算持续时间
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);

        // 计算大小
        const size = GAME_FONT_SIZE * (ownerStats.areaMultiplier || 1);

        // 寻找目标
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
        const angleStep = count > 1 ? (Math.PI / 10) : 0;
        const startAngle = Math.atan2(dirY, dirX) - (angleStep * (count - 1) / 2);

        // 发射投射物
        for (let i = 0; i < count; i++) {
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;

            // 使用对象池生成投射物
            const projectile = spawnProjectile(
                owner.x,
                owner.y,
                EMOJI.PROJECTILE_LIGHTNING,
                size,
                vx,
                vy,
                damage,
                pierce,
                duration,
                ownerStats
            );

            // 添加闪电链效果
            const self = this;

            // 重写命中敌人处理
            const originalOnHitEnemy = projectile.onHitEnemy;
            projectile.onHitEnemy = function(enemy) {
                // 调用原始命中处理
                if (originalOnHitEnemy) {
                    originalOnHitEnemy.call(this, enemy);
                }

                // 创建闪电链
                self.createLightningChain(this.x, this.y, enemy, owner, ownerStats);

                // 有几率眩晕敌人
                if (Math.random() < self.stats.stunChance) {
                    enemy.statusEffects.stun = {
                        duration: self.stats.stunDuration * (ownerStats.durationMultiplier || 1),
                        source: owner
                    };
                }
            };
        }
    }

    /**
     * 创建闪电链
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Enemy} sourceEnemy - 源敌人
     * @param {Player} owner - 拥有者
     * @param {Object} ownerStats - 拥有者属性
     */
    createLightningChain(x, y, sourceEnemy, owner, ownerStats) {
        // 获取闪电链属性
        const chainCount = this.stats.chainCount;
        const chainDamage = this.stats.chainDamage * (ownerStats.damageMultiplier || 1);
        const chainRange = this.stats.chainRange * (ownerStats.areaMultiplier || 1);

        // 已命中的敌人
        const hitEnemies = new Set([sourceEnemy]);

        // 当前源敌人
        let currentSource = sourceEnemy;

        // 创建闪电链
        for (let i = 0; i < chainCount; i++) {
            // 寻找范围内未命中的敌人
            const nearbyEnemies = enemies.filter(enemy => {
                if (enemy.isGarbage || !enemy.isActive || hitEnemies.has(enemy)) return false;

                const dx = enemy.x - currentSource.x;
                const dy = enemy.y - currentSource.y;
                const distSq = dx * dx + dy * dy;

                return distSq <= chainRange * chainRange;
            });

            // 如果没有可用敌人，结束链
            if (nearbyEnemies.length === 0) break;

            // 随机选择一个敌人
            const targetEnemy = nearbyEnemies[Math.floor(Math.random() * nearbyEnemies.length)];

            // 造成伤害
            targetEnemy.takeDamage(chainDamage, owner);

            // 有几率眩晕敌人
            if (Math.random() < this.stats.stunChance) {
                targetEnemy.statusEffects.stun = {
                    duration: this.stats.stunDuration * (ownerStats.durationMultiplier || 1),
                    source: owner
                };
            }

            // 创建闪电视觉效果
            this.createLightningEffect(currentSource.x, currentSource.y, targetEnemy.x, targetEnemy.y);

            // 添加到已命中列表
            hitEnemies.add(targetEnemy);

            // 更新当前源敌人
            currentSource = targetEnemy;
        }
    }

    /**
     * 创建闪电视觉效果
     * @param {number} x1 - 起点X坐标
     * @param {number} y1 - 起点Y坐标
     * @param {number} x2 - 终点X坐标
     * @param {number} y2 - 终点Y坐标
     */
    createLightningEffect(x1, y1, x2, y2) {
        // 创建闪电效果
        const lightning = {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            lifetime: 0.3,
            timer: 0,
            segments: this.generateLightningSegments(x1, y1, x2, y2),
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

                ctx.strokeStyle = `rgba(100, 180, 255, ${alpha})`;
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
                ctx.beginPath();
                ctx.moveTo(this.segments[0].x, this.segments[0].y);

                for (let i = 1; i < this.segments.length; i++) {
                    ctx.lineTo(this.segments[i].x, this.segments[i].y);
                }
                ctx.stroke();

                // 绘制发光效果
                ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.7})`;
                ctx.lineWidth = 4;
                ctx.stroke();
            }
        };

        // 添加到闪电链列表
        this.lightningChains.push(lightning);
    }

    /**
     * 生成闪电线段
     * @param {number} x1 - 起点X坐标
     * @param {number} y1 - 起点Y坐标
     * @param {number} x2 - 终点X坐标
     * @param {number} y2 - 终点Y坐标
     * @returns {Array} 线段数组
     */
    generateLightningSegments(x1, y1, x2, y2) {
        const segments = [];
        const segmentCount = 8;

        segments.push({ x: x1, y: y1 });

        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);

        for (let i = 1; i < segmentCount; i++) {
            const ratio = i / segmentCount;
            const x = x1 + dx * ratio;
            const y = y1 + dy * ratio;

            // 添加随机偏移
            const offset = (1 - ratio) * length * 0.15;
            const offsetX = (Math.random() - 0.5) * offset;
            const offsetY = (Math.random() - 0.5) * offset;

            segments.push({ x: x + offsetX, y: y + offsetY });
        }

        segments.push({ x: x2, y: y2 });

        return segments;
    }

    /**
     * 更新武器状态
     * @param {number} dt - 时间增量
     * @param {Player} owner - 拥有者
     */
    update(dt, owner) {
        // 调用父类更新方法
        super.update(dt, owner);

        // 更新闪电链
        this.lightningChains = this.lightningChains.filter(lightning => {
            lightning.update(dt);
            return !lightning.isGarbage;
        });
    }

    /**
     * 绘制特效
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawEffects(ctx) {
        // 绘制闪电链
        this.lightningChains.forEach(lightning => lightning.draw(ctx));
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        let desc = `Lv${this.level + 1}: `;

        if (this.level % 3 === 0) {
            desc += "+1 投射物。";
        } else if (this.level % 2 === 1) {
            desc += "+1 闪电链。";
        } else if (this.level % 4 === 0) {
            desc += "+1 穿透。";
        } else {
            desc += "+伤害/范围。";
        }

        return desc + ` (冷却: ${Math.max(0.3, this.baseCooldown - this.level * 0.1).toFixed(2)}s)`;
    }
    
    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `发射闪电刀刃，可以在敌人之间形成闪电链。`;
    }
}