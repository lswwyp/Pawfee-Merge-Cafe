/**
 * SpawnButton - 花费金币生成一个 Lv1 宠物到网格
 */

import { _decorator, Component, Button, Label } from 'cc';
import { MergeManager } from '../managers/MergeManager';
import { EconomyManager } from '../managers/EconomyManager';
import { SaveManager } from '../managers/SaveManager';
import { AudioManager } from '../managers/AudioManager';

const { ccclass, property } = _decorator;

const SPAWN_COST = 100;

@ccclass('SpawnButton')
export class SpawnButton extends Component {
  @property(Label)
  costLabel: Label | null = null;

  onLoad() {
    if (this.costLabel) this.costLabel.string = String(SPAWN_COST);
    const btn = this.getComponent(Button);
    if (btn) this.node.on(Button.EventType.CLICK, this.onClick, this);
  }

  private onClick() {
    if (EconomyManager.instance.coins < SPAWN_COST) return;
    if (MergeManager.instance.isGridFull()) return;
    EconomyManager.instance.spendCoins(SPAWN_COST);
    const item = MergeManager.instance.createStarterPet();
    const pos = MergeManager.instance.findEmptyCell();
    if (pos) {
      MergeManager.instance.placeItem(item, pos.x, pos.y);
      SaveManager.instance.save();
    }
    AudioManager.instance.playCoin();
  }
}
