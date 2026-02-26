/**
 * UIManager - 主界面：货币栏、离线弹窗、Tab、天气、红点、调试控制台
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { EconomyManager } from '../managers/EconomyManager';
import { IdleManager } from '../managers/IdleManager';
import { TaskManager } from '../managers/TaskManager';
import { SaveManager } from '../managers/SaveManager';
import { WeatherSystem } from '../managers/WeatherSystem';
import { GuildManager } from '../managers/GuildManager';
import type { GameRoot } from '../GameRoot';
import type { TabBar } from './TabBar';
import { EventBus, EVENTS } from '../core/EventBus';
import { AdMockManager } from '../managers/AdMockManager';

const { ccclass, property } = _decorator;

@ccclass('UIManager')
export class UIManager extends Component {
  @property(Label)
  coinLabel: Label | null = null;

  @property(Label)
  diamondLabel: Label | null = null;

  @property(Label)
  energyLabel: Label | null = null;

  @property(Label)
  starLabel: Label | null = null;

  @property(Label)
  idleEarnLabel: Label | null = null;

  @property(Label)
  weatherLabel: Label | null = null;

  @property(Node)
  offlinePopup: Node | null = null;

  @property(Label)
  offlineCoinsLabel: Label | null = null;

  @property(Label)
  offlineDiamondsLabel: Label | null = null;

  @property(Button)
  offlineClaimBtn: Button | null = null;

  @property(Button)
  offlineDoubleBtn: Button | null = null;

  @property(Node)
  taskRedDot: Node | null = null;

  @property(Label)
  versionLabel: Label | null = null;

  @property(Node)
  debugConsole: Node | null = null;

  @property(Node)
  toastRoot: Node | null = null;

  @property(Label)
  toastLabel: Label | null = null;

  private _gameRoot: GameRoot | null = null;
  private _versionTapCount = 0;
  private _versionTapTimer = 0;
  private _toastTimer = 0;

  init(root: GameRoot) {
    this._gameRoot = root;
    this.refreshCurrency();
    this.refreshWeather();
    if (this.offlinePopup) this.offlinePopup.active = false;
    if (this.offlineClaimBtn) {
      this.offlineClaimBtn.node.on(Button.EventType.CLICK, this.onClaimOffline, this);
    }
    if (this.offlineDoubleBtn) {
      this.offlineDoubleBtn.node.on(Button.EventType.CLICK, this.onClaimOfflineDouble, this);
    }
    if (this.versionLabel) {
      this.versionLabel.node.on(Node.EventType.TOUCH_END, this.onVersionTap, this);
    }
    if (this.debugConsole) this.debugConsole.active = false;
    if (this.toastRoot) this.toastRoot.active = false;
    EventBus.on(EVENTS.NOTIFY, (p: any) => this.showToast(p?.msg || ''), this);
    this.refreshTaskRedDot();
  }

  private onVersionTap() {
    this._versionTapCount++;
    this._versionTapTimer = 2;
    if (this._versionTapCount >= 5) {
      this._versionTapCount = 0;
      this.toggleDebugConsole();
    }
  }

  update(dt: number) {
    if (this._versionTapTimer > 0) {
      this._versionTapTimer -= dt;
      if (this._versionTapTimer <= 0) this._versionTapCount = 0;
    }
    if (this._toastTimer > 0) {
      this._toastTimer -= dt;
      if (this._toastTimer <= 0 && this.toastRoot) this.toastRoot.active = false;
    }
  }

  toggleDebugConsole() {
    if (this.debugConsole) this.debugConsole.active = !this.debugConsole.active;
  }

  refreshCurrency() {
    const eco = EconomyManager.instance;
    if (this.coinLabel) this.coinLabel.string = this.formatNum(eco.coins);
    if (this.diamondLabel) this.diamondLabel.string = String(eco.diamonds);
    if (this.energyLabel) this.energyLabel.string = String(Math.floor(eco.energy));
    if (this.starLabel) this.starLabel.string = '★' + (SaveManager.instance.data.currency?.stars ?? 0);
  }

  refreshWeather() {
    const w = WeatherSystem.instance.getWeatherType();
    const nameMap: Record<string, string> = { sunny: '晴 +20%客', rain: '雨 室内+15%', storm: '暴风雨 稀有+' };
    if (this.weatherLabel) this.weatherLabel.string = nameMap[w] || w;
  }

  refreshIdleStats(coins: number, customers: number) {
    this.refreshCurrency();
    if (this.idleEarnLabel) {
      this.idleEarnLabel.string = `+${this.formatNum(coins)} / ${customers} 客`;
    }
  }

  showOfflinePopup(coins: number, diamonds: number, hours: number) {
    if (this.offlineCoinsLabel) this.offlineCoinsLabel.string = this.formatNum(coins);
    if (this.offlineDiamondsLabel) this.offlineDiamondsLabel.string = String(diamonds);
    if (this.offlinePopup) this.offlinePopup.active = true;
  }

  private onClaimOffline() {
    IdleManager.instance.claimOfflineEarnings(false);
    if (this.offlinePopup) this.offlinePopup.active = false;
    this.refreshCurrency();
  }

  private onClaimOfflineDouble() {
    this.watchAdThen(() => {
      IdleManager.instance.claimOfflineEarnings(true);
      if (this.offlinePopup) this.offlinePopup.active = false;
      this.refreshCurrency();
      this.showToast('离线收益已双倍领取！');
    }, 'offline_double');
  }

  refreshTaskRedDot() {
    if (this.taskRedDot) {
      this.taskRedDot.active = TaskManager.instance.unfinishedCount() > 0;
    }
  }

  private formatNum(n: number): string {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
    if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
    return String(Math.floor(n));
  }

  showToast(msg: string) {
    if (!msg) return;
    if (this.toastLabel) this.toastLabel.string = msg;
    if (this.toastRoot) this.toastRoot.active = true;
    this._toastTimer = 2;
  }

  private async watchAdThen(onReward: () => void, reason: string) {
    const ok = await AdMockManager.instance.watchRewarded(reason, (sec) => {
      this.showToast(sec > 0 ? `广告中...${sec}s` : '发放奖励');
    });
    if (!ok) {
      this.showToast('广告播放中，请稍后再试');
      return;
    }
    SaveManager.instance.data.adWatchCount++;
    SaveManager.instance.save();
    onReward();
  }
}
