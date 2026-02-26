/**
 * EconomyManager - 货币与资源
 * 金币、钻石、体力；支出/收入平衡
 */

import { _decorator } from 'cc';
import { SaveManager } from './SaveManager';
import {
  ENERGY_MAX,
  ENERGY_REGEN_MINUTES,
  COIN_DAILY_CAP_MULTIPLIER,
} from '../config/GameConfig';
import type { CurrencyData } from '../data/SaveData';

export class EconomyManager {
  private static _instance: EconomyManager;

  static get instance(): EconomyManager {
    if (!EconomyManager._instance) {
      EconomyManager._instance = new EconomyManager();
    }
    return EconomyManager._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  get coins(): number {
    return this.data.currency.coins;
  }

  get diamonds(): number {
    return this.data.currency.diamonds;
  }

  get energy(): number {
    return this.recomputeEnergy();
  }

  /** 体力随时间恢复，上限 ENERGY_MAX */
  recomputeEnergy(): number {
    const c = this.data.currency;
    const now = Date.now();
    const elapsed = (now - c.lastEnergyTime) / 1000 / 60; // 分钟
    const regen = Math.floor(elapsed / ENERGY_REGEN_MINUTES);
    let e = c.energy + regen;
    if (e > ENERGY_MAX) e = ENERGY_MAX;
    if (regen > 0) {
      c.energy = e;
      c.lastEnergyTime = now;
      SaveManager.instance.save();
    }
    return e;
  }

  addCoins(amount: number, source?: string): void {
    const cap = this.data.playerLevel * COIN_DAILY_CAP_MULTIPLIER;
    const current = this.data.totalCoinsEarned;
    const allowed = Math.max(0, cap - current);
    const add = Math.min(amount, allowed);
    this.data.currency.coins += add;
    this.data.totalCoinsEarned += add;
    SaveManager.instance.save();
  }

  spendCoins(amount: number): boolean {
    if (this.data.currency.coins < amount) return false;
    this.data.currency.coins -= amount;
    SaveManager.instance.save();
    return true;
  }

  addDiamonds(amount: number): void {
    this.data.currency.diamonds += amount;
    SaveManager.instance.save();
  }

  spendDiamonds(amount: number): boolean {
    if (this.data.currency.diamonds < amount) return false;
    this.data.currency.diamonds -= amount;
    SaveManager.instance.save();
    return true;
  }

  /** 消耗体力，返回是否成功 */
  spendEnergy(amount: number): boolean {
    const e = this.recomputeEnergy();
    if (e < amount) return false;
    this.data.currency.energy -= amount;
    this.data.currency.lastEnergyTime = Date.now();
    SaveManager.instance.save();
    return true;
  }

  /** 广告观看后双倍奖励 (模拟) */
  recordAdWatch(): void {
    this.data.adWatchCount++;
    SaveManager.instance.save();
  }
}
