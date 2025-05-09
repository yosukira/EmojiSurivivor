/**
 * Boss管理器
 * 负责Boss的生成、管理和攻击模式
 */
class BossManager {
    /**
     * 构造函数
     */
    constructor() {
        this.nextBossTime = BOSS_INTERVAL;
        this.currentBoss = null;
        this.bossWarningTimer = 0;
        this.bossWarningDuration = 3.0;
        this.showingWarning = false;
    }

    /**
     * 更新Boss管理器
     * @param {number} dt - 时间增量
     * @param {number} gameTime - 游戏时间
     * @param {Player} player - 玩家对象
     */
    update(dt, gameTime, player) {
        // 处理Boss警告
        if (this.showingWarning) {
            this.bossWarningTimer -= dt;
            if (this.bossWarningTimer <= 0) {
                this.showingWarning = false;
                this.hideBossWarning();
            }
        }
        // 检查是否应该生成Boss
        if (gameTime >= this.nextBossTime && !this.currentBoss) {
            this.showBossWarning();
            this.spawnBoss(gameTime, player);
            this.nextBossTime += BOSS_INTERVAL;
        }
        // 更新当前Boss的特殊攻击
        if (this.currentBoss && !this.currentBoss.isGarbage && this.currentBoss.isActive) {
            this.updateBossAttack(dt, this.currentBoss, player);
        }
    }

    /**
     * 生成Boss
     * @param {number} gameTime - 游戏时间
     * @param {Player} player - 玩家对象
     */
    spawnBoss(gameTime, player) {
        // 根据游戏时间筛选可用Boss类型
        const availableTypes = BOSS_TYPES.filter(type => gameTime >= (type.minTime || 0));
        if (availableTypes.length === 0) return;
        // 随机选择Boss类型
        const typeIndex = Math.floor(Math.random() * availableTypes.length);
        const chosenType = availableTypes[typeIndex];
        // 计算生成位置（在屏幕外围）
        let spawnX, spawnY;
        // 考虑无限地图，使用相对于玩家的位置
        const edge = Math.floor(Math.random() * 4);
        const spawnPadding = SPAWN_PADDING * 2;
        switch (edge) {
            case 0: // 上方
                spawnX = player.x + (Math.random() * GAME_WIDTH - GAME_WIDTH / 2);
                spawnY = player.y - GAME_HEIGHT / 2 - spawnPadding;
                break;
            case 1: // 右方
                spawnX = player.x + GAME_WIDTH / 2 + spawnPadding;
                spawnY = player.y + (Math.random() * GAME_HEIGHT - GAME_HEIGHT / 2);
                break;
            case 2: // 下方
                spawnX = player.x + (Math.random() * GAME_WIDTH - GAME_WIDTH / 2);
                spawnY = player.y + GAME_HEIGHT / 2 + spawnPadding;
                break;
            case 3: // 左方
                spawnX = player.x - GAME_WIDTH / 2 - spawnPadding;
                spawnY = player.y + (Math.random() * GAME_HEIGHT - GAME_HEIGHT / 2);
                break;
        }
        // 创建Boss
        const boss = new BossEnemy(spawnX, spawnY, chosenType, gameTime);
        enemies.push(boss);
        this.currentBoss = boss;
        console.log(`生成Boss: ${chosenType.name}`);
    }

    /**
     * 更新Boss攻击
     * @param {number} dt - 时间增量
     * @param {BossEnemy} boss - Boss对象
     * @param {Player} player - 玩家对象
     */
    updateBossAttack(dt, boss, player) {
        if (!boss.attackPattern) return;
        // 更新Boss攻击计时器
        if (!boss.attackTimer) boss.attackTimer = 0;
        boss.attackTimer -= dt;
        // 当计时器小于等于0时执行攻击
        if (boss.attackTimer <= 0) {
            switch (boss.attackPattern) {
                case "melee":
                    this.executeMeleeAttack(boss, player);
                    boss.attackTimer = 3.0; // 3秒后再次攻击
                    break;
                case "ranged":
                    this.executeRangedAttack(boss, player);
                    boss.attackTimer = 4.0; // 4秒后再次攻击
                    break;
                case "teleport":
                    this.executeTeleportAttack(boss, player);
                    boss.attackTimer = 5.0; // 5秒后再次攻击
                    break;
                case "summon":
                    this.executeSummonAttack(boss, player);
                    boss.attackTimer = 6.0; // 6秒后再次攻击
                    break;
            }
        }
    }

