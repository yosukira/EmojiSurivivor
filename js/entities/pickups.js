/**
 * 拾取物类文件
 * 包含经验宝石、拾取物和宝箱等
 */

// 从URL参数中获取调试模式设置
const urlParams = new URLSearchParams(window.location.search);
const DEBUG_MODE = urlParams.get('debug') === 'true';

/**
 * 经验宝石类
 * 玩家可以收集的经验宝石
 */
class ExperienceGem extends GameObject {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} value - 经验值
     */
    constructor(x, y, value) {
        super(x, y, null, GAME_FONT_SIZE * 0.7);
        // 经验值
        this.value = value;

        // 吸引速度
        this.baseAttractionSpeed = 450; // 基础吸引速度
        this.attractionSpeed = this.baseAttractionSpeed;
        this.isAttracted = false; // 是否已被玩家吸引

        // 初始速度
        this.vx = (Math.random() - 0.5) * 50;
        this.vy = (Math.random() - 0.5) * 50;

        // 初始加速度
        this.ax = 0;
        this.ay = 0;

        // 摩擦系数
        this.friction = 0.95;
        
        // 加载图片
        if (!ExperienceGem.image) {
            ExperienceGem.image = new Image();
            ExperienceGem.image.src = 'assets/xp1.png';
            console.log("加载经验宝石图片: assets/xp1.png");
        }
        
        // 设置旋转效果
        this.rotation = Math.random() * Math.PI * 2; // 随机初始角度
        this.rotationSpeed = (Math.random() - 0.5) * 2; // 随机旋转速度
        
        // 设置大小
        this.scale = 0.7 + Math.random() * 0.3; // 随机缩放因子
        
        // 碰撞半径（比视觉大小稍小，只检测核心部分）
        this.collisionRadius = this.size * 0.6;
    }

    /**
     * 更新经验宝石状态
     * @param {number} dt - 时间增量
     * @param {Player} player - 玩家
     */
    update(dt, player) {
        // 如果经验宝石不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;

        // 更新旋转
        this.rotation += this.rotationSpeed * dt;

        // 计算到玩家的距离
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const distSq = dx * dx + dy * dy;

        // 如果已被吸引，或者在吸引范围内，则向玩家移动
        if (this.isAttracted || distSq < player.pickupRadiusSq) {
            if (!this.isAttracted) {
                // 首次进入吸引范围
                this.isAttracted = true;
                this.attractionSpeed = this.baseAttractionSpeed * 2.0; // 吸引后速度翻倍
                // 清除初始的随机速度，使其直接飞向玩家
                this.vx = 0;
                this.vy = 0;
            }

            const dist = Math.sqrt(distSq);
            // 即使在吸引状态，如果距离过近，也可以直接收集，避免抖动
            if (dist < 5) { // 假设一个很小的距离阈值可以直接收集
                 player.gainXP(this.value);
                 this.isGarbage = true;
                 this.isActive = false;
                 return;
            }

            // 计算加速度/直接设置速度，使其飞向玩家
            if (dist > 0) {
                // 直接设置速度飞向玩家，而不是通过加速度
                this.vx = (dx / dist) * this.attractionSpeed;
                this.vy = (dy / dist) * this.attractionSpeed;
            }
            this.ax = 0; // 清除加速度，因为我们直接设置速度
            this.ay = 0;
        } else {
            // 不在吸引范围内，且未被吸引，应用初始的随机运动和摩擦力
            this.ax = 0;
            this.ay = 0;
            // 更新速度 (如果之前有初始速度逻辑)
            this.vx += this.ax * dt;
            this.vy += this.ay * dt;
            this.vx *= this.friction;
            this.vy *= this.friction;
        }

        // 更新位置 (如果上面没有直接设置速度，则基于vx, vy更新)
        // 如果isAttracted，则上面已经更新了vx, vy
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // 检查与玩家的碰撞 (如果上面没有因为距离过近而收集)
        if (this.checkCollisionWithPlayer(player)) {
            player.gainXP(this.value);
            this.isGarbage = true;
            this.isActive = false;
        }
    }
    
    /**
     * 与玩家的碰撞检测，只检测图像的非透明部分
     * @param {Player} player - 玩家
     * @returns {boolean} 是否碰撞
     */
    checkCollisionWithPlayer(player) {
        // 计算两个对象之间的距离
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // 使用较小的碰撞半径，只检测宝石的核心部分
        return distance < (this.collisionRadius + player.size / 2);
    }

    /**
     * 绘制经验宝石
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果经验宝石不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;
        
        // 确保图片已加载
        if (ExperienceGem.image && ExperienceGem.image.complete) {
            try {
                // 获取屏幕坐标
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                // 保存当前绘图状态
                ctx.save();
                
                // 移动到宝石位置
                ctx.translate(screenPos.x, screenPos.y);
                
                // 应用旋转
                ctx.rotate(this.rotation);
                
                // 应用缩放
                const actualSize = this.size * this.scale;
                
                // 绘制图片（居中对齐）
                ctx.drawImage(
                    ExperienceGem.image, 
                    -actualSize / 2,  // 左上角X坐标 
                    -actualSize / 2,  // 左上角Y坐标
                    actualSize,       // 宽度
                    actualSize        // 高度
                );
                
                // 恢复绘图状态
                ctx.restore();
                
                // 调试模式下绘制碰撞半径
                if (DEBUG_MODE) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.collisionRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.restore();
                }
            } catch (error) {
                console.error("绘制经验宝石时出错:", error);
            }
        } else if (!ExperienceGem.imageLoadAttempted) {
            // 如果图片未加载，尝试重新加载一次
            ExperienceGem.image = new Image();
            ExperienceGem.image.src = 'assets/xp1.png';
            ExperienceGem.imageLoadAttempted = true;
            
            // 回退到使用emoji
            super.draw(ctx);
        } else {
            // 使用父类的默认绘制方法（emoji）作为回退
            this.emoji = "💎"; // 临时设置emoji
            super.draw(ctx);
            this.emoji = null; // 恢复null
        }
    }
}

// 静态图片对象
ExperienceGem.image = null;
ExperienceGem.imageLoadAttempted = false;

/**
 * 拾取物类
 * 玩家收集以获得各种效果
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

        // 闪烁效果
        this.glowTimer = Math.random() * Math.PI * 2;
        this.glowSpeed = 2 + Math.random() * 1.5;
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

        // 如果生命周期结束，标记为垃圾和非活动
        if (this.lifetime <= 0) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }

        // 更新闪烁效果
        this.glowTimer += dt * this.glowSpeed;

        // 计算到目标的距离
        const pickupRadiusSq = target.pickupRadiusSq;
        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const distSq = dx * dx + dy * dy;

        // 如果在吸引范围内且不在目标位置，移动向目标
        if (distSq < pickupRadiusSq && distSq > 1) {
            // 计算吸引力
            const dist = Math.sqrt(distSq);

            // 更新位置
            this.x += (dx / dist) * this.attractionSpeed * dt;
            this.y += (dy / dist) * this.attractionSpeed * dt;
        }

        // 检查与目标的碰撞
        if (this.checkCollision(target)) {
            // 应用效果
            this.applyEffect(target);

            // 标记为垃圾和非活动
            this.isGarbage = true;
            this.isActive = false;
        }
    }

    /**
     * 应用效果
     * @param {Player} target - 目标玩家
     */
    applyEffect(target) {
        // 根据类型应用不同效果
        switch (this.type) {
            case 'heal':
                // 恢复生命
                target.heal(this.value);

                // 创建恢复效果
                this.createHealEffect(target);
                break;

            case 'magnet':
                // 吸取所有经验宝石
                this.magnetizeAllXP();
                break;

            default:
                console.warn(`未知拾取物类型: ${this.type}`);
                break;
        }
    }

    /**
     * 创建恢复效果
     * @param {Player} target - 目标玩家
     */
    createHealEffect(target) {
        // 创建恢复效果
        const effect = {
            x: target.x,
            y: target.y,
            radius: 0,
            maxRadius: 60,
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
                const alpha = 0.5 - (this.timer / this.lifetime) * 0.5;

                // 绘制恢复效果
                ctx.fillStyle = `rgba(0, 255, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };

        // 添加到视觉效果列表
        visualEffects.push(effect);
    }

    /**
     * 吸取所有经验宝石
     */
    magnetizeAllXP() {
        // 创建磁铁特效 (在拾取磁铁的位置，而不是玩家位置)
        const effect = {
            x: this.x,  // 使用拾取物自身的位置
            y: this.y,
            radius: 0,
            maxRadius: Math.min(GAME_WIDTH, GAME_HEIGHT) * 0.8, // 更大的视觉效果
            lifetime: 0.6,
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
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                const alpha = 0.6 - (this.timer / this.lifetime) * 0.6;
                ctx.strokeStyle = `rgba(0, 100, 255, ${alpha})`;
                ctx.lineWidth = 5; // 更粗的线条
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.stroke();
            }
        };
        visualEffects.push(effect);

        // 使所有经验宝石飞向玩家
        xpGems.forEach(gem => {
            if (gem && !gem.isGarbage && gem.isActive) {
                gem.isAttracted = true;
                // 显著提高吸引速度，使其快速飞向玩家
                gem.attractionSpeed = gem.baseAttractionSpeed * 3.0; 
                gem.vx = 0; // 清除当前速度，以便直接飞向目标
                gem.vy = 0;
            }
        });
    }

    /**
     * 绘制拾取物
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果拾取物不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;

        try {
            // 获取屏幕坐标
            const screenPos = cameraManager.worldToScreen(this.x, this.y);

            // 绘制发光效果 (已移除磁铁和心的闪烁)
            // let glowColor;
            // switch (this.type) {
            //     case 'heal':
            //         glowColor = 'rgba(0, 255, 0, 0.3)';
            //         break;
            //
            //     case 'magnet':
            //         glowColor = 'rgba(0, 100, 255, 0.3)';
            //         break;
            //
            //     default:
            //         glowColor = 'rgba(255, 255, 255, 0.3)';
            //         break;
            // }
            //
            // // 闪烁效果
            // const glowSize = this.size * (1.3 + 0.3 * Math.sin(this.glowTimer));
            //
            // ctx.fillStyle = glowColor;
            // ctx.beginPath();
            // ctx.arc(screenPos.x, screenPos.y, glowSize, 0, Math.PI * 2);
            // ctx.fill();

            // 设置字体
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;

            // 设置对齐方式
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            // 绘制表情符号
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);

            // 如果生命周期少于3秒，绘制闪烁警告 (已移除)
            // if (this.lifetime < 3) {
            //     // 计算闪烁透明度
            //     const blinkAlpha = Math.sin(this.lifetime * 10) * 0.5 + 0.5;
            //
            //     // 绘制闪烁警告
            //     ctx.strokeStyle = `rgba(255, 0, 0, ${blinkAlpha})`;
            //     ctx.lineWidth = 2;
            //     ctx.beginPath();
            //     ctx.arc(screenPos.x, screenPos.y, this.size * 0.8, 0, Math.PI * 2);
            //     ctx.stroke();
            // }
        } catch (e) {
            console.error("绘制拾取物时出错:", e);
        }
    }
}

/**
 * 宝箱类
 * 玩家收集以获得大量经验值
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

        // 闪烁效果
        this.glowTimer = Math.random() * Math.PI * 2;
        this.glowSpeed = 1.5 + Math.random();
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

        // 如果生命周期结束，标记为垃圾和非活动
        if (this.lifetime <= 0) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }

        // 更新闪烁效果
        this.glowTimer += dt * this.glowSpeed;

        // 检查与目标的碰撞
        if (this.checkCollision(target)) {
            // 打开宝箱
            this.open(target);

            // 标记为已收集、垃圾和非活动
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
        // 防止重复打开或无效目标
        if (this.isOpen || !target || !(target instanceof Player)) return; 
        
        this.isOpen = true; 
        console.log("宝箱已打开！准备触发多次升级...");

        // 创建打开特效
        // this.createOpenEffect(); // 移除打开时的特效

        // --- 核心逻辑：触发多次升级 (带权重) ---
        let numberOfUpgrades;
        const upgradeWeights = [
            { value: 1, weight: 1 }, // 1次升级 (权重1)
            { value: 2, weight: 3 }, // 2次升级 (权重3)
            { value: 3, weight: 5 }, // 3次升级 (权重5 - 最常见)
            { value: 4, weight: 3 }, // 4次升级 (权重3)
            { value: 5, weight: 1 }  // 5次升级 (权重1)
        ];
        const totalWeight = upgradeWeights.reduce((sum, item) => sum + item.weight, 0);
        const randomValue = Math.random() * totalWeight;
        let cumulativeWeight = 0;
        for (const item of upgradeWeights) {
            cumulativeWeight += item.weight;
            if (randomValue < cumulativeWeight) {
                numberOfUpgrades = item.value;
                break;
            }
        }
        // 安全回退，理论上不应触发
        if (typeof numberOfUpgrades === 'undefined') {
            console.warn("宝箱升级次数权重计算出错，默认为3次。");
            numberOfUpgrades = 3; 
        }

        console.log(`宝箱提供 ${numberOfUpgrades} 次升级机会 (权重计算).`);
        
        if (target.pendingLevelUpsFromChest !== undefined && target.currentChestTotalUpgrades !== undefined) {
            // 如果当前没有宝箱升级在进行，则这次是新的序列
            if (target.currentChestTotalUpgrades === 0) {
                target.currentChestTotalUpgrades = numberOfUpgrades;
            } else {
                // 如果已经有宝箱升级在进行，将本次次数也计入总数
                target.currentChestTotalUpgrades += numberOfUpgrades; 
            }
            target.pendingLevelUpsFromChest += numberOfUpgrades; 
        } else {
            console.warn("Player 对象缺少 pendingLevelUpsFromChest 或 currentChestTotalUpgrades 属性! 将直接给予次数.");
            // 即使属性缺失，也尽量尝试赋值
            target.pendingLevelUpsFromChest = (target.pendingLevelUpsFromChest || 0) + numberOfUpgrades;
            target.currentChestTotalUpgrades = (target.currentChestTotalUpgrades || 0) + numberOfUpgrades;
        }
        // --- 结束核心逻辑 ---
    }

    /**
     * 创建宝箱开启效果
     */
    createOpenEffect() {
        // 创建爆炸效果
        const effect = {
            x: this.x,
            y: this.y,
            radius: 0,
            maxRadius: 120,
            lifetime: 0.8,
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
                const alpha = 0.7 - (this.timer / this.lifetime) * 0.7;

                // 绘制爆炸效果
                ctx.fillStyle = `rgba(255, 215, 0, ${alpha})`;
                ctx.beginPath();
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();

                // 绘制光芒
                const rayCount = 12;
                const rayLength = this.radius * 1.5;

                ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
                ctx.lineWidth = 3;

                for (let i = 0; i < rayCount; i++) {
                    const angle = (i / rayCount) * Math.PI * 2;
                    const innerRadius = this.radius * 0.8;

                    ctx.beginPath();
                    ctx.moveTo(
                        screenPos.x + Math.cos(angle) * innerRadius,
                        screenPos.y + Math.sin(angle) * innerRadius
                    );
                    ctx.lineTo(
                        screenPos.x + Math.cos(angle) * rayLength,
                        screenPos.y + Math.sin(angle) * rayLength
                    );
                    ctx.stroke();
                }
            }
        };

        // 添加到视觉效果列表
        visualEffects.push(effect);

        // 创建小星星效果
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 150;

            const star = {
                x: this.x,
                y: this.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                size: 5 + Math.random() * 10,
                lifetime: 0.5 + Math.random() * 0.5,
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

                    // 更新位置
                    this.x += this.vx * dt;
                    this.y += this.vy * dt;

                    // 减速
                    this.vx *= 0.95;
                    this.vy *= 0.95;
                },

                draw: function(ctx) {
                    if (this.isGarbage) return;

                    // 获取屏幕坐标
                    const screenPos = cameraManager.worldToScreen(this.x, this.y);

                    // 计算透明度
                    const alpha = 1 - (this.timer / this.lifetime);

                    // 绘制星星
                    ctx.fillStyle = `rgba(255, 255, 0, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            };

            // 添加到视觉效果列表
            visualEffects.push(star);
        }
    }

    /**
     * 绘制宝箱
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        if (!this.isActive || this.isGarbage || this.collected) {
            // console.log(`Chest not drawn: active=${this.isActive}, garbage=${this.isGarbage}, collected=${this.collected}, emoji=${this.emoji}`);
            return;
        }
        // console.log(`Attempting to draw Chest (Restored Pulsing Glow Attempt): emoji=${this.emoji}`);

        try {
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            const baseSize = this.size;

            const glowValue = Math.sin(this.glowTimer); 
            const sizePulse = (1 + glowValue * 0.1) * baseSize; 
            const alphaPulse = 0.7 + (glowValue + 1) * 0.15; 

            // console.log(`Chest values (Restored Pulsing Glow): sizePulse=${sizePulse}, alphaPulse=${alphaPulse}`);

            if (sizePulse <= 0 || baseSize <= 0) { 
                // console.error("Chest sizePulse or baseSize is zero/negative.");
                return;
            }
            if (alphaPulse <= 0) {
                // console.log("Chest alphaPulse is zero/negative.");
                return;
            }

            ctx.save(); 
            
            ctx.globalAlpha = alphaPulse; 

            ctx.shadowColor = 'rgba(255, 223, 0, 0.7)'; 
            ctx.shadowBlur = 15;    
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;

            ctx.font = `${sizePulse}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);

            ctx.restore(); 

        } catch (e) {
            console.error('Error in Chest.draw (Restored Pulsing Glow Attempt):', e);
        }
    }
}
