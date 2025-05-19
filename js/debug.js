// js/debug.js
// 初始化 debugCommands 对象
window.debugCommands = window.debugCommands || {};

window.DebugPanel = {
    panel: null,
    invincibleButton: null,
    isDragging: false,
    offsetX: 0,
    offsetY: 0,

    init: function() {
        console.log("Initializing Debug Panel...");
        this.createPanel();
        this.addCoreControls();
        this.addBossSpawningControls();
        this.addItemsSection();
        this.addGlobalSettingsControls();

        this.applyInitialDebugSettings();

        if (typeof player === 'undefined') {
            console.warn("Debug Panel: Player object not found at init. Some controls might not work until player is initialized.");
        }
        if (typeof player !== 'undefined') {
            this.updateInvincibleButton();
        }
    },

    applyInitialDebugSettings: function() {
        if (typeof player !== 'undefined' && player) {
            player.maxWeapons = 100;
            player.maxPassiveItems = 100;
            console.log("Debug: Applied initial settings - maxWeapons & maxPassiveItems set to 100.");
        } else {
            setTimeout(() => {
                if (typeof player !== 'undefined' && player) {
                    player.maxWeapons = 100;
                    player.maxPassiveItems = 100;
                    console.log("Debug: Applied initial settings (deferred) - maxWeapons & maxPassiveItems set to 100.");
                } else {
                     console.warn("Debug: Player still not available after delay. Could not set item limits automatically.");
                }
            }, 2000);
        }
    },

    createPanel: function() {
        this.panel = document.createElement('div');
        this.panel.id = 'debug-panel';
        this.panel.style.position = 'fixed';
        this.panel.style.top = '10px';
        this.panel.style.right = '10px';
        this.panel.style.width = '250px';
        this.panel.style.backgroundColor = 'rgba(30,30,30,0.9)';
        this.panel.style.color = 'white';
        this.panel.style.padding = '10px';
        this.panel.style.border = '1px solid #555';
        this.panel.style.borderRadius = '5px';
        this.panel.style.zIndex = '10000';
        this.panel.style.fontFamily = 'Arial, sans-serif';
        this.panel.style.fontSize = '13px';
        this.panel.style.maxHeight = '90vh';
        this.panel.style.overflowY = 'auto';
        document.body.appendChild(this.panel);

        const titleBar = document.createElement('div');
        titleBar.textContent = '调试面板 (Debug Panel)';
        titleBar.style.padding = '8px';
        titleBar.style.cursor = 'move';
        titleBar.style.backgroundColor = '#333';
        titleBar.style.color = 'white';
        titleBar.style.textAlign = 'center';
        titleBar.style.marginBottom = '10px';
        titleBar.style.borderBottom = '1px solid #555';
        titleBar.style.userSelect = 'none';
        this.panel.appendChild(titleBar);

        titleBar.onmousedown = (e) => {
            this.isDragging = true;
            this.offsetX = e.clientX - this.panel.offsetLeft;
            this.offsetY = e.clientY - this.panel.offsetTop;
            this.panel.style.cursor = 'grabbing';
        };

        document.onmousemove = (e) => {
            if (!this.isDragging) return;
            let newLeft = e.clientX - this.offsetX;
            let newTop = e.clientY - this.offsetY;
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - this.panel.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - this.panel.offsetHeight));
            this.panel.style.left = newLeft + 'px';
            this.panel.style.top = newTop + 'px';
        };

        document.onmouseup = () => {
            this.isDragging = false;
            this.panel.style.cursor = 'default';
        };
    },

    addButtonToElement: function(parentElement, text, onClick, id = null) {
        const button = document.createElement('button');
        button.textContent = text;
        if (id) button.id = id;
        button.style.display = 'block';
        button.style.width = '100%';
        button.style.boxSizing = 'border-box';
        button.style.marginBottom = '8px';
        button.style.padding = '10px 5px';
        button.style.backgroundColor = '#555';
        button.style.color = 'white';
        button.style.border = '1px solid #777';
        button.style.borderRadius = '3px';
        button.style.cursor = 'pointer';
        button.style.fontSize = '13px';
        button.onmouseover = () => button.style.backgroundColor = '#666';
        button.onmouseout = () => button.style.backgroundColor = '#555';
        button.onclick = onClick;
        parentElement.appendChild(button);
        return button;
    },
    
    addSectionTitle: function(parentElement, text) {
        const title = document.createElement('h4');
        title.textContent = text;
        title.style.textAlign = 'center';
        title.style.marginTop = '15px';
        title.style.marginBottom = '8px';
        title.style.borderBottom = '1px solid #444';
        title.style.paddingBottom = '5px';
        parentElement.appendChild(title);
    },

    addCoreControls: function() {
        this.addSectionTitle(this.panel, "核心控制 (Core Controls)");

        this.invincibleButton = this.addButtonToElement(this.panel, "切换无敌 (Toggle Invincible)", () => this.toggleInvincibility(), "debug-invincible-btn");
        this.updateInvincibleButton();

        this.addButtonToElement(this.panel, "显示升级选项 (Show Level Up)", () => {
            if (typeof player !== 'undefined' && player && typeof presentLevelUpOptions === 'function') {
                isLevelUp = true;
                presentLevelUpOptions();
                console.log("Debug: Forced display of level up options.");
            } else {
                 console.warn("Debug: Cannot show level up options. Player or presentLevelUpOptions function not found.");
                 alert("Player not ready or presentLevelUpOptions function missing.");
            }
        });
    },

    addBossSpawningControls: function() {
        this.addSectionTitle(this.panel, "生成首领 (Spawn Boss)");

        if (typeof BOSS_TYPES === 'undefined' || BOSS_TYPES.length === 0) {
            const noBossMsg = document.createElement('p');
            noBossMsg.textContent = "未找到首领类型 (No boss types defined).";
            noBossMsg.style.fontSize = '11px';
            noBossMsg.style.fontStyle = 'italic';
            this.panel.appendChild(noBossMsg);
            return;
        }

        BOSS_TYPES.forEach(bossType => {
            this.addButtonToElement(this.panel, `生成 ${bossType.name} (Spawn ${bossType.name})`, () => {
                if (typeof BossEnemy === 'undefined' || typeof enemies === 'undefined') {
                    console.warn("Debug: Cannot spawn boss. BossEnemy class or enemies array not found.");
                    alert("Boss spawning prerequisites missing (BossEnemy or enemies).");
                    return;
                }
                if (typeof cameraManager === 'undefined' || typeof canvas === 'undefined'){
                    console.warn("Debug: cameraManager or canvas not found for boss positioning.");
                    alert("Game screen utilities missing for boss positioning.");
                    return;
                }

                let spawnX = cameraManager.x + canvas.width / 2 / cameraManager.zoom;
                let spawnY = cameraManager.y; 

                if (player) {
                    spawnX = player.x + (Math.random() * 100 - 50);
                    spawnY = player.y - 250;
                }
                
                const newBoss = new BossEnemy(spawnX, spawnY, bossType);
                enemies.push(newBoss);
                console.log(`Debug: Spawned Boss ${bossType.name} at (${spawnX.toFixed(0)}, ${spawnY.toFixed(0)})`);
            });
        });
    },

    toggleInvincibility: function() {
        if (player) {
            player.isInvincible = !player.isInvincible;
            if (player.isInvincible) {
                player.invincibleTimer = Infinity; 
            } else {
                player.invincibleTimer = 0; 
            }
            console.log(`Debug: Player invincibility set to ${player.isInvincible}`);
            this.updateInvincibleButton();
        } else {
            console.warn("Debug: Cannot toggle invincibility. Player object not found.");
            alert("玩家未就绪 (Player not ready).");
        }
    },

    updateInvincibleButton: function() {
        if (this.invincibleButton) {
            if (typeof player !== 'undefined' && player && typeof player.isInvincible !== 'undefined') {
                const statusText = player.isInvincible ? '开 (ON)' : '关 (OFF)';
                this.invincibleButton.textContent = `切换无敌: ${statusText} (Toggle Invincible)`;
            } else {
                this.invincibleButton.textContent = "切换无敌 (玩家未就绪)";
            }
        }
    },

    getKnownItemClasses: function() {
        const items = { weapons: {}, passives: {}, evolutions: {} };
        
        // 基础武器
        if (typeof DaggerWeapon !== 'undefined') items.weapons['Dagger'] = DaggerWeapon;
        if (typeof GarlicWeapon !== 'undefined') items.weapons['Garlic'] = GarlicWeapon;
        if (typeof WhipWeapon !== 'undefined') items.weapons['Whip'] = WhipWeapon;
        
        // 高级武器
        if (typeof FireBladeWeapon !== 'undefined') items.weapons['FireBlade'] = FireBladeWeapon;
        if (typeof StormBladeWeapon !== 'undefined') items.weapons['StormBlade'] = StormBladeWeapon;
        if (typeof HandshakeWeapon !== 'undefined') items.weapons['Handshake'] = HandshakeWeapon;
        
        // 新武器
        if (typeof BubbleWandWeapon !== 'undefined') items.weapons['BubbleWand'] = BubbleWandWeapon;
        if (typeof ChaosDiceWeapon !== 'undefined') items.weapons['ChaosDice'] = ChaosDiceWeapon;
        if (typeof MagnetGunWeapon !== 'undefined') items.weapons['MagnetGun'] = MagnetGunWeapon;
        if (typeof SonicHornWeapon !== 'undefined') items.weapons['SonicHorn'] = SonicHornWeapon;
        if (typeof PoisonVialWeapon !== 'undefined') items.weapons['PoisonVial'] = PoisonVialWeapon;
        if (typeof FrostStaffWeapon !== 'undefined') items.weapons['FrostStaff'] = FrostStaffWeapon;
        if (typeof VineSeedWeapon !== 'undefined') items.weapons['VineSeed'] = VineSeedWeapon;
        if (typeof LaserPrismWeapon !== 'undefined') items.weapons['LaserPrism'] = LaserPrismWeapon;
        if (typeof VolcanoStaffWeapon !== 'undefined') items.weapons['VolcanoStaff'] = VolcanoStaffWeapon;
        if (typeof BlackHoleBallWeapon !== 'undefined') items.weapons['BlackHoleBall'] = BlackHoleBallWeapon;

        // 基础被动道具
        if (typeof Spinach !== 'undefined') items.passives['Spinach'] = Spinach;
        if (typeof Armor !== 'undefined') items.passives['Armor'] = Armor;
        if (typeof Wings !== 'undefined') items.passives['Wings'] = Wings;
        if (typeof EmptyTome !== 'undefined') items.passives['EmptyTome'] = EmptyTome;
        if (typeof Candelabrador !== 'undefined') items.passives['Candelabrador'] = Candelabrador;
        if (typeof Bracer !== 'undefined') items.passives['Bracer'] = Bracer;
        if (typeof HollowHeart !== 'undefined') items.passives['HollowHeart'] = HollowHeart;
        if (typeof Pummarola !== 'undefined') items.passives['Pummarola'] = Pummarola;
        if (typeof Magnet !== 'undefined' && Magnet.prototype instanceof PassiveItem) items.passives['Magnet'] = Magnet; 
        else if (typeof MagnetPassive !== 'undefined') items.passives['Magnet (Legacy)'] = MagnetPassive;
        if (typeof SoulRelic !== 'undefined') items.passives['SoulRelic'] = SoulRelic;
        
        // 新被动道具
        if (typeof EmptyBottle !== 'undefined') items.passives['EmptyBottle'] = EmptyBottle;
        if (typeof Gargoyle !== 'undefined') items.passives['Gargoyle'] = Gargoyle;
        if (typeof MagicCrystal !== 'undefined') items.passives['MagicCrystal'] = MagicCrystal;
        if (typeof MysteryCard !== 'undefined') items.passives['MysteryCard'] = MysteryCard;
        if (typeof OccultCharm !== 'undefined') items.passives['OccultCharm'] = OccultCharm;
        if (typeof BarrierRune !== 'undefined') items.passives['BarrierRune'] = BarrierRune;
        if (typeof FrostHeart !== 'undefined') items.passives['FrostHeart'] = FrostHeart;
        if (typeof DragonSpice !== 'undefined') items.passives['DragonSpice'] = DragonSpice;
        if (typeof ThunderAmulet !== 'undefined') items.passives['ThunderAmulet'] = ThunderAmulet;
        if (typeof PoisonOrb !== 'undefined') items.passives['PoisonOrb'] = PoisonOrb;
        if (typeof MagnetSphere !== 'undefined') items.passives['MagnetSphere'] = MagnetSphere;
        if (typeof AncientTreeSap !== 'undefined') items.passives['AncientTreeSap'] = AncientTreeSap;
        
        // 添加进化组合信息
        if (typeof WEAPON_EVOLUTIONS === 'object') {
            for (const [combo, result] of Object.entries(WEAPON_EVOLUTIONS)) {
                items.evolutions[combo] = result;
            }
        }
        
        return items;
    },

    addItemsSection: function() {
        this.addSectionTitle(this.panel, "添加/升级物品 (Add/Upgrade Items)");
        const itemsDiv = this.panel;

        const knownItems = this.getKnownItemClasses();

        // 添加折叠/展开功能的助手函数
        const createCollapsibleSection = (title, initiallyCollapsed = false) => {
            const section = document.createElement('div');
            section.className = 'debug-collapsible-section';
            
            const header = document.createElement('div');
            header.className = 'debug-section-header';
            header.style.cursor = 'pointer';
            header.style.padding = '5px';
            header.style.backgroundColor = '#444';
            header.style.borderRadius = '3px';
            header.style.marginTop = '10px';
            header.style.marginBottom = '5px';
            header.style.display = 'flex';
            header.style.justifyContent = 'space-between';
            header.style.alignItems = 'center';
            
            const headerText = document.createElement('span');
            headerText.textContent = title;
            headerText.style.fontWeight = 'bold';
            header.appendChild(headerText);
            
            const indicator = document.createElement('span');
            indicator.textContent = initiallyCollapsed ? '▶' : '▼';
            indicator.style.fontSize = '10px';
            header.appendChild(indicator);
            
            const content = document.createElement('div');
            content.className = 'debug-section-content';
            content.style.display = initiallyCollapsed ? 'none' : 'block';
            content.style.paddingLeft = '10px';
            
            section.appendChild(header);
            section.appendChild(content);
            
            header.onclick = () => {
                const isCollapsed = content.style.display === 'none';
                content.style.display = isCollapsed ? 'block' : 'none';
                indicator.textContent = isCollapsed ? '▼' : '▶';
            };
            
            return { section, content };
        };

        const createOrUpdateItemButtons = (type, classes, headerText) => {
            if (Object.keys(classes).length > 0) {
                const { section, content } = createCollapsibleSection(headerText, false);
                itemsDiv.appendChild(section);

                for (const itemName in classes) {
                    const itemClass = classes[itemName];
                    let displayName = itemName;
                    
                    // 获取中文名称（从类的静态Name属性或自定义映射）
                    if (itemClass && itemClass.Name) {
                        displayName = itemClass.Name;
                    } else {
                        // 常用道具的中文名映射
                        const nameMap = {
                            'Dagger': '短刀',
                            'Garlic': '大蒜',
                            'Whip': '鞭子',
                            'FireBlade': '火刀',
                            'StormBlade': '岚刀',
                            'Handshake': '握握手',
                            'BubbleWand': '泡泡魔棒',
                            'ChaosDice': '混沌骰子',
                            'MagnetGun': '磁力枪',
                            'SonicHorn': '声波号角',
                            'PoisonVial': '毒瓶',
                            'FrostStaff': '冰晶杖',
                            'VineSeed': '藤蔓种子',
                            'LaserPrism': '光棱塔',
                            'VolcanoStaff': '火山杖',
                            'BlackHoleBall': '黑洞球',
                            
                            'Spinach': '菠菜',
                            'Armor': '护甲',
                            'Wings': '翅膀',
                            'EmptyTome': '空之书',
                            'Candelabrador': '烛台',
                            'Bracer': '护腕',
                            'HollowHeart': '空心胸甲',
                            'Pummarola': '血泪石',
                            'Magnet': '磁铁',
                            'SoulRelic': '灵魂遗物',
                            'EmptyBottle': '空瓶',
                            'Gargoyle': '石像鬼',
                            'MagicCrystal': '魔法水晶',
                            'MysteryCard': '神秘卡片',
                            'OccultCharm': '神秘符咒',
                            'BarrierRune': '结界符文',
                            'FrostHeart': '寒冰之心',
                            'DragonSpice': '龙息香料',
                            'ThunderAmulet': '雷光护符',
                            'PoisonOrb': '毒素宝珠',
                            'MagnetSphere': '磁力球',
                            'AncientTreeSap': '古树精华'
                        };
                        if (nameMap[itemName]) {
                            displayName = nameMap[itemName];
                        }
                    }
                    
                    this.addButtonToElement(content, `添加/升级 ${displayName} (${itemName})`, () => {
                        if (!player) {
                             console.warn(`Debug: Player not found. Cannot add/upgrade ${itemName}.`);
                             alert("玩家未就绪 (Player not ready).");
                             return;
                        }
                        const itemCollection = type === 'weapon' ? player.weapons : player.passiveItems;
                        const existingItem = itemCollection.find(item => item instanceof itemClass);

                        if (existingItem) {
                            const canUpgrade = !existingItem.isMaxLevel || (typeof existingItem.isMaxLevel === 'function' && !existingItem.isMaxLevel());
                            if (canUpgrade) {
                                let upgraded = false;
                                if (typeof existingItem.upgrade === 'function') {
                                    existingItem.upgrade();
                                    upgraded = true;
                                } else if (typeof existingItem.levelUp === 'function') {
                                    existingItem.levelUp();
                                    upgraded = true;
                                } else {
                                     console.warn(`Debug: ${itemName} has no upgrade/levelUp method.`);
                                     alert(`${itemName} 没有升级方法。`);
                                     return;
                                }
                                if (upgraded) {
                                    if (player.recalculateStats) player.recalculateStats();
                                    console.log(`Debug: Upgraded ${type} ${itemName} to level ${existingItem.level}`);
                                    if (type === 'weapon' && typeof checkEvolution === 'function') {
                                        checkEvolution(player, existingItem);
                                    }
                                }
                            } else {
                                console.log(`Debug: ${itemName} is already max level.`);
                            }
                        } else {
                            // 使用箭头函数确保this绑定正确
                            const addFunc = type === 'weapon' ? 
                                (newItem) => player.addWeapon(newItem) : 
                                (newItem) => player.addPassive(newItem);
                            const maxItems = type === 'weapon' ? player.maxWeapons : player.maxPassiveItems;

                            if (itemCollection.length >= maxItems) {
                                console.warn(`Debug: Cannot add ${itemName}. Player has max ${type}s (${maxItems}).`);
                                return;
                            }
                            try {
                                const newItem = new itemClass(); 
                                addFunc(newItem);
                                console.log(`Debug: Added new ${type} ${itemName}`);
                            } catch (e) {
                                console.error(`Debug: Error adding new ${type} ${itemName}:`, e);
                            }
                        }
                        if (typeof updateUI === 'function') updateUI();
                    });
                }
            } else {
                const noItemsMsg = document.createElement('p');
                noItemsMsg.textContent = `未找到${type === 'weapon' ? '武器' : '被动'}类型定义。(No ${type} classes found).`;
                noItemsMsg.style.fontSize = '11px';
                noItemsMsg.style.fontStyle = 'italic';
                itemsDiv.appendChild(noItemsMsg);
            }
        };
        
        // 添加武器和被动道具按钮
        createOrUpdateItemButtons('weapon', knownItems.weapons, "武器 (Weapons)");
        createOrUpdateItemButtons('passive', knownItems.passives, "被动 (Passives)");
        
        // 添加进化组合信息
        if (Object.keys(knownItems.evolutions).length > 0) {
            const { section, content } = createCollapsibleSection("进化组合 (Evolutions)", true);
            itemsDiv.appendChild(section);
            
            const evolutionsList = document.createElement('div');
            evolutionsList.style.fontSize = '12px';
            evolutionsList.style.maxHeight = '200px';
            evolutionsList.style.overflowY = 'auto';
            evolutionsList.style.border = '1px solid #555';
            evolutionsList.style.padding = '5px';
            evolutionsList.style.marginTop = '5px';
            evolutionsList.style.marginBottom = '10px';
            evolutionsList.style.backgroundColor = 'rgba(0,0,0,0.2)';
            content.appendChild(evolutionsList);
            
            for (const [combo, result] of Object.entries(knownItems.evolutions)) {
                const item = document.createElement('div');
                item.textContent = `${combo} → ${result}`;
                item.style.padding = '3px 0';
                item.style.borderBottom = '1px dotted #444';
                evolutionsList.appendChild(item);
            }
        }
    },

    addGlobalSettingsControls: function() {
        this.addSectionTitle(this.panel, "全局设置 (Global Settings)");
        this.addButtonToElement(this.panel, "设置物品上限为100 (Set Item Limits to 100)", () => {
            if (player) {
                const oldMaxWeapons = player.maxWeapons;
                const oldMaxPassives = player.maxPassiveItems;
                player.maxWeapons = 100;
                player.maxPassiveItems = 100;
                console.log(`Debug: Set maxWeapons to 100 (was ${oldMaxWeapons}), maxPassiveItems to 100 (was ${oldMaxPassives}).`);
                if (typeof updateUI === 'function') updateUI();
            } else {
                alert("玩家未就绪，无法设置物品上限 (Player not ready).");
            }
        });
    }
};

