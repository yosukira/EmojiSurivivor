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
        
        // 检查并处理被动特殊效果触发
        this.checkPassiveEffectTriggers(dt);
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
            
            // 不再限制玩家移动范围，允许无限大地图

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
            // 获取生命恢复量，直接使用regenAmount属性
            const regenAmount = this.getStat('regenAmount');
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
            // 确保 item 和 item.bonuses 存在
            if (!item || !item.bonuses) return;
            
            // 直接应用来自被动物品的加成
            if (item.bonuses[statName] !== undefined) {
                // 乘法属性（以Multiplier结尾）
                if (statName.endsWith('Multiplier') || statName === 'speedMultiplier') {
                    multiplier *= item.bonuses[statName];
                } 
                // 加法属性（以Bonus结尾）
                else if (statName.endsWith('Bonus') || statName === 'armor' || statName === 'regen' || 
                         statName === 'health' || statName === 'maxHealthBonus' || 
                         statName === 'pickupRadius' || statName === 'projectileCountBonus') {
                    additive += item.bonuses[statName];
                }
            }
            
            // 特殊处理：如果查询最大生命值，也考虑maxHealthMultiplier
            if (statName === 'health' && item.bonuses.maxHealthMultiplier !== undefined) {
                multiplier *= item.bonuses.maxHealthMultiplier;
            }
            
            // 特殊处理：如果查询拾取半径，也考虑pickupRadiusBonus
            if (statName === 'pickupRadius' && item.bonuses.pickupRadiusBonus !== undefined) {
                additive += item.bonuses.pickupRadiusBonus;
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
     * 添加被动物品（别名方法，与 addPassive 功能相同）
     * @param {PassiveItem} passive - 被动物品
     * @returns {boolean} 是否成功添加
     */
    addPassiveItem(passive) {
        return this.addPassive(passive);
    }

    /**
     * 受到伤害
     * @param {number} amount - 伤害量
     * @param {GameObject} source - 伤害来源
     * @param {boolean} isBurnDamage - 是否是燃烧伤害（可选，主要用于敌人区分）
     * @param {boolean} isAuraDamage - 是否是光环伤害（可选）
     * @returns {boolean} 是否死亡
     */
    takeDamage(amount, source, isBurnDamage = false, isAuraDamage = false) {
        // 如果处于无敌状态，不受伤害
        if (this.invincibleTime > 0 && !isAuraDamage && !isBurnDamage) return false; // 光环和燃烧伤害无视普通无敌

        let actualDamage;
        if (isAuraDamage || isBurnDamage) {
            actualDamage = amount; // 光环和燃烧伤害直接应用，不计算护甲，允许小于1
        } else {
        const armor = this.getStat('armor');
            actualDamage = Math.max(1, amount - armor); // 普通攻击计算护甲，最低为1
        }

        // 减少生命值
        this.health -= actualDamage;

        // 显示玩家受到的伤害数字
        const damageTakenColor = isAuraDamage ? 'rgba(128,0,128,0.7)' : (isBurnDamage ? 'orange' : 'rgb(255, 165, 0)'); // 光环用紫色，燃烧用橙色
        const damageTakenSize = GAME_FONT_SIZE * 0.9;
        // 光环伤害显示两位小数，燃烧一位，其他整数
        const damageText = isAuraDamage ? `-${actualDamage.toFixed(2)}` : (isBurnDamage ? `-${actualDamage.toFixed(1)}` : `-${actualDamage.toFixed(0)}`);
        
        // 对于非常小的光环伤害，可以选择不显示
        if (!isAuraDamage || Math.abs(actualDamage) >= 0.01) {
            let damageNumberObj = null;
        if (inactiveDamageNumbers.length > 0) {
                damageNumberObj = inactiveDamageNumbers.pop();
                damageNumberObj.init(this.x, this.y - this.size / 2, damageText, damageTakenSize, damageTakenColor, 0.7);
        } else {
                damageNumberObj = new DamageNumber(this.x, this.y - this.size / 2, damageText, damageTakenSize, damageTakenColor, 0.7);
            }
            damageNumbers.push(damageNumberObj);
        }

        // 设置短暂的无敌时间 (非光环/燃烧伤害)
        if (!isAuraDamage && !isBurnDamage) {
        this.invincibleTime = 0.5;
        }

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
        let nearestEnemy = null;
        let minDistanceSq = maxDistance * maxDistance;

        enemies.forEach(enemy => {
            if (enemy.isGarbage || !enemy.isActive) return;

            // 确保敌人在相机视图内 (或大致在视图内，可以加一点缓冲)
            if (!cameraManager.isPositionInView(enemy.x, enemy.y, enemy.size)) { // 假设 isPositionInView 接受第三个参数作为缓冲/大小
                return; // 如果不在视图内，则跳过此敌人
            }

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                nearestEnemy = enemy;
            }
        });
        return nearestEnemy;
    }

    /**
     * 寻找随机敌人
     * @param {number} maxDistance - 最大距离
     * @returns {Enemy|null} 随机敌人
     */
    findRandomEnemy(maxDistance = Infinity) {
        const validEnemies = [];
        enemies.forEach(enemy => {
            if (enemy.isGarbage || !enemy.isActive) return;

            // 确保敌人在相机视图内
            if (!cameraManager.isPositionInView(enemy.x, enemy.y, enemy.size)) {
                return;
            }

            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distanceSq = dx * dx + dy * dy;

            if (distanceSq <= maxDistance * maxDistance) {
                validEnemies.push(enemy);
            }
        });

        if (validEnemies.length > 0) {
            return validEnemies[Math.floor(Math.random() * validEnemies.length)];
        }
        return null;
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

        ctx.save(); // 最外层保存状态
        ctx.globalAlpha = 1.0; // 确保玩家绘制开始时不透明

        const screenPos = cameraManager.worldToScreen(this.x, this.y);
        const drawSize = this.size; 

        // 白色边框的逻辑已被注释掉，按用户要求移除
        /*
        if (this.statusEffects.slow) {
            // ... border drawing code ...
        }
        */

        // 绘制玩家 (图片或 Emoji)
        if (playerImage && playerImage.complete && playerImage.naturalHeight !== 0) {
            // 无敌闪烁的 save/restore 已在内部处理 alpha
            ctx.save();
        if (this.invincibleTime > 0) {
            const blinkRate = 10;
                if (Math.sin(Date.now() / 100 * blinkRate * 2) > 0) { 
                    ctx.globalAlpha = 0.7; // 提高透明度从0.5到0.7，让玩家更清晰可见
                }
            }
            ctx.drawImage(playerImage, 
                          screenPos.x - drawSize / 2, 
                          screenPos.y - drawSize / 2, 
                          drawSize, 
                          drawSize);
            ctx.restore(); // 恢复到此 save 之前的状态 (可能是 globalAlpha = 1.0)
        } else {
            // 图片加载失败或未加载时，回退到绘制 Emoji
            ctx.save();
            if (this.invincibleTime > 0) {
                const blinkRate = 10;
                 if (Math.sin(Date.now() / 100 * blinkRate * 2) > 0) {
                    ctx.globalAlpha = 0.7; // 提高透明度从0.5到0.7，让玩家更清晰可见
                }
            }
            ctx.font = `${drawSize}px 'Segoe UI Emoji', Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(this.emoji, screenPos.x, screenPos.y);
            ctx.restore(); // 恢复到此 save 之前的状态
        }
        
        // 绘制状态效果 (Character.draw 已经处理了状态效果的 save/restore 和 alpha)
        // 所以这里不需要再次 save/restore 或设置 alpha
        this.drawStatusEffects(ctx);

        ctx.restore(); // 恢复到 Player.draw 最开始保存的状态
    }

    /**
     * 绘制拾取范围
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    drawPickupRadius(ctx) {
        // 不绘制拾取范围，可能是图中看到的白色圆
    }

    /**
     * 检查被动特殊效果触发
     * @param {number} dt - 时间增量
     */
    checkPassiveEffectTriggers(dt) {
        // 检查是否有无敌护盾需要激活(古树精华10级特效)
        const emergencyThreshold = this.getStat('emergencyShield');
        if (emergencyThreshold > 0 && this.health <= this.getStat('health') * emergencyThreshold && this.invincibleTime <= 0) {
            // 激活紧急护盾
            this.invincibleTime = 4.0; // 4秒无敌时间
            console.log("激活古树精华紧急护盾!");
            
            // 创建无敌特效
            this.createShieldEffect();
        }
        
        // 随机触发燃烧、雷电、冰霜等效果
        // 每2秒检查一次是否触发随机元素特效
        this.elementalEffectTimer = (this.elementalEffectTimer || 0) + dt;
        if (this.elementalEffectTimer >= 2.0) {
            this.elementalEffectTimer = 0;
            
            // 获取各元素相关属性
            const burnChance = this.getStat('burnChance') || 0;
            const burnDamage = this.getStat('burnDamage') || 0;
            const burnDuration = this.getStat('burnDuration') || 3.0;
            
            const lightningChance = this.getStat('lightningChance') || (this.getStat('areaShockChance') || 0);
            const lightningDamage = this.getStat('lightningDamage') || 0;
            const lightningChainCount = this.getStat('lightningChainCount') || 1;
            
            const freezeChance = this.getStat('freezeChance') || 0;
            const slowStrength = this.getStat('slowStrength') || 0;
            
            const poisonChance = this.getStat('poisonChance') || (this.getStat('spreadChance') || 0);
            const poisonDamage = this.getStat('poisonDamage') || 0;
            const poisonDuration = this.getStat('poisonDuration') || 3.0;
            
            // 寻找半径内的敌人
            const enemies = this.findEnemiesInRadius(180); // 180半径内敌人
            
            if (enemies.length > 0) {
                // 尝试触发燃烧效果
                if (burnChance > 0 && burnDamage > 0 && Math.random() < burnChance) {
                    // 随机选择一个敌人
                    const targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                    if (targetEnemy && !targetEnemy.isGarbage && targetEnemy.isActive) {
                        // 应用燃烧效果
                        if (typeof targetEnemy.applyBurnEffect === 'function') {
                            targetEnemy.applyBurnEffect(burnDamage, burnDuration, this);
                            console.log(`龙息香料触发! 对敌人施加 ${burnDamage} 燃烧伤害，持续 ${burnDuration} 秒`);
                        } else {
                            // 如果敌人没有烧伤方法，则直接造成伤害
                            targetEnemy.takeDamage(burnDamage, this, true);
                        }
                        
                        // 创建燃烧特效
                        this.createElementalEffect(targetEnemy, 'fire');
                    }
                }
                
                // 尝试触发雷电效果
                if (lightningChance > 0 && lightningDamage > 0 && Math.random() < lightningChance) {
                    // 随机选择一个敌人
                    const targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                    if (targetEnemy && !targetEnemy.isGarbage && targetEnemy.isActive) {
                        // 应用闪电效果，包括链式伤害
                        this.applyLightningEffect(targetEnemy, lightningDamage, lightningChainCount);
                        console.log(`雷光护符触发! 对敌人造成 ${lightningDamage} 闪电伤害，链接 ${lightningChainCount} 次`);
                    }
                }
                
                // 尝试触发冰冻效果
                if (freezeChance > 0 && Math.random() < freezeChance) {
                    // 随机选择一个敌人
                    const targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                    if (targetEnemy && !targetEnemy.isGarbage && targetEnemy.isActive) {
                        // 应用冰冻效果
                        if (typeof targetEnemy.applyFreezeEffect === 'function') {
                            targetEnemy.applyFreezeEffect(2.0, this); // 冻结2秒
                            console.log("寒冰之心触发! 冻结敌人 2 秒");
                        } else if (typeof targetEnemy.applySlowEffect === 'function' && slowStrength > 0) {
                            // 如果没有冻结方法但有减速方法，则应用减速
                            targetEnemy.applySlowEffect(slowStrength, 3.0, this);
                            console.log(`寒冰之心触发! 减速敌人 ${Math.round(slowStrength * 100)}%, 持续 3 秒`);
                        }
                        
                        // 创建冰冻特效
                        this.createElementalEffect(targetEnemy, 'ice');
                    }
                }
                
                // 尝试触发毒素效果
                if (poisonChance > 0 && poisonDamage > 0 && Math.random() < poisonChance) {
                    // 随机选择一个敌人
                    const targetEnemy = enemies[Math.floor(Math.random() * enemies.length)];
                    if (targetEnemy && !targetEnemy.isGarbage && targetEnemy.isActive) {
                        // 应用毒素效果
                        if (typeof targetEnemy.applyPoisonEffect === 'function') {
                            targetEnemy.applyPoisonEffect(poisonDamage, poisonDuration, this);
                            console.log(`毒素宝珠触发! 对敌人施加 ${poisonDamage} 毒素伤害，持续 ${poisonDuration} 秒`);
                        } else {
                            // 如果敌人没有中毒方法，则直接造成伤害
                            targetEnemy.takeDamage(poisonDamage, this);
                        }
                        
                        // 创建毒素特效
                        this.createElementalEffect(targetEnemy, 'poison');
                    }
                }
            }
        }
    }
    
    /**
     * 创建护盾特效
     */
    createShieldEffect() {
        // 创建护盾特效
        const effect = {
            x: this.x,
            y: this.y,
            radius: this.size * 1.5,
            maxRadius: this.size * 2.5,
            timer: 0,
            maxTime: 1.0,
            isGarbage: false,
            player: this,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.maxTime) {
                    this.isGarbage = true;
                    return;
                }
                
                // 更新位置跟随玩家
                this.x = this.player.x;
                this.y = this.player.y;
                
                // 更新大小
                const progress = this.timer / this.maxTime;
                this.radius = this.maxRadius * (1 - progress) + this.radius * progress;
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
                const screenPos = cameraManager.worldToScreen(this.x, this.y);
                
                // 护盾渐变效果
                ctx.beginPath();
                const gradient = ctx.createRadialGradient(
                    screenPos.x, screenPos.y, this.radius * 0.7,
                    screenPos.x, screenPos.y, this.radius
                );
                
                gradient.addColorStop(0, 'rgba(100, 255, 100, 0)');
                gradient.addColorStop(0.5, 'rgba(100, 255, 100, 0.3)');
                gradient.addColorStop(1, 'rgba(100, 255, 100, 0)');
                
                ctx.fillStyle = gradient;
                ctx.arc(screenPos.x, screenPos.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        };
        
        // 添加特效
        visualEffects.push(effect);
    }
    
    /**
     * 应用闪电效果
     * @param {Enemy} target - 目标敌人
     * @param {number} damage - 伤害值
     * @param {number} chainCount - 链接次数
     */
    applyLightningEffect(target, damage, chainCount) {
        if (!target || target.isGarbage || !target.isActive) return;
        
        // 对目标造成伤害
        target.takeDamage(damage, this);
        
        // 创建闪电效果
        this.createElementalEffect(target, 'lightning');
        
        // 如果链接次数大于0，寻找下一个目标
        if (chainCount > 0) {
            // 已命中的目标
            const hitTargets = new Set([target]);
            
            // 寻找周围敌人
            const nearbyEnemies = enemies
                .filter(enemy => enemy && !enemy.isGarbage && enemy.isActive && !hitTargets.has(enemy))
                .map(enemy => ({
                    enemy,
                    distance: Math.sqrt(
                        Math.pow(enemy.x - target.x, 2) + 
                        Math.pow(enemy.y - target.y, 2)
                    )
                }))
                .filter(item => item.distance < 150) // 150范围内的敌人
                .sort((a, b) => a.distance - b.distance);
            
            // 如果有可链接的敌人
            if (nearbyEnemies.length > 0) {
                const nextTarget = nearbyEnemies[0].enemy;
                
                // 创建链接特效
                const chainEffect = {
                    from: { x: target.x, y: target.y },
                    to: { x: nextTarget.x, y: nextTarget.y },
                    timer: 0,
                    duration: 0.3,
                    isGarbage: false,
                    
                    update: function(dt) {
                        this.timer += dt;
                        if (this.timer >= this.duration) {
                            this.isGarbage = true;
                        }
                    },
                    
                    draw: function(ctx) {
                        if (this.isGarbage) return;
                        
                        const fromPos = cameraManager.worldToScreen(this.from.x, this.from.y);
                        const toPos = cameraManager.worldToScreen(this.to.x, this.to.y);
                        
                        // 绘制闪电
                        ctx.strokeStyle = 'rgba(100, 180, 255, 0.7)';
                        ctx.lineWidth = 3;
                        
                        ctx.beginPath();
                        ctx.moveTo(fromPos.x, fromPos.y);
                        
                        // 添加一些随机的中间点，使闪电看起来不那么直
                        const segmentCount = 4;
                        const dx = (toPos.x - fromPos.x) / segmentCount;
                        const dy = (toPos.y - fromPos.y) / segmentCount;
                        
                        for (let i = 1; i < segmentCount; i++) {
                            const offsetX = (Math.random() - 0.5) * 15;
                            const offsetY = (Math.random() - 0.5) * 15;
                            ctx.lineTo(
                                fromPos.x + dx * i + offsetX, 
                                fromPos.y + dy * i + offsetY
                            );
                        }
                        
                        ctx.lineTo(toPos.x, toPos.y);
                        ctx.stroke();
                    }
                };
                
                // 添加链接特效
                visualEffects.push(chainEffect);
                
                // 递归调用，链接到下一个敌人
                // 稍微延迟，使视觉效果更好
                setTimeout(() => {
                    this.applyLightningEffect(nextTarget, damage * 0.8, chainCount - 1);
                }, 100);
            }
        }
    }
    
    /**
     * 创建元素效果
     * @param {Enemy} target - 目标敌人
     * @param {string} elementType - 元素类型: 'fire', 'lightning', 'ice', 'poison'
     */
    createElementalEffect(target, elementType) {
        if (!target || target.isGarbage || !target.isActive) return;
        
        let color, emoji, size, duration;
        
        // 根据元素类型设置参数
        switch (elementType) {
            case 'fire':
                color = 'rgba(255, 100, 0, 0.7)';
                emoji = '🔥';
                size = target.size * 1.2;
                duration = 0.8;
                break;
            case 'lightning':
                color = 'rgba(100, 180, 255, 0.7)';
                emoji = '⚡';
                size = target.size * 1.2;
                duration = 0.5;
                break;
            case 'ice':
                color = 'rgba(150, 220, 255, 0.7)';
                emoji = '❄️';
                size = target.size * 1.2;
                duration = 1.0;
                break;
            case 'poison':
                color = 'rgba(120, 255, 120, 0.7)';
                emoji = '☠️';
                size = target.size * 1.2;
                duration = 0.8;
                break;
            default:
                color = 'rgba(255, 255, 255, 0.5)';
                emoji = '✨';
                size = target.size;
                duration = 0.5;
        }
        
        // 创建效果
        const effect = {
            x: target.x,
            y: target.y,
            size: size * 0.8,
            maxSize: size,
            color: color,
            emoji: emoji,
            timer: 0,
            duration: duration,
            isGarbage: false,
            target: target,
            
            update: function(dt) {
                this.timer += dt;
                if (this.timer >= this.duration) {
                    this.isGarbage = true;
                    return;
                }
                
                // 更新位置跟随目标
                if (this.target && !this.target.isGarbage && this.target.isActive) {
                    this.x = this.target.x;
                    this.y = this.target.y;
                }
                
                // 更新大小
                const progress = this.timer / this.duration;
                this.size = this.maxSize * (1 - progress);
            },
            
            draw: function(ctx) {
                if (this.isGarbage) return;
                
        const screenPos = cameraManager.worldToScreen(this.x, this.y);

                // 绘制光环
                ctx.beginPath();
                ctx.fillStyle = this.color;
                ctx.arc(screenPos.x, screenPos.y, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                
                // 绘制emoji
                ctx.font = `${this.size}px 'Segoe UI Emoji', Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(this.emoji, screenPos.x, screenPos.y);
            }
        };
        
        // 添加效果
        visualEffects.push(effect);
    }
}