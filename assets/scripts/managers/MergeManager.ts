/**
 * MergeManager - 合并网格逻辑
 */

import { Vec2 } from 'cc';
import { SaveManager } from './SaveManager';
import { EconomyManager } from './EconomyManager';
import { TaskManager } from './TaskManager';
import { GuildManager } from './GuildManager';
import {
  GRID_COLS,
  GRID_ROWS,
  GRID_CELL_SIZE,
  CHAIN_REACTION_CHANCE,
  CHAIN_BONUS_COIN,
  AUTO_SPAWN_INTERVAL_MS,
} from '../config/GameConfig';
import type { GridItemData } from '../data/SaveData';
import { getNextEvolution, getPetMeta, PET_META_LIST } from '../config/PetMeta';
import { WeatherSystem } from './WeatherSystem';

/** 合并结果回调 */
export interface MergeResult {
  success: boolean;
  newItem?: GridItemData;
  coinGain?: number;
  chain?: boolean;
}

export class MergeManager {
  private static _instance: MergeManager;
  private _autoSpawnTimer = 0;
  private _grid: (GridItemData | null)[][] = [];

  static get instance(): MergeManager {
    if (!MergeManager._instance) {
      MergeManager._instance = new MergeManager();
    }
    return MergeManager._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  get gridCols(): number {
    return this.data.gridCols || GRID_COLS;
  }

  get gridRows(): number {
    return this.data.gridRows || GRID_ROWS;
  }

  get cellSize(): number {
    return GRID_CELL_SIZE;
  }

  /** 从存档重建网格二维数组 */
  buildGridFromSave(): (GridItemData | null)[][] {
    const cols = this.gridCols;
    const rows = this.gridRows;
    const grid: (GridItemData | null)[][] = Array(rows).fill(null).map(() => Array(cols).fill(null));
    this.data.gridItems.forEach(item => {
      const idx = this.itemIndexInGrid(item.id);
      if (idx !== undefined) {
        const r = Math.floor(idx / cols);
        const c = idx % cols;
        if (r >= 0 && r < rows && c >= 0 && c < cols) grid[r][c] = item;
      }
    });
    // 若存档没有位置信息，按顺序填满
    const list = [...this.data.gridItems];
    let listIdx = 0;
    for (let r = 0; r < rows && listIdx < list.length; r++) {
      for (let c = 0; c < cols && listIdx < list.length; c++) {
        if (!grid[r][c]) grid[r][c] = list[listIdx++] || null;
      }
    }
    this._grid = grid;
    return grid;
  }

  /** 物品在 gridItems 中的逻辑索引 (按行优先) */
  itemIndexInGrid(itemId: string): number | undefined {
    const idx = this.data.gridItems.findIndex(i => i.id === itemId);
    return idx >= 0 ? idx : undefined;
  }

  /** 根据行列取格子上物品 */
  getItemAt(col: number, row: number): GridItemData | null {
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return null;
    if (!this._grid.length) this.buildGridFromSave();
    return this._grid[row][col] ?? null;
  }

  /** 设置格子 (内部用) */
  setItemAt(col: number, row: number, item: GridItemData | null): void {
    if (row < 0 || row >= this.gridRows || col < 0 || col >= this.gridCols) return;
    if (!this._grid.length) this.buildGridFromSave();
    this._grid[row][col] = item;
  }

  /** 生成新物品 id */
  private nextId(): string {
    return 'item_' + Date.now() + '_' + Math.random().toString(36).slice(2, 9);
  }

  /** 创建 Lv1 宠物 (随机 N 级) */
  createStarterPet(): GridItemData {
    const lv1Pets = PET_META_LIST.filter(p => p.level === 1);
    const meta = lv1Pets[Math.floor(Math.random() * lv1Pets.length)] || PET_META_LIST[0];
    return {
      id: this.nextId(),
      type: 'pet',
      level: meta.level,
      rarity: meta.rarity,
      petId: meta.id,
    };
  }

  /** 创建指定 petId 的宠物物品（用于协作蛋/赠送蛋等） */
  createPetFromId(petId: string): GridItemData | null {
    const meta = getPetMeta(petId);
    if (!meta) return null;
    return {
      id: this.nextId(),
      type: 'pet',
      level: meta.level,
      rarity: meta.rarity,
      petId: meta.id,
    };
  }

  /** 尝试合并：从 (c1,r1) 拖到 (c2,r2)，若同类型同等级则合并 */
  tryMerge(c1: number, r1: number, c2: number, r2: number): MergeResult {
    const a = this.getItemAt(c1, r1);
    const b = this.getItemAt(c2, r2);
    if (!a || !b) return { success: false };
    if (a.id === b.id) return { success: false };
    if (a.type !== b.type) return { success: false };

    let sameLevel = false;
    let nextItem: GridItemData | undefined;
    if (a.type === 'pet' && a.petId && b.petId) {
      const metaA = getPetMeta(a.petId);
      const metaB = getPetMeta(b.petId);
      if (metaA && metaB && metaA.line === metaB.line && metaA.level === metaB.level) {
        sameLevel = true;
        const next = getNextEvolution(a.petId);
        if (next) {
          nextItem = {
            id: this.nextId(),
            type: 'pet',
            level: next.level,
            rarity: next.rarity,
            petId: next.id,
          };
        }
      }
    } else {
      if (a.level === b.level) {
        sameLevel = true;
        nextItem = {
          id: this.nextId(),
          type: a.type,
          level: a.level + 1,
          rarity: a.rarity,
          petId: a.type === 'pet' ? undefined : undefined,
        };
      }
    }

    if (!sameLevel || !nextItem) return { success: false };

    const chain = Math.random() < CHAIN_REACTION_CHANCE;
    const coinGain = 20 + (nextItem.level * 5) + (chain ? CHAIN_BONUS_COIN : 0);
    EconomyManager.instance.addCoins(coinGain, 'merge');
    this.data.totalMerges += 1;
    TaskManager.instance.onMerge(1);
    if (chain) TaskManager.instance.onChainMerge(1);

    this.removeItemFromGrid(a.id);
    this.removeItemFromGrid(b.id);
    this.placeItem(nextItem, c2, r2);
    GuildManager.instance.contributeMerge(1);
    WeatherSystem.instance.addStormBossProgress(1);
    SaveManager.instance.save();

    return { success: true, newItem: nextItem, coinGain, chain };
  }

  /** 从网格移除物品并同步 gridItems */
  removeItemFromGrid(itemId: string): void {
    if (!this._grid.length) this.buildGridFromSave();
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this._grid[r][c]?.id === itemId) {
          this._grid[r][c] = null;
          break;
        }
      }
    }
    const idx = this.data.gridItems.findIndex(i => i.id === itemId);
    if (idx >= 0) this.data.gridItems.splice(idx, 1);
  }

  /** 放置到指定格 (若有东西则找空位) */
  placeItem(item: GridItemData, col: number, row: number): boolean {
    if (!this._grid.length) this.buildGridFromSave();
    let c = col;
    let r = row;
    if (this.getItemAt(c, r)) {
      const pos = this.findEmptyCell();
      if (!pos) return false;
      c = pos.x;
      r = pos.y;
    }
    this.setItemAt(c, r, item);
    if (!this.data.gridItems.find(i => i.id === item.id)) {
      this.data.gridItems.push(item);
    }
    return true;
  }

  findEmptyCell(): Vec2 | null {
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (!this.getItemAt(c, r)) return new Vec2(c, r);
      }
    }
    return null;
  }

  isGridFull(): boolean {
    return this.findEmptyCell() === null;
  }

  /** 自动生成低等级物品 (每 10s) */
  update(dt: number): void {
    this._autoSpawnTimer += dt * 1000;
    const spawnLv = this.data.starUpgrades?.spawnSpeedLevel ?? 0;
    const interval = Math.max(3000, AUTO_SPAWN_INTERVAL_MS * (1 - 0.03 * spawnLv));
    if (this._autoSpawnTimer >= interval) {
      this._autoSpawnTimer = 0;
      if (!this.isGridFull()) {
        const item = this.createStarterPet();
        const pos = this.findEmptyCell();
        if (pos) this.placeItem(item, pos.x, pos.y);
        SaveManager.instance.save();
      }
    }
  }

  /** 整理：移除最低级物品直到有空位 (简化：移除一个) */
  tidy(): boolean {
    if (!this.isGridFull()) return true;
    const items = [...this.data.gridItems].sort((a, b) => a.level - b.level);
    const toRemove = items[0];
    if (toRemove) {
      this.removeItemFromGrid(toRemove.id);
      SaveManager.instance.save();
      return true;
    }
    return false;
  }

  getGridItemsForDisplay(): GridItemData[] {
    return this.data.gridItems;
  }

  getTotalMerges(): number {
    return this.data.totalMerges;
  }
}
