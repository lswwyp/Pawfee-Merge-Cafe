/**
 * BreedingManager - 育儿所：两只 Lv5+ 同类型宠物配对 → 杂交蛋
 * 24h 孵化（支持离线进度），孵化后得到杂交宠物
 */

import { SaveManager } from './SaveManager';
import { MergeManager } from './MergeManager';
import { PetManager } from './PetManager';
import {
  BREEDING_MIN_LEVEL,
  BREEDING_EGG_DURATION_MS,
} from '../config/GameConfig';
import type { BreedingEggData, GridItemData } from '../data/SaveData';
import { getPetMeta, getHybridIdByParentLines } from '../config/PetMeta';

export class BreedingManager {
  private static _instance: BreedingManager;

  static get instance(): BreedingManager {
    if (!BreedingManager._instance) {
      BreedingManager._instance = new BreedingManager();
    }
    return BreedingManager._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  getEggs(): BreedingEggData[] {
    return this.data.breedingEggs || [];
  }

  /** 每日限制：免费 1 次，广告追加 1 次（原型可扩展） */
  private getDailyState() {
    const today = new Date().toISOString().slice(0, 10);
    if (!this.data.breedingDaily || this.data.breedingDaily.date !== today) {
      this.data.breedingDaily = { date: today, freeUsed: false, adExtraUsed: 0 };
      SaveManager.instance.save();
    }
    return this.data.breedingDaily;
  }

  canStartBreeding(useAdExtra: boolean): { ok: boolean; reason?: string } {
    if (!this.canStartNewBreeding()) return { ok: false, reason: '育儿所满了' };
    const d = this.getDailyState();
    if (!d.freeUsed) return { ok: true };
    if (useAdExtra && d.adExtraUsed < 1) return { ok: true };
    return { ok: false, reason: '今日育种次数已用完' };
  }

  /** 可配对的宠物：网格中 Lv5+ 且同 line（或两只不同 line 则杂交） */
  canPair(a: GridItemData, b: GridItemData): { ok: boolean; hybridId?: string } {
    if (a.type !== 'pet' || b.type !== 'pet' || !a.petId || !b.petId) return { ok: false };
    const metaA = getPetMeta(a.petId);
    const metaB = getPetMeta(b.petId);
    if (!metaA || !metaB) return { ok: false };
    if (metaA.level < BREEDING_MIN_LEVEL || metaB.level < BREEDING_MIN_LEVEL) return { ok: false };
    if (metaA.line === 'hybrid' || metaB.line === 'hybrid') return { ok: false };
    const lineA = metaA.line;
    const lineB = metaB.line;
    const hybridId = getHybridIdByParentLines(lineA, lineB);
    return { ok: !!hybridId, hybridId: hybridId ?? undefined };
  }

  /** 开始育种：消耗两只宠物，生成蛋；useAdExtra 表示使用广告追加次数 */
  startBreeding(itemId1: string, itemId2: string, useAdExtra: boolean): BreedingEggData | null {
    const limit = this.canStartBreeding(useAdExtra);
    if (!limit.ok) return null;
    const items = this.data.gridItems.filter(i => i.id === itemId1 || i.id === itemId2);
    if (items.length !== 2) return null;
    const [a, b] = items;
    const { ok, hybridId } = this.canPair(a, b);
    if (!ok || !hybridId) return null;

    // 20% 稀有度上浮：R->SR->SSR（不超过 SSR）
    const baseMeta = getPetMeta(hybridId);
    let finalHybridId = hybridId;
    if (baseMeta && Math.random() < 0.2) {
      // 在同 parentLines 的候选中找更高稀有度的一个（简化：随机挑 SR/SSR）
      // 若找不到就用原本
      // 这里保持 hybridId 不变，但可在 PetMeta 中配置更多 SR/SSR 杂交来提升体验
      finalHybridId = hybridId;
    }

    const daily = this.getDailyState();
    if (!daily.freeUsed) daily.freeUsed = true;
    else if (useAdExtra) daily.adExtraUsed += 1;

    MergeManager.instance.removeItemFromGrid(itemId1);
    MergeManager.instance.removeItemFromGrid(itemId2);
    const egg: BreedingEggData = {
      id: 'egg_' + Date.now(),
      hybridId: finalHybridId,
      startTime: Date.now(),
      durationMs: BREEDING_EGG_DURATION_MS,
      parentPetId1: a.petId!,
      parentPetId2: b.petId!,
    };
    this.data.breedingEggs = this.data.breedingEggs || [];
    this.data.breedingEggs.push(egg);
    SaveManager.instance.save();
    return egg;
  }

  /** 蛋剩余时间 ms（0 表示可领取） */
  getRemainingMs(egg: BreedingEggData): number {
    const elapsed = Date.now() - egg.startTime;
    return Math.max(0, egg.durationMs - elapsed);
  }

  /** 可领取的蛋 */
  getReadyEggs(): BreedingEggData[] {
    return (this.data.breedingEggs || []).filter(e => this.getRemainingMs(e) <= 0);
  }

  /** 领取蛋：将杂交宠物放入网格并移除蛋 */
  claimEgg(eggId: string): boolean {
    const eggs = this.data.breedingEggs || [];
    const idx = eggs.findIndex(e => e.id === eggId);
    if (idx < 0) return false;
    const egg = eggs[idx];
    if (this.getRemainingMs(egg) > 0) return false;
    const meta = getPetMeta(egg.hybridId);
    if (!meta) return false;
    const item: GridItemData = {
      id: 'item_' + Date.now(),
      type: 'pet',
      level: meta.level,
      rarity: meta.rarity,
      petId: egg.hybridId,
      hybridId: egg.hybridId,
    };
    const pos = MergeManager.instance.findEmptyCell();
    if (!pos) return false;
    MergeManager.instance.placeItem(item, pos.x, pos.y);
    PetManager.instance.recordCollected(egg.hybridId, meta.level);
    eggs.splice(idx, 1);
    this.data.breedingEggs = eggs;
    SaveManager.instance.save();
    return true;
  }

  /** 育儿所空位数量（可同时孵化的蛋数） */
  getNurserySlots(): number {
    const base = 3;
    const extra = this.data.starUpgrades?.breedingSlotLevel ?? 0;
    return Math.min(6, base + extra);
  }

  canStartNewBreeding(): boolean {
    return (this.data.breedingEggs?.length ?? 0) < this.getNurserySlots();
  }
}
