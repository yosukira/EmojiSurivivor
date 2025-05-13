// js/debug.js
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
        const items = { weapons: {}, passives: {} };
        if (typeof DaggerWeapon !== 'undefined') items.weapons['Dagger'] = DaggerWeapon;
        if (typeof GarlicWeapon !== 'undefined') items.weapons['Garlic'] = GarlicWeapon;
        if (typeof WhipWeapon !== 'undefined') items.weapons['Whip'] = WhipWeapon;
        if (typeof FireBladeWeapon !== 'undefined') items.weapons['FireBlade'] = FireBladeWeapon;
        if (typeof StormBladeWeapon !== 'undefined') items.weapons['StormBlade'] = StormBladeWeapon;
        if (typeof HandshakeWeapon !== 'undefined') items.weapons['Handshake'] = HandshakeWeapon;

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
        return items;
    },

    addItemsSection: function() {
        this.addSectionTitle(this.panel, "添加/升级物品 (Add/Upgrade Items)");
        const itemsDiv = this.panel;

        const knownItems = this.getKnownItemClasses();

        const createOrUpdateItemButtons = (type, classes, headerText) => {
            if (Object.keys(classes).length > 0) {
                const subHeader = document.createElement('h5');
                subHeader.textContent = headerText;
                subHeader.style.marginTop = '10px';
                subHeader.style.marginBottom = '5px';
                subHeader.style.fontWeight = 'normal';
                itemsDiv.appendChild(subHeader);

                for (const itemName in classes) {
                    this.addButtonToElement(itemsDiv, `添加/升级 ${itemName} (Add/Upgrade ${itemName})`, () => {
                        if (!player) {
                             console.warn(`Debug: Player not found. Cannot add/upgrade ${itemName}.`);
                             alert("玩家未就绪 (Player not ready).");
                             return;
                        }
                        const itemClass = classes[itemName];
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
                            const addFunc = type === 'weapon' ? player.addWeapon : player.addPassiveItem;
                            const maxItems = type === 'weapon' ? player.maxWeapons : player.maxPassiveItems;

                            if (typeof addFunc !== 'function') {
                                console.warn(`Debug: Player ${type === 'weapon' ? 'addWeapon' : 'addPassiveItem'} function not found.`);
                                return;
                            }
                            if (itemCollection.length >= maxItems) {
                                console.warn(`Debug: Cannot add ${itemName}. Player has max ${type}s (${maxItems}).`);
                                return;
                            }
                            try {
                                const newItem = new itemClass(player); 
                                addFunc.call(player, newItem);
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
        
        createOrUpdateItemButtons('weapon', knownItems.weapons, "武器 (Weapons):");
        createOrUpdateItemButtons('passive', knownItems.passives, "被动 (Passives):");
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
 