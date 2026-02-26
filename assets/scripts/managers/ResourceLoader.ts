/**
 * ResourceLoader - 异步加载远程/本地资源，显示加载界面，缓存
 * 使用 cc.assetManager.loadRemote(url) 或内置占位
 * 许可说明见 AssetUrls.ts
 */

import { _decorator, Component, Node, Label, assetManager, SpriteFrame, Texture2D, AudioClip } from 'cc';
import { ASSET_URLS } from '../config/AssetUrls';

const { ccclass, property } = _decorator;

export interface LoadedAssets {
  textures: Map<string, Texture2D>;
  spriteFrames: Map<string, SpriteFrame>;
  audioClips: Map<string, AudioClip>;
}

@ccclass('ResourceLoader')
export class ResourceLoader extends Component {
  @property(Node)
  loadingRoot: Node | null = null;

  @property(Label)
  loadingLabel: Label | null = null;

  private static _assets: LoadedAssets = {
    textures: new Map(),
    spriteFrames: new Map(),
    audioClips: new Map(),
  };

  static get assets(): LoadedAssets {
    return ResourceLoader._assets;
  }

  /** 加载进度 0~1 */
  static get loadProgress(): number {
    return (ResourceLoader as any)._progress ?? 0;
  }

  /** 入口：加载全部资源后回调 */
  static async loadAll(onProgress?: (p: number, msg: string) => void): Promise<LoadedAssets> {
    const keys = Object.keys(ASSET_URLS) as (keyof typeof ASSET_URLS)[];
    let done = 0;
    const total = Math.max(keys.length, 1);
    for (const key of keys) {
      const url = (ASSET_URLS as any)[key];
      if (url && typeof url === 'string') {
        try {
          const ext = url.split('.').pop()?.toLowerCase();
          if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp') {
            const tex = await ResourceLoader.loadTexture(url);
            if (tex) ResourceLoader._assets.textures.set(key, tex);
          } else if (ext === 'mp3' || ext === 'ogg' || ext === 'wav') {
            const clip = await ResourceLoader.loadAudio(url);
            if (clip) ResourceLoader._assets.audioClips.set(key, clip);
          }
        } catch (e) {
          console.warn('[ResourceLoader] Failed:', key, e);
        }
      }
      done++;
      (ResourceLoader as any)._progress = done / total;
      onProgress?.(done / total, `加载中 ${done}/${total}`);
    }
    (ResourceLoader as any)._progress = 1;
    onProgress?.(1, '完成');
    return ResourceLoader._assets;
  }

  private static loadTexture(url: string): Promise<Texture2D | null> {
    return new Promise((resolve) => {
      const ext = '.' + (url.split('.').pop()?.toLowerCase() || 'png');
      assetManager.loadRemote(url, { ext }, (err, asset) => {
        if (err) {
          resolve(null);
          return;
        }
        resolve(asset as Texture2D);
      });
    });
  }

  private static loadAudio(url: string): Promise<AudioClip | null> {
    return new Promise((resolve) => {
      assetManager.loadRemote(url, (err, asset) => {
        if (err) {
          resolve(null);
          return;
        }
        resolve(asset as AudioClip);
      });
    });
  }

  /** 获取精灵帧（从已加载纹理创建） */
  static getSpriteFrame(key: string): SpriteFrame | null {
    const tex = ResourceLoader._assets.textures.get(key);
    if (!tex) return null;
    const sf = new SpriteFrame(tex);
    ResourceLoader._assets.spriteFrames.set(key, sf);
    return sf;
  }

  static getAudioClip(key: string): AudioClip | null {
    return ResourceLoader._assets.audioClips.get(key) ?? null;
  }

  /** 组件用：显示加载界面并执行加载 */
  async runLoad() {
    if (this.loadingLabel) this.loadingLabel.string = '0%';
    const onProgress = (p: number, msg: string) => {
      if (this.loadingLabel) this.loadingLabel.string = Math.floor(p * 100) + '%';
    };
    await ResourceLoader.loadAll(onProgress);
    if (this.loadingRoot) this.loadingRoot.active = false;
  }
}
