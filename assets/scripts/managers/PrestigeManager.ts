/**
 * PrestigeManager - 收集 80% 后可重置获得星币，永久加成收益
 */

import { SaveManager } from './SaveManager';
import { PetManager } from './PetManager';
import { PRESTIGE_COLLECTION_PERCENT, PRESTIGE_STAR_PER_RESET, PRESTIGE_INCOME_PER_STAR } from '../config/GameConfig';

export class PrestigeManager {
  private static _instance: PrestigeManager;

  static get instance(): PrestigeManager {
    if (!PrestigeManager._instance) {
      PrestigeManager._instance = new PrestigeManager();
    }
    return PrestigeManager._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  /** 当前收集完成度 0~100 */
  getCollectionPercent(): number {
    return PetManager.instance.collectionProgress().percent;
  }

  canPrestige(): boolean {
    return this.getCollectionPercent() >= PRESTIGE_COLLECTION_PERCENT;
  }

  /** 执行 prestige：重置进度，增加星币 */
  doPrestige(): boolean {
    if (!this.canPrestige()) return false;
    this.data.prestigeCount = (this.data.prestigeCount || 0) + 1;
    this.data.starsEarned = (this.data.starsEarned || 0) + PRESTIGE_STAR_PER_RESET;
    this.data.currency.stars = (this.data.currency.stars || 0) + PRESTIGE_STAR_PER_RESET;
    // 重置：清空网格、保留货币与星、重置等级等
    this.data.gridItems = [];
    this.data.playerLevel = 1;
    this.data.cafeLevel = 1;
    this.data.collectedPets = [];
    this.data.breedingEggs = [];
    SaveManager.instance.save();
    return true;
  }

  /** 全局收益加成（1 + star * 0.1） */
  getIncomeMultiplier(): number {
    const stars = this.data.currency?.stars ?? 0;
    const upgradeLv = this.data.starUpgrades?.incomeLevel ?? 0;
    const upgradeMult = 1 + upgradeLv * 0.05;
    return (1 + stars * PRESTIGE_INCOME_PER_STAR) * upgradeMult;
  }

  getStars(): number {
    return this.data.currency?.stars ?? 0;
  }

  /** 星币商店：升级（花费递增） */
  getUpgradeCost(kind: 'income' | 'spawn' | 'slot'): number {
    const u = this.data.starUpgrades;
    const lv = kind === 'income' ? u.incomeLevel : kind === 'spawn' ? u.spawnSpeedLevel : u.breedingSlotLevel;
    return 1 + lv; // 简化：1、2、3...
  }

  tryUpgrade(kind: 'income' | 'spawn' | 'slot'): boolean {
    const cost = this.getUpgradeCost(kind);
    const stars = this.data.currency?.stars ?? 0;
    if (stars < cost) return false;
    this.data.currency.stars = stars - cost;
    if (kind === 'income') this.data.starUpgrades.incomeLevel += 1;
    else if (kind === 'spawn') this.data.starUpgrades.spawnSpeedLevel += 1;
    else this.data.starUpgrades.breedingSlotLevel += 1;
    SaveManager.instance.save();
    return true;
  }
}
