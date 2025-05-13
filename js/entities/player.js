/**
 * 玩家类
 * 玩家角色
 */
class Player extends Character {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    constructor(x, y) {
        // 调用父类构造函数
        super(x, y, EMOJI.PLAYER, GAME_FONT_SIZE * 1.2, PLAYER_DEFAULT_STATS);
        // 等级
        this.level = 1;

        // 经验值
        this.xp = 0;

        // 下一级所需经验值
        this.xpToNextLevel = LEVEL_XP_REQUIREMENTS[0];

        // 武器列表
        this.weapons = [];

        // 被动物品列表
        this.passiveItems = [];

        // 最大武器数量
        this.maxWeapons = PLAYER_DEFAULT_STATS.maxWeapons;

        // 最大被动物品数量
        this.maxPassives = PLAYER_DEFAULT_STATS.maxPassives;
        // 拾取半径
        this.pickupRadius = PLAYER_DEFAULT_STATS.pickupRadius;
        this.pickupRadiusSq = this.pickupRadius * this.pickupRadius;

        // 最后移动方向
        this.lastMoveDirection = { x: 0, y: 1 };
        // 生命恢复计时器
        this.regenTimer = 0;

        // 无敌时间
        this.invincibleTime = 0;
        
        // 新增：宝箱待处理升级次数
        this.pendingLevelUpsFromChest = 0;
        
        // 新增：当前宝箱序列的总升级次数
        this.currentChestTotalUpgrades = 0;
    }

    /**
     * 更新玩家状态
     * @param {number} dt - 时间增量
     * @param {Object} keys - 按键状态
     */
    update(dt, keys) {
        // 如果玩家不活动或已标记为垃圾，不更新
        if (!this.isActive || this.isGarbage) return;
        // 调用父类更新方法
        super.update(dt);
        // 处理移动
        this.handleMovement(dt, keys);

        // 更新武器
        this.updateWeapons(dt);

        // 更新生命恢复
        this.updateRegen(dt);
    }

    /**
     * 处理移动
     * @param {number} dt - 时间增量
     * @param {Object} keys - 按键状态
     */
    handleMovement(dt, keys) {
        // 如果被眩晕，不移动
        if (this.isStunned()) return;

        // 计算移动方向
        let dx = 0;
        let dy = 0;

        // 水平移动
        if (keys['a'] || keys['arrowleft']) dx -= 1;
        if (keys['d'] || keys['arrowright']) dx += 1;

        // 垂直移动
        if (keys['w'] || keys['arrowup']) dy -= 1;
        if (keys['s'] || keys['arrowdown']) dy += 1;

        // 如果有移动，更新最后移动方向
        if (dx !== 0 || dy !== 0) {
            // 归一化方向
            const length = Math.sqrt(dx * dx + dy * dy);
            dx /= length;
            dy /= length;

            // 更新最后移动方向
            this.lastMoveDirection.x = dx;
            this.lastMoveDirection.y = dy;

            // 获取当前速度
            const currentSpeed = this.getCurrentSpeed();

            // 计算新位置
            let newX = this.x + dx * currentSpeed * dt;
            let newY = this.y + dy * currentSpeed * dt;
            
            // 限制玩家不能移动到屏幕外
            const margin = this.size / 2;
            
            // 获取相机视口边界
            const viewportMinX = cameraManager.x - GAME_WIDTH / 2;
            const viewportMaxX = cameraManager.x + GAME_WIDTH / 2;
            const viewportMinY = cameraManager.y - GAME_HEIGHT / 2;
            const viewportMaxY = cameraManager.y + GAME_HEIGHT / 2;
            
            // 限制X坐标
            newX = Math.max(viewportMinX + margin, Math.min(viewportMaxX - margin, newX));
            // 限制Y坐标
            newY = Math.max(viewportMinY + margin, Math.min(viewportMaxY - margin, newY));

            // 更新位置
            this.x = newX;
            this.y = newY;
        }
    }

    /**
     * 更新武器
     * @param {number} dt - 时间增量
     */
    updateWeapons(dt) {
        // 更新所有武器
        this.weapons.forEach(weapon => {
            weapon.update(dt, this);
        });
    }

