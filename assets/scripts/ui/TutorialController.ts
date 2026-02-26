/**
 * TutorialController - 新手教程链式弹窗
 * 步骤：0=合并 1=收集 2=育儿所 3=天气 4=小游戏 5=Prestige 6=完成
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { SaveManager } from '../managers/SaveManager';
import { EventBus, EVENTS } from '../core/EventBus';

const { ccclass, property } = _decorator;

const STEPS: { msg: string; key: string }[] = [
  { msg: '拖动两个相同宠物合并升级！', key: 'merge' },
  { msg: '合并可获得金币，宠物会服务顾客赚取收益~', key: 'idle' },
  { msg: 'Lv5+ 宠物可在育儿所配对，孵化杂交蛋！', key: 'nursery' },
  { msg: '每日天气会影响顾客与稀有掉落，记得看右上角~', key: 'weather' },
  { msg: '任务与活动里可玩节奏/顾客潮小游戏，赢取奖励！', key: 'minigame' },
  { msg: '收集 80% 宠物后可 Prestige 重置，获得永久星币加成~', key: 'prestige' },
  { msg: '教程完成，享受萌宠咖啡吧！', key: 'done' },
];

@ccclass('TutorialController')
export class TutorialController extends Component {
  @property(Node)
  popupRoot: Node | null = null;

  @property(Label)
  messageLabel: Label | null = null;

  @property(Button)
  nextButton: Button | null = null;

  private _step = 0;

  onLoad() {
    if (this.nextButton) {
      this.nextButton.node.on(Button.EventType.CLICK, this.next, this);
    }
  }

  onEnable() {
    this._step = SaveManager.instance.data.tutorial?.step ?? 0;
    if (this._step >= STEPS.length) {
      if (this.popupRoot) this.popupRoot.active = false;
      return;
    }
    this.showStep(this._step);
  }

  private showStep(index: number) {
    if (index >= STEPS.length) {
      SaveManager.instance.data.tutorial = { step: index, completed: true, seenSteps: (1 << index) - 1 };
      SaveManager.instance.save();
      if (this.popupRoot) this.popupRoot.active = false;
      EventBus.emit(EVENTS.NOTIFY, { msg: '教程已全部完成！' });
      return;
    }
    if (this.popupRoot) this.popupRoot.active = true;
    if (this.messageLabel) this.messageLabel.string = STEPS[index].msg;
  }

  private next() {
    this._step++;
    SaveManager.instance.data.tutorial = {
      ...SaveManager.instance.data.tutorial,
      step: this._step,
      completed: this._step >= STEPS.length,
    };
    SaveManager.instance.save();
    this.showStep(this._step);
  }

  /** 外部调用：触发某步（若未见过则显示） */
  triggerStep(key: string) {
    const idx = STEPS.findIndex(s => s.key === key);
    if (idx < 0 || idx > this._step) return;
    if (idx === this._step && this.popupRoot && !this.popupRoot.active) {
      this.showStep(this._step);
    }
  }
}
