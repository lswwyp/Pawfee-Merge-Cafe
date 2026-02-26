/**
 * CustomerRush - 顾客潮小游戏：限时内完成 N 次合并
 * 临时网格模式，目标达成即奖励
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { MergeManager } from '../managers/MergeManager';
import { EconomyManager } from '../managers/EconomyManager';
import type { MiniGameController } from './MiniGameController';

const { ccclass, property } = _decorator;

const RUSH_DURATION = 90;  // 秒
const TARGET_MERGES = 15;
const REWARD_COINS = 2000;

@ccclass('CustomerRush')
export class CustomerRush extends Component {
  @property(Label)
  targetLabel: Label | null = null;

  @property(Label)
  progressLabel: Label | null = null;

  @property(Label)
  timeLabel: Label | null = null;

  private _startMerges = 0;
  private _timeLeft = RUSH_DURATION;
  private _running = false;
  private _controller: MiniGameController | null = null;

  onLoad() {}

  setController(c: MiniGameController) {
    this._controller = c;
  }

  startGame() {
    this._startMerges = MergeManager.instance.getTotalMerges();
    this._timeLeft = RUSH_DURATION;
    this._running = true;
    if (this.targetLabel) this.targetLabel.string = `目标: ${TARGET_MERGES} 次合并`;
  }

  update(dt: number) {
    if (!this._running) return;
    this._timeLeft -= dt;
    const current = MergeManager.instance.getTotalMerges();
    const done = current - this._startMerges;
    if (this.progressLabel) this.progressLabel.string = `${done}/${TARGET_MERGES}`;
    if (this.timeLabel) this.timeLabel.string = Math.ceil(this._timeLeft) + 's';
    if (done >= TARGET_MERGES || this._timeLeft <= 0) {
      this._running = false;
      if (done >= TARGET_MERGES) {
        EconomyManager.instance.addCoins(REWARD_COINS, 'minigame');
      }
      this._controller?.setPlayedToday('rush');
      this._controller?.close();
    }
  }
}
