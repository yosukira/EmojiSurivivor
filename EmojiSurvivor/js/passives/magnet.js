/**
 * 吸铁石被动道具
 * 增加拾取范围和吸引力
 */
class Magnet extends PassiveItem {
    static Name = "吸铁石";
    static Emoji = EMOJI.PASSIVE_MAGNET;

    /**
     * 构造函数
     */
    constructor() {
        super(Magnet.Name, Magnet.Emoji, 5, {
            magnetBonus: { mult: 0.2 }, // 每级增加20%拾取范围
            pickupRadius: { add: 15 }   // 每级增加15点基础拾取范围
        });
    }

    /**
     * 获取初始描述
     * @returns {string} 初始描述
     */
    getInitialDescription() {
        return `增加拾取范围和吸引力。`;
    }

    /**
     * 获取升级描述
     * @returns {string} 升级描述
     */
    getUpgradeDescription() {
        return `再增加拾取范围和吸引力 (总计: +${((this.level + 1) * 20).toFixed(0)}% 范围)。`;
    }

    /**
     * 应用初始加成
     * @param {Player} player - 玩家对象
     */
    applyInitialBonus(player) {
        super.applyInitialBonus(player);
        
        // 添加一次性吸取所有经验的能力
        player.canMagnetizeAll = true;
    }

    /**
     * 升级后的回调
     */
    onUpgrade() {
        super.onUpgrade();
        
        // 每次升级都刷新吸取所有经验的能力
        if (this.owner) {
            this.owner.canMagnetizeAll = true;
        }
    }
}