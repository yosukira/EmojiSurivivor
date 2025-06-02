/**
 * 敌人管理器
 * 负责敌人的生成、管理和Boss系统
 */

// 敌人管理器
const enemyManager = {
    spawnTimer: 0,
    currentSpawnInterval: 3.5, // 初始生成间隔，增加为3.5秒
    BASE_SPAWN_INTERVAL: 2.0,
    difficultyTimer: 0,
    maxEnemyCap: MAX_ENEMIES_ON_SCREEN, // 使用常量

    update(dt, gameTime, player) {
        // 更新生成计时器
        this.spawnTimer += dt;

        // 更新难度计时器
        this.difficultyTimer += dt;

        // 每20秒增加难度 (原30秒)
        if (this.difficultyTimer >= 20) {
            // 随着时间推移逐渐减少生成间隔，但不低于0.5秒 (原0.8, 原削减率0.92)
            // 将削减率从0.90改为0.95，使生成速度增长更平缓
            this.currentSpawnInterval = Math.max(0.8, this.currentSpawnInterval * 0.95);
            this.difficultyTimer = 0;
            
            // 根据游戏时间动态调整敌人上限
            // 初始上限较低，随时间逐渐增加
            const baseEnemyCap = 30; // 初始敌人上限
            const maxEnemyCap = 100; // 最大敌人上限
            const minutesPassed = gameTime / 60;
            // 每3分钟增加10个敌人上限，但不超过最大值
            const capIncrease = Math.min(Math.floor(minutesPassed / 3) * 10, maxEnemyCap - baseEnemyCap);
            this.maxEnemyCap = baseEnemyCap + capIncrease;
        }

        // 如果计时器超过生成间隔，并且当前敌人数量未达上限，则生成敌人
        if (this.spawnTimer >= this.currentSpawnInterval && enemies.length < this.maxEnemyCap) {
            // 生成敌人
            this.spawnEnemies(gameTime, player);

            // 重置计时器
            this.spawnTimer = 0;
        }
    },

    spawnEnemies(gameTime, player) {
        // 获取相机视图的中心和半宽/半高
        const viewCenterX = cameraManager.x;
        const viewCenterY = cameraManager.y;
        const halfWidth = GAME_WIDTH / 2;
        const halfHeight = GAME_HEIGHT / 2;
        
        // 根据游戏时间获取可用敌人类型
        let availableEnemies;
        
        // 移除 firstBossDefeated 的判断
        // const firstBossDefeated = bossManager.isFirstBossDefeated(); 
        // console.log(`SpawnEnemies Check - GameTime: ${Math.floor(gameTime)}s, FirstBossDefeated: ${firstBossDefeated}`);
        
        // 根据游戏时间筛选敌人类型
        availableEnemies = ENEMY_TYPES.filter(enemy => {
            // 基本条件：游戏时间必须大于等于敌人的最小出现时间
            if (gameTime < (enemy.minTime || 0)) {
                return false;
            }
            
            // 如果有最大时间限制，检查是否超过
            if (enemy.maxTime && gameTime >= enemy.maxTime) {
                return false;
            }
            
            // 移除与 firstBossDefeated 相关的判断逻辑，完全依赖 minTime 和 maxTime
            return true; 
        });
        
        // 打印详细的可用敌人列表，但只在每隔60秒时记录一次，避免日志过多
        if (gameTime % 60 < 1) {
            console.log(`当前游戏时间: ${Math.floor(gameTime)}秒, 可用敌人有 ${availableEnemies.length} 种:`);
            console.log(availableEnemies.map(e => e.name).join(', '));
        }
        
        // 如果没有可用敌人，使用史莱姆作为后备选择
        if (availableEnemies.length === 0) {
            console.warn("没有找到符合条件的敌人类型，使用史莱姆作为后备");
            availableEnemies = ENEMY_TYPES.filter(enemy => enemy.name === "史莱姆");
            // 如果史莱姆也不可用，尝试蝙蝠，然后僵尸
            if (availableEnemies.length === 0) {
                availableEnemies = ENEMY_TYPES.filter(enemy => enemy.name === "蝙蝠");
                if (availableEnemies.length === 0) {
                    availableEnemies = ENEMY_TYPES.filter(enemy => enemy.name === "僵尸");
                }
            }
            // 如果所有备选都不可用，使用第一个敌人类型
            if (availableEnemies.length === 0 && ENEMY_TYPES.length > 0) {
                availableEnemies = [ENEMY_TYPES[0]];
            }
        }
        
        // 计算总权重
        const totalWeight = availableEnemies.reduce((sum, enemy) => sum + enemy.weight, 0);
        if (totalWeight === 0) return; // 防止没有可用敌人时出错
        
        // 根据游戏时间计算生成数量
        const initialSpawnCount = 3;  // 初始
        const midGameTime = 180;      // 3分钟进入中期
        const midGameSpawnCount = 8;  // 中期单次生成数量
        const lateGameTime = 480;     // 8分钟进入后期
        const lateGameSpawnCount = 15; // 后期单次生成数量
        const maxTotalEnemies = MAX_ENEMIES_ON_SCREEN; // 使用常量，例如 60

        let spawnCountThisWave;
        if (gameTime < midGameTime) { // 0-3 分钟
            const progress = gameTime / midGameTime;
            spawnCountThisWave = Math.floor(initialSpawnCount + progress * (midGameSpawnCount - initialSpawnCount));
        } else if (gameTime < lateGameTime) { // 3-8 分钟
            const progress = (gameTime - midGameTime) / (lateGameTime - midGameTime);
            spawnCountThisWave = Math.floor(midGameSpawnCount + progress * (lateGameSpawnCount - midGameSpawnCount));
        } else { // 8分钟以后
            spawnCountThisWave = lateGameSpawnCount;
        }
        // 确保不会因为一次生成过多而超过总数上限（虽然 update 中已检查，这里再保险一下）
        spawnCountThisWave = Math.min(spawnCountThisWave, maxTotalEnemies - enemies.length);
        if (spawnCountThisWave <= 0) return;
        
        // 生成敌人
        for (let i = 0; i < spawnCountThisWave; i++) {
            // 增加生成距离，确保敌人在视野外生成
            const forcedMinSpawnDistance = 150; // 强制最小生成距离
            const visualRange = Math.max(GAME_WIDTH, GAME_HEIGHT) / 2; // 玩家视野范围
            const currentSpawnOffset = Math.max(SPAWN_PADDING, visualRange + forcedMinSpawnDistance);
            
            // 随机选择生成角度，确保敌人在视野外均匀分布
            const spawnAngle = Math.random() * Math.PI * 2;
            const spawnDistance = currentSpawnOffset + Math.random() * 100; // 添加一些随机性
            
            // 根据角度和距离计算生成坐标
            const x = player.x + Math.cos(spawnAngle) * spawnDistance;
            const y = player.y + Math.sin(spawnAngle) * spawnDistance;
            
            // 根据权重随机选择敌人类型
            const rand = Math.random() * totalWeight;
            let weightSum = 0;
            let selectedType = availableEnemies[0];
            
            for (const enemyType of availableEnemies) {
                weightSum += enemyType.weight;
                if (rand <= weightSum) {
                    selectedType = enemyType;
                    break;
                }
            }
            
            // 创建敌人
            const enemy = new Enemy(x, y, selectedType);
            enemies.push(enemy);
        }
    },

    cleanup() {
        // 清理已标记为垃圾的敌人
        enemies = enemies.filter(enemy => !enemy.isGarbage);
    }
};

