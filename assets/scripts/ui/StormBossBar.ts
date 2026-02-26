/**
 * StormBossBar - 暴风 Boss 事件进度条与领取按钮
 * 仅暴风日显示；合并满 goal 后可领取奖励
 */

import { _decorator, Component, Node, Label, Button, Sprite, UITransform } from 'cc';
import { WeatherSystem } from '../managers/WeatherSystem';
import { EconomyManager } from '../managers/EconomyManager';
import { EventBus, EVENTS } from '../core/EventBus';

const { ccclass, property } = _decorator;

const REWARD_COINS = 500;
const REWARD_DIAMONDS = 5;

@ccclass('StormBossBar')
export class StormBossBar extends Component {
  @property(Node)
  root: Node | null = null;

  @property(Label)
  progressLabel: Label | null = null;

  @property(Node)
  progressBarFill: Node | null = null;

  @property(Button)
  claimButton: Button | null = null;

  onLoad() {
    if (this.claimButton) {
      this.claimButton.node.on(Button.EventType.CLICK, this.claim, this);
    }
  }

  onEnable() {
    this.schedule(this.refresh, 0.5);
    this.refresh();
  }

  onDisable() {
    this.unschedule(this.refresh);
  }

  refresh() {
    const active = WeatherSystem.instance.isStormBossActive();
    if (this.root) this.root.active = active;
    if (!active) return;
    const { progress, goal } = WeatherSystem.instance.getStormBossProgress();
    if (this.progressLabel) this.progressLabel.string = `暴风Boss ${progress}/${goal} 合并`;
    if (this.progressBarFill) {
      const ui = this.progressBarFill.getComponent(UITransform);
      if (ui) ui.setContentSize(Math.max(0, (progress / goal) * 200), ui.contentSize.height);
    }
    if (this.claimButton) {
      this.claimButton.node.active = progress >= goal;
    }
  }

  private claim() {
    if (!WeatherSystem.instance.claimStormBossReward()) return;
    EconomyManager.instance.addCoins(REWARD_COINS, 'storm_boss');
    EconomyManager.instance.addDiamonds(REWARD_DIAMONDS);
    EventBus.emit(EVENTS.NOTIFY, { msg: `暴风Boss奖励：${REWARD_COINS} 金币 + ${REWARD_DIAMONDS} 钻石` });
    this.refresh();
  }
}
