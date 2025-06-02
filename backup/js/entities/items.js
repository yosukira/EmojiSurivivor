/**
 * 游戏物品类
 * 包括经验宝石、拾取物和宝箱
 */

/**
 * 经验宝石类
 * 玩家可以收集经验宝石来升级
 */
class ExperienceGem extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} value - 经验值
     */
    constructor(x, y, value) {
        super(x, y, EMOJI.XP_GEM, GAME_FONT_SIZE * 0.7);
        this.value = value;
        this.attractionSpeed = 450;
        this.baseAttractionSpeed = this.attractionSpeed;
        this.magnetized = false; // 是否被吸铁石吸引
    }

    /**
     * 更新经验宝石状态
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标玩家
     */
    update(dt, target) {
        if (this.isGarbage || !this.isActive) return;
        
        // 检查是否被吸铁石吸引
        if (target.canMagnetizeAll && !this.magnetized) {
            this.magnetized = true;
            this.attractionSpeed = this.baseAttractionSpeed * 5; // 吸铁石效果：5倍吸引速度
        }
        
        // 计算与玩家的距离
        const pickupRadiusSq = target.pickupRadiusSq;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        // 如果在吸引范围内，向玩家移动
        if ((distSq < pickupRadiusSq && distSq > 1) || this.magnetized) {
            const dist = Math.sqrt(distSq);
            const speedMultiplier = 1 + (pickupRadiusSq - distSq) / pickupRadiusSq * 2.5;
            
            this.x += (dx / dist) * this.attractionSpeed * speedMultiplier * dt;
            this.y += (dy / dist) * this.attractionSpeed * speedMultiplier * dt;
        }
        
        // 如果碰到玩家，给予经验并销毁
        if (this.checkCollision(target)) {
            target.gainXP(this.value);
            // 显示经验获得数字
            calculateAndShowDamage(target, this.value, null, 'xp');
            this.isGarbage = true;
            this.isActive = false;
        }
    }
}

/**
 * 拾取物类
 * 玩家可以拾取各种物品获得效果
 */
class Pickup extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {string} type - 类型
     * @param {number} value - 值
     */
    constructor(x, y, emoji, type, value) {
        super(x, y, emoji, GAME_FONT_SIZE);
        this.type = type;
        this.value = value;
        this.lifetime = 12; // 12秒后消失
        this.attractionSpeed = 350;
    }

    /**
     * 更新拾取物状态
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标玩家
     */
    update(dt, target) {
        if (this.isGarbage || !this.isActive) return;
        
        // 更新生命周期
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        
        // 计算与玩家的距离
        const pickupRadiusSq = target.pickupRadiusSq;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        // 如果在吸引范围内，向玩家移动
        if (distSq < pickupRadiusSq && distSq > 1) {
            const dist = Math.sqrt(distSq);
            this.x += (dx / dist) * this.attractionSpeed * dt;
            this.y += (dy / dist) * this.attractionSpeed * dt;
        }
        
        // 如果碰到玩家，应用效果并销毁
        if (this.checkCollision(target)) {
            this.applyEffect(target);
            this.isGarbage = true;
            this.isActive = false;
        }
    }

    /**
     * 应用拾取效果
     * @param {Player} target - 目标玩家
     */
    applyEffect(target) {
        switch (this.type) {
            case 'heal':
                // 恢复生命值 - 新的heal方法会自动显示治疗数字
                target.heal(this.value);
                break;
                
            case 'magnetize':
                // 吸引所有经验宝石
                target.canMagnetizeAll = true;
                // 创建吸铁石特效
                createMagnetEffect(target.x, target.y);
                break;
                
            default:
                console.warn(`未知的拾取类型: ${this.type}`);
                break;
        }
    }

    /**
     * 绘制拾取物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        super.draw(ctx);
        
        // 如果剩余时间少于3秒，闪烁提示
        if (this.lifetime < 3) {
            const alpha = 0.7 * Math.sin(this.lifetime * 10) + 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.6, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * 宝箱类
 * Boss掉落的宝箱，可以获得大量经验
 */
class Chest extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    constructor(x, y) {
        super(x, y, EMOJI.CHEST, GAME_FONT_SIZE * 1.8);
        this.lifetime = 45; // 45秒后消失
        this.collected = false;
        this.glowTimer = 0;
    }

    /**
     * 更新宝箱状态
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标玩家
     */
    update(dt, target) {
        if (this.isGarbage || !this.isActive || this.collected) return;
        
        // 更新生命周期
        this.lifetime -= dt;
        if (this.lifetime <= 0) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        
        // 更新发光效果计时器
        this.glowTimer += dt;
        
        // 如果碰到玩家，打开宝箱并销毁
        if (this.checkCollision(target)) {
            this.open(target);
            this.collected = true;
            this.isGarbage = true;
            this.isActive = false;
        }
    }

    /**
     * 打开宝箱
     * @param {Player} player - 玩家对象
     */
    open(player) {
        console.log("宝箱已开启!");
        
        // 给予大量经验
        const xpAmount = player.xpToNextLevel * 1.5;
        player.gainXP(xpAmount);
        
        // 创建开箱特效
        createExplosionEffect(this.x, this.y, 120, 'rgba(255, 215, 0, 0.6)');
    }

    /**
     * 绘制宝箱
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        super.draw(ctx);
        
        // 绘制发光效果
        const glowSize = this.size * (1.1 + 0.1 * Math.sin(this.glowTimer * 3));
        const gradient = ctx.createRadialGradient(
            this.x, this.y, this.size * 0.5,
            this.x, this.y, glowSize
        );
        
        gradient.addColorStop(0, 'rgba(255, 215, 0, 0.0)');
        gradient.addColorStop(0.5, 'rgba(255, 215, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 215, 0, 0.0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, glowSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

/**
 * 创建吸铁石特效
 * @param {number} x - X坐标
 * @param {number} y - Y坐标
 */
function createMagnetEffect(x, y) {
    // 创建波纹特效
    for (let i = 0; i < 3; i++) {
        setTimeout(() => {
            const effect = {
                x: x,
                y: y,
                radius: 0,
                maxRadius: 200,
                color: 'rgba(0, 100, 255, 0.5)',
                lifetime: 0.8,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                    }
                    
                    this.radius = (this.timer / this.lifetime) * this.maxRadius;
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const alpha = 1 - (this.timer / this.lifetime);
                    
                    ctx.strokeStyle = this.color.replace(')', `, ${alpha})`).replace('rgba', 'rgba');
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
            };
            
            visualEffects.push(effect);
        }, i * 200); // 每200毫秒创建一个波纹
    }
}