/**
 * PetTrainingRhythm - 节奏小游戏：在正确时机点击
 * 使用 Cocos 输入事件，条带移动，命中区间得分
 */

import { _decorator, Component, Node, Label, Button, UITransform, Vec2 } from 'cc';
import { EconomyManager } from '../managers/EconomyManager';
import type { MiniGameController } from './MiniGameController';

const { ccclass, property } = _decorator;

const HIT_ZONE_WIDTH = 80;   // 命中区宽度（像素）
const BELT_SPEED = 200;      // 条带移动速度
const TOTAL_TIME = 60;       // 游戏时长秒
const REWARD_PER_HIT = 50;

@ccclass('PetTrainingRhythm')
export class PetTrainingRhythm extends Component {
  @property(Node)
  hitZone: Node | null = null;

  @property(Node)
  movingBar: Node | null = null;

  @property(Label)
  scoreLabel: Label | null = null;

  @property(Label)
  timeLabel: Label | null = null;

  @property(Button)
  tapButton: Button | null = null;

  private _score = 0;
  private _timeLeft = TOTAL_TIME;
  private _beltOffset = 0;
  private _running = false;
  private _controller: MiniGameController | null = null;

  onLoad() {
    if (this.tapButton) {
      this.tapButton.node.on(Button.EventType.CLICK, this.onTap, this);
    }
  }

  setController(c: MiniGameController) {
    this._controller = c;
  }

  startGame() {
    this._score = 0;
    this._timeLeft = TOTAL_TIME;
    this._beltOffset = 0;
    this._running = true;
    this.refreshUI();
  }

  update(dt: number) {
    if (!this._running) return;
    this._timeLeft -= dt;
    this._beltOffset += BELT_SPEED * dt;
    const maxOffset = 400;
    if (this._beltOffset > maxOffset) this._beltOffset = 0;
    if (this.movingBar) {
      this.movingBar.setPosition(this._beltOffset - maxOffset / 2, this.movingBar.position.y, 0);
    }
    if (this._timeLeft <= 0) {
      this._running = false;
      this.onGameEnd();
    }
    this.refreshUI();
  }

  private refreshUI() {
    if (this.scoreLabel) this.scoreLabel.string = String(this._score);
    if (this.timeLabel) this.timeLabel.string = Math.ceil(this._timeLeft) + 's';
  }

  private onTap() {
    if (!this._running || !this.movingBar || !this.hitZone) return;
    const barPos = this.movingBar.position.x;
    const zonePos = this.hitZone.position.x;
    const dist = Math.abs(barPos - zonePos);
    if (dist <= HIT_ZONE_WIDTH / 2) {
      this._score++;
    }
  }

  private onGameEnd() {
    EconomyManager.instance.addCoins(this._score * REWARD_PER_HIT, 'minigame');
    if (this._controller) this._controller.setPlayedToday('rhythm');
    this._controller?.close();
  }
}
