/**
 * 摄像机管理器
 * 管理游戏摄像机（固定视角）
 */
const cameraManager = {
    // 相机位置
    x: 0,
    y: 0,
    // 目标位置
    targetX: 0,
    targetY: 0,

    // 平滑系数
    smoothFactor: 0.1,

    // 缩放比例
    zoom: 1.0,

    // 游戏世界无限大
    // 不再限制世界大小
    worldWidth: Number.MAX_SAFE_INTEGER,
    worldHeight: Number.MAX_SAFE_INTEGER,

    // 是否在Boss战中
    bossArenaActive: false,
    bossArenaRadius: 0,
    bossArenaX: 0,
    bossArenaY: 0,

    /**
     * 设置相机位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
    },

    /**
     * 设置目标位置
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    },

    /**
     * 更新相机位置
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 平滑移动相机
        this.x += (this.targetX - this.x) * this.smoothFactor;
        this.y += (this.targetY - this.y) * this.smoothFactor;
        
        // 移除世界边界限制，使地图无限大
        // 不再限制相机位置
    },

    /**
     * 更新相机跟随目标
     * @param {Object} target - 跟随目标，通常是玩家
     */
    follow(target) {
        if (!target) return;
        
        // 如果在Boss战场中，限制玩家在战场内
        if (this.bossArenaActive) {
            // 计算玩家与Boss战场中心的距离
            const dx = target.x - this.bossArenaX;
            const dy = target.y - this.bossArenaY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // 如果玩家试图离开Boss战场
            if (distance > this.bossArenaRadius - target.size / 2) {
                // 计算边界上的最近点，将玩家限制在战场内
                const ratio = (this.bossArenaRadius - target.size / 2) / distance;
                target.x = this.bossArenaX + dx * ratio;
                target.y = this.bossArenaY + dy * ratio;
            }
        }

        // 设置相机目标为玩家位置
        this.setTarget(target.x, target.y);
    },
    
    /**
     * 激活Boss战场
     * @param {number} x - 战场中心X坐标
     * @param {number} y - 战场中心Y坐标
     * @param {number} radius - 战场半径
     */
    activateBossArena(x, y, radius) {
        console.log("激活Boss战场:", x, y, radius);
        
        // 先确保彻底清理之前的战场效果
        this.deactivateBossArena();
        
        // 设置新的战场参数
        this.bossArenaActive = true;
        this.bossArenaX = x;
        this.bossArenaY = y;
        this.bossArenaRadius = radius;
        
        // 确保visualEffects已初始化
        if (typeof window.visualEffects === 'undefined' || !Array.isArray(window.visualEffects)) {
            console.warn("visualEffects数组未初始化或不是数组，将初始化一个新数组");
            window.visualEffects = [];
        }
        
        // 创建战场视觉边界效果
        createBossArenaEffect(x, y, radius);
        
        console.log("Boss战场激活完成，参数:", 
                   {x, y, radius, 
                    active: this.bossArenaActive, 
                    effectsCount: window.visualEffects.length});
    },
    
    /**
     * 停用Boss战场
     */
    deactivateBossArena() {
        this.bossArenaActive = false;
        
        // 移除战场视觉边界效果
        removeBossArenaEffect();
        console.log("相机管理器：Boss战场已停用");
    },

    /**
     * 世界坐标转屏幕坐标
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @returns {Object} 屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        // 将世界坐标转换为相对于相机的坐标
        const x = worldX - this.x + GAME_WIDTH / 2;
        const y = worldY - this.y + GAME_HEIGHT / 2;
        return { x, y };
    },

    /**
     * 屏幕坐标转世界坐标
     * @param {number} screenX - 屏幕X坐标
     * @param {number} screenY - 屏幕Y坐标
     * @returns {Object} 世界坐标
     */
    screenToWorld(screenX, screenY) {
        // 将屏幕坐标转换为世界坐标
        const x = screenX + this.x - GAME_WIDTH / 2;
        const y = screenY + this.y - GAME_HEIGHT / 2;
        return { x, y };
    },

    /**
     * 检查对象是否在视野内
     * @param {GameObject} obj - 游戏对象
     * @returns {boolean} 是否在视野内
     */
    isVisible(obj) {
        // 将对象位置转换为屏幕坐标
        const screenPos = this.worldToScreen(obj.x, obj.y);
        
        // 检查是否在屏幕范围内
        return (
            screenPos.x + obj.size / 2 > 0 &&
            screenPos.x - obj.size / 2 < GAME_WIDTH &&
            screenPos.y + obj.size / 2 > 0 &&
            screenPos.y - obj.size / 2 < GAME_HEIGHT
        );
    },

    /**
     * 检查给定世界坐标是否在相机视图内（可带缓冲）
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @param {number} [buffer=0] - 边缘缓冲，也可以理解为物体的一半大小
     * @returns {boolean} 是否在视图内
     */
    isPositionInView(worldX, worldY, buffer = 0) {
        // 相机视图的边界
        const viewLeft = this.x - GAME_WIDTH / 2;
        const viewRight = this.x + GAME_WIDTH / 2;
        const viewTop = this.y - GAME_HEIGHT / 2;
        const viewBottom = this.y + GAME_HEIGHT / 2;

        // 检查点是否在视图边界内（考虑缓冲区）
        return (
            worldX + buffer > viewLeft &&
            worldX - buffer < viewRight &&
            worldY + buffer > viewTop &&
            worldY - buffer < viewBottom
        );
    },
    
    /**
     * 重置相机
     */
    resetCamera() {
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.bossArenaActive = false;
    }
};