// Boss管理器
const bossManager = {
    nextBossTime: FIRST_BOSS_TIME, // 使用新的第一个Boss时间
    currentBoss: null,
    bossWarningTimer: 0,
    showingWarning: false,
    pendingBossType: null,
    defeatedBossCount: 0, 
    bossArenaEffect: null,
    lastSpawnedBossName: null, // 新增：存储上一个生成的Boss名称

    update(dt, gameTime, player) {
        // 如果当前有Boss，更新Boss
        if (this.currentBoss && !this.currentBoss.isGarbage) {
            return;
        }
        
        // 如果之前有Boss且现在没有了，表示Boss被击败
        if (this.currentBoss && this.currentBoss.isGarbage) {
            this.defeatedBossCount++;
            console.log(`Boss已击败! 总计击败: ${this.defeatedBossCount}`);
            
            // 立即执行Boss战场清理，并做彻底检查
            this.cleanupBossEffects();
            
            // 取消Boss战场限制 - 确保在cameraManager中停用
            cameraManager.deactivateBossArena();
            console.log("Boss战场已解除!");
            
            // 播放胜利音效或视觉效果
            triggerScreenShake(5, 0.8);
            
            // 重置当前Boss
            this.currentBoss = null;
            hideBossHealthBar(); // <--- 新增：隐藏Boss血条
        }

        // 如果正在显示警告，更新警告计时器
        if (this.showingWarning) {
            this.bossWarningTimer += dt;

            // 如果警告计时器超过3秒，生成Boss
            if (this.bossWarningTimer >= 3) {
                if (this.pendingBossType) {
                    this.spawnBoss(player, this.pendingBossType); // 使用预选的Boss类型
                }
                this.showingWarning = false;
                this.bossWarningTimer = 0;
                this.pendingBossType = null; // 清除预选的Boss
            }
            return;
        }

        // 如果游戏时间超过下一次Boss生成时间，显示警告
        if (gameTime >= this.nextBossTime) {
            const availableBosses = BOSS_TYPES.filter(boss => gameTime >= (boss.minTime || 0));
            if (availableBosses.length > 0) {
                // 随机选择一个Boss
                let selectedBossType = availableBosses[Math.floor(Math.random() * availableBosses.length)];

                // 如果选择的Boss与上一个相同，并且有其他可选Boss，则重新选择
                if (availableBosses.length > 1 && selectedBossType.name === this.lastSpawnedBossName) {
                    let newSelection = selectedBossType;
                    let attempts = 0; // 防止无限循环
                    while (newSelection.name === this.lastSpawnedBossName && attempts < availableBosses.length * 2) {
                        newSelection = availableBosses[Math.floor(Math.random() * availableBosses.length)];
                        attempts++;
                    }
                    selectedBossType = newSelection;
                    if (selectedBossType.name === this.lastSpawnedBossName) {
                        console.log("Could not pick a different boss, will spawn the same one:", selectedBossType.name);
                    } else {
                         console.log("Avoided spawning same boss. New boss:", selectedBossType.name);
                    }
                }
                
                this.pendingBossType = selectedBossType;
                this.showBossWarning(this.pendingBossType.name); 
                this.showingWarning = true;
            } else {
                // 如果没有可用的Boss（理论上不应发生，除非BOSS_TYPES为空或minTime都过高）
                // 简单地推迟下一次检查，或者可以记录一个错误
                console.warn("No bosses available to choose from at gameTime:", gameTime);
            }
            
            // 计算下一个Boss出现的时间间隔
            let nextBossInterval = BOSS_INTERVAL; // 默认4分钟
            
            // 后期Boss刷新频率加快
            if (gameTime >= 900) { // 15分钟后
                if (gameTime < 1200) { // 15-20分钟
                    nextBossInterval = 240; // 保持4分钟
                } else if (gameTime < 1500) { // 20-25分钟
                    nextBossInterval = 210; // 减少到3.5分钟
                } else if (gameTime < 1800) { // 25-30分钟
                    nextBossInterval = 180; // 减少到3分钟
                } else if (gameTime < 2100) { // 30-35分钟
                    nextBossInterval = 150; // 减少到2.5分钟
                } else { // 35分钟后
                    nextBossInterval = 120; // 减少到2分钟
                }
            }
            
            // 设置下一次Boss生成的时间
            this.nextBossTime = gameTime + nextBossInterval;
            console.log(`下一个Boss将在游戏时间 ${Math.floor(this.nextBossTime)} 秒出现，间隔：${nextBossInterval}秒`);
        }
    },

    spawnBoss(player, bossTypeToSpawn) { // 修改：接收预选的Boss类型
        // 计算生成位置
        const angle = Math.random() * Math.PI * 2;
        const distance = 300;
        const x = player.x + Math.cos(angle) * distance;
        const y = player.y + Math.sin(angle) * distance;

        // 创建Boss - 使用 BossEnemy 类
        const boss = new BossEnemy(x, y, bossTypeToSpawn); // 使用传入的Boss类型

        // 添加到敌人列表
        enemies.push(boss);

        // 设置当前Boss
        this.currentBoss = boss;
        this.lastSpawnedBossName = bossTypeToSpawn.name; // 新增：记录本次生成的Boss名称
        console.log('[BOSS_SPAWN] Boss object for health bar:', this.currentBoss); // DEBUG
        showBossHealthBar(this.currentBoss); 

        // 创建Boss战场，限制玩家移动范围
        const bossArenaRadius = 800; // 设置一个较大的战场半径
        cameraManager.activateBossArena(x, y, bossArenaRadius);
        
        // 播放Boss战场激活音效或视觉效果
        triggerScreenShake(10, 1.5);
    },
    
    // 检查第一个Boss是否已被击败
    isFirstBossDefeated() {
        return this.defeatedBossCount > 0;
    },
    
    showBossWarning(bossName) {
        // 调用全局showBossWarning函数
        if (typeof showBossWarning === 'function') {
            showBossWarning(bossName);
        } else {
            // 备用警告逻辑
            console.warn("全局showBossWarning函数不可用，使用备用警告");
            const warning = document.createElement("div");
            warning.className = "boss-warning";
            warning.textContent = `⚠️ ${bossName}即将出现! ⚠️`;
            warning.style.position = 'absolute';
            warning.style.top = '20%';
            warning.style.left = '50%';
            warning.style.transform = 'translateX(-50%)';
            warning.style.backgroundColor = 'rgba(200, 0, 0, 0.8)';
            warning.style.color = '#ffffff';
            warning.style.padding = '15px 30px';
            warning.style.borderRadius = '8px';
            warning.style.zIndex = '1000';
            document.body.appendChild(warning);
            
            // 3秒后移除警告
            setTimeout(() => {
                warning.remove();
            }, 3000);
        }
    },

    cleanup() {
        // 如果当前Boss已标记为垃圾，重置当前Boss
        if (this.currentBoss && this.currentBoss.isGarbage) {
            this.currentBoss = null;
        }
    },

    // 清理Boss相关的所有视觉效果
    cleanupBossEffects() {
        console.log("开始清理Boss战场效果和相关视觉效果...");

        // 确保全局引用被清除
        if (window.bossArenaEffect) {
            console.log("发现全局Boss战场效果引用，准备清除");
            window.bossArenaEffect.isGarbage = true;
            window.bossArenaEffect = null;
            console.log("全局Boss战场效果引用已清除");
        }
        
        // 确保Boss战场被停用
        cameraManager.bossArenaActive = false;
        console.log("Boss战场标记已重置: bossArenaActive = false");
        
        // 清理本地引用
        this.bossArenaEffect = null;
        
        // 一次性彻底清理所有相关视觉效果 - 使用直接删除方式
        let removedEffectCount = 0;
        
        // 先找出所有需要删除的效果
        const effectsToRemove = [];
        for (let i = 0; i < visualEffects.length; i++) {
            const effect = visualEffects[i];
            // 检查是否为Boss战场效果或与当前Boss相关的效果
            if (effect && (
                effect.isBossArenaEffect || 
                (effect.boss && this.currentBoss && effect.boss === this.currentBoss)
            )) {
                effectsToRemove.push(i);
            }
        }
        
        // 从后向前删除，避免索引问题
        for (let i = effectsToRemove.length - 1; i >= 0; i--) {
            visualEffects.splice(effectsToRemove[i], 1);
            removedEffectCount++;
        }
        
        console.log(`已直接移除 ${removedEffectCount} 个Boss相关视觉效果`);
        
        // 确保所有战场效果都被清理
        for (let i = visualEffects.length - 1; i >= 0; i--) {
            if (visualEffects[i] && visualEffects[i].isBossArenaEffect) {
                console.log("移除残留的Boss战场效果:", visualEffects[i]);
                visualEffects.splice(i, 1);
            }
        }
        
        // 清理Boss产生的危害区域和投射物
        if (this.currentBoss) {
            let removedHazards = 0;
            for (let i = hazards.length - 1; i >= 0; i--) {
                if (hazards[i] && hazards[i].owner === this.currentBoss) {
                    hazards.splice(i, 1);
                    removedHazards++;
                }
            }
            
            if (removedHazards > 0) {
                console.log(`已直接移除 ${removedHazards} 个Boss产生的危害区域`);
            }
            
            let removedProjectiles = 0;
            for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
                if (enemyProjectiles[i] && enemyProjectiles[i].owner === this.currentBoss) {
                    enemyProjectiles.splice(i, 1);
                    removedProjectiles++;
                }
            }
            
            if (removedProjectiles > 0) {
                console.log(`已直接移除 ${removedProjectiles} 个Boss投射物`);
            }
        }
        
        console.log("Boss战场效果清理完成");
    },
    
    // 处理Boss死亡
    handleBossDeath(boss, killer) {
        console.log(`[BossManager.handleBossDeath] Called for Boss: ${boss.type.name}. Preparing to hide health bar and cleanup.`); // 新增日志
        if (!boss || boss.isGarbage) {
            console.warn("[BossManager.handleBossDeath] Boss already marked as garbage or null, skipping.");
            return;
        }
        // 增加击杀计数
        killCount++;
        
        // 掉落宝箱
        worldObjects.push(new Chest(boss.x, boss.y));
        
        // 立即清理战场效果
        this.cleanupBossEffects();
        
        // 确保取消Boss战场限制
        cameraManager.deactivateBossArena();
        
        // 将Boss标记为垃圾，确保不会再次触发其他处理
        boss.isGarbage = true;

        // 确保隐藏血条
        if (this.currentBoss === boss || currentBossForHealthBar === boss) {
            console.log(`[BossManager.handleBossDeath] Hiding health bar for defeated boss: ${boss.type.name}`);
            hideBossHealthBar();
            this.currentBoss = null; // 也清除管理器中的当前Boss引用
        } else {
            console.warn(`[BossManager.handleBossDeath] Defeated boss ${boss.type.name} does not match currentBoss ${this.currentBoss ? this.currentBoss.type.name : 'null'} or currentBossForHealthBar ${currentBossForHealthBar ? currentBossForHealthBar.type.name : 'null'}. Health bar may not hide as expected.`);
        }
    }
}; 