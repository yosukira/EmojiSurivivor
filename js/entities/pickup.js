/**
 * 经验宝石类
 * 玩家可以收集的经验值
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
        
        // 经验值
        this.value = value;
        
        // 吸引速度
        this.attractionSpeed = 450;
    }

    /**
     * 更新经验宝石状态
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标玩家
     */
    update(dt, target) {
        // 如果经验宝石不活动或已标记为垃圾，不更新
        if (this.isGarbage || !this.isActive) return;
        
        // 计算到目标的距离
        const pickupRadiusSq = target.pickupRadiusSq;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        // 如果在吸引范围内，移动向目标
        if (distSq < pickupRadiusSq && distSq > 1) {
            const dist = Math.sqrt(distSq);
            
            // 计算吸引力
            const speedMultiplier = 1 + (pickupRadiusSq - distSq) / pickupRadiusSq * 2.5;
            
            // 更新位置
            this.x += (dx / dist) * this.attractionSpeed * speedMultiplier * dt;
            this.y += (dy / dist) * this.attractionSpeed * speedMultiplier * dt;
        }
        
        // 检查是否被收集
        if (this.checkCollision(target)) {
            target.gainXP(this.value);
            this.isGarbage = true;
            this.isActive = false;
        }
    }

    /**
     * 重置经验宝石状态
     */
    reset() {
        // 调用父类重置方法
        super.reset();
    }
}

/**
 * 拾取物类
 * 玩家可以收集的物品
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
        
        // 类型和值
        this.type = type;
        this.value = value;
        
        // 生命周期
        this.lifetime = 12;
        
        // 吸引速度
        this.attractionSpeed = 350;
    }

    /**
     * 更新拾取物状态
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标玩家
     */
    update(dt, target) {
        // 如果拾取物不活动或已标记为垃圾，不更新
        if (this.isGarbage || !this.isActive) return;
        
        // 更新生命周期
        this.lifetime -= dt;
        
        // 检查是否过期
        if (this.lifetime <= 0) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        
        // 计算到目标的距离
        const pickupRadiusSq = target.pickupRadiusSq;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distSq = dx * dx + dy * dy;
        
        // 如果在吸引范围内，移动向目标
        if (distSq < pickupRadiusSq && distSq > 1) {
            const dist = Math.sqrt(distSq);
            
            // 更新位置
            this.x += (dx / dist) * this.attractionSpeed * dt;
            this.y += (dy / dist) * this.attractionSpeed * dt;
        }
        
        // 检查是否被收集
        if (this.checkCollision(target)) {
            this.applyEffect(target);
            this.isGarbage = true;
            this.isActive = false;
        }
    }

    /**
     * 应用效果
     * @param {Player} target - 目标玩家
     */
    applyEffect(target) {
        switch (this.type) {
            case 'heal':
                // 恢复生命
                target.heal(this.value);
                
                // 创建治疗特效
                this.createHealEffect(target);
                break;
                
            case 'magnet':
                // 吸引所有经验宝石
                this.magnetizeAllXP();
                break;
                
            default:
                console.warn(`未知拾取物类型: ${this.type}`);
                break;
        }
    }

    /**
     * 创建治疗特效
     * @param {Player} target - 目标玩家
     */
    createHealEffect(target) {
        // 创建治疗数字
        spawnDamageNumber(target.x, target.y - target.size / 2, `+${this.value}`, 20, 'green', 0.8);
        
        // 创建治疗粒子
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * target.size / 2;
            
            const effect = {
                x: target.x + Math.cos(angle) * distance,
                y: target.y + Math.sin(angle) * distance,
                vx: Math.cos(angle) * 30,
                vy: Math.sin(angle) * 30,
                size: GAME_FONT_SIZE * 0.4,
                lifetime: 0.8,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                    
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const alpha = 1 - (this.timer / this.lifetime);
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    
                    ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            };
            
            visualEffects.push(effect);
        }
    }

    /**
     * 吸引所有经验宝石
     */
    magnetizeAllXP() {
        // 创建磁铁特效
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: 300,
            lifetime: 0.5,
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
                
                ctx.strokeStyle = `rgba(0, 100, 255, ${alpha})`;
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        };
        
        visualEffects.push(effect);
        
        // 将所有经验宝石移动到玩家位置
        xpGems.forEach(gem => {
            if (!gem.isGarbage && gem.isActive) {
                // 设置宝石位置为玩家位置
                gem.x = player.x;
                gem.y = player.y;
            }
        });
    }

    /**
     * 重置拾取物状态
     */
    reset() {
        // 调用父类重置方法
        super.reset();
        
        // 重置拾取物特有属性
        this.lifetime = 12;
    }
}

/**
 * 宝箱类
 * 玩家可以打开的宝箱
 */
class Chest extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    constructor(x, y) {
        super(x, y, EMOJI.CHEST, GAME_FONT_SIZE * 1.8);
        
        // 生命周期
        this.lifetime = 45;
        
        // 是否已收集
        this.collected = false;
    }

    /**
     * 更新宝箱状态
     * @param {number} dt - 时间增量
     * @param {Player} target - 目标玩家
     */
    update(dt, target) {
        // 如果宝箱不活动、已标记为垃圾或已收集，不更新
        if (this.isGarbage || !this.isActive || this.collected) return;
        
        // 更新生命周期
        this.lifetime -= dt;
        
        // 检查是否过期
        if (this.lifetime <= 0) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        
        // 检查是否被收集
        if (this.checkCollision(target)) {
            this.open(target);
            this.collected = true;
            this.isGarbage = true;
            this.isActive = false;
        }
    }

    /**
     * 打开宝箱
     * @param {Player} target - 目标玩家
     */
    open(target) {
        console.log("宝箱已开启!");
        
        // 给予大量经验
        target.gainXP(target.xpToNextLevel * 1.5);
        
        // 创建宝箱开启特效
        this.createOpenEffect();
    }

    /**
     * 创建宝箱开启特效
     */
    createOpenEffect() {
        // 创建爆炸特效
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: 150,
            lifetime: 0.8,
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
                
                const alpha = 0.7 - (this.timer / this.lifetime) * 0.7;
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        visualEffects.push(effect);
        
        // 创建星星特效
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;
            
            const star = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: GAME_FONT_SIZE * 0.5,
                lifetime: 0.5 + Math.random() * 0.5,
                timer: 0,
                isGarbage: false,
                
                update: function(dt) {
                    this.timer += dt;
                    if (this.timer >= this.lifetime) {
                        this.isGarbage = true;
                        return;
                    }
                    
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                },
                
                draw: function(ctx) {
                    if (this.isGarbage) return;
                    
                    const alpha = 1 - (this.timer / this.lifetime);
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);
                    
                    ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.globalAlpha = alpha;
                    ctx.fillText('✨', screenPos.x, screenPos.y);
                    ctx.globalAlpha = 1.0;
                }
            };
            
            visualEffects.push(star);
        }
    }

    /**
     * 重置宝箱状态
     */
    reset() {
        // 调用父类重置方法
        super.reset();
        
        // 重置宝箱特有属性
        this.lifetime = 45;
        this.collected = false;
    }
}