    /**
     * 执行近战攻击
     * @param {BossEnemy} boss - Boss对象
     * @param {Player} player - 玩家对象
     */
    executeMeleeAttack(boss, player) {
        // 冲刺攻击
        const dx = player.x - boss.x;
        const dy = player.y - boss.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 0) {
            // 保存原始速度
            const originalSpeed = boss.speed;
            // 设置冲刺速度（3倍）
            boss.speed = originalSpeed * 3;
            // 创建冲刺效果
            setTimeout(() => {
                if (!boss.isGarbage && boss.isActive) {
                    // 恢复原始速度
                    boss.speed = originalSpeed;
                    // 创建冲击波
                    const radius = 120;
                    const damage = boss.damage * 1.5;
                    // 对范围内的玩家造成伤害
                    const playerDx = player.x - boss.x;
                    const playerDy = player.y - boss.y;
                    const playerDistSq = playerDx * playerDx + playerDy * playerDy;
                    if (playerDistSq <= radius * radius) {
                        player.takeDamage(damage, boss);
                    }
                    // 创建冲击波视觉效果
                    createExplosionEffect(boss.x, boss.y, radius, 'rgba(255, 0, 0, 0.5)');
                }
            }, 500); // 0.5秒后执行
        }
    }

    /**
     * 执行远程攻击
     * @param {BossEnemy} boss - Boss对象
     * @param {Player} player - 玩家对象
     */
    executeRangedAttack(boss, player) {
        // 发射多个投射物
        const projectileCount = boss.projectileCount || 3;
        const damage = boss.damage * 0.8;
        const speed = 200;
        // 计算角度
        const angleStep = Math.PI * 2 / projectileCount;
        const startAngle = Math.random() * Math.PI * 2;
        for (let i = 0; i < projectileCount; i++) {
            const angle = startAngle + i * angleStep;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            // 创建Boss投射物
            const projectile = new BossProjectile(
                boss.x,
                boss.y,
                vx,
                vy,
                damage,
                boss
            );
            projectiles.push(projectile);
        }
    }

    /**
     * 执行传送攻击
     * @param {BossEnemy} boss - Boss对象
     * @param {Player} player - 玩家对象
     */
    executeTeleportAttack(boss, player) {
        // 创建消失效果
        createExplosionEffect(boss.x, boss.y, 80, 'rgba(128, 0, 128, 0.7)');
        // 计算传送位置（玩家附近）
        const angle = Math.random() * Math.PI * 2;
        const distance = 150 + Math.random() * 100;
        const teleportX = player.x + Math.cos(angle) * distance;
        const teleportY = player.y + Math.sin(angle) * distance;
        // 传送
        setTimeout(() => {
            if (!boss.isGarbage && boss.isActive) {
                boss.x = teleportX;
                boss.y = teleportY;
                // 创建出现效果
                createExplosionEffect(boss.x, boss.y, 80, 'rgba(128, 0, 128, 0.7)');
                // 创建冲击波
                setTimeout(() => {
                    if (!boss.isGarbage && boss.isActive) {
                        const radius = 150;
                        const damage = boss.damage;
                        // 对范围内的玩家造成伤害
                        const playerDx = player.x - boss.x;
                        const playerDy = player.y - boss.y;
                        const playerDistSq = playerDx * playerDx + playerDy * playerDy;
                        if (playerDistSq <= radius * radius) {
                            player.takeDamage(damage, boss);
                        }
                        // 创建冲击波视觉效果
                        createExplosionEffect(boss.x, boss.y, radius, 'rgba(128, 0, 128, 0.5)');
                    }
                }, 300); // 0.3秒后执行
            }
        }, 500); // 0.5秒后执行
    }

    /**
     * 执行召唤攻击
     * @param {BossEnemy} boss - Boss对象
     * @param {Player} player - 玩家对象
     */
    executeSummonAttack(boss, player) {
        // 召唤小怪
        const summonCount = 3 + Math.floor(Math.random() * 3); // 3-5个
        for (let i = 0; i < summonCount; i++) {
            // 计算召唤位置（Boss附近）
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const summonX = boss.x + Math.cos(angle) * distance;
            const summonY = boss.y + Math.sin(angle) * distance;
            // 随机选择敌人类型
            const typeIndex = Math.floor(Math.random() * ENEMY_TYPES.length);
            const enemyType = ENEMY_TYPES[typeIndex];
            // 创建敌人（较弱）
            const enemy = new Enemy(summonX, summonY, enemyType, 0.7);
            enemies.push(enemy);
            // 创建召唤效果
            createExplosionEffect(summonX, summonY, 40, 'rgba(0, 255, 0, 0.5)');
        }
    }

    /**
     * 显示Boss警告
     */
    showBossWarning() {
        this.showingWarning = true;
        this.bossWarningTimer = this.bossWarningDuration;
        const bossWarningUI = document.getElementById('bossWarning');
        if (bossWarningUI) {
            bossWarningUI.style.display = 'block';
        }
    }

    /**
     * 隐藏Boss警告
     */
    hideBossWarning() {
        const bossWarningUI = document.getElementById('bossWarning');
        if (bossWarningUI) {
            bossWarningUI.style.display = 'none';
        }
    }

    /**
     * 处理Boss死亡
     * @param {BossEnemy} boss - 死亡的Boss
     * @param {Player} killer - 击杀Boss的玩家
     */
    handleBossDeath(boss, killer) {
        if (!killer || !(killer instanceof Player)) return;
        // 增加击杀计数
        killCount++;
        // 掉落宝箱
        worldObjects.push(new Chest(boss.x, boss.y));
        // 掉落大量经验
        const xpAmount = boss.xpValue;
        const gemCount = 15;
        const gemXP = Math.ceil(xpAmount / gemCount);
        for (let i = 0; i < gemCount; i++) {
            const offsetX = (Math.random() - 0.5) * 60;
            const offsetY = (Math.random() - 0.5) * 60;
            xpGems.push(new ExperienceGem(boss.x + offsetX, boss.y + offsetY, gemXP));
        }
        // 清除当前Boss
        this.currentBoss = null;
        console.log(`Boss ${boss.name || '未知'} 被击败!`);
    }

    /**
     * 清理无效Boss
     */
    cleanup() {
        if (this.currentBoss && this.currentBoss.isGarbage) {
            this.currentBoss = null;
        }
    }
}

