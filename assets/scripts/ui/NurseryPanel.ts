/**
 * NurseryPanel - 育儿所（完整可用版本）
 * 交互：点击“选择A/选择B” → 回到合并网格轻点宠物选择（Lv5+）
 * 点击“开始育种(免费)”或“开始育种(广告追加)” → 生成 24h 杂交蛋
 * 倒计时每秒刷新；完成后可“领取全部”
 *
 * 注：为了在不做复杂跨面板拖拽命中检测的前提下保证功能可用，
 * 这里采用“请求选择 → 在网格轻点选中”的交互。后续可替换为真正拖拽槽位。
 */

import { _decorator, Component, Node, Label, Button, tween, Vec3 } from 'cc';

const { ccclass, property } = _decorator;

@ccclass('NurseryPanel')
export class NurseryPanel extends Component {
  @property(Node)
  eggListContent: Node | null = null;

  @property(Label)
  slotLabel: Label | null = null;

  @property(Label)
  parentALabel: Label | null = null;

  @property(Label)
  parentBLabel: Label | null = null;

  @property(Label)
  countdownLabel: Label | null = null;

  @property(Button)
  pickAButton: Button | null = null;

  @property(Button)
  pickBButton: Button | null = null;

  @property(Button)
  startFreeButton: Button | null = null;

  @property(Button)
  startAdButton: Button | null = null;

  @property(Button)
  claimAllButton: Button | null = null;

  private _itemIdA: string | null = null;
  private _itemIdB: string | null = null;

  onEnable() {
    EventBus.on(EVENTS.PET_PICKED, this.onPetPicked, this);
    if (this.pickAButton) this.pickAButton.node.on(Button.EventType.CLICK, () => this.requestPick(0), this);
    if (this.pickBButton) this.pickBButton.node.on(Button.EventType.CLICK, () => this.requestPick(1), this);
    if (this.startFreeButton) this.startFreeButton.node.on(Button.EventType.CLICK, () => this.tryStart(false), this);
    if (this.startAdButton) this.startAdButton.node.on(Button.EventType.CLICK, () => this.tryStart(true), this);
    if (this.claimAllButton) this.claimAllButton.node.on(Button.EventType.CLICK, this.claimAllReady, this);
    this.schedule(this.refreshCountdown, 1);
    this.refresh();
  }

  onDisable() {
    EventBus.off(EVENTS.PET_PICKED, this.onPetPicked, this);
    this.unschedule(this.refreshCountdown);
  }

  refresh() {
    const b = BreedingManager.instance;
    const eggs = b.getEggs();
    if (this.slotLabel) {
      this.slotLabel.string = `孵化位 ${eggs.length}/${b.getNurserySlots()}`;
    }
    if (this.parentALabel) this.parentALabel.string = this._itemIdA ? `A 已选：${this._itemIdA}` : 'A：未选择（点按钮后去网格轻点宠物）';
    if (this.parentBLabel) this.parentBLabel.string = this._itemIdB ? `B 已选：${this._itemIdB}` : 'B：未选择（点按钮后去网格轻点宠物）';
    this.refreshCountdown();
  }

  private requestPick(slot: 0 | 1) {
    EventBus.emit(EVENTS.REQUEST_PICK_PET, { slot });
    EventBus.emit(EVENTS.NOTIFY, { msg: slot === 0 ? '请选择父母A：回到网格轻点一只 Lv5+ 宠物' : '请选择父母B：回到网格轻点一只 Lv5+ 宠物' });
  }

  private onPetPicked(payload: any) {
    const slot = payload?.slot as 0 | 1;
    const itemId = payload?.itemId as string;
    if (!itemId) return;
    if (slot === 0) this._itemIdA = itemId;
    else this._itemIdB = itemId;
    this.refresh();
  }

  private async tryStart(useAdExtra: boolean) {
    if (!this._itemIdA || !this._itemIdB) {
      EventBus.emit(EVENTS.NOTIFY, { msg: '请先选择父母A与B' });
      return;
    }
    const can = BreedingManager.instance.canStartBreeding(useAdExtra);
    if (!can.ok) {
      EventBus.emit(EVENTS.NOTIFY, { msg: can.reason || '今日育种次数已用完' });
      return;
    }
    if (useAdExtra) {
      const ok = await AdMockManager.instance.watchRewarded('breeding_extra');
      if (!ok) return;
      SaveManager.instance.data.adWatchCount++;
      SaveManager.instance.save();
    }
    const egg = BreedingManager.instance.startBreeding(this._itemIdA, this._itemIdB, useAdExtra);
    if (!egg) {
      EventBus.emit(EVENTS.NOTIFY, { msg: '育种失败：需要两只 Lv5+ 且组合支持（猫/狗/兔）' });
      return;
    }
    this._itemIdA = null;
    this._itemIdB = null;
    AudioManager.instance.playBreedSuccess();
    this.playHeartAnimation();
    EventBus.emit(EVENTS.NOTIFY, { msg: '育种开始！完成后可在育儿所领取杂交宠物' });
    this.refresh();
  }

  private playHeartAnimation() {
    for (let i = 0; i < 3; i++) {
      const heart = new Node('Heart');
      heart.setScale(0.3, 0.3, 1);
      heart.setPosition(Math.random() * 100 - 50, Math.random() * 80 - 40, 0);
      this.node.addChild(heart);
      tween(heart)
        .delay(i * 0.1)
        .to(0.3, { scale: new Vec3(1.2, 1.2, 1) })
        .to(0.2, { scale: new Vec3(0, 0, 1) })
        .call(() => heart.removeFromParent())
        .start();
    }
  }

  /** 领取所有可领取的蛋 */
  claimAllReady() {
    const ready = BreedingManager.instance.getReadyEggs();
    if (!ready.length) {
      EventBus.emit(EVENTS.NOTIFY, { msg: '暂无可领取的蛋' });
      return;
    }
    ready.forEach(e => BreedingManager.instance.claimEgg(e.id));
    EventBus.emit(EVENTS.NOTIFY, { msg: `已领取 ${ready.length} 个杂交蛋` });
    this.refresh();
  }

  private refreshCountdown() {
    const eggs = BreedingManager.instance.getEggs();
    if (!this.countdownLabel) return;
    if (!eggs.length) {
      this.countdownLabel.string = '暂无孵化';
      return;
    }
    const soonest = [...eggs].sort((a, b) => BreedingManager.instance.getRemainingMs(a) - BreedingManager.instance.getRemainingMs(b))[0];
    const ms = BreedingManager.instance.getRemainingMs(soonest);
    if (ms <= 0) {
      this.countdownLabel.string = '有蛋可领取！';
      return;
    }
    const sec = Math.floor(ms / 1000);
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    this.countdownLabel.string = `最近孵化: ${h}h ${m}m ${s}s`;
  }
}
