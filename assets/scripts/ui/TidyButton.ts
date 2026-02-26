/**
 * TidyButton - 整理网格（移除最低级物品腾出空位）
 */

import { _decorator, Component, Button } from 'cc';
import { MergeManager } from '../managers/MergeManager';
import { AudioManager } from '../managers/AudioManager';

const { ccclass, property } = _decorator;

@ccclass('TidyButton')
export class TidyButton extends Component {
  onLoad() {
    const btn = this.getComponent(Button);
    if (btn) {
      this.node.on(Button.EventType.CLICK, this.onClick, this);
    }
  }

  private onClick() {
    const ok = MergeManager.instance.tidy();
    if (ok) AudioManager.instance.playCoin();
  }
}