/**
 * Boss投射物类
 */
class BossProjectile extends Projectile {
    /**
     * 构造函数
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {number} damage - 伤害
     * @param {BossEnemy} owner - 拥有者
     */
    constructor(x, y, vx, vy, damage, owner) {
        super(x, y, '🔴', GAME_FONT_SIZE, vx, vy, damage, 0, 3.0, {
            damageMultiplier: 1.0
        });
        this.owner = owner;
        this.targetPlayer = true;
    }

    /**
     * 更新投射物状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        if (this.isGarbage || !this.isActive) return;
        // 移动
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.lifetime += dt;
        // 检查生命周期
        if (this.lifetime >= this.duration || this.pierce < 0) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 检查是否超出屏幕
        if (this.x < -this.width || this.x > GAME_WIDTH + this.width ||
            this.y < -this.height || this.y > GAME_HEIGHT + this.height) {
            this.isGarbage = true;
            this.isActive = false;
            return;
        }
        // 检查与玩家的碰撞
        if (this.targetPlayer && player && !player.isGarbage && player.isActive) {
            if (this.checkCollision(player)) {
                player.takeDamage(this.damage, this.owner);
                this.isGarbage = true;
                this.isActive = false;
            }
        }
    }
}

// 创建全局Boss管理器实例
const bossManager = new BossManager();