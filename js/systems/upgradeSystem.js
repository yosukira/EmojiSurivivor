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
    
    console.log("=== 开始获取升级选项 ===");
    console.log("玩家当前武器数量:", player.weapons.length, "最大武器数:", player.maxWeapons);
    console.log("玩家当前被动物品数量:", player.passiveItems.length, "最大被动物品数:", player.maxPassives);
    console.log("BASE_WEAPONS数量:", BASE_WEAPONS ? BASE_WEAPONS.length : 0);
    console.log("BASE_PASSIVES数量:", BASE_PASSIVES ? BASE_PASSIVES.length : 0);

    // 1. 收集所有可能的升级选项（不限制数量）
    
    // 1.1 添加武器升级选项
    player.weapons.forEach(weapon => {
        if (weapon && !weapon.isMaxLevel()) {
            options.push({
                item: weapon,
                type: 'upgrade_weapon',
                text: `升级 ${weapon.name} (Lv ${weapon.level + 1})`,
                description: weapon.getUpgradeDescription ? weapon.getUpgradeDescription() : `提升${weapon.name}的能力。`,
                icon: weapon.emoji,
                level: weapon.level + 1,
                priority: 1, // 武器升级优先级
                action: () => {
                    weapon.upgrade();
                    if(player) player.recalculateStats();
                }
            });
        }
    });

    // 1.2 添加被动物品升级选项
    player.passiveItems.forEach(passive => {
        if (passive && !passive.isMaxLevel()) {
            options.push({
                item: passive,
                type: 'upgrade_passive',
                text: `升级 ${passive.name} (Lv ${passive.level + 1})`,
                description: passive.getUpgradeDescription ? passive.getUpgradeDescription() : `提升${passive.name}的效果。`,
                icon: passive.emoji,
                level: passive.level + 1,
                priority: 1, // 被动物品升级优先级
                action: () => {
                    passive.upgrade();
                    if(player) player.recalculateStats();
                }
            });
        }
    });

    // 1.3 添加新武器选项
    if (player.weapons.length < player.maxWeapons && BASE_WEAPONS && BASE_WEAPONS.length > 0) {
        BASE_WEAPONS.forEach(WeaponClass => {
            if (WeaponClass && !player.weapons.some(w => w instanceof WeaponClass)) {
                try {
                    const weapon = new WeaponClass();
                    options.push({
                        item: weapon,
                        classRef: WeaponClass,
                        type: 'new_weapon',
                        text: `获得 ${weapon.name || WeaponClass.Name || '未知武器'}`,
                        description: weapon.getInitialDescription ? weapon.getInitialDescription() : '获得一个新武器。',
                        icon: weapon.emoji || WeaponClass.Emoji || '❓',
                        priority: 2, // 新武器优先级稍低
                        action: () => {
                            player.addWeapon(new WeaponClass());
                        }
                    });
                } catch (e) {
                    console.error(`实例化武器 ${WeaponClass.name} 时出错:`, e);
                }
            }
        });
    }

    // 1.4 添加新被动物品选项
    if (player.passiveItems.length < player.maxPassives && BASE_PASSIVES && BASE_PASSIVES.length > 0) {
        console.log("检查可用的被动物品...");
        
        // 创建已有被动物品的名称集合
        const playerHasPassives = new Set();
        player.passiveItems.forEach(p => {
            if (p && p.constructor) {
                playerHasPassives.add(p.constructor.name);
                if (p.name) playerHasPassives.add(p.name);
            }
        });
        
        console.log("玩家已有被动物品:", Array.from(playerHasPassives));
        
        BASE_PASSIVES.forEach(PassiveClass => {
            if (!PassiveClass || typeof PassiveClass !== 'function') {
                console.warn("无效的被动物品类:", PassiveClass);
                return;
            }
            
            // 检查玩家是否已经拥有此类被动物品
            const className = PassiveClass.name;
            const alreadyHas = playerHasPassives.has(className) || 
                              player.passiveItems.some(p => p instanceof PassiveClass);
            
            if (!alreadyHas) {
                try {
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
                                     '获得一个新的被动道具。',
                        icon: passive.emoji || '❓',
                        priority: 2, // 新被动物品优先级稍低
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

    // 1.5 添加生命恢复选项作为保底（当选项太少时）
    if (player && player.health < player.getStat('health')) {
        options.push({
            type: 'utility',
            text: '恢复 30% 生命',
            description: '回复部分生命值。',
            icon: '🍗',
            priority: 3, // 实用选项优先级最低
            action: () => {
                if(player) player.heal(player.getStat('health') * 0.3);
            }
        });
    }

    console.log(`收集到 ${options.length} 个总选项`);

    // 2. 智能选择策略：确保选项多样性
    
    // 按类型分组
    const upgradeWeaponOptions = options.filter(o => o.type === 'upgrade_weapon');
    const upgradePassiveOptions = options.filter(o => o.type === 'upgrade_passive');
    const newWeaponOptions = options.filter(o => o.type === 'new_weapon');
    const newPassiveOptions = options.filter(o => o.type === 'new_passive');
    const utilityOptions = options.filter(o => o.type === 'utility');

    console.log("选项分类统计:");
    console.log("- 武器升级:", upgradeWeaponOptions.length);
    console.log("- 被动升级:", upgradePassiveOptions.length);
    console.log("- 新武器:", newWeaponOptions.length);
    console.log("- 新被动:", newPassiveOptions.length);
    console.log("- 实用选项:", utilityOptions.length);

    // 3. 构建最终选项列表（最多4个，确保多样性）
    let finalOptions = [];
    const maxOptions = 4;
    
    // 3.1 优先选择1-2个武器相关选项（升级或新武器）
    const weaponOptions = [...upgradeWeaponOptions, ...newWeaponOptions];
    if (weaponOptions.length > 0) {
        const shuffledWeaponOptions = shuffleArray(weaponOptions);
        const weaponCount = Math.min(2, shuffledWeaponOptions.length, maxOptions - finalOptions.length);
        finalOptions.push(...shuffledWeaponOptions.slice(0, weaponCount));
    }
    
    // 3.2 优先选择1-2个被动物品相关选项（升级或新被动）
    const passiveOptions = [...upgradePassiveOptions, ...newPassiveOptions];
    if (passiveOptions.length > 0 && finalOptions.length < maxOptions) {
        const shuffledPassiveOptions = shuffleArray(passiveOptions);
        const passiveCount = Math.min(2, shuffledPassiveOptions.length, maxOptions - finalOptions.length);
        finalOptions.push(...shuffledPassiveOptions.slice(0, passiveCount));
    }
    
    // 3.3 如果还有空位，从剩余选项中随机选择
    const remainingOptions = options.filter(o => !finalOptions.includes(o));
    if (remainingOptions.length > 0 && finalOptions.length < maxOptions) {
        const shuffledRemainingOptions = shuffleArray(remainingOptions);
        const remainingCount = Math.min(shuffledRemainingOptions.length, maxOptions - finalOptions.length);
        finalOptions.push(...shuffledRemainingOptions.slice(0, remainingCount));
    }
    
    // 3.4 如果选项仍然不足，添加实用选项
    if (finalOptions.length === 0 && utilityOptions.length > 0) {
        finalOptions.push(utilityOptions[0]);
    }

    // 4. 最终随机打乱选项顺序
    finalOptions = shuffleArray(finalOptions);
    
    console.log(`最终选择了 ${finalOptions.length} 个选项:`, finalOptions.map(o => o.text));
    console.log("=== 升级选项获取完成 ===");
    
    return finalOptions;
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
    const chestUpgradeInfoElement = document.getElementById('chestUpgradeInfo');

    // 显示debug属性面板
    if (typeof showLevelUpDebugStats === 'function') {
        showLevelUpDebugStats();
    }
    
    // 显示宝箱升级提示
    if (player && player.currentChestTotalUpgrades > 0 && (player.pendingLevelUpsFromChest + 1) > 0) {
        if (chestUpgradeInfoElement) {
            chestUpgradeInfoElement.textContent = `开启宝箱！共 ${player.currentChestTotalUpgrades} 次升级机会，还剩 ${player.pendingLevelUpsFromChest + 1} 次选择。`;
            chestUpgradeInfoElement.style.display = 'block';
        }
    } else {
        if (chestUpgradeInfoElement) {
            chestUpgradeInfoElement.style.display = 'none';
        }
    }

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
        hintElement.style.marginTop = "-10px";
        hintElement.style.marginBottom = "20px";
        
        const h1Element = levelUpScreenElement.querySelector('h1');
        if (h1Element && h1Element.nextSibling) {
            levelUpScreenElement.insertBefore(hintElement, h1Element.nextSibling.nextSibling);
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
                button.dataset.index = index;
                
                // 创建数字提示
                const keyHintSpan = document.createElement('span');
                keyHintSpan.className = 'upgradeKeyHint';
                keyHintSpan.textContent = `[${index + 1}] `;
                keyHintSpan.style.marginRight = "8px";
                keyHintSpan.style.color = "#ffd700";

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
                    const levelSpan = document.createElement('span');
                    levelSpan.className = 'upgradeLevel';
                    levelSpan.textContent = '新';
                    textSpan.appendChild(levelSpan);
                }
                
                // 创建描述
                const descP = document.createElement('p');
                descP.textContent = option.description || '';
                
                // 添加到按钮
                button.appendChild(keyHintSpan);
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
                    const selectedOption = options[optionIndex];
                    executeUpgradeOption(selectedOption, levelUpScreenElement);
                }
                // 小键盘数字键1-4选择
                else if (key === 'numpad1' || key === 'numpad2' || key === 'numpad3' || key === 'numpad4') {
                    const optionIndex = parseInt(key.replace('numpad', '')) - 1;
                    if (optionIndex < numOptions) {
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
                    if (typeof hideLevelUpDebugStats === 'function') {
                        hideLevelUpDebugStats();
                    }

                    // 移除键盘事件监听器
                    window.removeEventListener('keydown', handleKeyDown);

                    // 重置宝箱计数器
                    if (player && player.pendingLevelUpsFromChest === 0) {
                        player.currentChestTotalUpgrades = 0;
                        console.log("All chest upgrades complete. Resetting currentChestTotalUpgrades.");
                    }

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
            // 如果没有有效选项，提供一个默认的关闭方式
            const noOptionText = document.createElement('p');
            noOptionText.textContent = "没有可用的升级选项了！点击屏幕继续。";
            upgradeOptionsContainer.appendChild(noOptionText);
            
            levelUpScreenElement.onclick = () => {
                levelUpScreenElement.classList.add('hidden');
                isPaused = false;
                isLevelUp = false;
                levelUpScreenElement.onclick = null;
            };
        }
        
        // 显示升级界面
        levelUpScreenElement.classList.remove('hidden');
    } catch (error) {
        console.error("显示升级选项时出错:", error);
        // 确保游戏不会卡住
        levelUpScreenElement.classList.add('hidden');
        isPaused = false;
        isLevelUp = false;
    }
} 