const tryUpdateDebugPanelOnPlayerReady = () => {
    if (window.DebugPanel && window.DebugPanel.panel && typeof player !== 'undefined' && player) {
        window.DebugPanel.updateInvincibleButton();
    }
};

let playerCheckIntervalId = setInterval(() => {
    if (typeof player !== 'undefined' && player && (player.id !== undefined || player.x !== undefined)) {
        tryUpdateDebugPanelOnPlayerReady();
    }
}, 1000);

// 添加一个命令：显示当前所有被动道具的详细信息
debugCommands.passives = {
    help: "显示当前所有被动道具的详细信息",
    action: () => {
        if (!player || !player.passiveItems) {
            console.log("玩家或被动道具不存在");
            return;
        }
        
        console.log("===== 被动道具详情 =====");
        player.passiveItems.forEach((passive, index) => {
            console.log(`${index + 1}. ${passive.name} (Lv ${passive.level})`);
            console.log(`   描述: ${passive.description}`);
            console.log(`   属性加成:`, passive.bonuses);
        });
        
        // 输出玩家当前计算后的属性
        console.log("===== 玩家属性 =====");
        const stats = [
            'health', 'speed', 'armor', 'regen', 'pickupRadius', 
            'damageMultiplier', 'areaMultiplier', 'durationMultiplier', 
            'projectileSpeedMultiplier', 'cooldownMultiplier', 'projectileCountBonus'
        ];
        
        stats.forEach(stat => {
            console.log(`${stat}: ${player.getStat(stat)}`);
        });
    }
};

