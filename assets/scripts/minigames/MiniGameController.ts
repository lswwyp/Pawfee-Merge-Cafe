/**
 * MiniGameController - 小游戏入口与模式切换
 * 节奏游戏：点击时机；顾客潮：限时快速合并
 */

import { _decorator, Component, Node } from 'cc';
import { SaveManager } from '../managers/SaveManager';

const { ccclass, property } = _decorator;

export type MiniGameMode = 'rhythm' | 'rush' | 'none';

@ccclass('MiniGameController')
export class MiniGameController extends Component {
  @property(Node)
  rhythmPanel: Node | null = null;

  @property(Node)
  rushPanel: Node | null = null;

  private _mode: MiniGameMode = 'none';

  onLoad() {
    if (this.rhythmPanel) this.rhythmPanel.active = false;
    if (this.rushPanel) this.rushPanel.active = false;
  }

  open(mode: 'rhythm' | 'rush') {
    this._mode = mode;
    if (this.rhythmPanel) this.rhythmPanel.active = mode === 'rhythm';
    if (this.rushPanel) this.rushPanel.active = mode === 'rush';
  }

  close() {
    this._mode = 'none';
    if (this.rhythmPanel) this.rhythmPanel.active = false;
    if (this.rushPanel) this.rushPanel.active = false;
  }

  /** 今日是否已玩过该小游戏 */
  hasPlayedToday(mode: 'rhythm' | 'rush'): boolean {
    const d = SaveManager.instance.data.miniGamePlayedToday;
    return !!(mode === 'rhythm' ? d?.rhythm : d?.rush);
  }

  setPlayedToday(mode: 'rhythm' | 'rush') {
    const d = SaveManager.instance.data.miniGamePlayedToday;
    if (!d) SaveManager.instance.data.miniGamePlayedToday = {};
    if (mode === 'rhythm') (SaveManager.instance.data.miniGamePlayedToday as any).rhythm = true;
    else (SaveManager.instance.data.miniGamePlayedToday as any).rush = true;
    SaveManager.instance.save();
  }
}
