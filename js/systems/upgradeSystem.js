/**
 * 升级系统
 * 负责升级选项的管理和升级界面的显示
 */

/**
 * 获取可用的升级选项
 * @param {Player} player - 玩家对象
 * @returns {Array} 升级选项数组
 */
function getAvailableUpgrades(player) {
    let options = [];
    let hasWeaponOption = false;

    // 添加武器升级选项
    player.weapons.forEach(weapon => {
        if (weapon) { // 确保 weapon 对象存在
            let weaponUpgrades = null;
            if (typeof weapon.getCurrentUpgradeOptions === 'function') {
                weaponUpgrades = weapon.getCurrentUpgradeOptions(player);
            } else if (!weapon.isMaxLevel() && typeof weapon.getUpgradeDescription === 'function') {
                // 如果 getCurrentUpgradeOptions 不可用，但武器可以升级，则提供一个基于 getUpgradeDescription 的默认升级
                weaponUpgrades = [{
                    item: weapon,
                    type: 'upgrade_weapon',
                    text: `升级 ${weapon.name} (Lv ${weapon.level + 1})`,
                    description: weapon.getUpgradeDescription(),
                    icon: weapon.emoji,
                    level: weapon.level + 1,
                    action: () => {
                        weapon.upgrade(); // 或者 weapon.levelUp()，确保与武器类中的方法一致
                        if(player) player.recalculateStats(); // 确保玩家对象存在
                    }
                }];
            }

            if (weaponUpgrades && weaponUpgrades.length > 0) {
                options = options.concat(weaponUpgrades);
                hasWeaponOption = true;
            }
        }
    });
    // 添加被动物品升级选项
    player.passiveItems.forEach(passive => {
        if (passive) { // 确保 passive 对象存在
            let passiveUpgrades = null;
            if (typeof passive.getCurrentUpgradeOptions === 'function') {
                passiveUpgrades = passive.getCurrentUpgradeOptions(player);
            } else if (!passive.isMaxLevel() && typeof passive.getUpgradeDescription === 'function') { // 修改为方法调用
                 passiveUpgrades = [{
                    item: passive,
                    type: 'upgrade_passive',
                    text: `升级 ${passive.name} (Lv ${passive.level + 1})`,
                    description: passive.getUpgradeDescription(),
                    icon: passive.emoji,
                    level: passive.level + 1,
                    action: () => {
                        passive.upgrade(); // 或者 passive.levelUp()
                        if(player) player.recalculateStats();
                    }
                }];
            }
             if (passiveUpgrades && passiveUpgrades.length > 0) {
                options = options.concat(passiveUpgrades);
            }
        }
    });

    // 添加新武器选项
    if (player.weapons.length < player.maxWeapons) {
        BASE_WEAPONS.forEach(WeaponClass => {
            if (WeaponClass && !player.weapons.some(w => w instanceof WeaponClass)) {
                if (typeof WeaponClass === 'function' && WeaponClass.prototype) {
                    try {
                const weapon = new WeaponClass();
                options.push({
                    item: weapon,
                            classRef: WeaponClass,
                    type: 'new_weapon',
                            text: `获得 ${weapon.name || WeaponClass.name || '未知武器'}`,
                            description: weapon.getInitialDescription ? weapon.getInitialDescription() : (WeaponClass.Description || '选择一个新武器。'),
                            icon: weapon.emoji || WeaponClass.Emoji || '❓',
                    action: () => {
                                player.addWeapon(new WeaponClass());
                            }
                        });
                        hasWeaponOption = true; // A new weapon is a weapon option
                    } catch (e) {
                        console.error(`Error instantiating weapon ${WeaponClass.name}:`, e);
                    }
                } else {
                    console.warn('Encountered non-constructable item in BASE_WEAPONS:', WeaponClass);
                }
            }
        });
    }

    // 添加新被动物品选项
    if (player.passiveItems.length < player.maxPassives) {
        console.log("检查可用的被动物品...");
        // 调试输出：检查BASE_PASSIVES中的内容
        console.log("BASE_PASSIVES包含:", BASE_PASSIVES.map(cls => cls ? (cls.name || "未命名类") : "无效类"));
        
        // 调试：检查玩家已有的被动物品
        console.log("玩家已有被动物品:", player.passiveItems.map(p => p.constructor.name));
        
        // 创建已有被动物品的名称集合
        const playerHasPassives = new Set();
        player.passiveItems.forEach(p => {
            if (p && p.constructor) {
                playerHasPassives.add(p.constructor.name);
                // 也添加类的显示名称，防止命名不一致
                if (p.name) playerHasPassives.add(p.name);
            }
        });
        
        console.log("玩家已有被动物品集合:", Array.from(playerHasPassives));
        
        const BANNED_PASSIVE_NAMES = [
            "魔法水晶", "MagicCrystal",
            "神秘卡片", "MysteryCard", "Card",
            "神秘符咒", "OccultCharm", "Charm",
            "咒术护符", // 新增中文名
            "CursedRelic", "SpellboundAmulet", "RitualTalisman", // 新增可能的英文/ID，具体根据实际道具名称调整
            "寒冰之心", "FrostHeart", "Heart",
            "龙息香料", "DragonSpice", "Spice",
            "雷光护符", "ThunderAmulet", "Amulet",
            "毒素宝珠", "PoisonOrb", "Orb",
            "磁力球", "MagnetSphere", "MagnetBall", "Magnet"
        ];
        
        BASE_PASSIVES.forEach(PassiveClass => {
            if (!PassiveClass) {
                console.warn("BASE_PASSIVES中存在无效的被动物品类");
                return;
            }
            
            // 仅尝试实例化函数类型
            if (typeof PassiveClass !== 'function') {
                console.warn(`无法实例化非函数类型:`, PassiveClass);
                return;
            }
            
            // 确保类有原型
            if (!PassiveClass.prototype) {
                console.warn(`类没有原型:`, PassiveClass);
                return;
            }

            // 检查是否为被禁用的被动道具
            // 我们需要实例化一个临时对象来获取其名称，或者检查类名（如果一致）
            let tempPassiveName = PassiveClass.name; // 尝试用类名
            try {
                const tempInstance = new PassiveClass();
                tempPassiveName = tempInstance.name || PassiveClass.name; // 优先用实例的name属性
            } catch (e) {
                // 实例化失败，继续使用类名
            }

            if (BANNED_PASSIVE_NAMES.includes(tempPassiveName)) {
                console.log(`Skipping banned passive item by name: ${tempPassiveName}`);
                return; // 跳过被禁用的道具
            }
            
            // 检查玩家是否已经拥有此类被动物品
            // 通过名称匹配和instanceof双重检查
            const className = PassiveClass.name;
            const alreadyHas = playerHasPassives.has(className) || 
                              player.passiveItems.some(p => p instanceof PassiveClass);
            
            console.log(`检查被动物品 ${className}: ${alreadyHas ? "玩家已拥有" : "玩家未拥有"}`);
            
            if (!alreadyHas) {
                try {
                    // 尝试实例化被动物品
                    const passive = new PassiveClass();
                    
                    // 双重检查：确保这不是已经拥有的另一个名称的物品
                    if (passive.name && playerHasPassives.has(passive.name)) {
                        console.log(`玩家已拥有名为 ${passive.name} 的物品，跳过`);
                        return;
                    }
                    
                    console.log(`添加被动物品选项: ${passive.name || className}`);
                    
                    options.push({
                        item: passive,
                        classRef: PassiveClass,
                        type: 'new_passive',
                        text: `获得 ${passive.name || className || '未知被动'}`,
                        description: passive.getInitialDescription ? 
                                     passive.getInitialDescription() : 
                                     (PassiveClass.Description || '选择一个新被动道具。'),
                        icon: passive.emoji || PassiveClass.Emoji || '❓',
                        action: () => {
                            console.log(`玩家选择了被动物品: ${passive.name || className}`);
                            player.addPassive(new PassiveClass());
                        }
                    });
                } catch (e) {
                    console.error(`实例化被动物品 ${className} 时出错:`, e);
                }
            }
        });
    }

    // 如果到目前为止还没有武器选项，并且可以有武器选项，尝试添加一个
    if (!hasWeaponOption) {
        let potentialWeaponOptions = [];
        // 优先升级现有未满级武器
        const upgradableWeapons = player.weapons.filter(w => w && !w.isMaxLevel()); // 确保 w 存在
        if (upgradableWeapons.length > 0) {
            upgradableWeapons.sort((a, b) => a.level - b.level); // 升级等级最低的
            const weaponToUpgrade = upgradableWeapons[0];
            
            let currentWeaponUpgradeOptions = null;
            if (weaponToUpgrade && typeof weaponToUpgrade.getCurrentUpgradeOptions === 'function') {
                currentWeaponUpgradeOptions = weaponToUpgrade.getCurrentUpgradeOptions(player);
            } else if (weaponToUpgrade && !weaponToUpgrade.isMaxLevel() && typeof weaponToUpgrade.getUpgradeDescription === 'function') {
                 currentWeaponUpgradeOptions = [{
                    item: weaponToUpgrade,
                    type: 'upgrade_weapon',
                    text: `升级 ${weaponToUpgrade.name} (Lv ${weaponToUpgrade.level + 1})`,
                    description: weaponToUpgrade.getUpgradeDescription(),
                    icon: weaponToUpgrade.emoji,
                    level: weaponToUpgrade.level + 1,
            action: () => {
                        weaponToUpgrade.upgrade();
                        if(player) player.recalculateStats();
                    }
                }];
            }

            if (currentWeaponUpgradeOptions && currentWeaponUpgradeOptions.length > 0) {
                 potentialWeaponOptions = potentialWeaponOptions.concat(currentWeaponUpgradeOptions);
            }
        }

        // 如果没有可升级的现有武器，但可以添加新武器
        if (potentialWeaponOptions.length === 0 && player.weapons.length < player.maxWeapons) {
            const availableNewWeapons = BASE_WEAPONS.filter(WC => WC && !player.weapons.some(w => w instanceof WC));
            if (availableNewWeapons.length > 0) {
                const WeaponClass = availableNewWeapons[Math.floor(Math.random() * availableNewWeapons.length)]; // 随机选一个
                 if (typeof WeaponClass === 'function' && WeaponClass.prototype) {
                    try {
                        const weapon = new WeaponClass();
                        potentialWeaponOptions.push({
                            item: weapon,
                            classRef: WeaponClass,
                            type: 'new_weapon',
                            text: `获得 ${weapon.name || WeaponClass.name || '未知武器'}`,
                            description: weapon.getInitialDescription ? weapon.getInitialDescription() : (WeaponClass.Description || '选择一个新武器。'),
                            icon: weapon.emoji || WeaponClass.Emoji || '❓',
                            action: () => {
                                player.addWeapon(new WeaponClass());
                            }
                        });
                    } catch (e) {
                        console.error(`Error instantiating forced weapon ${WeaponClass.name}:`, e);
                    }
                }
            }
        }
        // 如果找到了强制的武器选项，将其添加到主选项列表 (如果主列表还不包含它)
        // 为了简单，直接添加，后续的去重和数量限制会处理
        if (potentialWeaponOptions.length > 0) {
            options = options.concat(potentialWeaponOptions);
            // hasWeaponOption = true; // Not strictly needed to set here as we are at the end of option gathering for weapons
        }
    }

    // 去重：基于 text 和 type (简单去重，可能需要更复杂的逻辑)
    const uniqueOptions = [];
    const seenOptions = new Set();
    for (const opt of options) {
        const key = `${opt.type}_${opt.text}`;
        if (!seenOptions.has(key)) {
            uniqueOptions.push(opt);
            seenOptions.add(key);
        }
    }
    options = uniqueOptions;

    // 如果选项仍然很少 (例如少于1个)，并且玩家生命值不满，则添加恢复生命选项作为保底
    if (options.length < 1 && player && player.health < player.getStat('health')) { // 使用 getStat('health')
        options.push({
            type: 'utility',
            text: '恢复 30% 生命',
            description: '回复部分生命值。',
            icon: '🍗',
            action: () => {
                if(player) player.heal(player.getStat('health') * 0.3);
            }
        });
    }

    // 随机打乱选项顺序
    shuffleArray(options);
    // 返回前N个选项 (通常是3或4，如果选项少于N，则返回所有可用选项)
    return options.slice(0, Math.min(options.length, 4));
}