/**
 * 创建Boss战场视觉边界效果
 * @param {number} x - 战场中心X坐标
 * @param {number} y - 战场中心Y坐标
 * @param {number} radius - 战场半径
 */
function createBossArenaEffect(x, y, radius) {
    console.log("创建新的Boss战场边界效果...");
    
    // 首先清理可能存在的任何Boss战场效果
    // 防止重复创建导致的效果堆叠问题
    removeBossArenaEffect();
    
    // 检查visualEffects中是否有残留的Boss战场效果
    if (typeof visualEffects !== 'undefined') {
        let existingEffects = visualEffects.filter(effect => effect && effect.isBossArenaEffect);
        if (existingEffects.length > 0) {
            console.warn(`警告: 在创建新效果前仍有 ${existingEffects.length} 个Boss战场效果未清理`);
            // 强制清理
            for (let i = visualEffects.length - 1; i >= 0; i--) {
                if (visualEffects[i] && visualEffects[i].isBossArenaEffect) {
                    visualEffects.splice(i, 1);
                }
            }
        }
    }
    
    // 创建边界效果对象
    const arenaEffect = {
        x: x,
        y: y,
        radius: radius,
        isGarbage: false,
        isBossArenaEffect: true, // 添加标识，方便后续移除
        createdAt: Date.now(), // 添加创建时间戳，便于调试
        
        // 更新方法（目前没有特别需要更新的，但保留接口）
        update: function(dt) {
            // 确保状态一致性
            if (!cameraManager.bossArenaActive && !this.isGarbage) {
                console.log("检测到异常：Boss战场已停用但效果仍然存在，标记为移除");
                this.isGarbage = true;
                
                // 从视觉效果列表中直接移除
                const index = visualEffects.indexOf(this);
                if (index !== -1) {
                    visualEffects.splice(index, 1);
                }
            }
        },
        
        // 绘制方法
        draw: function(ctx) {
            if (this.isGarbage) return; // 如果已标记为垃圾，不绘制
            
            const screenPos = cameraManager.worldToScreen(this.x, this.y);
            const screenRadius = this.radius;
            
            // 绘制半透明边界
            ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 绘制边界警告区域
            ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
            ctx.lineWidth = 20;
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, screenRadius - 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    };
    
    // 添加到视觉效果列表
    window.bossArenaEffect = arenaEffect;
    try {
        if (typeof visualEffects === 'undefined' || !Array.isArray(visualEffects)) {
            console.error("视觉效果数组未定义或不是数组，重新初始化");
            window.visualEffects = window.visualEffects || [];
            visualEffects = window.visualEffects;
        }
        visualEffects.push(arenaEffect);
        console.log("Boss战场视觉边界效果已创建，ID:", arenaEffect.createdAt);
    } catch (e) {
        console.error("添加Boss战场效果失败:", e);
    }
    
    // 添加安全检查，确保效果确实被添加到了数组中
    const effectAdded = visualEffects && visualEffects.some(e => e === arenaEffect);
    if (!effectAdded) {
        console.error("Boss战场效果未能成功添加到视觉效果数组");
    }
    
    return arenaEffect; // 返回创建的效果对象
}

/**
 * 移除Boss战场视觉边界效果
 */
function removeBossArenaEffect() {
    console.log("执行removeBossArenaEffect - 彻底移除Boss战场效果");
    
    // 立即停用相机管理器中的标志
    cameraManager.bossArenaActive = false;
    cameraManager.bossArenaRadius = 0;
    
    // 清理全局引用
    if (window.bossArenaEffect) {
        console.log("发现全局Boss战场效果引用，准备清除");
        window.bossArenaEffect.isGarbage = true;
        window.bossArenaEffect = null;
        console.log("全局Boss战场效果引用已清除");
    }
    
    // 直接强制清理所有战场效果
    if (typeof visualEffects !== 'undefined') {
        let removedCount = 0;
        // 找出所有Boss战场效果
        const arenaEffects = [];
        for (let i = 0; i < visualEffects.length; i++) {
            if (visualEffects[i] && visualEffects[i].isBossArenaEffect) {
                arenaEffects.push(i);
            }
        }
        
        // 从后往前移除，避免索引变化问题
        for (let i = arenaEffects.length - 1; i >= 0; i--) {
            visualEffects.splice(arenaEffects[i], 1);
            removedCount++;
        }
        
        if (removedCount > 0) {
            console.log(`成功移除${removedCount}个Boss战场边界效果`);
        } else {
            console.log("没有找到需要移除的Boss战场效果");
        }
    }
}
