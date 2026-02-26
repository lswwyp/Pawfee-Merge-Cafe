/**
 * 远程资源 URL 配置 - CC0/免费可商用
 * 若 loadRemote 因 CORS 失败，将使用占位图/内置音效
 *
 * Pets (CC0):
 * - https://opengameart.org/content/cat-sprites
 * - https://opengameart.org/content/dog-sprites
 * - https://opengameart.org/content/cat-dog-free-sprites
 * - https://opengameart.org/content/lpc-cats-and-dogs
 *
 * Audio (Freesound/Pixabay 需检查许可):
 * - Merge pop: https://freesound.org/people/Geoff-Bremner-Audio/sounds/683461/
 * - Meow: https://freesound.org/people/tim.kahn/sounds/33657/
 * - Coin: https://freesound.org/people/creek23/sounds/75235/
 * - BGM: https://pixabay.com/music/search/cafe%20jazz/
 *
 * 生产环境建议：将资源下载到 assets/resources 或自有 CDN
 */

export const ASSET_URLS = {
  /** 宠物精灵图（备用：直接图床或同源 URL） */
  // CC0: https://opengameart.org/content/2d-cat-sprite
  petCat: 'https://opengameart.org/sites/default/files/cat_4.png',
  // CC0: https://opengameart.org/content/dog-spritesheets
  petDog: 'https://opengameart.org/sites/default/files/spritesheet_white_0.png',
  /** 咖啡厅背景 */
  cafeBg: 'https://thumbs.dreamstime.com/b/pixel-art-illustration-cozy-cafe-side-view-286233986.jpg',
  /** UI 图标 */
  iconCoin: 'https://thumbs.dreamstime.com/b/pixel-art-coffee-cup-illustration-grey-background-bit-design-blocky-steam-pixelated-appearance-bit-pixel-art-coffee-cup-emoji-397144445.jpg',
  iconDiamond: '',
  iconCoffee: 'https://thumbs.dreamstime.com/b/pixel-art-coffee-cup-illustration-grey-background-bit-design-blocky-steam-pixelated-appearance-bit-pixel-art-coffee-cup-emoji-397144445.jpg',
  /** 音效 - 使用可直链的 CDN 或同源 */
  sfxMerge: '',
  sfxMeow: '',
  sfxCoin: '',
  bgmCafe: '',
} as const;

export type AssetKey = keyof typeof ASSET_URLS;
