/**
 * IdleManager - 离线收益与在线顾客/服务模拟
 * 含天气、prestige、家具、杂交吸引力、日成长
 */

import { SaveManager } from './SaveManager';
import { EconomyManager } from './EconomyManager';
import { WeatherSystem } from './WeatherSystem';
import { PrestigeManager } from './PrestigeManager';
import { FurnitureManager } from './FurnitureManager';
import {
  CUSTOMER_SPAWN_RATE_BASE,
  SERVICE_TIME_BASE,
  COIN_PER_CUSTOMER_BASE,
  COIN_LEVEL_MULTIPLIER,
  DIAMOND_RATE_FROM_CUSTOMER,
  OFFLINE_MAX_HOURS,
  DAY_PROGRESSION_GROWTH,
} from '../config/GameConfig';
import { getPetMeta } from '../config/PetMeta';
import { TaskManager } from './TaskManager';

export class IdleManager {
  private static _instance: IdleManager;
  private _accumulatedCoins = 0;
  private _accumulatedDiamonds = 0;
  private _pendingOfflineSeconds = 0;

  static get instance(): IdleManager {
    if (!IdleManager._instance) {
      IdleManager._instance = new IdleManager();
    }
    return IdleManager._instance;
  }

  private get save() {
    return SaveManager.instance.data;
  }

  /** 网格中宠物数量与总等级 (仅 pet 类型)，含杂交 */
  getPetStats(): { count: number; totalLevel: number } {
    const items = this.save.gridItems.filter(i => i.type === 'pet');
    let totalLevel = 0;
    items.forEach(i => {
      const pid = i.petId || i.hybridId;
      const meta = pid ? getPetMeta(pid) : null;
      totalLevel += meta ? meta.level : i.level;
    });
    return { count: items.length, totalLevel };
  }

  /** 吸引力系数：咖啡店等级 + 杂交宠物的 attractionBonus */
  getAttractionBonus(): number {
    let base = 1 + this.save.cafeLevel * 0.2;
    const items = this.save.gridItems.filter(i => i.type === 'pet');
    items.forEach(i => {
      const meta = (i.petId ? getPetMeta(i.petId) : null) || (i.hybridId ? getPetMeta(i.hybridId) : null);
      if (meta?.attractionBonus) base += meta.attractionBonus;
    });
    return base;
  }

  /** 日成长系数 (Day1 ~1, Day30 约 3.4) */
  getDayProgressionMultiplier(): number {
    const days = Math.min(this.save.totalPlayDays ?? 1, 365);
    return 1 + DAY_PROGRESSION_GROWTH * days;
  }

  /** 每小时收益 (用于离线) */
  getHourlyRate(): { coins: number; customers: number } {
    const { count, totalLevel } = this.getPetStats();
    if (count === 0) return { coins: 0, customers: 0 };
    const mult = 1 + totalLevel * COIN_LEVEL_MULTIPLIER;
    const weather = WeatherSystem.instance.getCustomerMultiplier();
    const prestige = PrestigeManager.instance.getIncomeMultiplier();
    const dayMult = this.getDayProgressionMultiplier();
    const furnitureSpeed = 1 + FurnitureManager.instance.getTotalSpeedBonus();
    const customersPerHour = 3600 * CUSTOMER_SPAWN_RATE_BASE * count * this.getAttractionBonus() * weather * furnitureSpeed;
    const coinsPerCustomer = COIN_PER_CUSTOMER_BASE * mult * prestige * dayMult;
    return {
      coins: Math.floor(customersPerHour * coinsPerCustomer),
      customers: Math.floor(customersPerHour),
    };
  }

  /** 计算离线收益并返回弹窗用数据 */
  computeOfflineEarnings(): { coins: number; diamonds: number; hours: number } {
    const logout = SaveManager.instance.getLogoutTime();
    const now = Date.now();
    let hours = (now - logout) / 1000 / 3600;
    if (hours > OFFLINE_MAX_HOURS) hours = OFFLINE_MAX_HOURS;
    if (hours < 0) hours = 0;

    const rate = this.getHourlyRate();
    const totalCustomers = rate.customers * hours;
    const coins = Math.floor(rate.coins * hours);
    const diamonds = Math.floor(totalCustomers * DIAMOND_RATE_FROM_CUSTOMER);

    this._accumulatedCoins = coins;
    this._accumulatedDiamonds = diamonds;
    this._pendingOfflineSeconds = totalCustomers; // 可用来刷新 UI 计数
    return { coins, diamonds, hours };
  }

  /** 领取离线收益 (可选看广告双倍) */
  claimOfflineEarnings(doubleByAd: boolean): void {
    let c = this._accumulatedCoins;
    let d = this._accumulatedDiamonds;
    if (doubleByAd) {
      c *= 2;
      d *= 2;
    }
    EconomyManager.instance.addCoins(c, 'offline');
    if (d > 0) EconomyManager.instance.addDiamonds(d);
    this.save.totalCustomersServed += Math.floor(this._pendingOfflineSeconds);
    this._accumulatedCoins = 0;
    this._accumulatedDiamonds = 0;
    this._pendingOfflineSeconds = 0;
    SaveManager.instance.save();
  }

  /** 在线模拟：deltaTime 秒内产生的顾客与金币 (由 GameLoop 调用) */
  tick(deltaTime: number): { coins: number; diamonds: number; customers: number } {
    const { count, totalLevel } = this.getPetStats();
    if (count === 0) return { coins: 0, diamonds: 0, customers: 0 };

    const weather = WeatherSystem.instance.getCustomerMultiplier();
    const rareDrop = WeatherSystem.instance.getRareDropMultiplier();
    const prestige = PrestigeManager.instance.getIncomeMultiplier();
    const dayMult = this.getDayProgressionMultiplier();
    const furnitureSpeed = 1 + FurnitureManager.instance.getTotalSpeedBonus();

    const spawnRate = CUSTOMER_SPAWN_RATE_BASE * count * this.getAttractionBonus() * weather * furnitureSpeed;
    const customers = spawnRate * deltaTime;
    const serviceTime = Math.max(0.5, SERVICE_TIME_BASE / Math.max(1, totalLevel));
    const served = customers * (deltaTime / serviceTime);
    const mult = 1 + totalLevel * COIN_LEVEL_MULTIPLIER;
    const coins = Math.floor(served * COIN_PER_CUSTOMER_BASE * mult * prestige * dayMult);
    const diamonds = served * DIAMOND_RATE_FROM_CUSTOMER * rareDrop;
    const diamondRoll = Math.random() < diamonds ? 1 : 0;

    this.save.totalCustomersServed += Math.floor(served);
    EconomyManager.instance.addCoins(coins, 'idle');
    if (diamondRoll) EconomyManager.instance.addDiamonds(1);
    TaskManager.instance.onCustomersServed(Math.floor(served));
    TaskManager.instance.onCoinsEarned(coins);
    SaveManager.instance.save();

    return { coins, diamonds: diamondRoll, customers: Math.floor(served) };
  }

  hasPendingOffline(): boolean {
    return this._accumulatedCoins > 0 || this._accumulatedDiamonds > 0;
  }
}
