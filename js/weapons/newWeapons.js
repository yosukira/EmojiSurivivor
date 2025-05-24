/**
 * EmojiSurvivor - 新武器
 * 这个文件包含10种新武器的实现
 */

/**
 * 泡泡魔棒
 * 发射缓慢漂浮的泡泡，困住敌人数秒
 */
class BubbleWandWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "泡泡魔棒";
    static Emoji = "🧼";
    static MaxLevel = 10;
    static Evolution = {
        requires: "Magnet",
        evolvesTo: "GravityBubble"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(BubbleWandWeapon.Name, BubbleWandWeapon.Emoji, 1.2, BubbleWandWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 3 + (this.level - 1) * 2,  // 基础伤害较低
            projectileSpeed: 150 + (this.level - 1) * 10,  // 速度缓慢
            cooldown: Math.max(0.8, this.baseCooldown - (this.level - 1) * 0.07),
            count: 1 + Math.floor((this.level - 1) / 2),  // 每2级增加一个泡泡
            trapDuration: 2 + (this.level - 1) * 0.4,  // 困住敌人的时间
            splitOnBurst: this.level === 10,  // 10级时泡泡爆炸分裂
            duration: 3.5  // 泡泡存在时间
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        if (!owner) return; // 确保owner存在
        
        const ownerStats = this.getOwnerStats(owner);
        const projectileCount = Math.min(this.stats.count + (ownerStats.projectileCountBonus || 0), 8); // 限制最大数量为8个
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const trapDuration = this.stats.trapDuration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * 1.2 * (ownerStats.areaMultiplier || 1);
        const splitOnBurst = this.stats.splitOnBurst;
        
        // 限制屏幕上泡泡总数
        const currentBubbleCount = projectiles.filter(p => p instanceof BubbleProjectile).length;
        if (currentBubbleCount > 50) return; // 降低限制从100到50
        
        // 获取玩家精确位置，作为所有泡泡的发射起点
        const startX = owner.x;
        const startY = owner.y;

        // 寻找目标，与匕首武器索敌逻辑一致
        let target = owner.findNearestEnemy(GAME_WIDTH * 1.5) || {
            x: owner.x + owner.lastMoveDirection.x * 100,
            y: owner.y + owner.lastMoveDirection.y * 100
        };
        
        // 计算方向
        const dx = target.x - startX;
        const dy = target.y - startY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
        const dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
        
        // 计算角度和扇形范围
        const baseAngle = Math.atan2(dirY, dirX);
        const angleSpread = Math.PI * 0.6;

        // 随机方向发射泡泡
        for (let i = 0; i < projectileCount; i++) {
            // 计算发射角度，在敌人方向的扇形范围内
            const randomAngle = baseAngle + (Math.random() - 0.5) * angleSpread;
            
            const dirX = Math.cos(randomAngle);
            const dirY = Math.sin(randomAngle);
            
            // 添加一点随机性到速度
            const speedVariation = 0.8 + Math.random() * 0.4; // 速度在80%-120%之间变化
            const vx = dirX * speed * speedVariation;
            const vy = dirY * speed * speedVariation;
            
            // 创建泡泡投射物，确保从玩家位置发射
            const bubble = new BubbleProjectile(
                startX, startY, size, vx, vy, damage, duration, 
                ownerStats, trapDuration, splitOnBurst
            );
            
            // 设置所有者和初始位置确认
            bubble.owner = owner;
            bubble.sourceX = startX;
            bubble.sourceY = startY;
            projectiles.push(bubble);
        }
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `发射${this.stats.count}个泡泡，困住敌人${this.stats.trapDuration.toFixed(1)}秒，造成${this.stats.damage}伤害。`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "发射魔法泡泡，困住敌人数秒并造成伤害。";
    }
}

/**
 * 混沌骰子
 * 掷出一个骰子，随机触发六种效果之一：火焰、冰冻、雷电、击退、护盾或治疗
 */
class ChaosDiceWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "混沌骰子";
    static Emoji = "🎲";
    static MaxLevel = 10;
    static Evolution = {
        requires: "Book",
        evolvesTo: "FateDice"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(ChaosDiceWeapon.Name, ChaosDiceWeapon.Emoji, 1.5, ChaosDiceWeapon.MaxLevel);
        
        // 可能的效果
        this.effects = [
            { id: "fire", name: "火焰" },    // 火焰
            { id: "ice", name: "冰冻" },     // 冰冻
            { id: "lightning", name: "雷电" }, // 雷电
            { id: "knockback", name: "击退" }, // 击退
            { id: "shield", name: "护盾" },  // 护盾
            { id: "heal", name: "治疗" }     // 治疗
        ];
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 8 + (this.level - 1) * 3,  // 基础伤害
            projectileSpeed: 250 + (this.level - 1) * 15,  // 投掷速度
            cooldown: Math.max(0.65, 1.5 - (this.level - 1) * 0.08),  // 冷却时间
            count: 1 + Math.floor((this.level - 1) / 3),  // 每3级额外投一个骰子
            area: 70 + (this.level - 1) * 10,  // 影响范围
            effectPower: 1 + (this.level - 1) * 0.15,  // 效果强度
            dualEffect: this.level === 10,  // 10级时同时触发两种效果
            duration: 2.5  // 骰子持续时间
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        const projectileCount = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const area = this.stats.area * (ownerStats.areaMultiplier || 1);
        const effectPower = this.stats.effectPower;
        const dualEffect = this.stats.dualEffect;
        const size = GAME_FONT_SIZE * 1.2;
        
        // 投掷多个骰子
        enemies.forEach(enemy => {
            if (projectiles.length >= projectileCount || !enemy || enemy.isGarbage || !enemy.isActive) return;
            
            // 计算方向
            const dx = enemy.x - owner.x;
            const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // 如果敌人太远，跳过
            if (dist > 600) return;
            
            // 计算方向
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            // 添加随机性
            const randomAngle = (Math.random() - 0.5) * Math.PI * 0.2;
            const finalDirX = Math.cos(randomAngle) * dirX - Math.sin(randomAngle) * dirY;
            const finalDirY = Math.sin(randomAngle) * dirX + Math.cos(randomAngle) * dirY;
            
            // 计算速度
            const vx = finalDirX * speed;
            const vy = finalDirY * speed;
            
            // 随机选择效果
            const effect1 = this.effects[Math.floor(Math.random() * this.effects.length)];
            
            // 第二个效果不能与第一个相同
            let effect2;
                do {
                    effect2 = this.effects[Math.floor(Math.random() * this.effects.length)];
            } while (effect2.id === effect1.id);
            
            // 创建骰子投射物
            const dice = new ChaosDiceProjectile(
                owner.x, owner.y, size, vx, vy, damage, duration,
                ownerStats, area, effectPower, effect1, dualEffect ? effect2 : null
            );
            
            dice.owner = owner;
            projectiles.push(dice);
        });
        
        // 如果没有找到合适的敌人目标，向随机方向投掷
        if (projectiles.length === 0) {
            for (let i = 0; i < projectileCount; i++) {
                // 随机角度
                const angle = Math.random() * Math.PI * 2;
                const vx = Math.cos(angle) * speed;
                const vy = Math.sin(angle) * speed;
                
                // 随机效果
                const effect1 = this.effects[Math.floor(Math.random() * this.effects.length)];
                
                // 第二个效果不能与第一个相同
                let effect2;
                do {
                    effect2 = this.effects[Math.floor(Math.random() * this.effects.length)];
                } while (effect2.id === effect1.id);
                
                // 创建骰子投射物
                const dice = new ChaosDiceProjectile(
                    owner.x, owner.y, size, vx, vy, damage, duration,
                    ownerStats, area, effectPower, effect1, dualEffect ? effect2 : null
                );
                
                dice.owner = owner;
                projectiles.push(dice);
            }
        }
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        let desc = `投掷${this.stats.count}个骰子，造成${this.stats.damage}伤害并在半径${this.stats.area}范围内触发随机效果。`;
        if (this.stats.dualEffect) {
            desc += " 每个骰子同时触发两种效果。";
        }
        return desc;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "投掷骰子，随机触发六种效果之一：火焰、冰冻、雷电、击退、护盾或治疗。";
    }
}

