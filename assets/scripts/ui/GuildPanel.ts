/**
 * GuildPanel - 公会/社交 Tab 内容
 * 每日奖励、协作进度、领取协作蛋、赠送蛋、领取收件箱赠送蛋
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { GuildManager } from '../managers/GuildManager';
import { EventBus, EVENTS } from '../core/EventBus';

const { ccclass, property } = _decorator;

@ccclass('GuildPanel')
export class GuildPanel extends Component {
  @property(Label)
  coopLabel: Label | null = null;

  @property(Label)
  inboxLabel: Label | null = null;

  @property(Button)
  claimDailyBtn: Button | null = null;

  @property(Button)
  claimCoopBtn: Button | null = null;

  @property(Button)
  sendGiftBtn: Button | null = null;

  @property(Button)
  claimInboxBtn: Button | null = null;

  onLoad() {
    if (this.claimDailyBtn) this.claimDailyBtn.node.on(Button.EventType.CLICK, this.claimDaily, this);
    if (this.claimCoopBtn) this.claimCoopBtn.node.on(Button.EventType.CLICK, this.claimCoop, this);
    if (this.sendGiftBtn) this.sendGiftBtn.node.on(Button.EventType.CLICK, this.sendGift, this);
    if (this.claimInboxBtn) this.claimInboxBtn.node.on(Button.EventType.CLICK, this.claimInbox, this);
  }

  onEnable() {
    this.refresh();
  }

  refresh() {
    const g = GuildManager.instance;
    const { progress, goal } = g.getCoopProgress();
    if (this.coopLabel) this.coopLabel.string = `协作合并 ${progress}/${goal}`;
    const inbox = g.getPendingGiftEggs();
    if (this.inboxLabel) this.inboxLabel.string = inbox > 0 ? `收件箱 ${inbox} 个蛋` : '收件箱空';
    if (this.claimDailyBtn) this.claimDailyBtn.node.active = !g.hasClaimedGuildDaily();
    if (this.claimCoopBtn) this.claimCoopBtn.node.active = g.canClaimCoopEgg();
    if (this.sendGiftBtn) this.sendGiftBtn.interactable = g.canSendGiftEgg();
    if (this.claimInboxBtn) this.claimInboxBtn.node.active = inbox > 0;
  }

  private claimDaily() {
    if (GuildManager.instance.claimGuildDaily()) {
      EventBus.emit(EVENTS.NOTIFY, { msg: '已领取公会每日奖励' });
      this.refresh();
    }
  }

  private claimCoop() {
    if (GuildManager.instance.claimCoopEgg()) {
      EventBus.emit(EVENTS.NOTIFY, { msg: '已领取公会协作蛋' });
      this.refresh();
    }
  }

  private sendGift() {
    if (GuildManager.instance.sendGiftEgg()) {
      EventBus.emit(EVENTS.NOTIFY, { msg: '已赠送蛋给好友，对方下次登录可领取' });
      this.refresh();
    }
  }

  private claimInbox() {
    const n = GuildManager.instance.claimPendingGiftEggsToGrid();
    EventBus.emit(EVENTS.NOTIFY, { msg: n > 0 ? `已领取 ${n} 个赠送蛋到网格` : '网格已满，无法领取' });
    this.refresh();
  }
}
