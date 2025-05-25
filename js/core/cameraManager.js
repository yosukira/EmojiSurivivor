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
        this.bossArenaActive = true;
        this.bossArenaX = x;
        this.bossArenaY = y;
        this.bossArenaRadius = radius;
        
        // 创建战场视觉边界效果
        createBossArenaEffect(x, y, radius);
    },
    
    /**
     * 停用Boss战场
     */
    deactivateBossArena() {
        this.bossArenaActive = false;
        
        // 移除战场视觉边界效果
        removeBossArenaEffect();
        
        // 添加额外的清理步骤
        if (typeof visualEffects !== 'undefined' && Array.isArray(visualEffects)) {
            // 再次检查并清理所有Boss战场相关效果
            let remainingEffects = 0;
            for (let i = visualEffects.length - 1; i >= 0; i--) {
                const effect = visualEffects[i];
                if (effect && (effect.isBossArenaEffect || effect.type === 'bossArena')) {
                    visualEffects.splice(i, 1);
                    remainingEffects++;
                }
            }
            if (remainingEffects > 0) {
                console.log(`额外清理了${remainingEffects}个遗留的Boss战场效果`);
            }
        }
        
        // 确保全局引用被清除
        if (window.bossArenaEffect) {
            window.bossArenaEffect.isGarbage = true;
            window.bossArenaEffect = null;
        }
        
        console.log("相机管理器：Boss战场已停用并完全清理");
    },

    /**
     * 世界坐标转屏幕坐标
     * @param {number} worldX - 世界X坐标
     * @param {number} worldY - 世界Y坐标
     * @returns {Object} 屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        // 将世界坐标转换为相对于相机的坐标
        // 修复浏览器缩放问题：使用canvas实际尺寸而非GAME_WIDTH/HEIGHT常量
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const x = worldX - this.x + canvasWidth / 2;
        const y = worldY - this.y + canvasHeight / 2;
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
        // 修复浏览器缩放问题：使用canvas实际尺寸而非GAME_WIDTH/HEIGHT常量
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const x = screenX + this.x - canvasWidth / 2;
        const y = screenY + this.y - canvasHeight / 2;
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
 * @returns {Object} 创建的边界效果对象
 */
function createBossArenaEffect(x, y, radius) {
    console.log("创建新的Boss战场边界效果...");
    
    // 首先清理可能存在的任何Boss战场效果
    // 防止重复创建导致的效果堆叠问题
    if (window.bossArenaEffect) {
        console.log("发现现有Boss战场效果，先清理...");
        removeBossArenaEffect();
    }
    
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
                // 立即进行一次完整清理
                removeBossArenaEffect();
                return;
            }
            
            // 额外检查：如果Boss已经被击败，但效果还存在
            if (bossManager && bossManager.currentBoss === null && cameraManager.bossArenaActive) {
                console.log("检测到异常：Boss已被击败但战场效果仍然活跃，停用战场");
                cameraManager.deactivateBossArena();
                this.isGarbage = true;
                return;
            }
            
            // 定期检查战场效果一致性 (每5秒)
            if (!this._lastConsistencyCheck || Date.now() - this._lastConsistencyCheck > 5000) {
                this._lastConsistencyCheck = Date.now();
                
                // 检查全局引用一致性
                if (window.bossArenaEffect !== this && window.bossArenaEffect !== null) {
                    console.warn("检测到异常：存在多个Boss战场效果实例，进行清理");
                    removeBossArenaEffect();
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
    visualEffects.push(arenaEffect);
    console.log("Boss战场视觉边界效果已创建，ID:", arenaEffect.createdAt);
    
    return arenaEffect; // 返回创建的效果对象
}

/**
 * 移除Boss战场视觉边界效果
 */
function removeBossArenaEffect() {
    console.log("开始移除Boss战场视觉边界效果...");
    if (window.bossArenaEffect) {
        console.log("标记并移除全局Boss战场效果引用...");
        window.bossArenaEffect.isGarbage = true; // 确保在设为null前标记
        window.bossArenaEffect = null;
    }
    
    // 直接从 visualEffects 数组中移除所有 isBossArenaEffect 为 true 的效果
    if (typeof visualEffects !== 'undefined' && Array.isArray(visualEffects)) {
        let removedCount = 0;
        for (let i = visualEffects.length - 1; i >= 0; i--) {
            if (visualEffects[i] && visualEffects[i].isBossArenaEffect) {
                console.log("直接从visualEffects中移除Boss战场效果对象:", visualEffects[i]);
                visualEffects.splice(i, 1);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            console.log(`已从visualEffects中直接移除了 ${removedCount} 个Boss战场效果对象。`);
        } else {
            console.log("在visualEffects中未找到需要直接移除的Boss战场效果对象。");
        }
    } else {
        console.warn("visualEffects 数组未定义或不是数组，无法移除战场效果。");
    }
    console.log("移除Boss战场视觉边界效果执行完毕。");
}