/**
 * 磁力枪
 * 发射磁力波，吸引敌人并造成范围伤害
 */
class MagnetGunWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "磁力枪";
    static Emoji = "🧲";
    static MaxLevel = 10;
    static Evolution = {
        requires: "Whip",
        evolvesTo: "GravityGun"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(MagnetGunWeapon.Name, MagnetGunWeapon.Emoji, 1.2, MagnetGunWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 4 + (this.level - 1) * 2,  // 基础伤害
            projectileSpeed: 220 + (this.level - 1) * 20,  // 投射物速度
            cooldown: Math.max(0.85, 1.3 - (this.level - 1) * 0.05),  // 冷却时间
            count: 1 + Math.floor((this.level - 1) / 2.5),  // 每3级增加一个投射物
            pullRadius: 100 + (this.level - 1) * 10,  // 吸引半径
            pullStrength: 50 + (this.level - 1) * 10,  // 吸引强度
            stun: this.level === 10,  // 10级才有晕眩效果
            stunDuration: 0.5,  // 晕眩持续时间
            duration: 3,  // 持续时间
            pierce: Math.min(3, 1 + Math.floor((this.level - 1) / 3))  // 穿透数量
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        const projectileCount = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const pullRadius = this.stats.pullRadius * (ownerStats.areaMultiplier || 1);
        const pullStrength = this.stats.pullStrength;
        const stun = this.stats.stun;
        const stunDuration = this.stats.stunDuration * (ownerStats.durationMultiplier || 1);
        const duration = this.stats.duration * (ownerStats.durationMultiplier || 1);
        const pierce = this.stats.pierce + (ownerStats.pierceBonus || 0);
        const size = GAME_FONT_SIZE * 1.2;
        
        // 获取玩家当前移动方向
        const playerDirectionX = owner.lastMoveDirectionX || 0;
        const playerDirectionY = owner.lastMoveDirectionY || 0;
        const hasPlayerDirection = playerDirectionX !== 0 || playerDirectionY !== 0;
        
        // 优先朝玩家移动方向寻找敌人，其次是最近的敌人
        const visibleEnemies = this.getVisibleEnemies(300);
        let targetEnemies = [];
        
        // 如果玩家有移动方向，优先考虑该方向的敌人
        if (hasPlayerDirection && visibleEnemies.length > 0) {
            // 计算玩家朝向的单位向量
            const dirMag = Math.sqrt(playerDirectionX * playerDirectionX + playerDirectionY * playerDirectionY);
            const normalizedDirX = playerDirectionX / dirMag;
            const normalizedDirY = playerDirectionY / dirMag;
            
            // 为每个敌人计算一个"方向得分"，基于它们与玩家朝向的一致性和距离
            const scoredEnemies = visibleEnemies.map(enemy => {
                const dx = enemy.x - owner.x;
                const dy = enemy.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 计算敌人方向的单位向量
                const enemyDirX = dx / dist;
                const enemyDirY = dy / dist;
                
                // 计算点积（方向相似度，1表示完全相同，-1表示相反）
                const dotProduct = normalizedDirX * enemyDirX + normalizedDirY * enemyDirY;
                
                // 距离因子（近的敌人得分更高）
                const distFactor = 1 - Math.min(1, dist / 300);
                
                // 最终得分：方向相似度和距离的加权和
                // 方向占40%权重，距离占60%权重，更注重距离而非方向
                const score = (dotProduct + 1) * 0.2 + distFactor * 0.8;
                
                return { enemy, score };
            });
            
            // 按得分排序（高到低）
            scoredEnemies.sort((a, b) => b.score - a.score);
            
            // 按得分排序选择目标，不限制必须在玩家前方
            targetEnemies = scoredEnemies
                .slice(0, projectileCount)
                .map(item => item.enemy);
        }
        
        // 如果没有找到足够的目标敌人，填充最近的敌人
        if (targetEnemies.length < projectileCount) {
            // 按距离排序的敌人列表
            const nearbyEnemies = [...visibleEnemies].sort((a, b) => {
                const distA = (a.x - owner.x) * (a.x - owner.x) + (a.y - owner.y) * (a.y - owner.y);
                const distB = (b.x - owner.x) * (b.x - owner.x) + (b.y - owner.y) * (b.y - owner.y);
                return distA - distB;
            });
            
            // 添加尚未选为目标的敌人
            for (const enemy of nearbyEnemies) {
                if (!targetEnemies.includes(enemy)) {
                    targetEnemies.push(enemy);
                    if (targetEnemies.length >= projectileCount) break;
                }
            }
        }
        
        // 发射多个磁力波
        for (let i = 0; i < projectileCount; i++) {
            let dirX, dirY;
            
            // 如果有目标敌人，瞄准它
            if (i < targetEnemies.length) {
                const enemy = targetEnemies[i];
                const dx = enemy.x - owner.x;
                const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
                
                dirX = dx / dist;
                dirY = dy / dist;
                
                // 添加小随机偏移，使射击更自然
                const angle = Math.atan2(dirY, dirX);
                const randomAngle = angle + (Math.random() - 0.5) * Math.PI * 0.1; // 减小随机偏移范围
                dirX = Math.cos(randomAngle);
                dirY = Math.sin(randomAngle);
            } 
            // 如果没有足够的目标敌人但有玩家朝向，朝玩家移动方向发射
            else if (hasPlayerDirection) {
                const angle = Math.atan2(playerDirectionY, playerDirectionX);
                // 添加扇形散布
                const spreadAngle = (i - (projectileCount / 2)) * (Math.PI / 12);
                const finalAngle = angle + spreadAngle;
                
                dirX = Math.cos(finalAngle);
                dirY = Math.sin(finalAngle);
            } 
            // 最后的选择：随机方向
            else {
                const angle = Math.random() * Math.PI * 2;
                dirX = Math.cos(angle);
                dirY = Math.sin(angle);
            }
            
            // 计算速度
            const vx = dirX * speed;
            const vy = dirY * speed;
            
            // 创建磁力波投射物
            const wave = new MagnetWaveProjectile(
                owner.x, owner.y, size, vx, vy, damage, duration,
                ownerStats, pullRadius, pullStrength, stun ? stunDuration : 0
            );
            
            wave.owner = owner;
            wave.pierce = pierce;
            projectiles.push(wave);
        }
    }

    /**
     * 获取视野内的敌人
     * @param {number} maxRange - 最大范围
     * @returns {Array} 敌人数组
     */
    getVisibleEnemies(maxRange) {
        const visibleEnemies = [];
        const maxRangeSq = maxRange * maxRange;

        // 确保this.owner存在
        if (!this.owner) return visibleEnemies;

        enemies.forEach(enemy => {
            if (!enemy || enemy.isGarbage || !enemy.isActive) return;

            const distanceSq = (enemy.x - this.owner.x) * (enemy.x - this.owner.x) +
                               (enemy.y - this.owner.y) * (enemy.y - this.owner.y);
            
            if (distanceSq < maxRangeSq) {
                visibleEnemies.push(enemy);
            }
        });
        
        return visibleEnemies;
    }

    /**
     * 获取最近的敌人
     * @param {number} maxRange - 最大范围
     * @returns {Enemy|null} 敌人对象或null
     */
    getClosestEnemy(maxRange) {
        let closestEnemy = null;
        let minDistanceSq = maxRange * maxRange;

        // 确保this.owner存在，防止空指针异常
        if (!this.owner) return null;

        enemies.forEach(enemy => {
            if (!enemy || enemy.isGarbage || !enemy.isActive) return;

            const distanceSq = (enemy.x - this.owner.x) * (enemy.x - this.owner.x) +
                             (enemy.y - this.owner.y) * (enemy.y - this.owner.y);
            
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `发射${this.stats.count}个磁力波，造成${this.stats.damage}伤害并吸引${this.stats.pullRadius}范围内的敌人。${this.stats.stun ? `吸引后晕眩敌人${this.stats.stunDuration.toFixed(1)}秒。` : ''}`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "发射磁力波，吸引敌人并造成范围伤害。";
    }
}

/**
 * 火山法杖
 * 召唤小型火山爆发，造成区域伤害和燃烧效果
 */
class VolcanoStaffWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "火山法杖";
    static Emoji = "🌋";
    static MaxLevel = 10;
    static Evolution = {
        requires: "Knives",
        evolvesTo: "MeteorStaff"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(VolcanoStaffWeapon.Name, VolcanoStaffWeapon.Emoji, 1.8, VolcanoStaffWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 12 + (this.level - 1) * 3,  // 基础伤害
            cooldown: Math.max(1.0, 1.8 - (this.level - 1) * 0.08),  // 冷却时间
            count: 1 + Math.floor((this.level - 1) / 3),  // 每3级增加一个火山
            radius: 70 + (this.level - 1) * 5,  // 爆发半径
            eruptions: 3 + Math.floor((this.level - 1) / 2),  // 爆发次数
            eruptionDelay: 0.5,  // 爆发间隔
            burnDamage: 2 + Math.floor((this.level - 1) * 0.5),  // 燃烧伤害
            burnDuration: 3.0,  // 燃烧持续时间固定为3秒
            lavaPuddle: this.level === 10,  // 10级才有熔岩池
            lavaDuration: 2.0  // 熔岩池持续时间固定为2秒
        };
        
        // 10级额外效果
        if (this.level === 10) {
            this.stats.eruptions += 2;  // 额外爆发次数
            this.stats.burnDamage *= 1.5;  // 燃烧伤害提升
        }
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        const volcanoCount = this.stats.count + (ownerStats.projectileCountBonus || 0);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const radius = this.stats.radius * (ownerStats.areaMultiplier || 1);
        const eruptions = this.stats.eruptions;
        const eruptionDelay = this.stats.eruptionDelay / (ownerStats.attackSpeedMultiplier || 1);
        const burnDamage = this.stats.burnDamage * (ownerStats.damageMultiplier || 1);
        const burnDuration = this.stats.burnDuration * (ownerStats.durationMultiplier || 1);
        const lavaPuddle = this.stats.lavaPuddle;
        const lavaDuration = this.stats.lavaDuration * (ownerStats.durationMultiplier || 1);
        
        // 创建多个火山
        for (let i = 0; i < volcanoCount; i++) {
            let x, y;
            
            // 找到随机敌人
            const enemy = owner.findRandomEnemy(500);
            
            if (enemy) {
                // 在敌人附近创建火山
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 100;
                x = enemy.x + offsetX;
                y = enemy.y + offsetY;
                } else {
                // 在玩家周围随机位置创建火山
                const angle = Math.random() * Math.PI * 2;
                const distance = 100 + Math.random() * 150;
                x = owner.x + Math.cos(angle) * distance;
                y = owner.y + Math.sin(angle) * distance;
            }
            
            // 创建火山爆发
            const volcano = new VolcanoEruption(
                x, y, radius, damage, eruptions, eruptionDelay,
                burnDamage, burnDuration, lavaPuddle, lavaDuration,
                owner
            );
            
            // 添加到危险区域列表
            if (typeof hazards !== 'undefined') {
                hazards.push(volcano);
            } else {
                console.error('hazards 数组未定义!');
            }
        }
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `召唤${this.stats.count}个火山，造成${this.stats.damage}伤害并引发${this.stats.eruptions}次爆发。燃烧敌人造成每秒${this.stats.burnDamage}伤害，持续${this.stats.burnDuration.toFixed(1)}秒。${this.stats.lavaPuddle ? `留下持续${this.stats.lavaDuration.toFixed(1)}秒的熔岩池。` : ''}`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "召唤小型火山爆发，造成区域伤害和燃烧效果。";
    }
}

/**
 * 黑洞球
 * 发射会变成黑洞的能量球
 */
class BlackHoleBallWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "黑洞球";
    static Emoji = "⚫";
    static MaxLevel = 10;
    static Evolution = {
        requires: "MagnetSphere",
        evolvesTo: "EventHorizon"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(BlackHoleBallWeapon.Name, BlackHoleBallWeapon.Emoji, 5.0, BlackHoleBallWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 15 + (this.level - 1) * 5,
            cooldown: Math.max(2.0, this.baseCooldown - (this.level - 1) * 0.3),
            projectileSpeed: 120 + (this.level - 1) * 10,
            blackHoleDuration: 3 + (this.level - 1) * 0.3,
            blackHoleRadius: 80 + (this.level - 1) * 10,
            pullStrength: 0.3 + (this.level - 1) * 0.05,
            tickDamage: 3 + (this.level - 1) * 1,
            tickInterval: 0.3,
            collapse: this.level >= 10 // 10级特殊效果：黑洞结束时爆炸
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        const ownerStats = this.getOwnerStats(owner);
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const blackHoleDuration = this.stats.blackHoleDuration * (ownerStats.durationMultiplier || 1);
        const size = GAME_FONT_SIZE * 1.5 * (ownerStats.areaMultiplier || 1);
        const blackHoleRadius = this.stats.blackHoleRadius * (ownerStats.areaMultiplier || 1);
        const tickDamage = this.stats.tickDamage * (ownerStats.damageMultiplier || 1);
        const pullStrength = this.stats.pullStrength;
        const collapse = this.stats.collapse;
        
        // 寻找最近的敌人
        const enemy = this.getClosestEnemy(800);
        
        if (enemy) {
            // 计算方向朝向敌人
            const dx = enemy.x - owner.x;
            const dy = enemy.y - owner.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            let dirX = dx / dist;
            let dirY = dy / dist;
            
            // 添加一些随机性
            dirX += (Math.random() - 0.5) * 0.2;
            dirY += (Math.random() - 0.5) * 0.2;
            
            // 规范化方向
            const length = Math.sqrt(dirX * dirX + dirY * dirY);
            dirX /= length;
            dirY /= length;
            
            // 计算速度
            const vx = dirX * speed;
            const vy = dirY * speed;
            
            // 创建黑洞球投射物
            const ball = new BlackHoleBallProjectile(
                owner.x, owner.y, size, vx, vy, damage, 1.5, 
                ownerStats, blackHoleDuration, blackHoleRadius, 
                tickDamage, this.stats.tickInterval, pullStrength, collapse
            );
            
            ball.owner = owner;
            projectiles.push(ball);
        } else {
            // 没有敌人时，随机方向
            const angle = Math.random() * Math.PI * 2;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
        
        // 创建黑洞球投射物
            const ball = new BlackHoleBallProjectile(
                owner.x, owner.y, size, vx, vy, damage, 1.5, 
                ownerStats, blackHoleDuration, blackHoleRadius, 
                tickDamage, this.stats.tickInterval, pullStrength, collapse
            );
            
            ball.owner = owner;
            projectiles.push(ball);
        }
    }

    /**
     * 获取最近的敌人
     * @param {number} maxRange - 最大范围
     * @returns {Enemy|null} 敌人对象或null
     */
    getClosestEnemy(maxRange) {
        let closestEnemy = null;
        let minDistanceSq = maxRange * maxRange;

        // 确保this.owner存在，防止空指针异常
        if (!this.owner) return null;

        enemies.forEach(enemy => {
            if (!enemy || enemy.isGarbage || !enemy.isActive) return;

            const distanceSq = (enemy.x - this.owner.x) * (enemy.x - this.owner.x) +
                             (enemy.y - this.owner.y) * (enemy.y - this.owner.y);
            
            if (distanceSq < minDistanceSq) {
                minDistanceSq = distanceSq;
                closestEnemy = enemy;
            }
        });
        
        return closestEnemy;
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `发射黑洞球，吸引${this.stats.blackHoleRadius}范围内的敌人并造成每${this.stats.tickInterval.toFixed(1)}秒${this.stats.tickDamage}点伤害。${this.stats.collapse ? '黑洞结束时爆炸，造成额外伤害。' : ''}`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "发射会变成黑洞的能量球，吸引并伤害敌人。";
    }
}

/**
 * 冰晶杖
 * 发射冰晶，冻结敌人并造成范围伤害
 */
class FrostStaffWeapon extends Weapon {
    /**
     * 静态属性
     */
    static Name = "冰晶杖";
    static Emoji = "❄";
    static MaxLevel = 10;
    static Evolution = {
        requires: "Ice",
        evolvesTo: "FrostStaff"
    };

    /**
     * 构造函数
     */
    constructor() {
        super(FrostStaffWeapon.Name, FrostStaffWeapon.Emoji, 1.5, FrostStaffWeapon.MaxLevel);
    }

    /**
     * 计算武器属性
     */
    calculateStats() {
        this.stats = {
            damage: 9 + (this.level - 1) * 3,
            cooldown: Math.max(1.0, 1.5 - (this.level - 1) * 0.06),
            count: 1 + Math.floor((this.level - 1) / 2),
            freezeDuration: this.level === 10 ? 1.0 : 0,
            slowFactor: 0.10 + (this.level - 1) * 0.015,
            projectileSpeed: 300 + (this.level - 1) * 10,
            pierce: Math.floor((this.level - 1) / 3),
            split: this.level >= 8
        };
    }

    /**
     * 发射武器
     * @param {Player} owner - 拥有者
     */
    fire(owner) {
        if (!owner) return; // 确保owner存在
        
        const ownerStats = this.getOwnerStats(owner);
        const projectileCount = Math.min(this.stats.count + (ownerStats.projectileCountBonus || 0), 8); // 限制最大数量为8个
        const speed = this.stats.projectileSpeed * (ownerStats.projectileSpeedMultiplier || 1);
        const damage = this.stats.damage * (ownerStats.damageMultiplier || 1);
        const freezeDuration = this.stats.freezeDuration * (ownerStats.durationMultiplier || 1);
        const slowFactor = this.stats.slowFactor;
        const size = GAME_FONT_SIZE * 1.2 * (ownerStats.areaMultiplier || 1);
        const split = this.stats.split;
        const pierce = this.stats.pierce;
        const duration = 4.0;
        
        // 获取玩家精确位置，作为所有冰晶的发射起点
        const startX = owner.x;
        const startY = owner.y;
        
        // 与匕首类似的索敌方式
        // 1. 获取并排序敌人
        let sortedEnemies = [];
        if (typeof enemies !== 'undefined' && enemies.length > 0) {
            sortedEnemies = enemies.filter(e => e && !e.isGarbage && e.isActive && !(e instanceof GhostEnemy)) // 排除幽灵
                .map(enemy => ({
                    enemy,
                    distSq: (enemy.x - owner.x) * (enemy.x - owner.x) + (enemy.y - owner.y) * (enemy.y - owner.y)
                }))
                .sort((a, b) => a.distSq - b.distSq)
                .map(item => item.enemy);
        }
        
        // 2. 为每个冰晶确定目标并发射
        for (let i = 0; i < projectileCount; i++) {
            let dirX, dirY;
            
            if (sortedEnemies.length > 0) {
                // 循环选择目标敌人
                const targetEnemy = sortedEnemies[i % sortedEnemies.length];
                const dx = targetEnemy.x - owner.x;
                const dy = targetEnemy.y - owner.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                dirX = dist > 0 ? dx / dist : owner.lastMoveDirection.x;
                dirY = dist > 0 ? dy / dist : owner.lastMoveDirection.y;
                
                // 添加一点随机性，使冰晶发射更自然
                const angle = Math.atan2(dirY, dirX);
                const randomAngle = angle + (Math.random() - 0.5) * Math.PI * 0.1; // 小角度随机偏移
                dirX = Math.cos(randomAngle);
                dirY = Math.sin(randomAngle);
            } else {
                // 没有敌人时，在玩家朝向的前方扇形区域发射
                const forwardAngle = Math.atan2(owner.lastMoveDirection.y, owner.lastMoveDirection.x);
                // 如果只有一个投射物，就直接朝前方发射
                if (projectileCount === 1) {
                    dirX = owner.lastMoveDirection.x;
                    dirY = owner.lastMoveDirection.y;
                    // 确保有方向
                    if (dirX === 0 && dirY === 0) {
                        dirX = 0;
                        dirY = -1; // 默认向上
                    }
                } else {
                    // 多个投射物时，在扇形区域内均匀分布
                    const angleStep = Math.PI / 8; // 与匕首类似
                    const startAngle = forwardAngle - (angleStep * (projectileCount - 1) / 2);
                    const currentAngle = startAngle + i * angleStep;
                    dirX = Math.cos(currentAngle);
                    dirY = Math.sin(currentAngle);
                }
            }
            
            // 添加一点随机性到速度
            const speedVariation = 0.9 + Math.random() * 0.2; // 速度在90%-110%之间变化
            const vx = dirX * speed * speedVariation;
            const vy = dirY * speed * speedVariation;
            
            // 创建冰晶投射物，确保从玩家位置发射
            const crystal = new FrostCrystalProjectile(
                startX, startY, size, vx, vy, damage, pierce, duration, ownerStats, freezeDuration, slowFactor, split
            );
            crystal.owner = owner;
            projectiles.push(crystal);
        }
    }

    /**
     * 获取当前描述
     */
    getCurrentDescription() {
        return `发射${this.stats.count}个冰晶，冻结敌人${this.stats.freezeDuration.toFixed(1)}秒并造成${this.stats.damage}伤害。`;
    }

    /**
     * 获取初始描述
     */
    getInitialDescription() {
        return "发射冰晶，冻结敌人并造成范围伤害。";
    }
}

// 在文件末尾添加新武器到全局武器列表
if (typeof BASE_WEAPONS !== 'undefined') {
    // 添加新武器
    if (typeof BubbleWandWeapon === 'function') BASE_WEAPONS.push(BubbleWandWeapon);
    if (typeof ChaosDiceWeapon === 'function') BASE_WEAPONS.push(ChaosDiceWeapon);
    if (typeof MagnetGunWeapon === 'function') BASE_WEAPONS.push(MagnetGunWeapon);
    if (typeof VolcanoStaffWeapon === 'function') BASE_WEAPONS.push(VolcanoStaffWeapon);
    if (typeof BlackHoleBallWeapon === 'function') BASE_WEAPONS.push(BlackHoleBallWeapon);
    if (typeof FrostStaffWeapon === 'function') BASE_WEAPONS.push(FrostStaffWeapon);

    console.log('New weapons added to BASE_WEAPONS:', 
        BASE_WEAPONS.filter(w => 
            w !== DaggerWeapon && 
            w !== GarlicWeapon && 
            w !== WhipWeapon &&
            w !== FireBladeWeapon &&
            w !== StormBladeWeapon &&
            w !== HandshakeWeapon
        ).map(w => w.name)
    );
} else {
    console.error('BASE_WEAPONS not found! Make sure basic weapon files are loaded first.');
} 