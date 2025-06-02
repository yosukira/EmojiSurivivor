/**
 * 敌人投射物系统
 * 包含EnemyProjectile类和相关功能
 */

/**
 * 敌人投射物类
 */
class EnemyProjectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {Enemy} owner - 拥有者
     * @param {string} [emoji=null] - 可选的表情符号用于显示
     * @param {number} [customSize=null] - 可选的自定义大小
     */
    constructor(x, y, vx, vy, damage, owner, emoji = null, customSize = null) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.owner = owner;
        this.emoji = emoji;
        
        // 大小
        this.size = customSize !== null ? customSize : (this.emoji ? GAME_FONT_SIZE * 0.8 : GAME_FONT_SIZE * 0.6);
        
        // 确保width和height属性存在并赋值，防止"Cannot set properties of undefined"错误
        this.width = this.size;
        this.height = this.size;
        
        // 生命周期
        this.lifetime = 0;
        this.duration = 3.0;
        
        // 活动状态
        this.isActive = true;
        this.isGarbage = false;
        
        // 已击中的目标
        this.hasHit = false;
    }
    
    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果投射物不活动或已标记为垃圾，不更新
        if (!this.isGarbage && this.isActive) {
            // 更新位置
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            
            // 更新生命周期
            this.lifetime += dt;
            
            // 检查生命周期
            if (this.lifetime >= this.duration) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查是否超出屏幕边界
            if (this.x < cameraManager.x - GAME_WIDTH * 0.6 || 
                this.x > cameraManager.x + GAME_WIDTH * 0.6 || 
                this.y < cameraManager.y - GAME_HEIGHT * 0.6 || 
                this.y > cameraManager.y + GAME_HEIGHT * 0.6) {
                this.isGarbage = true;
                this.isActive = false;
                return;
            }
            
            // 检查与玩家的碰撞
            if (!this.hasHit && player && !player.isGarbage && player.isActive) {
                const dx = this.x - player.x;
                const dy = this.y - player.y;
                const distSq = dx * dx + dy * dy;
                const collisionRadiusSq = (this.size / 2 + player.size / 2) * (this.size / 2 + player.size / 2);
                
                if (distSq <= collisionRadiusSq) {
                    // 对玩家造成伤害
                    player.takeDamage(this.damage, this.owner);
                    
                    // 标记为已击中
                    this.hasHit = true;
                    this.isGarbage = true;
                    this.isActive = false;
                    
                    // 创建命中特效
                    this.createHitEffect();
                    
                    // 应用效果处理
                    
                    // 如果是蜘蛛敌人的投射物，应用减速效果并显示蜘蛛网特效
                    if (this.owner && this.owner.type && this.owner.type.name === "蜘蛛") {
                        // 应用减速效果
                        const slowFactor = 0.8; // 减速到80%（降低幅度从60%减为20%）
                        const slowDuration = 2.0; // 持续2秒
                        
                        // 应用减速效果（不叠加，取最强效果）
                        this.applySlowToPlayer(slowFactor, slowDuration);
                        
                        // 创建蜘蛛网视觉效果
                        this.createSpiderWebEffect();
                    }
                    // 如果是巫师敌人的投射物，应用更强的减速效果
                    else if (this.owner && this.owner.type && this.owner.type.name === "巫师") {
                        // 应用减速效果
                        const slowFactor = 0.5; // 减速到50%（降低幅度50%）
                        const slowDuration = 3.0; // 持续3秒
                        
                        // 应用减速效果（不叠加，取最强效果）
                        this.applySlowToPlayer(slowFactor, slowDuration);
                        
                        // 创建魔法减速视觉效果
                        this.createMagicSlowEffect();
                    }
                }
            }
        }
    }
    
    /**
     * 对玩家应用减速效果（不叠加，取最强效果）
     * @param {number} slowFactor - 减速因子
     * @param {number} slowDuration - 减速持续时间
     */
    applySlowToPlayer(slowFactor, slowDuration) {
        if (!player || !player.stats) return;
        // slowImmunity判定
        if (player.getStat && player.getStat('slowImmunity')) {
            if (player.statusEffects && player.statusEffects.slow) {
                delete player.statusEffects.slow;
                player.speed = player.getStat('speed');
            }
            return;
        }
        // 确保玩家有statusEffects对象
        if (!player.statusEffects) {
            player.statusEffects = {
                stun: null,
                slow: null,
                burn: null,
                poison: null
            };
        }
        
        // 保存原有速度（如果没有已存在的减速效果）
        let originalSpeed = player.statusEffects.slow ? 
                          player.statusEffects.slow.originalSpeed : 
                          player.stats.speed;
        
        // 检查是否已有减速效果
        if (player.statusEffects.slow) {
            // 已有减速效果，取最强的效果（更低的factor值表示更强的减速）
            if (slowFactor <= player.statusEffects.slow.factor) {
                // 新的减速效果更强或相同，更新减速系数
                player.statusEffects.slow.factor = slowFactor;
                // 重置玩家速度为原速度×新减速系数
                player.stats.speed = originalSpeed * slowFactor;
            }
            // 不管新效果是否更强，都刷新持续时间（取较长的）
            player.statusEffects.slow.duration = Math.max(player.statusEffects.slow.duration, slowDuration);
        } else {
            // 没有已存在的减速效果，直接应用
            player.stats.speed *= slowFactor;
            
            player.statusEffects.slow = {
                factor: slowFactor,
                duration: slowDuration,
                originalSpeed: originalSpeed,
                source: this.owner,
                icon: '🐌' // 确保有蜗牛图标
            };
        }
    }
    
    /**
     * 创建魔法减速视觉效果
     */
    createMagicSlowEffect() {
        const effect = {
            x: player.x,
            y: player.y,
            radius: 0,
            maxRadius: 50,
            lifetime: 1.5,
            timer: 0,
            rings: [],
            isGarbage: false,
            
            // 初始化创建多个魔法环
            init() {
                for (let i = 0; i < 3; i++) {
                    this.rings.push({
                        delay: i * 0.3,
                        progress: 0,
                        maxRadius: this.maxRadius + i * 15,
                        color: `hsl(${280 + i * 20}, 70%, 60%)`
                    });
                }
            },
            
            update(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 更新每个魔法环
                this.rings.forEach(ring => {
                    if (this.timer >= ring.delay) {
                        const ringAge = this.timer - ring.delay;
                        const ringLifetime = this.lifetime - ring.delay;
                        ring.progress = Math.min(1, ringAge / ringLifetime);
                    }
                });
            },
            
            draw(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                // 绘制多个魔法环
                this.rings.forEach(ring => {
                    if (ring.progress > 0) {
                        const currentRadius = ring.progress * ring.maxRadius;
                        const alpha = (1 - ring.progress) * 0.7;
                        
                        // 外环
                        ctx.strokeStyle = ring.color.replace('60%', `${60 * alpha}%`);
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(screenPos.x, screenPos.y, currentRadius, 0, Math.PI * 2);
                        ctx.stroke();
                        
                        // 内环光晕
                        const innerAlpha = alpha * 0.3;
                        ctx.fillStyle = ring.color.replace('60%', `${60 * innerAlpha}%`);
                        ctx.beginPath();
                        ctx.arc(screenPos.x, screenPos.y, currentRadius * 0.8, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
                
                // 绘制中心魔法粒子
                if (this.timer < this.lifetime * 0.8) {
                    const particleCount = 8;
                    for (let i = 0; i < particleCount; i++) {
                        const angle = (Date.now() / 1000 + i) * 0.5;
                        const distance = 15 + Math.sin(this.timer * 3 + i) * 10;
                        const particleX = screenPos.x + Math.cos(angle) * distance;
                        const particleY = screenPos.y + Math.sin(angle) * distance;
                        
                        ctx.fillStyle = `rgba(200, 100, 255, ${0.6 * (1 - this.timer / this.lifetime)})`;
                        ctx.beginPath();
                        ctx.arc(particleX, particleY, 2, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        };
        
        effect.init();
        visualEffects.push(effect);
    }
    
    /**
     * 创建命中特效
     */
    createHitEffect() {
        const effect = {
            x: this.x,
            y: this.y,
            particles: [],
            lifetime: 0.5,
            timer: 0,
            isGarbage: false,
            
            init() {
                // 创建爆炸粒子
                for (let i = 0; i < 6; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const speed = 50 + Math.random() * 100;
                    this.particles.push({
                        x: this.x,
                        y: this.y,
                        vx: Math.cos(angle) * speed,
                        vy: Math.sin(angle) * speed,
                        size: 3 + Math.random() * 4,
                        color: `hsl(${Math.random() * 60}, 70%, 60%)`
                    });
                }
            },
            
            update(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 更新粒子
                this.particles.forEach(p => {
                    p.x += p.vx * dt;
                    p.y += p.vy * dt;
                    p.vx *= 0.95; // 减速
                    p.vy *= 0.95;
                });
            },
            
            draw(ctx) {
                if (this.isGarbage) return;
                
                const alpha = 1 - this.timer / this.lifetime;
                this.particles.forEach(p => {
                    const screenPos = cameraManager.worldToScreen(p.x, p.y);
                    ctx.fillStyle = p.color.replace('60%', `${60 * alpha}%`);
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, p.size * alpha, 0, Math.PI * 2);
                    ctx.fill();
                });
            }
        };
        
        effect.init();
        visualEffects.push(effect);
    }
    
    /**
     * 创建蜘蛛网视觉效果
     */
    createSpiderWebEffect() {
        const effect = {
            x: player.x,
            y: player.y,
            radius: 0,
            maxRadius: 40,
            lifetime: 2.5,
            timer: 0,
            webLines: [],
            isGarbage: false,
            
            init() {
                // 创建蜘蛛网线条
                const lines = 8;
                for (let i = 0; i < lines; i++) {
                    const angle = (i / lines) * Math.PI * 2;
                    this.webLines.push({
                        angle: angle,
                        length: this.maxRadius,
                        segments: []
                    });
                    
                    // 为每条线创建分段
                    const segments = 4;
                    for (let j = 0; j < segments; j++) {
                        const segmentRadius = (j + 1) / segments * this.maxRadius;
                        this.webLines[i].segments.push({
                            radius: segmentRadius,
                            offset: (Math.random() - 0.5) * 10
                        });
                    }
                }
            },
            
            update(dt) {
                this.timer += dt;
                if (this.timer >= this.lifetime) {
                    this.isGarbage = true;
                    return;
                }
                
                const progress = Math.min(1, this.timer / 0.5); // 0.5秒展开时间
                this.radius = progress * this.maxRadius;
            },
            
            draw(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = Math.max(0, 1 - this.timer / this.lifetime);
                
                ctx.strokeStyle = `rgba(200, 200, 200, ${alpha * 0.8})`;
                ctx.lineWidth = 2;
                
                // 绘制放射线
                this.webLines.forEach(line => {
                    if (this.radius > 0) {
                        const endX = screenPos.x + Math.cos(line.angle) * this.radius;
                        const endY = screenPos.y + Math.sin(line.angle) * this.radius;
                        
                        ctx.beginPath();
                        ctx.moveTo(screenPos.x, screenPos.y);
                        ctx.lineTo(endX, endY);
                        ctx.stroke();
                    }
                });
                
                // 绘制同心圆环
                ctx.strokeStyle = `rgba(200, 200, 200, ${alpha * 0.6})`;
                ctx.lineWidth = 1;
                
                const rings = 3;
                for (let i = 1; i <= rings; i++) {
                    const ringRadius = (i / rings) * this.radius;
                    if (ringRadius > 0) {
                        ctx.beginPath();
                        ctx.arc(screenPos.x, screenPos.y, ringRadius, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                }
            }
        };
        
        effect.init();
        visualEffects.push(effect);
    }
    
    /**
     * 绘制投射物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;
        
        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        
        // 保存画布状态
        ctx.save();
        
        if (this.emoji) {
            // 绘制表情符号
            ctx.font = `${this.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        } else {
            // 绘制默认投射物（红色圆点）
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 恢复画布状态
        ctx.restore();
    }
    
    /**
     * 销毁投射物
     */
    destroy() {
        this.isGarbage = true;
        this.isActive = false;
    }
} 