/**
 * 敌人管理器
 * 负责敌人的生成、管理和掉落物处理
 */
class EnemyManager {
    /**
     * 构造函数
     */
    constructor() {
        // 敌人生成计时器
        this.spawnTimer = 0;

        // 当前生成间隔
        this.currentSpawnInterval = BASE_SPAWN_INTERVAL;

        // 难度调整计时器
        this.difficultyTimer = 0;

        // 敌人类型权重缓存
        this.cachedTypeWeights = null;
        this.lastCacheTime = 0;
    }

    /**
     * 更新敌人管理器
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 更新生成计时器
        this.spawnTimer += dt;

        // 更新难度调整计时器
        this.difficultyTimer += dt;
        // 每10秒调整难度
        if (this.difficultyTimer > 10) {
            this.adjustDifficulty();
            this.difficultyTimer = 0;
        }

        // 如果计时器达到生成间隔，生成敌人
        if (this.spawnTimer >= this.currentSpawnInterval) {
            this.spawnEnemies();
            this.spawnTimer = 0;
        }
    }

    /**
     * 调整难度
     */
    adjustDifficulty() {
        // 根据游戏时间调整生成间隔
        this.currentSpawnInterval = Math.max(0.1, BASE_SPAWN_INTERVAL * Math.pow(0.98, gameTime / 60));

        // 清除类型权重缓存，以便下次生成时重新计算
        this.cachedTypeWeights = null;
    }

    /**
     * 生成敌人
     */
    spawnEnemies() {
        // 如果有Boss，不生成普通敌人
        if (bossManager.currentBoss) return;

        // 计算生成数量
        const spawnCount = 1 + Math.floor(gameTime / 35);

        // 生成多个敌人
        for (let i = 0; i < spawnCount; i++) {
            this.spawnEnemy();
        }
    }

    /**
     * 生成单个敌人
     */
    spawnEnemy() {
        // 获取可用敌人类型
        const availableTypes = this.getAvailableEnemyTypes();

        // 如果没有可用类型，返回
        if (availableTypes.length === 0) return;

        // 选择敌人类型
        const enemyType = this.selectEnemyType(availableTypes);

        // 计算生成位置
        const spawnPosition = this.calculateSpawnPosition();

        // 计算难度乘数
        const difficultyMultiplier = 1 + (gameTime / 150);

        // 创建敌人
        const enemy = new Enemy(spawnPosition.x, spawnPosition.y, enemyType, difficultyMultiplier);

        // 添加到敌人列表
        enemies.push(enemy);
    }

    /**
     * 获取可用敌人类型
     * @returns {Array} 可用敌人类型数组
     */
    getAvailableEnemyTypes() {
        // 根据游戏时间筛选可用敌人类型
        return ENEMY_TYPES.filter(type => gameTime >= (type.minTime || 0));
    }

    /**
     * 选择敌人类型
     * @param {Array} availableTypes - 可用敌人类型数组
     * @returns {Object} 选中的敌人类型
     */
    selectEnemyType(availableTypes) {
        // 如果缓存有效，使用缓存的权重
        if (this.cachedTypeWeights && gameTime - this.lastCacheTime < 10) {
            return this.selectTypeByWeight(availableTypes, this.cachedTypeWeights);
        }

        // 计算总权重
        let totalWeight = 0;
        availableTypes.forEach(type => totalWeight += type.weight);

        // 缓存权重和时间
        this.cachedTypeWeights = totalWeight;
        this.lastCacheTime = gameTime;

        // 选择类型
        return this.selectTypeByWeight(availableTypes, totalWeight);
    }

    /**
     * 根据权重选择类型
     * @param {Array} types - 类型数组
     * @param {number} totalWeight - 总权重
     * @returns {Object} 选中的类型
     */
    selectTypeByWeight(types, totalWeight) {
        // 生成随机权重
        let randomWeight = Math.random() * totalWeight;

        // 选择类型
        for (const type of types) {
            if (randomWeight < type.weight) {
                return type;
            }
            randomWeight -= type.weight;
        }

        // 默认返回第一个类型
        return types[0];
    }

    /**
     * 计算生成位置
     * @returns {Object} 生成位置
     */
    calculateSpawnPosition() {
        // 选择一个边缘
        const edge = Math.floor(Math.random() * 4);

        // 计算生成位置
        let x, y;
        switch (edge) {
            case 0: // 上边缘
                x = player.x + (Math.random() * GAME_WIDTH - GAME_WIDTH / 2);
                y = player.y - GAME_HEIGHT / 2 - SPAWN_PADDING;
                break;
            case 1: // 右边缘
                x = player.x + GAME_WIDTH / 2 + SPAWN_PADDING;
                y = player.y + (Math.random() * GAME_HEIGHT - GAME_HEIGHT / 2);
                break;
            case 2: // 下边缘
                x = player.x + (Math.random() * GAME_WIDTH - GAME_WIDTH / 2);
                y = player.y + GAME_HEIGHT / 2 + SPAWN_PADDING;
                break;
            case 3: // 左边缘
                x = player.x - GAME_WIDTH / 2 - SPAWN_PADDING;
                y = player.y + (Math.random() * GAME_HEIGHT - GAME_HEIGHT / 2);
                break;
        }

        return { x, y };
    }

    /**
     * 处理敌人死亡
     * @param {Enemy} enemy - 敌人
     * @param {Player} killer - 击杀者
     */
    handleEnemyDeath(enemy, killer) {
        // 增加击杀计数
        killCount++;

        // 掉落经验
        this.dropExperience(enemy);

        // 掉落物品
        this.dropItems(enemy, killer);
    }

    /**
     * 掉落经验
     * @param {Enemy} enemy - 敌人
     */
    dropExperience(enemy) {
        // 生成经验宝石
        spawnXPGem(enemy.x, enemy.y, enemy.xpValue);
    }

    /**
     * 掉落物品
     * @param {Enemy} enemy - 敌人
     * @param {Player} killer - 击杀者
     */
    dropItems(enemy, killer) {
        // 获取幸运值
        const luckFactor = killer.getStat('luck');

        // 掉落治疗物品
        if (Math.random() < 0.02 * luckFactor) {
            spawnPickup(enemy.x, enemy.y, EMOJI.HEART, 'heal', 20);
        }

        // 掉落吸铁石
        if (Math.random() < 0.01 * luckFactor) {
            spawnPickup(enemy.x, enemy.y, EMOJI.MAGNET, 'magnet', 0);
        }
    }
}

// 创建全局敌人管理器实例
const enemyManager = new EnemyManager();