/**
 * FurnitureManager - 咖啡厅家具拖放放置
 * 解锁通过合并/升级；位置持久化到 placedFurniture
 */

import { SaveManager } from './SaveManager';
import type { PlacedFurnitureData } from '../data/SaveData';

export interface FurnitureDef {
  id: string;
  nameKey: string;
  level: number;
  unlockAtMerges?: number;
  unlockAtCafeLevel?: number;
  capacity?: number;
  speedBonus?: number;
}

const FURNITURE_DEFS: FurnitureDef[] = [
  { id: 'table_small', nameKey: 'furn_table_small', level: 1, unlockAtMerges: 0, capacity: 1 },
  { id: 'table_round', nameKey: 'furn_table_round', level: 2, unlockAtMerges: 20, capacity: 2, speedBonus: 0.1 },
  { id: 'chair_cushion', nameKey: 'furn_chair_cushion', level: 1, unlockAtCafeLevel: 2 },
  { id: 'counter', nameKey: 'furn_counter', level: 3, unlockAtMerges: 50, capacity: 3, speedBonus: 0.15 },
  { id: 'plant_small', nameKey: 'furn_plant_small', level: 1, unlockAtMerges: 10 },
  { id: 'lamp', nameKey: 'furn_lamp', level: 2, unlockAtCafeLevel: 3 },
];

export class FurnitureManager {
  private static _instance: FurnitureManager;

  static get instance(): FurnitureManager {
    if (!FurnitureManager._instance) {
      FurnitureManager._instance = new FurnitureManager();
    }
    return FurnitureManager._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  getPlaced(): PlacedFurnitureData[] {
    return this.data.placedFurniture || [];
  }

  getDefs(): FurnitureDef[] {
    return FURNITURE_DEFS;
  }

  isUnlocked(def: FurnitureDef): boolean {
    if (def.unlockAtMerges != null && this.data.totalMerges < def.unlockAtMerges) return false;
    if (def.unlockAtCafeLevel != null && this.data.cafeLevel < def.unlockAtCafeLevel) return false;
    return true;
  }

  place(furnitureId: string, level: number, x: number, y: number): PlacedFurnitureData {
    const def = FURNITURE_DEFS.find(d => d.id === furnitureId);
    if (!def || !this.isUnlocked(def)) throw new Error('Furniture not unlocked');
    const list = this.data.placedFurniture || [];
    const id = 'furn_' + Date.now();
    const placed: PlacedFurnitureData = { id, furnitureId, level, x, y };
    list.push(placed);
    this.data.placedFurniture = list;
    SaveManager.instance.save();
    return placed;
  }

  move(placedId: string, x: number, y: number): boolean {
    const list = this.data.placedFurniture || [];
    const p = list.find(i => i.id === placedId);
    if (!p) return false;
    p.x = x;
    p.y = y;
    SaveManager.instance.save();
    return true;
  }

  remove(placedId: string): boolean {
    const list = this.data.placedFurniture || [];
    const idx = list.findIndex(i => i.id === placedId);
    if (idx < 0) return false;
    list.splice(idx, 1);
    this.data.placedFurniture = list;
    SaveManager.instance.save();
    return true;
  }

  /** 总容量/速度加成（可被 IdleManager 使用） */
  getTotalCapacity(): number {
    const placed = this.getPlaced();
    return placed.reduce((sum, p) => {
      const def = FURNITURE_DEFS.find(d => d.id === p.furnitureId);
      return sum + (def?.capacity ?? 0);
    }, 0);
  }

  getTotalSpeedBonus(): number {
    const placed = this.getPlaced();
    return placed.reduce((sum, p) => {
      const def = FURNITURE_DEFS.find(d => d.id === p.furnitureId);
      return sum + (def?.speedBonus ?? 0);
    }, 0);
  }
}
