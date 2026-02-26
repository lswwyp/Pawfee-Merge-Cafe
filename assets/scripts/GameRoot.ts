/**
 * GameRoot - 主场景入口
 * 加载资源 → 初始化管理器 → 离线弹窗 → 主循环
 */

import { _decorator, Component, Node, director, Canvas } from 'cc';
import { SaveManager } from './managers/SaveManager';
import { IdleManager } from './managers/IdleManager';
import { EconomyManager } from './managers/EconomyManager';
import { MergeManager } from './managers/MergeManager';
import { TaskManager } from './managers/TaskManager';
import { WeatherSystem } from './managers/WeatherSystem';
import { GuildManager } from './managers/GuildManager';
import { UIManager } from './ui/UIManager';
import { ResourceLoader } from './managers/ResourceLoader';
import { DESIGN_WIDTH, DESIGN_HEIGHT } from './config/GameConfig';

const { ccclass, property } = _decorator;

@ccclass('GameRoot')
export class GameRoot extends Component {
  @property(Node)
  loadingRoot: Node | null = null;

  @property(Node)
  uiRoot: Node | null = null;

  @property(Node)
  mergeGridRoot: Node | null = null;

  private _ui: UIManager | null = null;
  private _ready = false;

  async onLoad() {
    director.addPersistRootNode(this.node);
    if (this.loadingRoot) this.loadingRoot.active = true;
    await ResourceLoader.loadAll((p, msg) => {});
    if (this.loadingRoot) this.loadingRoot.active = false;
    this.initManagers();
    this.setupCanvas();
    if (this.uiRoot) {
      this._ui = this.uiRoot.getComponent(UIManager) || this.uiRoot.addComponent(UIManager);
      this._ui.init(this);
    }
    this.checkNewDay();
    this.checkOfflineEarnings();
    this._ready = true;
  }

  private initManagers() {
    SaveManager.instance.load();
    MergeManager.instance.buildGridFromSave();
    TaskManager.instance.ensureDailyTasks();
    EconomyManager.instance.recomputeEnergy();
    WeatherSystem.instance.getTodayWeather();
    GuildManager.instance.getGuild();
  }

  private setupCanvas() {
    const canvas = this.node.getComponent(Canvas) || this.node.getComponentInChildren(Canvas);
    if (canvas && canvas.designResolution) {
      canvas.designResolution.width = DESIGN_WIDTH;
      canvas.designResolution.height = DESIGN_HEIGHT;
    }
  }

  /** 跨天：重置公会每日、暴风Boss、增加 totalPlayDays */
  private checkNewDay() {
    const today = new Date().toISOString().slice(0, 10);
    const last = SaveManager.instance.data.dailyTaskResetDate;
    if (last && last !== today) {
      SaveManager.instance.data.totalPlayDays = (SaveManager.instance.data.totalPlayDays || 1) + 1;
      SaveManager.instance.data.miniGamePlayedToday = {};
      SaveManager.instance.data.weather = null;
      GuildManager.instance.resetDailyGift();
      WeatherSystem.instance.resetStormBossIfNewDay();
      SaveManager.instance.save();
    }
  }

  private checkOfflineEarnings() {
    const idle = IdleManager.instance;
    const { coins, diamonds, hours } = idle.computeOfflineEarnings();
    if (hours > 0.01 && (coins > 0 || diamonds > 0)) {
      this._ui?.showOfflinePopup(coins, diamonds, hours);
    }
    const n = GuildManager.instance.getPendingGiftEggs();
    if (n > 0) {
      this._ui?.showToast?.('您有 ' + n + ' 个好友赠送的蛋，请到公会领取');
    }
  }

  update(dt: number) {
    if (!this._ready) return;
    MergeManager.instance.update(dt);
    const result = IdleManager.instance.tick(dt);
    if (result.coins > 0 || result.customers > 0) {
      this._ui?.refreshIdleStats(result.coins, result.customers);
    }
  }

  onDestroy() {
    SaveManager.instance.setLogoutTime();
  }

  getUIManager(): UIManager | null {
    return this._ui;
  }
}
