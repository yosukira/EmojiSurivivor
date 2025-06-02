/**
 * 资源管理器
 * 负责游戏资源的加载和管理
 */

// 资源加载相关
const ASSETS_TO_LOAD = [
    { name: 'player', type: 'image', src: 'assets/playerR.png' },
    { name: 'background', type: 'image', src: 'assets/grassbg.png' },
    { name: 'bossHealthBar', type: 'image', src: 'assets/UI/bossHealthBar.png' },
    { name: 'slimeSvg', type: 'image', src: 'assets/svg/slime.svg' },
    { name: 'firewispPng', type: 'image', src: 'assets/enemy/firewisp.png' },
    { name: 'frostwispPng', type: 'image', src: 'assets/enemy/frostwisp.png' },
    { name: 'lightningwispPng', type: 'image', src: 'assets/enemy/lightingwisp.png' },
    { name: 'eliteSlimeSvg', type: 'image', src: 'assets/svg/elite_slime.svg' }
];

const loadedAssets = {};
let assetsLoadedCount = 0;
let totalAssetsToLoad = ASSETS_TO_LOAD.length;

// 加载资源的函数
function loadAssets(callback) {
    const loadingScreen = document.getElementById('loadingScreen');
    const progressBar = document.getElementById('loadingProgressBar');
    const loadingStatus = document.getElementById('loadingStatus');

    // Ensure DOM elements exist before trying to use them
    if (!loadingScreen || !progressBar || !loadingStatus) {
        console.error("Loading screen UI elements not found!");
        // Optionally, proceed without visual feedback or halt
        if (totalAssetsToLoad === 0 && callback) {
            callback();
            return;
        }
        // Fallback or error handling if critical UI is missing
    }

    if (totalAssetsToLoad === 0) {
        if (loadingStatus) loadingStatus.textContent = "没有需要加载的资源";
        if (progressBar) progressBar.style.width = '100%';
        if (callback) callback();
        return;
    }

    if (loadingStatus) loadingStatus.textContent = `正在加载: ${assetsLoadedCount} / ${totalAssetsToLoad}`;
    if (progressBar) progressBar.style.width = '0%'; // Initialize progress bar

    ASSETS_TO_LOAD.forEach(assetInfo => {
        if (assetInfo.type === 'image') {
            const img = new Image();
            img.src = assetInfo.src;
            img.onload = () => {
                loadedAssets[assetInfo.name] = img;
                assetsLoadedCount++;
                if (progressBar) progressBar.style.width = (assetsLoadedCount / totalAssetsToLoad) * 100 + '%';
                if (loadingStatus) loadingStatus.textContent = `正在加载: ${assetsLoadedCount} / ${totalAssetsToLoad}`;
                if (assetsLoadedCount === totalAssetsToLoad) {
                    if (callback) callback();
                }
            };
            img.onerror = () => {
                console.error(`无法加载资源: ${assetInfo.name} (${assetInfo.src})`);
                assetsLoadedCount++; // Still count it as an attempt
                if (progressBar) progressBar.style.width = (assetsLoadedCount / totalAssetsToLoad) * 100 + '%';
                if (loadingStatus) loadingStatus.textContent = `正在加载: ${assetsLoadedCount} / ${totalAssetsToLoad}`;
                if (assetsLoadedCount === totalAssetsToLoad) {
                    if (callback) callback(); // Proceed even if some assets fail
                }
            };
        }
        // TODO: Add support for other asset types like audio if needed
    });
} 