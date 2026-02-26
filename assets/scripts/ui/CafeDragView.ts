/**
 * CafeDragView - 咖啡厅内家具拖放
 * 使用 Cocos 触摸事件实现拖拽，位置写入 FurnitureManager
 */

import { _decorator, Component, Node, EventTouch, UITransform, Vec2 } from 'cc';
import { FurnitureManager } from '../managers/FurnitureManager';
import type { PlacedFurnitureData } from '../data/SaveData';

const { ccclass, property } = _decorator;

@ccclass('CafeDragView')
export class CafeDragView extends Component {
  @property(Node)
  furnitureRoot: Node | null = null;

  private _dragging: { node: Node; data: PlacedFurnitureData; startPos: Vec2 } | null = null;

  onLoad() {
    this.syncPlaced();
  }

  syncPlaced() {
    const placed = FurnitureManager.instance.getPlaced();
    const root = this.furnitureRoot || this.node;
    root.removeAllChildren();
    placed.forEach(p => {
      const n = this.createFurnitureNode(p);
      root.addChild(n);
    });
  }

  private createFurnitureNode(data: PlacedFurnitureData): Node {
    const node = new Node('Furn_' + data.id);
    const ui = node.addComponent(UITransform);
    ui.setContentSize(60, 60);
    node.setPosition(data.x, data.y, 0);
    (node as any)._placedData = data;
    node.on(Node.EventType.TOUCH_START, (e: EventTouch) => this.onTouchStart(e, node), this);
    node.on(Node.EventType.TOUCH_MOVE, (e: EventTouch) => this.onTouchMove(e, node), this);
    node.on(Node.EventType.TOUCH_END, () => this.onTouchEnd(node), this);
    return node;
  }

  private onTouchStart(e: EventTouch, node: Node) {
    const data = (node as any)._placedData as PlacedFurnitureData;
    if (!data) return;
    const pos = e.getUILocation();
    this._dragging = { node, data, startPos: new Vec2(node.position.x, node.position.y) };
  }

  private onTouchMove(e: EventTouch, node: Node) {
    if (!this._dragging || this._dragging.node !== node) return;
    const delta = e.getUIDelta();
    node.setPosition(node.position.x + delta.x, node.position.y + delta.y, 0);
  }

  private onTouchEnd(node: Node) {
    if (!this._dragging || this._dragging.node !== node) return;
    FurnitureManager.instance.move(this._dragging.data.id, node.position.x, node.position.y);
    this._dragging = null;
  }
}
