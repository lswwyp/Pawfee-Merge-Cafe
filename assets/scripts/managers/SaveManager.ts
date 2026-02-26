/**
 * SaveManager - 存档读写与自动保存
 */

import { SAVE_KEY, LAST_LOGOUT_KEY } from '../config/GameConfig';
import type { SaveData } from '../data/SaveData';
import { createDefaultSaveData } from '../data/SaveData';

export class SaveManager {
  private static _instance: SaveManager;
  private _data: SaveData | null = null;

  static get instance(): SaveManager {
    if (!SaveManager._instance) {
      SaveManager._instance = new SaveManager();
    }
    return SaveManager._instance;
  }

  get data(): SaveData {
    if (!this._data) {
      this._data = this.load();
    }
    return this._data;
  }

  load(): SaveData {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as SaveData;
        const def = createDefaultSaveData();
        this._data = { ...def, ...parsed };
        this._data.currency = { ...def.currency, ...parsed.currency };
        this._data.tutorial = { ...def.tutorial, ...parsed.tutorial };
        if (!this._data.breedingEggs) this._data.breedingEggs = [];
        if (!this._data.placedFurniture) this._data.placedFurniture = [];
        if (this._data.currency && typeof this._data.currency.stars !== 'number') this._data.currency.stars = 0;
        if (!this._data.miniGamePlayedToday) this._data.miniGamePlayedToday = {};
        if (typeof this._data.totalPlayDays !== 'number') this._data.totalPlayDays = 1;
        if (!this._data.starUpgrades) this._data.starUpgrades = { incomeLevel: 0, spawnSpeedLevel: 0, breedingSlotLevel: 0 };
        if (typeof (this._data as any).breedingDaily === 'undefined') (this._data as any).breedingDaily = null;
        if (typeof (this._data as any).pendingGiftEggs !== 'number') (this._data as any).pendingGiftEggs = 0;
        if (typeof (this._data as any).stormBossProgress !== 'number') (this._data as any).stormBossProgress = 0;
        if (typeof (this._data as any).stormBossGoal !== 'number') (this._data as any).stormBossGoal = 20;
        if (!(this._data as any).stormBossClaimedDate) (this._data as any).stormBossClaimedDate = null;
        const g = this._data.guild;
        if (g && typeof (g as any).coopMergeGoal !== 'number') {
          (g as any).coopMergeGoal = 30;
          (g as any).coopMergeProgress = 0;
          (g as any).coopEggClaimedDate = null;
        }
        return this._data;
      }
    } catch (e) {
      console.warn('[SaveManager] Load failed:', e);
    }
    this._data = createDefaultSaveData();
    return this._data;
  }

  save(): void {
    if (!this._data) return;
    this._data.lastSaveTime = Date.now();
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this._data));
    } catch (e) {
      console.warn('[SaveManager] Save failed:', e);
    }
  }

  /** 退出时记录时间，用于离线收益计算 */
  setLogoutTime(): void {
    localStorage.setItem(LAST_LOGOUT_KEY, String(Date.now()));
    this.data.logoutTime = Date.now();
    this.save();
  }

  getLogoutTime(): number {
    const s = localStorage.getItem(LAST_LOGOUT_KEY);
    return s ? parseInt(s, 10) : Date.now();
  }

  /** 重置存档 (调试用) */
  reset(): void {
    this._data = createDefaultSaveData();
    this.save();
  }
}