    /**
     * 更新生命恢复
     * @param {number} dt - 时间增量
     */
    updateRegen(dt) {
        // 更新生命恢复计时器
        this.regenTimer += dt;

        // 如果计时器超过1秒，恢复生命
        if (this.regenTimer >= 1.0) {
            // 获取生命恢复量
            const regenAmount = this.getStat('regen');
            // 如果有生命恢复，恢复生命
            if (regenAmount > 0) {
                this.heal(regenAmount);
            }
            // 重置计时器
            this.regenTimer = 0;
        }
    }

    /**
     * 获取属性
     * @param {string} statName - 属性名称
     * @returns {number} 属性值
     */
    getStat(statName) {
        // 基础属性
        let baseStat = PLAYER_DEFAULT_STATS[statName] || 0;

        // 加成乘数
        let multiplier = 1.0;

        // 加成加值
        let additive = 0;

        // 应用被动物品加成
        this.passiveItems.forEach(item => {
            // 如果有该属性的加成
            if (item.bonuses[statName]) {
                // 如果有乘数加成
                if (item.bonuses[statName].mult) {
                    multiplier += item.bonuses[statName].mult;
                }

                // 如果有加值加成
                if (item.bonuses[statName].add) {
                    additive += item.bonuses[statName].add;
                }
            }
        });

        // 计算最终属性值
        return Math.max(0, (baseStat + additive) * multiplier);
    }

    /**
     * 重新计算属性
     */
    recalculateStats() {
        // 重新计算拾取半径
        this.pickupRadius = this.getStat('pickupRadius');
        this.pickupRadiusSq = this.pickupRadius * this.pickupRadius;

        // 重新计算最大武器数量
        this.maxWeapons = this.getStat('maxWeapons');

        // 重新计算最大被动物品数量
        this.maxPassives = this.getStat('maxPassives');
    }

