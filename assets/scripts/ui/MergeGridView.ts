/**
 * MergeGridView - 合并网格显示与拖拽
 * 根据 MergeManager 数据生成格子与物品节点，处理拖拽合并
 */

import { _decorator, Component, Node, Vec2, Vec3, UITransform, EventTouch, tween, Color, Sprite } from 'cc';
import { MergeManager } from '../managers/MergeManager';
import { AudioManager } from '../managers/AudioManager';
import type { GridItemData } from '../data/SaveData';
import { GRID_CELL_SIZE } from '../config/GameConfig';
import { getPetMeta } from '../config/PetMeta';
import { EventBus, EVENTS } from '../core/EventBus';
import { ResourceLoader } from '../managers/ResourceLoader';

const { ccclass, property } = _decorator;

@ccclass('MergeGridView')
export class MergeGridView extends Component {
  @property(Node)
  cellPrefab: Node | null = null;

  @property(Node)
  itemPrefab: Node | null = null;

  private _merge: MergeManager;
  private _cells: Node[] = [];
  private _itemNodes: Map<string, Node> = new Map();
  private _dragging: { node: Node; data: GridItemData; startPos: Vec3 } | null = null;
  private _startCell: Vec2 | null = null;
  private _pickSlot: 0 | 1 | null = null;
  private _touchMoved = false;

  constructor() {
    super();
    this._merge = MergeManager.instance;
  }

  onLoad() {
    this.buildGrid();
    this.schedule(this.syncItems, 0.2);
    EventBus.on(EVENTS.REQUEST_PICK_PET, (payload: any) => {
      this._pickSlot = payload?.slot ?? null;
    });
  }