/**
 * 显示升级选项
 */
function presentLevelUpOptions() {
    // 暂停游戏
    isPaused = true; 
    console.log("Presenting level up options. Setting isPaused = true.");
    
    const levelUpScreenElement = document.getElementById('levelUpScreen');
    const upgradeOptionsContainer = document.getElementById('upgradeOptions');
    const chestUpgradeInfoElement = document.getElementById('chestUpgradeInfo'); // 获取新DOM元素

    // 显示debug属性面板
    showLevelUpDebugStats();
    
    // --- 显示宝箱升级提示 ---
    if (player && player.currentChestTotalUpgrades > 0 && (player.pendingLevelUpsFromChest + 1) > 0) {
        chestUpgradeInfoElement.textContent = `开启宝箱！共 ${player.currentChestTotalUpgrades} 次升级机会，还剩 ${player.pendingLevelUpsFromChest + 1} 次选择。`;
        chestUpgradeInfoElement.style.display = 'block';
    } else {
        chestUpgradeInfoElement.style.display = 'none';
    }
    // --- 结束提示 ---

    // 添加键盘操作提示
    const keyboardHint = document.getElementById('keyboardHint');
    if (keyboardHint) {
        keyboardHint.textContent = "使用数字键 1-4 选择并确认升级，或用鼠标点击。";
    } else {
        const hintElement = document.createElement('p');
        hintElement.id = 'keyboardHint';
        hintElement.textContent = "使用数字键 1-4 选择并确认升级，或用鼠标点击。";
        hintElement.style.fontSize = "0.9em";
        hintElement.style.color = "#ccc";
        hintElement.style.marginTop = "-10px"; // 调整与上方元素的间距
        hintElement.style.marginBottom = "20px";
        // 插入到 upgradeOptionsContainer 之前，并且在<h1>和<p id="chestUpgradeInfo">之后
        const h1Element = levelUpScreenElement.querySelector('h1');
        if (h1Element && h1Element.nextSibling) {
            levelUpScreenElement.insertBefore(hintElement, h1Element.nextSibling.nextSibling); // 插入到第二个p之后
        } else if (h1Element) {
            levelUpScreenElement.insertBefore(hintElement, h1Element.nextSibling);
        }

    }

    try {
        // 获取升级选项
        const options = getAvailableUpgrades(player);
        
        // 清空容器
        upgradeOptionsContainer.innerHTML = '';
        
        // 当前选中的选项索引（用于键盘操作）
        let currentSelection = -1;
        
        // 添加选项
        if (options && options.length > 0) {
        options.forEach((option, index) => {
            // 创建按钮
            const button = document.createElement('button');
            button.dataset.index = index; // 保存索引，方便键盘操作
            
            // 创建数字提示
            const keyHintSpan = document.createElement('span');
            keyHintSpan.className = 'upgradeKeyHint';
            keyHintSpan.textContent = `[${index + 1}] `;
            keyHintSpan.style.marginRight = "8px";
            keyHintSpan.style.color = "#ffd700"; // 金色提示

            // 创建图标
            const iconSpan = document.createElement('span');
            iconSpan.className = 'upgradeIcon';
            iconSpan.textContent = option.icon || '❓';
            // 创建文本
            const textSpan = document.createElement('span');
            textSpan.className = 'upgradeText';
            textSpan.textContent = option.text;
            // 如果有等级，添加等级
            if (option.level) {
                const levelSpan = document.createElement('span');
                levelSpan.className = 'upgradeLevel';
                levelSpan.textContent = `Lv ${option.level}`;
                textSpan.appendChild(levelSpan);
            } else if (option.type === 'new_weapon' || option.type === 'new_passive') {
                // 对于新武器/被动，明确显示 "新"
                const levelSpan = document.createElement('span');
                levelSpan.className = 'upgradeLevel';
                levelSpan.textContent = '新'; // 使用 "新" 来表示未拥有的物品
                textSpan.appendChild(levelSpan);
            }
            // 创建描述
            const descP = document.createElement('p');
            descP.textContent = option.description || '';
            // 添加到按钮
            button.appendChild(keyHintSpan); // 添加数字按键提示
            button.appendChild(iconSpan);
            button.appendChild(textSpan);
            button.appendChild(descP);
            
            // 添加鼠标悬停效果
            button.addEventListener('mouseover', () => {
                selectUpgradeOption(index);
            });
            
            // 添加点击事件
            button.onclick = () => {
                executeUpgradeOption(option, levelUpScreenElement);
            };
            
            // 添加到容器
            upgradeOptionsContainer.appendChild(button);
        });
            
            // 默认选中第一个选项
            if (options.length > 0) {
                selectUpgradeOption(0);
            }
            
            // 添加键盘事件监听
            const handleKeyDown = (e) => {
                const key = e.key.toLowerCase();
                const numOptions = options.length;
                
                // 数字键1-4选择
                if (key >= '1' && key <= '4' && (parseInt(key) <= numOptions)) {
                    const optionIndex = parseInt(key) - 1;
                    
                    // 直接执行选项，不再需要先选中再确认的逻辑了，因为鼠标可以悬停选中
                    const selectedOption = options[optionIndex];
                    executeUpgradeOption(selectedOption, levelUpScreenElement);
                }
                // 小键盘数字键1-4选择
                else if (key === 'numpad1' || key === 'numpad2' || key === 'numpad3' || key === 'numpad4') {
                    const optionIndex = parseInt(key.replace('numpad', '')) - 1;
                    if (optionIndex < numOptions) {
                        // 直接执行选项
                        const selectedOption = options[optionIndex];
                        executeUpgradeOption(selectedOption, levelUpScreenElement);
                    }
                }
            };
            
            // 添加键盘事件监听器
            window.addEventListener('keydown', handleKeyDown);
            
            // 选中指定选项的函数
            function selectUpgradeOption(index) {
                // 移除所有选项的选中状态
                const allButtons = upgradeOptionsContainer.querySelectorAll('button');
                allButtons.forEach(btn => {
                    btn.classList.remove('selected');
                });
                
                // 设置当前选中项
                currentSelection = index;
                const selectedButton = allButtons[index];
                if (selectedButton) {
                    selectedButton.classList.add('selected');
                }
            }
            
            // 执行升级选项的函数
            function executeUpgradeOption(option, levelUpScreenElement) {
                try {
                    // 执行选项操作
                    console.log("Upgrade button clicked. Action:", option.text);
                    if (typeof option.action === 'function') {
                        option.action();
                    }
                    levelUpScreenElement.classList.add('hidden');
                    console.log("Hiding level up screen. Setting isPaused=false, isLevelUp=false.");
                    isPaused = false;
                    isLevelUp = false;

                    // 隐藏debug面板
                    hideLevelUpDebugStats();

                    // 移除键盘事件监听器
                    window.removeEventListener('keydown', handleKeyDown);

                    // --- 重置宝箱计数器 (如果适用) ---
                    if (player && player.pendingLevelUpsFromChest === 0) {
                        player.currentChestTotalUpgrades = 0; // 所有宝箱升级已完成
                        console.log("All chest upgrades complete. Resetting currentChestTotalUpgrades.");
                    }
                    // --- 结束重置 ---

                } catch (error) {
                    console.error("升级选项执行错误:", error);
                    levelUpScreenElement.classList.add('hidden');
                    console.log("Error in upgrade action. Setting isPaused=false, isLevelUp=false.");
                    isPaused = false;
                    isLevelUp = false;
                    window.removeEventListener('keydown', handleKeyDown);
                }
            }
        } else {
            // 如果没有有效选项，提供一个默认的关闭方式或提示
            const noOptionText = document.createElement('p');
            noOptionText.textContent = "没有可用的升级选项了！点击屏幕继续。";
            upgradeOptionsContainer.appendChild(noOptionText);
            // 允许点击屏幕关闭
            levelUpScreenElement.onclick = () => {
                levelUpScreenElement.classList.add('hidden');
                isPaused = false;
                // isLevelUp = false; 
                levelUpScreenElement.onclick = null; // 移除事件监听器
            };
        }
        // 显示升级界面
        levelUpScreenElement.classList.remove('hidden');
    } catch (error) {
        console.error("显示升级选项时出错:", error);
        // 确保游戏不会卡住
        levelUpScreenElement.classList.add('hidden');
        isPaused = false;
        // isLevelUp = false;
    }
} 