    /**
     * 获得经验值
     * @param {number} amount - 经验值数量
     */
    gainXP(amount) {
        // 如果已达到最大等级，不获得经验值
        if (this.level >= MAX_LEVEL) return;
        // 增加经验值
        this.xp += amount;

        // 如果经验值达到下一级所需经验值，升级
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        }
    }

    /**
     * 升级
     */
    levelUp() {
        // 增加等级
        this.level++;

        // 如果已达到最大等级，设置经验值为0
        if (this.level >= MAX_LEVEL) {
            this.xp = 0;
            this.xpToNextLevel = Infinity;
            return;
        }

        // 计算剩余经验值
        this.xp -= this.xpToNextLevel;

        // 计算下一级所需经验值
        const levelIndex = Math.min(this.level - 1, LEVEL_XP_REQUIREMENTS.length - 1);
        this.xpToNextLevel = LEVEL_XP_REQUIREMENTS[levelIndex];

        // 如果经验值仍然达到下一级所需经验值，继续升级
        if (this.xp >= this.xpToNextLevel) {
            this.levelUp();
        } else {
            // 否则，显示升级选项
            // 只有在没有待处理的宝箱升级时，才由普通升级触发 isLevelUp
            if (this.pendingLevelUpsFromChest > 0) {
                // 如果有宝箱升级正在等待或进行中，普通升级不应抢占 isLevelUp。
                // 经验会保留，宝箱升级序列结束后，如果经验仍然满足条件，
                // 理论上应该由后续的经验获取再次触发 player.gainXP -> player.levelUp 来处理。
                // 或者在宝箱序列结束后，在 game.js 中添加逻辑主动检查一次。
                // 目前的策略是简单地不设置 isLevelUp，让宝箱升级优先。
                console.log("Player.levelUp: XP met for next level, but pending chest upgrades exist. Suppressing normal level up screen trigger.");
            } else {
                isLevelUp = true; // 设置全局标志，由 game.js 处理升级界面的显示
            }
        }
    }

    /**
     * 恢复生命值
     * @param {number} amount - 恢复量
     */
    heal(amount) {
        // 增加生命值
        this.health = Math.min(this.getStat('health'), this.health + amount);
    }

    /**
     * 添加武器
     * @param {Weapon} weapon - 武器
     * @returns {boolean} 是否成功添加
     */
    addWeapon(weapon) {
        // 如果武器数量已达上限，不添加
        if (this.weapons.length >= this.maxWeapons) return false;

        // 添加武器
        this.weapons.push(weapon);

        return true;
    }

    /**
     * 添加被动物品
     * @param {PassiveItem} passive - 被动物品
     * @returns {boolean} 是否成功添加
     */
    addPassive(passive) {
        // 如果被动物品数量已达上限，不添加
        if (this.passiveItems.length >= this.maxPassives) return false;

        // 添加被动物品
        this.passiveItems.push(passive);

        // 重新计算属性
        this.recalculateStats();

        return true;
    }

    /**
     * 受到伤害
     * @param {number} amount - 伤害量
     * @param {GameObject} source - 伤害来源
     * @returns {boolean} 是否死亡
     */
    takeDamage(amount, source) {
        // 如果处于无敌状态，不受伤害
        if (this.invincibleTime > 0) return;

        // 计算护甲减伤
        const armor = this.getStat('armor');
        const actualDamage = Math.max(1, amount - armor);

        // 减少生命值
        this.health -= actualDamage;

        // 显示玩家受到的伤害数字 (不同颜色和大小)
        const damageTakenColor = 'rgb(255, 165, 0)'; // 橙色
        const damageTakenSize = GAME_FONT_SIZE * 0.9; // 稍大一点
        
        // 在 Player 类中直接创建和管理伤害数字
        let damageNumber = null;
        if (inactiveDamageNumbers.length > 0) {
            damageNumber = inactiveDamageNumbers.pop();
            damageNumber.init(this.x, this.y - this.size / 2, `-${actualDamage.toFixed(1)}`, damageTakenSize, damageTakenColor, 0.7);
        } else {
            damageNumber = new DamageNumber(this.x, this.y - this.size / 2, `-${actualDamage.toFixed(1)}`, damageTakenSize, damageTakenColor, 0.7);
        }
        damageNumbers.push(damageNumber);


        // 设置短暂的无敌时间
        this.invincibleTime = 0.5;

        // 检查是否死亡
        if (this.health <= 0) {
            this.onDeath(source);
            return true;
        }
        return false;
    }

    /**
     * 死亡处理
     * @param {GameObject} killer - 击杀者
     */
    onDeath(killer) {
        // 调用父类死亡处理
        super.onDeath(killer);

        // 游戏结束
        gameOver();
    }

    /**
     * 寻找最近的敌人
     * @param {number} maxDistance - 最大距离
     * @returns {Enemy|null} 最近的敌人
     */
    findNearestEnemy(maxDistance = Infinity) {
        // 如果没有敌人，返回null
        if (enemies.length === 0) return null;

        let bestTarget = null;
        let bestScore = Infinity;
        const maxDistSq = maxDistance * maxDistance;

        // 遍历所有敌人
        enemies.forEach(enemy => {
            // 跳过不活动或已标记为垃圾的敌人
            if (enemy.isGarbage || !enemy.isActive) return;

            // 计算距离的平方
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;

            // 如果超出最大距离，则跳过
            if (distSq > maxDistSq) return;

            // 计算分数：距离越近，血量越少，分数越低
            // 距离权重为1，血量权重可以调整，例如 0.5
            // 为了避免除以零，如果 enemy.maxHealth 为0或未定义，则将 healthFactor 设为较大值
            const healthFactor = (enemy.maxHealth && enemy.maxHealth > 0) ? (enemy.health / enemy.maxHealth) : 1;
            // 综合考虑距离和血量，距离的平方根更符合直观感受
            const score = Math.sqrt(distSq) + healthFactor * 50; // 血量权重为50，可以根据需要调整

            if (score < bestScore) {
                bestScore = score;
                bestTarget = enemy;
            }
        });

        return bestTarget;
    }

    /**
     * 寻找随机敌人
     * @param {number} maxDistance - 最大距离
     * @returns {Enemy|null} 随机敌人
     */
    findRandomEnemy(maxDistance = Infinity) {
        // 如果没有敌人，返回null
        if (enemies.length === 0) return null;

        // 可用敌人列表
        const availableEnemies = enemies.filter(enemy => {
            // 跳过不活动或已标记为垃圾的敌人
            if (enemy.isGarbage || !enemy.isActive) return false;

            // 计算距离
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;

            // 检查是否在最大距离内
            return distSq <= maxDistance * maxDistance;
        });

        // 如果没有可用敌人，返回null
        if (availableEnemies.length === 0) return null;

        // 返回随机敌人
        return availableEnemies[Math.floor(Math.random() * availableEnemies.length)];
    }

    /**
     * 寻找范围内的敌人
     * @param {number} radius - 半径
     * @returns {Enemy[]} 范围内的敌人
     */
    findEnemiesInRadius(radius) {
        // 可用敌人列表
        const inRangeEnemies = enemies.filter(enemy => {
            // 跳过不活动或已标记为垃圾的敌人
            if (enemy.isGarbage || !enemy.isActive) return false;
            // 计算距离
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distSq = dx * dx + dy * dy;

            // 检查是否在半径内
            return distSq <= radius * radius;
        });

        return inRangeEnemies;
    }

    /**
     * 绘制玩家
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 如果玩家不活动或已标记为垃圾，不绘制
        if (!this.isActive || this.isGarbage) return;

        // 绘制拾取范围 (如果需要)
        // this.drawPickupRadius(ctx);

        // 保存当前context状态
        ctx.save();
        
        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        
        // 确保绘制不透明
        ctx.globalAlpha = 1.0;
        
        // 如果有无敌时间，使其闪烁
        if (this.invincibleTime > 0) {
            const blinkRate = 10;
            if (Math.sin(this.invincibleTime * blinkRate) > 0) {
                ctx.globalAlpha = 0.7;
            }
        }

        // 绘制玩家图片（如果已加载）
        if (playerImage && playerImage.complete && playerImage.naturalWidth > 0) {
            const drawX = screenPos.x - this.size / 2;
            const drawY = screenPos.y - this.size / 2;
            
            // --- 添加白色描边 --- 
            const outlineOffset = 2; // 描边宽度
            ctx.globalAlpha = ctx.globalAlpha * 0.8; // 描边可以稍微透明一点
            
            // 存储原始 composite operation
            const originalCompositeOperation = ctx.globalCompositeOperation;
            // 设置 composite operation 以便白色描边在图片下方
            // 这需要浏览器支持，如果效果不理想可以注释掉这两行
            // ctx.globalCompositeOperation = 'destination-over'; 
            
            // 绘制白色描边（通过偏移绘制）
            ctx.drawImage(playerImage, drawX - outlineOffset, drawY, this.size, this.size); // 左
            ctx.drawImage(playerImage, drawX + outlineOffset, drawY, this.size, this.size); // 右
            ctx.drawImage(playerImage, drawX, drawY - outlineOffset, this.size, this.size); // 上
            ctx.drawImage(playerImage, drawX, drawY + outlineOffset, this.size, this.size); // 下
            // 可选：对角线描边，使轮廓更平滑
            ctx.drawImage(playerImage, drawX - outlineOffset, drawY - outlineOffset, this.size, this.size); 
            ctx.drawImage(playerImage, drawX + outlineOffset, drawY - outlineOffset, this.size, this.size);
            ctx.drawImage(playerImage, drawX - outlineOffset, drawY + outlineOffset, this.size, this.size);
            ctx.drawImage(playerImage, drawX + outlineOffset, drawY + outlineOffset, this.size, this.size);

            // --- 白色描边结束 ---
            
            // 恢复 alpha 和 composite operation
            ctx.globalAlpha = ctx.globalAlpha / 0.8; // 恢复原始 alpha
            // ctx.globalCompositeOperation = originalCompositeOperation; // 恢复

            // 绘制原始图片
            ctx.drawImage(playerImage, drawX, drawY, this.size, this.size);

        } else {
            // 图片加载失败或未完成，则回退到绘制 Emoji
            ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
        }
        
        // 恢复context状态
        ctx.restore();

        // 绘制血条 (调用父类或 GameObject 的方法，如果需要)
        // super.drawHealthBar(ctx); // 假设有这个方法

        // 绘制状态效果 (调用父类 Character 的方法)
        this.drawStatusEffects(ctx);
    }

    /**
     * 绘制拾取范围
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawPickupRadius(ctx) {
        // 获取屏幕坐标
        const screenPos = cameraManager.worldToScreen(this.x, this.y);

        // 计算半径
        const radius = this.pickupRadius * cameraManager.zoom;

        // 绘制拾取范围 (已注释掉)
        // ctx.strokeStyle = 'rgba(100, 200, 255, 0.2)';
        // ctx.lineWidth = 1;
        // ctx.beginPath();
        // ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
        // ctx.stroke();
    }
}