  private buildGrid() {
    const root = this.node;
    const cols = this._merge.gridCols;
    const rows = this._merge.gridRows;
    const startX = -(cols - 1) * (GRID_CELL_SIZE / 2);
    const startY = -(rows - 1) * (GRID_CELL_SIZE / 2);

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = this.createCell(c, r, startX + c * GRID_CELL_SIZE, startY + r * GRID_CELL_SIZE);
        root.addChild(cell);
        this._cells.push(cell);
      }
    }
  }

  private createCell(col: number, row: number, x: number, y: number): Node {
    const cell = new Node('Cell_' + col + '_' + row);
    const t = cell.addComponent(UITransform);
    t.setContentSize(GRID_CELL_SIZE, GRID_CELL_SIZE);
    cell.setPosition(x, y, 0);
    const sprite = cell.addComponent(Sprite);
    try {
      (sprite as any).color = new Color(220, 200, 180, 120);
    } catch (_) {}
    cell.on(Node.EventType.TOUCH_END, () => this.onCellTouchEnd(col, row), this);
    (cell as any)._gridCol = col;
    (cell as any)._gridRow = row;
    return cell;
  }

  private syncItems() {
    const items = this._merge.getGridItemsForDisplay();
    const existing = new Set(items.map(i => i.id));
    this._itemNodes.forEach((node, id) => {
      if (!existing.has(id)) {
        node.removeFromParent();
        this._itemNodes.delete(id);
      }
    });
    items.forEach(data => {
      if (!this._itemNodes.has(data.id)) {
        const node = this.createItemNode(data);
        if (node) {
          this.node.addChild(node);
          this._itemNodes.set(data.id, node);
          (node as any)._itemData = data;
        }
      }
    });
    this.updateItemPositions();
  }

  private createItemNode(data: GridItemData): Node | null {
    const item = new Node('Item_' + data.id);
    const t = item.addComponent(UITransform);
    const size = GRID_CELL_SIZE * 0.85;
    t.setContentSize(size, size);
    const sprite = item.addComponent(Sprite);
    const meta = (data.petId ? getPetMeta(data.petId) : null) || (data.hybridId ? getPetMeta(data.hybridId) : null);
    const color = this.rarityColor(data.rarity);
    try {
      (sprite as any).color = color;
    } catch (_) {}
    // 尝试用远程资源替换占位颜色
    if (meta?.line === 'cat') {
      const sf = ResourceLoader.getSpriteFrame('petCat');
      if (sf) sprite.spriteFrame = sf;
    } else if (meta?.line === 'dog') {
      const sf = ResourceLoader.getSpriteFrame('petDog');
      if (sf) sprite.spriteFrame = sf;
    }
    item.on(Node.EventType.TOUCH_START, (e: EventTouch) => this.onItemTouchStart(e, data, item), this);
    item.on(Node.EventType.TOUCH_MOVE, (e: EventTouch) => this.onItemTouchMove(e, item), this);
    item.on(Node.EventType.TOUCH_END, (e: EventTouch) => this.onItemTouchEnd(e, item), this);
    item.on(Node.EventType.TOUCH_CANCEL, (e: EventTouch) => this.onItemTouchEnd(e, item), this);
    return item;
  }

  private rarityColor(r: string): Color {
    switch (r) {
      case 'SSR': return new Color(255, 200, 0, 255);
      case 'SR': return new Color(200, 100, 255, 255);
      case 'R': return new Color(100, 150, 255, 255);
      default: return new Color(255, 180, 120, 255);
    }
  }

  private updateItemPositions() {
    const cols = this._merge.gridCols;
    const rows = this._merge.gridRows;
    const startX = -(cols - 1) * (GRID_CELL_SIZE / 2);
    const startY = -(rows - 1) * (GRID_CELL_SIZE / 2);
    const grid = this._merge.buildGridFromSave();

    this._itemNodes.forEach((node, id) => {
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (grid[r][c]?.id === id) {
            node.setPosition(startX + c * GRID_CELL_SIZE, startY + r * GRID_CELL_SIZE, 0);
            break;
          }
        }
      }
    });
  }

  private getCellAt(worldPos: Vec3): { col: number; row: number } | null {
    const cols = this._merge.gridCols;
    const rows = this._merge.gridRows;
    const startX = -(cols - 1) * (GRID_CELL_SIZE / 2);
    const startY = -(rows - 1) * (GRID_CELL_SIZE / 2);
    const ui = this.node.getComponent(UITransform);
    if (!ui) return null;
    const localPos = new Vec3();
    ui.convertToNodeSpaceAR(worldPos, localPos);
    const col = Math.round((localPos.x - startX) / GRID_CELL_SIZE);
    const row = Math.round((localPos.y - startY) / GRID_CELL_SIZE);
    if (col >= 0 && col < cols && row >= 0 && row < rows) return { col, row };
    return null;
  }

  private onItemTouchStart(e: EventTouch, data: GridItemData, node: Node) {
    this._dragging = { node, data, startPos: node.position.clone() };
    this._startCell = this.getCellAt(e.getUILocation());
    this._touchMoved = false;
    node.setSiblingIndex(999);
  }

  private onItemTouchMove(e: EventTouch, node: Node) {
    if (!this._dragging || this._dragging.node !== node) return;
    const delta = e.getUIDelta();
    if (Math.abs(delta.x) + Math.abs(delta.y) > 2) this._touchMoved = true;
    node.setPosition(node.position.x + delta.x, node.position.y + delta.y, 0);
  }

  private onItemTouchEnd(e: EventTouch, node: Node) {
    if (!this._dragging || this._dragging.node !== node) return;
    // 选宠模式：轻点选择，不触发合并
    if (this._pickSlot !== null && !this._touchMoved) {
      EventBus.emit(EVENTS.PET_PICKED, { slot: this._pickSlot, itemId: this._dragging.data.id });
      this._pickSlot = null;
      node.setPosition(this._dragging.startPos);
      this._dragging = null;
      this._startCell = null;
      return;
    }
    const endCell = this.getCellAt(e.getUILocation());
    const start = this._startCell;
    if (start && endCell && (start.col !== endCell.col || start.row !== endCell.row)) {
      const result = this._merge.tryMerge(start.col, start.row, endCell.col, endCell.row);
      if (result.success) {
        this.playMergeEffect(node);
        this.playMergeParticle(endCell.col, endCell.row);
        AudioManager.instance.playMerge();
        this._itemNodes.delete(this._dragging.data.id);
        if (result.newItem) {
          this._merge.placeItem(result.newItem, endCell.col, endCell.row);
          this.syncItems();
        }
      }
    }
    node.setPosition(this._dragging.startPos);
    this._dragging = null;
    this._startCell = null;
  }

  private onCellTouchEnd(col: number, row: number) {
    if (!this._dragging) return;
    const start = this._startCell;
    if (!start) return;
    const result = this._merge.tryMerge(start.col, start.row, col, row);
    if (result.success) {
      this.playMergeEffect(this._dragging.node);
      this.playMergeParticle(col, row);
      AudioManager.instance.playMerge();
      this._itemNodes.delete(this._dragging.data.id);
      if (result.newItem) {
        this._merge.placeItem(result.newItem, col, row);
        this.syncItems();
      }
    }
    this._dragging.node.setPosition(this._dragging.startPos);
    this._dragging = null;
    this._startCell = null;
  }

  private playMergeEffect(node: Node) {
    tween(node)
      .to(0.1, { scale: new Vec3(1.3, 1.3, 1) })
      .to(0.1, { scale: new Vec3(1, 1, 1) })
      .start();
  }

  private playMergeParticle(col: number, row: number) {
    const cols = this._merge.gridCols;
    const rows = this._merge.gridRows;
    const startX = -(cols - 1) * (GRID_CELL_SIZE / 2);
    const startY = -(rows - 1) * (GRID_CELL_SIZE / 2);
    const x = startX + col * GRID_CELL_SIZE;
    const y = startY + row * GRID_CELL_SIZE;
    const particle = new Node('MergeParticle');
    const t = particle.addComponent(UITransform);
    t.setContentSize(40, 40);
    particle.setPosition(x, y, 0);
    particle.setScale(0.5, 0.5, 1);
    this.node.addChild(particle);
    tween(particle)
      .to(0.15, { scale: new Vec3(1.5, 1.5, 1) })
      .call(() => particle.removeFromParent())
      .start();
  }
}
