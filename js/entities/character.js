/**
 * 角色基类
 * 所有角色的基础类
 */
class Character extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {string} emoji - 表情符号
     * @param {number} size - 大小
     * @param {Object} stats - 属性
     */
    constructor(x, y, emoji, size, stats) {
        // 调用父类构造函数
        super(x, y, emoji, size);
        // 属性
        this.stats = stats || {};
        // 生命值
        this.health = stats.health || 100;
        // 速度
        this.speed = stats.speed || 100;
        // 伤害
        this.damage = stats.damage || 10;
        // 经验值
        this.xpValue = stats.xp || 0;

        // 状态效果
        this.statusEffects = {
            stun: null,
            slow: null,
            burn: null,
            poison: null
        };
        // 无敌时间
        this.invincibleTime = 0;
        // 眩晕免疫计时器
        this.stunImmunityTimer = 0;
    }

    /**
     * 应用状态效果
     * @param {string} type - 效果类型 ('stun', 'slow', 'burn', 'poison')
     * @param {Object} effectData - 效果数据 (例如 { duration: 1, factor: 0.5, damage: 5, tickInterval: 0.5, source: null })
     */
    applyStatusEffect(type, effectData) {
        // 确保statusEffects对象正确初始化（修复精灵特殊效果问题）
        if (!this.statusEffects || typeof this.statusEffects !== 'object') {
            console.warn(`[DEBUG] statusEffects对象无效，重新初始化: ${this.constructor.name}`);
            this.statusEffects = {
                stun: null,
                slow: null,
                burn: null,
                poison: null
            };
        }
        
        // 确保所有必需的状态效果类型都存在
        const requiredTypes = ['stun', 'slow', 'burn', 'poison'];
        for (const requiredType of requiredTypes) {
            if (!this.statusEffects.hasOwnProperty(requiredType)) {
                console.warn(`[DEBUG] 缺少状态效果类型 ${requiredType}，添加到 ${this.constructor.name}`);
                this.statusEffects[requiredType] = null;
            }
        }
        
        if (!this.statusEffects.hasOwnProperty(type)) {
            console.warn(`Unknown status effect type: ${type}`);
            return;
        }

        // 对于减速效果 - 直接应用，不做任何检查
        if (type === 'slow') {
            const currentBaseSpeed = this.getStat('speed');
            const actualSlowStrength = effectData.factor || 0.5;
            
            // 直接覆盖任何现有的减速效果
            this.statusEffects[type] = {
                ...effectData,
                factor: actualSlowStrength,
                originalSpeed: currentBaseSpeed,
                icon: '🐌',
                isAuraEffect: false
            };
            this.speed = currentBaseSpeed * actualSlowStrength;
            return;
        }

        // 对于眩晕效果 - 检查免疫状态
        if (type === 'stun') {
            // 如果当前正被眩晕或处于眩晕免疫中，则不施加新的眩晕
            if (this.statusEffects.stun || this.stunImmunityTimer > 0) {
                console.log(`Stun application blocked for ${this.constructor.name}. Has stun: ${!!this.statusEffects.stun}, Immunity timer: ${this.stunImmunityTimer.toFixed(2)}`);
                return;
            }
            
            const newDuration = (effectData && typeof effectData.duration === 'number') ? effectData.duration : 1.0;
            console.log(`Stun applied via applyStatusEffect to ${this.constructor.name}. Duration: ${newDuration.toFixed(2)}, Current Stun Immunity: ${this.stunImmunityTimer.toFixed(2)}`);
            this.statusEffects[type] = { ...effectData, icon: '⭐', duration: newDuration }; 
            return; 
        }

        // 对于燃烧效果 - 直接应用
        if (type === 'burn') {
            this.statusEffects[type] = { 
                ...effectData, 
                icon: '🔥',
                tickInterval: effectData.tickInterval || 1.0,
                tickTimer: effectData.tickTimer || 1.0
            };
            return;
        }
        
        // 其他效果直接应用
        this.statusEffects[type] = { ...effectData };
    }

    /**
     * 更新角色状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 如果角色不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 更新无敌时间
        if (this.invincibleTime > 0) {
            this.invincibleTime -= dt;
        }

        // 更新状态效果
        this.updateStatusEffects(dt);
    }

    /**
     * 更新状态效果
     * @param {number} dt - 时间增量
     */
    updateStatusEffects(dt) {
        // console.log(`Character updateStatusEffects dt: ${dt.toFixed(4)}, Entity: ${this.constructor.name}`); // 注释掉这行日志
        
        // 更新眩晕免疫时间
        if (this.stunImmunityTimer > 0) {
            this.stunImmunityTimer -= dt;
            if (this.stunImmunityTimer < 0) this.stunImmunityTimer = 0;
        }

        // 更新眩晕效果
        if (this.statusEffects.stun) {
            this.statusEffects.stun.duration -= dt;
            if (this.statusEffects.stun.duration <= 0) {
                delete this.statusEffects.stun;
                // 眩晕结束后给予免疫时间，防止连续眩晕
                this.stunImmunityTimer = 1.0; // 恢复到1.0秒免疫时间
            }
        }

        // 更新冻结效果
        if (this.statusEffects.freeze) {
            this.statusEffects.freeze.duration -= dt;
            if (this.statusEffects.freeze.duration <= 0) {
                // 恢复原速
                if (this.statusEffects.freeze.originalSpeed !== undefined) {
                    this.speed = this.statusEffects.freeze.originalSpeed;
                }
                delete this.statusEffects.freeze;
            } else {
                // 冻结期间速度为0
                this.speed = 0;
            }
        } else if (this.statusEffects.slow) {
            // 光环减速效果有特殊标记，不减少持续时间
            if (this.statusEffects.slow.isAuraEffect) {
                // 不做任何处理，让光环减速由施加者控制
                return;
            }
            
            // 更新减速效果
            this.statusEffects.slow.duration -= dt;
            if (this.statusEffects.slow.duration <= 0) {
                // 恢复原速
                if (this.statusEffects.slow.originalSpeed !== undefined) {
                    this.speed = this.statusEffects.slow.originalSpeed;
                }
                delete this.statusEffects.slow;
            } else {
                // 减速期间，始终使用最新的基础速度计算
                const currentBaseSpeed = this.getStat('speed');
                this.speed = currentBaseSpeed * this.statusEffects.slow.factor;
                this.statusEffects.slow.originalSpeed = currentBaseSpeed;
            }
        } else {
            // 如果没有减速效果，恢复基础速度
            this.speed = this.getStat('speed');
        }

        // 更新燃烧效果
        if (this.statusEffects.burn) {
            this.statusEffects.burn.duration -= dt;
            this.statusEffects.burn.tickTimer -= dt;

            if (this.statusEffects.burn.tickTimer <= 0) {
                // 燃烧伤害直接扣血，不受暴击和护甲影响
                const burnDamage = this.statusEffects.burn.damage;
                this.health -= burnDamage;
                
                // 显示燃烧伤害数字
                if (typeof spawnDamageNumber !== 'undefined') {
                    const offsetY = this.size ? this.size / 2 : 20;
                    spawnDamageNumber(
                        this.x, 
                        this.y - offsetY, 
                        Math.floor(burnDamage).toString(), 
                        '#FF4444', // 燃烧伤害用红色
                        GAME_FONT_SIZE * 0.7, 
                        0.7,
                        false
                    );
                }
                
                // 检查是否死亡
                if (this.health <= 0) {
                    this.onDeath(this.statusEffects.burn.source);
                }

                // 重置计时器
                this.statusEffects.burn.tickTimer = this.statusEffects.burn.tickInterval;
            }
            if (this.statusEffects.burn.duration <= 0) {
                delete this.statusEffects.burn;
            }
        }

        // 更新中毒效果
        if (this.statusEffects.poison) {
            this.statusEffects.poison.duration -= dt;
            this.statusEffects.poison.tickTimer -= dt;

            // 每隔一段时间造成中毒伤害
            if (this.statusEffects.poison.tickTimer <= 0) {
                // 造成中毒伤害
                this.takeDamage(this.statusEffects.poison.damage, this.statusEffects.poison.source);
                // 重置计时器
                this.statusEffects.poison.tickTimer = this.statusEffects.poison.tickInterval;
            }

            if (this.statusEffects.poison.duration <= 0) {
                delete this.statusEffects.poison;
            }
        }

        // 更新泡泡困住效果
        if (this.statusEffects.bubbleTrap) {
            this.statusEffects.bubbleTrap.duration -= dt;
            
            // 如果困住时间结束或泡泡对象不存在，清除困住状态
            if (this.statusEffects.bubbleTrap.duration <= 0 || 
                !this.statusEffects.bubbleTrap.bubble || 
                this.statusEffects.bubbleTrap.bubble.isGarbage || 
                !this.statusEffects.bubbleTrap.bubble.isActive) {
                
                // 恢复原有速度
                if (this.statusEffects.bubbleTrap.originalSpeed !== undefined) {
                    this.speed = this.statusEffects.bubbleTrap.originalSpeed;
                }
                
                // 恢复原始的updateMovement方法
                if (this._originalUpdateMovement) {
                    this.updateMovement = this._originalUpdateMovement;
                    delete this._originalUpdateMovement;
                }
                
                // 删除困住效果
                delete this.statusEffects.bubbleTrap;
            }
        }
    }

    /**
     * 受到伤害
     * @param {number} amount - 伤害量
     * @param {GameObject} source - 伤害来源
     * @returns {boolean} 是否死亡
     */
    takeDamage(amount, source) {
        // 如果无敌，不受伤害
        if (this.invincibleTime > 0) return false;

        // 确保伤害数值有效
        const safeAmount = isNaN(amount) ? 1 : Math.max(0, amount);
        
        // 使用新的伤害计算和显示系统
        const damageResult = calculateAndShowDamage(this, safeAmount, source, 'normal');
        const actualDamage = damageResult.damage;
        
        // 减少生命值
        this.health -= actualDamage;

        // 如果是Boss，添加Boss受伤日志
        if (this instanceof BossEnemy) {
            const critText = damageResult.isCrit ? ' (CRIT!)' : '';
            console.log(`[BOSS_TAKE_DAMAGE] Boss ${this.name || (this.type && this.type.name) || 'UnknownBoss'} took ${actualDamage} damage${critText}. New HP: ${this.health}/${this.maxHealth}`);
        }

        // 确保生命值不是NaN
        if (isNaN(this.health)) {
            console.error('Character health became NaN after damage calculation!');
            this.health = 0; // 设置为0，触发死亡
        }

        // 设置无敌时间
        this.invincibleTime = 0.1;
        // 如果生命值小于等于0，死亡
        if (this.health <= 0) {
            this.onDeath(source);
            return true;
        }

        return false;
    }

    /**
     * 治疗
     * @param {number} amount - 治疗量
     */
    heal(amount) {
        // 增加生命值
        this.health = Math.min(this.health + amount, this.getStat('health'));

        // 使用新的伤害显示系统显示治疗
        calculateAndShowDamage(this, amount, null, 'heal');
    }

    /**
     * 死亡处理
     * @param {GameObject} killer - 击杀者
     */
    onDeath(killer) {
        // 标记为垃圾
        this.isGarbage = true;
        this.isActive = false;
    }

    /**
     * 获取属性
     * @param {string} statName - 属性名称
     * @returns {number} 属性值
     */
    getStat(statName) {
        return this.stats[statName] || 0;
    }

    /**
     * 检查是否被眩晕
     * @returns {boolean} 是否被眩晕
     */
    isStunned() {
        return this.statusEffects && this.statusEffects.stun && this.statusEffects.stun.duration > 0;
    }

    /**
     * 检查是否被冻结
     * @returns {boolean} 是否被冻结
     */
    isFrozen() {
        return this.statusEffects && this.statusEffects.freeze && this.statusEffects.freeze.duration > 0;
    }

    /**
     * 检查是否被泡泡困住
     * @returns {boolean} 是否被泡泡困住
     */
    isBubbleTrapped() {
        return this.statusEffects && this.statusEffects.bubbleTrap && this.statusEffects.bubbleTrap.duration > 0;
    }

    /**
     * 获取当前速度
     * @returns {number} 当前速度
     */
    getCurrentSpeed() {
        let speed = this.getStat('speed');
        // 优先光环减速
        if (this.statusEffects.slow && this.statusEffects.slow.isAuraEffect) {
            speed *= this.statusEffects.slow.factor;
        } else if (this.statusEffects.slow) {
            speed *= this.statusEffects.slow.factor;
        }
        if (this.isStunned() || this.isFrozen() || this.isBubbleTrapped()) {
            speed = 0;
        }
        return speed;
    }

    /**
     * 绘制角色
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (this.isGarbage || !this.isActive) return;

        const screenPos = cameraManager.worldToScreen(this.x, this.y);

        // 绘制表情符号
        ctx.font = `${this.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.emoji, screenPos.x, screenPos.y);

        // 绘制状态效果图标
        this.drawStatusEffects(ctx, screenPos);
    }

    /**
     * 绘制状态效果图标
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {{x: number, y: number}} screenPos - 角色在屏幕上的位置
     */
    drawStatusEffects(ctx, screenPos) {
        if (!this.statusEffects) return;

        const iconSize = 16;
        const iconSpacing = 20;
        let activeEffectsCount = 0;
        
        // 先统计有多少个活跃的状态效果
        if (this.statusEffects.stun && this.statusEffects.stun.duration > 0) activeEffectsCount++;
        if (this.statusEffects.burn && this.statusEffects.burn.duration > 0) activeEffectsCount++;
        if (this.statusEffects.slow && this.statusEffects.slow.duration > 0) activeEffectsCount++;
        if (this.statusEffects.freeze && this.statusEffects.freeze.duration > 0) activeEffectsCount++;
        if (this.statusEffects.poison && this.statusEffects.poison.duration > 0) activeEffectsCount++;
        if (this.statusEffects.bubbleTrap && this.statusEffects.bubbleTrap.duration > 0) activeEffectsCount++;

        // 计算图标起始位置 - 在角色正上方，居中对齐
        const baseIconY = screenPos.y - this.size / 2 - 25; // 稍微再高一点
        const startX = screenPos.x - ((activeEffectsCount - 1) * iconSpacing) / 2; // 居中计算起始X
        
        let iconIndex = 0;
        
        // 眩晕效果 - 显示旋转的星星
        if (this.statusEffects.stun && this.statusEffects.stun.duration > 0) {
            const stunRadius = this.size * 0.6;
            const angularSpeed = 4;
            const numStars = 3;
            
            ctx.save();
            ctx.font = `${iconSize * 0.8}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            for (let i = 0; i < numStars; i++) {
                const angle = (gameTime * angularSpeed + (i * (Math.PI * 2 / numStars))) % (Math.PI * 2);
                const starX = screenPos.x + Math.cos(angle) * stunRadius;
                const starY = screenPos.y - this.size / 2 - 10 + Math.sin(angle) * stunRadius * 0.3;
                
                ctx.fillStyle = '#FFFF00';
                ctx.fillText('⭐', starX, starY);
            }
            ctx.restore();
            iconIndex++;
        }

        // 燃烧效果
        if (this.statusEffects.burn && this.statusEffects.burn.duration > 0) {
            const iconX = startX + iconIndex * iconSpacing;
            const iconY = baseIconY;
            
            // 绘制火焰特效
            this.drawBurnEffect(ctx, screenPos);
            
            // 绘制燃烧图标
            ctx.save();
            ctx.font = `${iconSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#FF4500';
            ctx.fillText('🔥', iconX, iconY);
            ctx.restore();
            iconIndex++;
        }

        // 减速效果
        if (this.statusEffects.slow && this.statusEffects.slow.duration > 0) {
            const iconX = startX + iconIndex * iconSpacing;
            const iconY = baseIconY;
            
            ctx.save();
            ctx.font = `${iconSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#87CEEB';
            ctx.fillText('🐌', iconX, iconY);
            ctx.restore();
            iconIndex++;
        }

        // 冻结效果
        if (this.statusEffects.freeze && this.statusEffects.freeze.duration > 0) {
            const iconX = startX + iconIndex * iconSpacing;
            const iconY = baseIconY;
            
            ctx.save();
            ctx.font = `${iconSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#ADD8E6';
            ctx.fillText('❄️', iconX, iconY);
            ctx.restore();
            iconIndex++;
        }

        // 中毒效果
        if (this.statusEffects.poison && this.statusEffects.poison.duration > 0) {
            const iconX = startX + iconIndex * iconSpacing;
            const iconY = baseIconY;
            
            ctx.save();
            ctx.font = `${iconSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#32CD32';
            ctx.fillText('☠️', iconX, iconY);
            ctx.restore();
            iconIndex++;
        }

        // 泡泡困住效果
        if (this.statusEffects.bubbleTrap && this.statusEffects.bubbleTrap.duration > 0) {
            const iconX = startX + iconIndex * iconSpacing;
            const iconY = baseIconY;
            
            ctx.save();
            ctx.font = `${iconSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#87CEEB';
            ctx.fillText('🫧', iconX, iconY);
            ctx.restore();
            iconIndex++;
        }
    }

    /**
     * 绘制燃烧特效
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {{x: number, y: number}} screenPos - 角色在屏幕上的位置
     */
    drawBurnEffect(ctx, screenPos) {
        if (!this.statusEffects || !this.statusEffects.burn) return;
        
        // 初始化燃烧特效计时器
        if (!this.burnEffectTimer) {
            this.burnEffectTimer = 0;
        }
        
        // 更新燃烧特效计时器（使用全局deltaTime）
        this.burnEffectTimer += deltaTime || 0.016;
        
        ctx.save();
        
        // 绘制多个火焰粒子
        const numFlames = 6;
        for (let i = 0; i < numFlames; i++) {
            const angle = (this.burnEffectTimer * 2 + i * (Math.PI * 2 / numFlames)) % (Math.PI * 2);
            const radius = 8 + Math.sin(this.burnEffectTimer * 3 + i) * 3;
            const flameX = screenPos.x + Math.cos(angle) * radius;
            const flameY = screenPos.y + Math.sin(angle) * radius - 5;
            
            // 火焰颜色渐变
            const intensity = 0.7 + Math.sin(this.burnEffectTimer * 4 + i) * 0.3;
            const red = Math.floor(255 * intensity);
            const green = Math.floor(100 * intensity);
            const blue = 0;
            
            // 绘制火焰粒子
            ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, ${intensity * 0.8})`;
            ctx.beginPath();
            ctx.arc(flameX, flameY, 2 + Math.sin(this.burnEffectTimer * 5 + i) * 1, 0, Math.PI * 2);
            ctx.fill();
            
            // 绘制火焰核心
            ctx.fillStyle = `rgba(255, 200, 0, ${intensity * 0.6})`;
            ctx.beginPath();
            ctx.arc(flameX, flameY, 1, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制燃烧光环
        const glowRadius = this.size / 2 + 5 + Math.sin(this.burnEffectTimer * 2) * 2;
        const gradient = ctx.createRadialGradient(screenPos.x, screenPos.y, 0, screenPos.x, screenPos.y, glowRadius);
        gradient.addColorStop(0, 'rgba(255, 100, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(255, 50, 0, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, glowRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
