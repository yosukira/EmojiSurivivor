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
        if (!this.statusEffects.hasOwnProperty(type)) {
            console.warn(`Unknown status effect type: ${type}`);
            return;
        }

        // 对于减速效果，需要特殊处理
        if (type === 'slow') {
            if (this.getStat && this.getStat('slowImmunity')) {
                if (this.statusEffects.slow) {
                    delete this.statusEffects.slow;
                    this.speed = this.getStat('speed');
                }
                this._pendingNormalSlow = null;
                return;
            }
            let slowResistance = 0;
            if (this.getStat && typeof this.getStat('slowResistance') === 'number') {
                slowResistance = this.getStat('slowResistance');
            }
            const actualSlowStrength = effectData.factor * (1 - slowResistance);
            const currentBaseSpeed = this.getStat('speed');
            
            if (effectData.isAuraEffect) {
                // 进入毒圈时始终覆盖为光环减速，保存当前普通减速
                if (this.statusEffects.slow && !this.statusEffects.slow.isAuraEffect) {
                    this._pendingNormalSlow = { ...this.statusEffects.slow };
                }
                // 每次进入毒圈都强制覆盖光环减速，并刷新duration
                this.statusEffects[type] = {
                    ...effectData,
                    factor: actualSlowStrength,
                    originalSpeed: currentBaseSpeed,
                    icon: '🐌',
                    isAuraEffect: true,
                    duration: effectData.duration || 0.5 // 每帧都重置duration，防止被清理
                };
                this.speed = currentBaseSpeed * actualSlowStrength;
                return;
            }
            
            // 离开毒圈时恢复普通减速
            if (effectData._restoreFromAura) {
                if (this._pendingNormalSlow) {
                    this.statusEffects.slow = { ...this._pendingNormalSlow };
                    this.speed = currentBaseSpeed * this._pendingNormalSlow.factor;
                } else {
                    delete this.statusEffects.slow;
                    this.speed = currentBaseSpeed;
                }
                this._pendingNormalSlow = null;
                return;
            }
            
            // 如果当前有光环slow，普通slow不生效
            if (this.statusEffects.slow && this.statusEffects.slow.isAuraEffect && !effectData.isAuraEffect) {
                return;
            }
            
            // 应用普通减速效果
            if (!this.statusEffects.slow || actualSlowStrength < this.statusEffects.slow.factor) {
                const originalSpeed = this.statusEffects.slow ? this.statusEffects.slow.originalSpeed : currentBaseSpeed;
                this.statusEffects[type] = {
                    ...effectData,
                    factor: actualSlowStrength,
                    originalSpeed: originalSpeed,
                    icon: '🐌',
                    isAuraEffect: false
                };
                this.speed = originalSpeed * actualSlowStrength;
            }
            return;
        }

        // 对于眩晕效果
        if (type === 'stun') {
            // 如果当前正被眩晕或处于眩晕免疫中，则不施加新的眩晕
            if (this.statusEffects.stun || this.stunImmunityTimer > 0) {
                return;
            }
            // 如果新的眩晕效果比现有的弱（虽然上面已经return了，但保留逻辑完整性）
            // 确保 effectData.duration 存在且有效
            const newDuration = (effectData && typeof effectData.duration === 'number') ? effectData.duration : 0;
            if (this.statusEffects[type] && this.statusEffects[type].duration > newDuration) {
                return; 
            }
            // 施加眩晕效果时不启动免疫计时器
            this.statusEffects[type] = { ...effectData, icon: '💫', duration: newDuration }; 
            return; 
        }
        
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
        // 更新眩晕免疫计时器
        if (this.stunImmunityTimer > 0) {
            this.stunImmunityTimer -= dt;
            if (this.stunImmunityTimer < 0) {
                this.stunImmunityTimer = 0;
            }
        }

        // 更新眩晕效果
        if (this.statusEffects.stun) {
            this.statusEffects.stun.duration -= dt;
            if (this.statusEffects.stun.duration <= 0) {
                this.statusEffects.stun = null;
                this.stunImmunityTimer = 1.0; // 眩晕结束后开始1秒免疫
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
                // 造成伤害
                this.takeDamage(this.statusEffects.burn.damage, this.statusEffects.burn.source);

                // 重置计时器
                this.statusEffects.burn.tickTimer = this.statusEffects.burn.tickInterval;
            }
            if (this.statusEffects.burn.duration <= 0) {
                this.statusEffects.burn = null;
            }
        }

        // 更新中毒效果
        if (this.statusEffects.poison) {
            this.statusEffects.poison.duration -= dt;
            this.statusEffects.poison.tickTimer -= dt;

            if (this.statusEffects.poison.tickTimer <= 0) {
                // 造成伤害
                this.takeDamage(this.statusEffects.poison.damage, this.statusEffects.poison.source);

                // 重置计时器
                this.statusEffects.poison.tickTimer = this.statusEffects.poison.tickInterval;
            }

            if (this.statusEffects.poison.duration <= 0) {
                this.statusEffects.poison = null;
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
        const armor = this.getStat('armor') || 0;
        
        // 计算实际伤害
        const actualDamage = Math.max(1, safeAmount - armor);
        
        // 减少生命值
        this.health -= actualDamage;

        // 如果是Boss，添加Boss受伤日志
        if (this instanceof BossEnemy) {
            console.log(`[BOSS_TAKE_DAMAGE] Boss ${this.name || (this.type && this.type.name) || 'UnknownBoss'} took ${actualDamage} damage. New HP: ${this.health}/${this.maxHealth}`);
        }

        // 确保生命值不是NaN
        if (isNaN(this.health)) {
            console.error('Character health became NaN after damage calculation!');
            this.health = 0; // 设置为0，触发死亡
        }

        // 创建伤害数字 - 修改为合适的大小
        spawnDamageNumber(this.x, this.y - this.size / 2, actualDamage.toString(), 'rgb(255, 80, 80)', GAME_FONT_SIZE * 0.8);

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

        // 创建治疗数字 - 修改为合适的大小
        spawnDamageNumber(this.x, this.y - this.size / 2, `+${Math.ceil(amount)}`, 'rgb(50, 200, 50)', GAME_FONT_SIZE * 0.8);
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
        if (this.isStunned()) {
            speed = 0;
        }
        return speed;
    }

    /**
     * 检查是否被眩晕
     * @returns {boolean} 是否被眩晕
     */
    isStunned() {
        return this.statusEffects.stun !== null;
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
     * @param {{x: number, y: number}} screenPos - 屏幕坐标
     */
    drawStatusEffects(ctx, screenPos) {
        if (!this.isActive || this.isGarbage) return;

        let iconYOffset = -this.size * 0.8; // 图标基准Y偏移，稍微调高一点给旋转星星留空间
        const iconSpacing = GAME_FONT_SIZE * 0.5; 

        ctx.save();
        ctx.font = `${GAME_FONT_SIZE * 0.5}px 'Segoe UI Emoji', Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 绘制眩晕图标 (旋转的星星)
        if (this.statusEffects.stun && this.statusEffects.stun.duration > 0) {
            const stunRadius = this.size * 0.5; // 星星旋转半径
            const angularSpeed = 4; // 星星旋转速度 (弧度/秒)
            const numStars = 3;
            const starEmoji = '⭐'; // 修改为⭐
            ctx.fillStyle = 'yellow';

            for (let i = 0; i < numStars; i++) {
                const angle = (gameTime * angularSpeed + (i * (Math.PI * 2 / numStars))) % (Math.PI * 2);
                const starX = screenPos.x + Math.cos(angle) * stunRadius;
                const starY = screenPos.y + iconYOffset + Math.sin(angle) * stunRadius * 0.5; // Y方向椭圆一些
                ctx.fillText(starEmoji, starX, starY);
            }
            iconYOffset -= iconSpacing * 1.5; // 为旋转星星多留一些空间再显示其他图标
        }

        // 绘制减速图标 (🐌)
        if (this.statusEffects.slow && this.statusEffects.slow.duration > 0 && this.statusEffects.slow.icon) {
            ctx.fillText(this.statusEffects.slow.icon, screenPos.x, screenPos.y + iconYOffset);
            iconYOffset -= iconSpacing; 
        }

        // 绘制燃烧图标 (🔥)
        if (this.statusEffects.burn && this.statusEffects.burn.duration > 0 && this.statusEffects.burn.icon) {
            ctx.globalAlpha = 0.8; 
            ctx.fillStyle = 'orange'; 
            ctx.fillText(this.statusEffects.burn.icon, screenPos.x, screenPos.y + iconYOffset);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'white'; // 恢复默认颜色
            iconYOffset -= iconSpacing;
        }

        // 绘制中毒图标 (☠️)
        if (this.statusEffects.poison && this.statusEffects.poison.duration > 0 && this.statusEffects.poison.icon) {
            ctx.globalAlpha = 0.8;
            ctx.fillStyle = 'green'; 
            ctx.fillText(this.statusEffects.poison.icon, screenPos.x, screenPos.y + iconYOffset);
            ctx.globalAlpha = 1.0;
            ctx.fillStyle = 'white'; // 恢复默认颜色
            iconYOffset -= iconSpacing; // 如果还有其他图标
        }

        ctx.restore();
    }
}