// 创建缺失的武器类
// 由于这些类在项目中可能不存在，我们在debug.js中创建它们，确保debug面板可以显示这些选项
// 这些只是基本实现，真正使用时应替换为正确的实现

// 藤蔓种子
if (typeof VineSeedWeapon === 'undefined') {
    class VineSeedWeapon extends Weapon {
        static Name = "藤蔓种子";
        static Emoji = "🌱";
        static MaxLevel = 10;
        static Evolution = {
            requires: "AncientTreeSap",
            evolvesTo: "LifeForest"
        };

        constructor() {
            super(VineSeedWeapon.Name, VineSeedWeapon.Emoji, 2.0, VineSeedWeapon.MaxLevel);
        }

                calculateStats() {            this.stats = {                damage: 10 + (this.level - 1) * 3,                cooldown: Math.max(1.0, 2.0 - (this.level - 1) * 0.1),                count: 1 + Math.floor((this.level - 1) / 3),                radius: 60 + (this.level - 1) * 5,                slowFactor: 0.3 + (this.level - 1) * 0.05,                duration: 5.0 // 持续时间固定为5秒            };        }
        
        /**
         * 更新武器状态
         * @param {number} dt - 时间增量
         * @param {Player} owner - 拥有者
         */
        update(dt, owner) {
            // 如果没有统计信息，计算统计信息
            if (!this.stats) {
                this.calculateStats();
            }
            
            // 增加冷却计时器
            this.cooldownTimer += dt;
            
            // 如果冷却结束，发射藤蔓
            if (this.cooldownTimer >= this.stats.cooldown) {
                // 重置冷却计时器
                this.cooldownTimer = 0;
                
                // 发射藤蔓攻击
                this.castVine(owner);
            }
        }
        
        /**
         * 发射藤蔓攻击
         * @param {Player} owner - 拥有者
         */
        castVine(owner) {
            // 获取基础伤害乘数
            const damageMultiplier = owner.getStat ? owner.getStat('damageMultiplier') : 1;
            const finalDamage = this.stats.damage * damageMultiplier;
            
            // 获取范围乘数
            const areaMultiplier = owner.getStat ? owner.getStat('areaMultiplier') : 1;
            const finalRadius = this.stats.radius * areaMultiplier;
            
            // 获取持续时间乘数
            const durationMultiplier = owner.getStat ? owner.getStat('durationMultiplier') : 1;
            const finalDuration = this.stats.duration * durationMultiplier;
            
            // 寻找目标位置
            for (let i = 0; i < this.stats.count; i++) {
                // 寻找随机敌人
                let targetEnemy = owner.findRandomEnemy(400);
                
                if (targetEnemy) {
                    // 如果找到敌人，在敌人位置创建藤蔓
                    if (typeof VineHazard === 'function') {
                        const vine = new VineHazard(
                            targetEnemy.x,
                            targetEnemy.y,
                            finalRadius,
                            finalDamage,
                            0.5, // 攻击间隔
                            this.stats.slowFactor,
                            finalDuration,
                            owner
                        );
                        
                        // 添加到全局数组
                        if (typeof hazards !== 'undefined') {
                            hazards.push(vine);
                        }
                    }
                }
            }
        }

        getInitialDescription() {
            return "种植藤蔓，减速并伤害范围内敌人。";
        }

        getCurrentDescription() {
            return `种植${this.stats.count}个藤蔓，减速敌人${Math.round(this.stats.slowFactor * 100)}%并造成${this.stats.damage}伤害。`;
        }
    }
    window.VineSeedWeapon = VineSeedWeapon;
}

// 光棱塔
if (typeof LaserPrismWeapon === 'undefined') {
    class LaserPrismWeapon extends Weapon {
        static Name = "光棱塔";
        static Emoji = "🔆";
        static MaxLevel = 10;
        static Evolution = {
            requires: "Bracer",
            evolvesTo: "LaserCore"
        };

        constructor() {
            super(LaserPrismWeapon.Name, LaserPrismWeapon.Emoji, 1.5, LaserPrismWeapon.MaxLevel);
        }

        calculateStats() {
            this.stats = {
                damage: 15 + (this.level - 1) * 5,
                cooldown: Math.max(0.8, 1.5 - (this.level - 1) * 0.07),
                count: 1 + Math.floor((this.level - 1) / 2),
                beamWidth: 15 + (this.level - 1) * 2,
                duration: 1.0 + (this.level - 1) * 0.1,
                piercing: this.level >= 5
            };
        }
        
        /**
         * 更新武器状态
         * @param {number} dt - 时间增量
         * @param {Player} owner - 拥有者
         */
        update(dt, owner) {
            // 如果没有统计信息，计算统计信息
            if (!this.stats) {
                this.calculateStats();
            }
            
            // 增加冷却计时器
            this.cooldownTimer += dt;
            
            // 如果冷却结束，发射激光
            if (this.cooldownTimer >= this.stats.cooldown) {
                // 重置冷却计时器
                this.cooldownTimer = 0;
                
                // 发射激光攻击
                this.fireLaser(owner);
            }
        }
        
        /**
         * 发射激光攻击
         * @param {Player} owner - 拥有者
         */
        fireLaser(owner) {
            // 获取基础伤害乘数
            const damageMultiplier = owner.getStat ? owner.getStat('damageMultiplier') : 1;
            const finalDamage = this.stats.damage * damageMultiplier;
            
            // 获取持续时间乘数
            const durationMultiplier = owner.getStat ? owner.getStat('durationMultiplier') : 1;
            const finalDuration = this.stats.duration * durationMultiplier;
            
            // 计算激光方向，均匀分布
            const beamCount = this.stats.count;
            const angleStep = Math.PI * 2 / beamCount;
            
            for (let i = 0; i < beamCount; i++) {
                const angle = angleStep * i;
                const dirX = Math.cos(angle);
                const dirY = Math.sin(angle);
                
                // 使用LaserBeamAttack类创建激光
                if (typeof LaserBeamAttack === 'function') {
                    const beam = new LaserBeamAttack(
                        owner,
                        dirX,
                        dirY,
                        300, // 激光长度
                        this.stats.beamWidth,
                        finalDamage,
                        finalDuration,
                        2.0, // 旋转速度
                        this.stats.piercing // 是否穿透
                    );
                    
                    // 添加到投射物数组
                    if (typeof projectiles !== 'undefined') {
                        projectiles.push(beam);
                    }
                }
            }
        }

        getInitialDescription() {
            return "发射激光光束，造成持续伤害。";
        }

        getCurrentDescription() {
            return `发射${this.stats.count}束激光，造成${this.stats.damage}伤害。${this.stats.piercing ? '激光可以穿透敌人。' : ''}`;
        }
    }
    window.LaserPrismWeapon = LaserPrismWeapon;
}

// 毒瓶
if (typeof PoisonVialWeapon === 'undefined') {
    class PoisonVialWeapon extends Weapon {
        static Name = "毒瓶";
        static Emoji = "🧪";
        static MaxLevel = 10;
        static Evolution = {
            requires: "PoisonOrb",
            evolvesTo: "PlagueVial"
        };

        constructor() {
            super(PoisonVialWeapon.Name, PoisonVialWeapon.Emoji, 1.8, PoisonVialWeapon.MaxLevel);
        }

        calculateStats() {
            this.stats = {
                damage: 8 + (this.level - 1) * 2,
                cooldown: Math.max(1.0, 1.8 - (this.level - 1) * 0.08),
                count: 1 + Math.floor((this.level - 1) / 3),
                poisonDamage: 3 + (this.level - 1) * 1,
                poisonDuration: Math.min(5, 3 + (this.level - 1) * 0.3),
                area: 60 + (this.level - 1) * 5,
                projectileSpeed: 250 + (this.level - 1) * 10,
                toxicCloud: this.level >= 7
            };
        }
        
        /**
         * 更新武器状态
         * @param {number} dt - 时间增量
         * @param {Player} owner - 拥有者
         */
        update(dt, owner) {
            // 如果没有统计信息，计算统计信息
            if (!this.stats) {
                this.calculateStats();
            }
            
            // 增加冷却计时器
            this.cooldownTimer += dt;
            
            // 如果冷却结束，投掷毒瓶
            if (this.cooldownTimer >= this.stats.cooldown) {
                // 重置冷却计时器
                this.cooldownTimer = 0;
                
                // 投掷毒瓶
                this.throwPoisonVial(owner);
            }
        }
        
        /**
         * 投掷毒瓶
         * @param {Player} owner - 拥有者
         */
        throwPoisonVial(owner) {
            // 获取基础伤害乘数
            const damageMultiplier = owner.getStat ? owner.getStat('damageMultiplier') : 1;
            const finalDamage = this.stats.damage * damageMultiplier;
            const finalPoisonDamage = this.stats.poisonDamage * damageMultiplier;
            
            // 获取范围乘数
            const areaMultiplier = owner.getStat ? owner.getStat('areaMultiplier') : 1;
            const finalArea = this.stats.area * areaMultiplier;
            
            // 获取持续时间乘数
            const durationMultiplier = owner.getStat ? owner.getStat('durationMultiplier') : 1;
            const finalPoisonDuration = this.stats.poisonDuration * durationMultiplier;
            
            // 获取投射物速度乘数
            const projSpeedMultiplier = owner.getStat ? owner.getStat('projectileSpeedMultiplier') : 1;
            const finalSpeed = this.stats.projectileSpeed * projSpeedMultiplier;
            
            // 对每个毒瓶
            for (let i = 0; i < this.stats.count; i++) {
                // 寻找目标
                const target = owner.findRandomEnemy(400);
                
                // 确定方向
                let dirX, dirY;
                
                if (target) {
                    // 计算方向
                    const dx = target.x - owner.x;
                    const dy = target.y - owner.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        dirX = dx / dist;
                        dirY = dy / dist;
                    } else {
                        // 随机方向
                        const angle = Math.random() * Math.PI * 2;
                        dirX = Math.cos(angle);
                        dirY = Math.sin(angle);
                    }
                } else {
                    // 随机方向
                    const angle = Math.random() * Math.PI * 2;
                    dirX = Math.cos(angle);
                    dirY = Math.sin(angle);
                }
                
                // 计算速度
                const vx = dirX * finalSpeed;
                const vy = dirY * finalSpeed;
                
                // 创建毒瓶投射物
                if (typeof PoisonVialProjectile === 'function') {
                    const vial = new PoisonVialProjectile(
                        owner.x,
                        owner.y,
                        24, // 大小
                        vx,
                        vy,
                        finalDamage,
                        4.0, // 存在时间
                        damageMultiplier,
                        finalArea,
                        finalPoisonDamage,
                        finalPoisonDuration,
                        this.stats.toxicCloud
                    );
                    
                    // 添加到投射物数组
                    if (typeof projectiles !== 'undefined') {
                        projectiles.push(vial);
                    }
                }
            }
        }

        getInitialDescription() {
            return "投掷毒瓶，造成毒素伤害。";
        }

        getCurrentDescription() {
            return `投掷${this.stats.count}个毒瓶，造成${this.stats.damage}伤害并使敌人中毒，每秒造成${this.stats.poisonDamage}点伤害，持续${this.stats.poisonDuration.toFixed(1)}秒。${this.stats.toxicCloud ? '毒瓶爆炸后留下毒云。' : ''}`;
        }
    }
    window.PoisonVialWeapon = PoisonVialWeapon;
}

// 冰晶杖
if (typeof FrostStaffWeapon === 'undefined') {
    class FrostStaffWeapon extends Weapon {
        static Name = "冰晶杖";
        static Emoji = "❄️";
        static MaxLevel = 10;
        static Evolution = {
            requires: "FrostHeart",
            evolvesTo: "GlacierStaff"
        };

        constructor() {
            super(FrostStaffWeapon.Name, FrostStaffWeapon.Emoji, 1.5, FrostStaffWeapon.MaxLevel);
        }

        calculateStats() {
            this.stats = {
                damage: 12 + (this.level - 1) * 4,
                cooldown: Math.max(0.8, 1.5 - (this.level - 1) * 0.07),
                count: 1 + Math.floor((this.level - 1) / 2),
                freezeDuration: 1.0 + (this.level - 1) * 0.1,
                slowFactor: 0.5 + (this.level - 1) * 0.05,
                projectileSpeed: 300 + (this.level - 1) * 10,
                pierce: 1 + Math.floor((this.level - 1) / 3),
                split: this.level >= 7
            };
        }
        
        /**
         * 更新武器状态
         * @param {number} dt - 时间增量
         * @param {Player} owner - 拥有者
         */
        update(dt, owner) {
            // 如果没有统计信息，计算统计信息
            if (!this.stats) {
                this.calculateStats();
            }
            
            // 增加冷却计时器
            this.cooldownTimer += dt;
            
            // 如果冷却结束，发射冰晶
            if (this.cooldownTimer >= this.stats.cooldown) {
                // 重置冷却计时器
                this.cooldownTimer = 0;
                
                // 发射冰晶
                this.shootFrostCrystal(owner);
            }
        }
        
        /**
         * 发射冰晶
         * @param {Player} owner - 拥有者
         */
        shootFrostCrystal(owner) {
            // 获取基础伤害乘数
            const damageMultiplier = owner.getStat ? owner.getStat('damageMultiplier') : 1;
            const finalDamage = this.stats.damage * damageMultiplier;
            
            // 获取穿透加成
            const pierceBonus = owner.getStat ? owner.getStat('pierceBonus') || 0 : 0;
            const finalPierce = this.stats.pierce + pierceBonus;
            
            // 获取持续时间乘数
            const durationMultiplier = owner.getStat ? owner.getStat('durationMultiplier') : 1;
            const finalFreezeDuration = this.stats.freezeDuration * durationMultiplier;
            
            // 获取速度乘数
            const speedMultiplier = owner.getStat ? owner.getStat('projectileSpeedMultiplier') : 1;
            const finalSpeed = this.stats.projectileSpeed * speedMultiplier;
            
            // 寻找附近敌人而不是考虑玩家朝向
            const targets = [];
            
            // 如果有enemies数组
            if (typeof enemies !== 'undefined') {
                // 获取可视范围内的敌人
                const maxRange = 800; // 最大索敌范围
                
                // 筛选视野内的敌人
                const visibleEnemies = enemies.filter(enemy => {
                    if (!enemy || enemy.isGarbage || !enemy.isActive) return false;
                    
                    const dx = enemy.x - owner.x;
                    const dy = enemy.y - owner.y;
                    const distSq = dx * dx + dy * dy;
                    
                    return distSq <= maxRange * maxRange;
                });
                
                // 按距离排序
                const sortedEnemies = visibleEnemies.sort((a, b) => {
                    const distA = (a.x - owner.x) * (a.x - owner.x) + (a.y - owner.y) * (a.y - owner.y);
                    const distB = (b.x - owner.x) * (b.x - owner.x) + (b.y - owner.y) * (b.y - owner.y);
                    return distA - distB;
                });
                
                // 取最近的几个敌人作为目标
                targets.push(...sortedEnemies.slice(0, this.stats.count));
            }
            
            // 对每个目标发射冰晶
            for (let i = 0; i < this.stats.count; i++) {
                let vx, vy;
                
                // 如果有目标，瞄准目标
                if (i < targets.length) {
                    const target = targets[i];
                    const dx = target.x - owner.x;
                    const dy = target.y - owner.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    vx = dx / dist * finalSpeed;
                    vy = dy / dist * finalSpeed;
                } else {
                    // 没有目标时随机方向
                    const angle = Math.random() * Math.PI * 2;
                    vx = Math.cos(angle) * finalSpeed;
                    vy = Math.sin(angle) * finalSpeed;
                }
                
                // 创建冰晶投射物
                if (typeof FrostCrystalProjectile === 'function') {
                    const crystal = new FrostCrystalProjectile(
                        owner.x,
                        owner.y,
                        24, // 大小
                        vx,
                        vy,
                        finalDamage,
                        finalPierce,
                        4.0, // 存在时间
                        damageMultiplier,
                        finalFreezeDuration,
                        this.stats.slowFactor,
                        this.stats.split
                    );
                    
                    // 添加到投射物数组
                    if (typeof projectiles !== 'undefined') {
                        projectiles.push(crystal);
                    }
                }
            }
        }

        getInitialDescription() {
            return "发射冰晶，冻结并减速敌人。";
        }

        getCurrentDescription() {
            return `发射${this.stats.count}个冰晶，造成${this.stats.damage}伤害，冻结敌人${this.stats.freezeDuration.toFixed(1)}秒并减速${Math.round(this.stats.slowFactor * 100)}%。${this.stats.split ? '冰晶碰撞后分裂成多个碎片。' : ''}`;
        }
    }
    window.FrostStaffWeapon = FrostStaffWeapon;
}

// 将新武器添加到BASE_WEAPONS数组中
if (typeof BASE_WEAPONS !== 'undefined') {
    // 添加新武器到BASE_WEAPONS
    if (typeof VineSeedWeapon === 'function') BASE_WEAPONS.push(VineSeedWeapon);
    if (typeof LaserPrismWeapon === 'function') BASE_WEAPONS.push(LaserPrismWeapon);
    if (typeof PoisonVialWeapon === 'function') BASE_WEAPONS.push(PoisonVialWeapon);
    if (typeof FrostStaffWeapon === 'function') BASE_WEAPONS.push(FrostStaffWeapon);
    
    console.log('Debug weapons added to BASE_WEAPONS:', 
        [VineSeedWeapon, LaserPrismWeapon, PoisonVialWeapon, FrostStaffWeapon]
            .filter(w => typeof w === 'function')
            .map(w => w.Name)
    );
} else {
    console.error('BASE_WEAPONS not found! Make sure weapon files are loaded first.');
}
 