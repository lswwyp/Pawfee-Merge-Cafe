/**
 * PetManager - 图鉴、蛋孵化、收集进度
 */

import { SaveManager } from './SaveManager';
import { EconomyManager } from './EconomyManager';
import { EGG_RARITY_WEIGHTS } from '../config/GameConfig';
import type { CollectedPetData } from '../data/SaveData';
import { PET_META_LIST, getPetMeta, type PetMeta } from '../config/PetMeta';

export class PetManager {
  private static _instance: PetManager;

  static get instance(): PetManager {
    if (!PetManager._instance) {
      PetManager._instance = new PetManager();
    }
    return PetManager._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  getCollectedPets(): CollectedPetData[] {
    return this.data.collectedPets || [];
  }

  recordCollected(petId: string, level: number): void {
    let c = this.data.collectedPets.find(p => p.petId === petId && p.level === level);
    if (!c) {
      c = { petId, level, count: 0 };
      this.data.collectedPets.push(c);
    }
    c.count++;
    SaveManager.instance.save();
  }

  /** 孵化蛋：随机稀有度，返回新宠物 id */
  hatchEgg(useDiamonds: boolean): string | null {
    if (useDiamonds) {
      if (!EconomyManager.instance.spendDiamonds(10)) return null;
    } else {
      if (!EconomyManager.instance.spendCoins(500)) return null;
    }
    return this.hatchFreeEgg();
  }

  /** 免费孵化（不扣币，用于公会协作/赠送蛋等） */
  hatchFreeEgg(): string | null {
    const roll = Math.random() * 100;
    let rarity: 'N' | 'R' | 'SR' | 'SSR' = 'N';
    if (roll < EGG_RARITY_WEIGHTS.SSR) rarity = 'SSR';
    else if (roll < EGG_RARITY_WEIGHTS.SSR + EGG_RARITY_WEIGHTS.SR) rarity = 'SR';
    else if (roll < EGG_RARITY_WEIGHTS.SSR + EGG_RARITY_WEIGHTS.SR + EGG_RARITY_WEIGHTS.R) rarity = 'R';

    const candidates = PET_META_LIST.filter(p => p.rarity === rarity && p.level === 1);
    const meta = candidates[Math.floor(Math.random() * candidates.length)] || PET_META_LIST[0];
    this.recordCollected(meta.id, meta.level);
    return meta.id;
  }

  collectionProgress(): { current: number; total: number; percent: number } {
    const total = PET_META_LIST.length;
    const unique = new Set(this.data.collectedPets.map(p => p.petId));
    return { current: unique.size, total, percent: Math.floor((unique.size / total) * 100) };
  }
}
