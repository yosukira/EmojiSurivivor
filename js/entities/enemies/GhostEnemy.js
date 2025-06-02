/**
 * GhostEnemy类 - 幽灵敌人实现
 * 从enemy.js中提取的GhostEnemy类
 */

/**
 * 幽灵敌人实体 (由舍利子回魂召唤)
 * 不会伤害玩家，会自动攻击其他敌人
 */
class GhostEnemy extends Character {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {Player} owner - 召唤者 (玩家)
     * @param {number} damage - 幽灵造成的伤害
     * @param {number} duration - 幽灵持续时间
     * @param {number} speed - 幽灵移动速度
     * @param {Object} effects - 额外效果 (例如减速)
     */
    constructor(x, y, owner, damage, duration, speed = 150, effects = {}) {
        super(x, y, '👻', GAME_FONT_SIZE * 0.9, { health: 1, speed: speed, damage: damage, xp: 0 });
        this.owner = owner;
        this.lifetime = 0;
        this.maxLifetime = duration;
        this.targetEnemy = null;
        this.attackCooldown = 0;
        this.attackInterval = 0.8;
        this.attackRangeSq = 50 * 50;
        this.searchRangeSq = 300 * 300;
        this.effects = effects;

        console.log(`[GhostEnemy] Constructed. Pos: (${x}, ${y}), Dmg: ${damage}, Dur: ${duration}. Initial activeGhosts.length: ${typeof activeGhosts !== 'undefined' ? activeGhosts.length : 'undefined'}`);
    }

    /**
     * 更新幽灵状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        if (this.isGarbage || !this.isActive) return;

        this.lifetime += dt;
        if (this.lifetime >= this.maxLifetime) {
            this.destroy();
            return;
        }

        if (this.attackCooldown > 0) {
            this.attackCooldown -= dt;
        }

        if (!this.targetEnemy || this.targetEnemy.isGarbage || !this.targetEnemy.isActive) {
            this.findTargetEnemy();
        }

        if (this.targetEnemy) {
            const dx = this.targetEnemy.x - this.x;
            const dy = this.targetEnemy.y - this.y;
            const distSq = dx * dx + dy * dy;

            if (distSq > this.attackRangeSq) {
                const dist = Math.sqrt(distSq);
                const moveX = (dx / dist) * this.stats.speed * dt;
                const moveY = (dy / dist) * this.stats.speed * dt;
                this.x += moveX;
                this.y += moveY;
            } else if (this.attackCooldown <= 0) {
                this.attack(this.targetEnemy);
                this.attackCooldown = this.attackInterval;
            }
        }
    }

    /**
     * 寻找目标敌人
     */
    findTargetEnemy() {
        let closestEnemy = null;
        let minDistanceSq = this.searchRangeSq;

        enemies.forEach(enemy => {
            // 跳过自身、其他幽灵或已死亡的敌人
            if (enemy === this || enemy.isGarbage || !enemy.isActive || enemy instanceof GhostEnemy) {
                return;
            }

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });

        this.targetEnemy = closestEnemy;
    }

    /**
     * 攻击目标
     * @param {Character} target - 目标敌人
     */
    attack(target) {
        // 对目标造成伤害
        target.takeDamage(this.stats.damage, this.owner); // 伤害来源算玩家

        // 应用效果 (例如减速)
        if (this.effects.slow && target.applyStatusEffect) {
            target.applyStatusEffect('slow', {
                factor: this.effects.slow.factor,
                duration: this.effects.slow.duration,
                source: this.owner // 效果来源算玩家
            });
        }

        // 创建攻击视觉效果
        const hitEffect = {
            x: target.x, 
            y: target.y, 
            radius: target.size * 0.5, 
            maxRadius: target.size * 0.7, 
            lifetime: 0.2, 
            timer: 0, 
            isGarbage: false,
            
            update: function(dt) { 
                this.timer += dt; 
                if (this.timer >= this.lifetime) this.isGarbage = true; 
                this.radius = this.maxRadius * (this.timer/this.lifetime); 
            },
            
            draw: function(ctx) { 
                if (this.isGarbage) return; 
                const screenPos = cameraManager.worldToScreen(this.x, this.y); 
                const alpha = 0.6 - (this.timer/this.lifetime)*0.6; 
                ctx.fillStyle = `rgba(180, 180, 255, ${alpha})`; 
                ctx.beginPath(); 
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI*2); 
                ctx.fill(); 
            }
        };
        visualEffects.push(hitEffect);
    }

    /**
     * 绘制幽灵
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;

        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        // 增加基础透明度，并让淡出效果不那么剧烈
        const baseAlpha = 0.9; // 从 0.8 提升到 0.9
        const fadeFactor = Math.max(0.2, 1 - (this.lifetime / this.maxLifetime) * 0.8); // 淡出到 0.2 而不是 0
        const alpha = baseAlpha * fadeFactor;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 添加外发光效果
        ctx.shadowColor = 'yellow'; // 外发光颜色改为 yellow
        ctx.shadowBlur = 20; // 增加外发光模糊半径到 20

        ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        ctx.restore();
    }

    /**
     * 销毁幽灵
     */
    destroy() {
        this.isGarbage = true;
        this.isActive = false;
        // 从 activeGhosts 数组中移除自身
        if (typeof activeGhosts !== 'undefined') {
            const index = activeGhosts.indexOf(this);
            if (index > -1) {
                activeGhosts.splice(index, 1);
            }
        }
    }
} 