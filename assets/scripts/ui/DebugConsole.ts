/**
 * DebugConsole - 调试：生成物品、重置存档、跳级
 * 由 UIManager 通过“版本号点击 5 次”打开
 */

import { _decorator, Component, Button, Label } from 'cc';
import { SaveManager } from '../managers/SaveManager';
import { MergeManager } from '../managers/MergeManager';
import { EconomyManager } from '../managers/EconomyManager';
import { BreedingManager } from '../managers/BreedingManager';
import { WeatherSystem } from '../managers/WeatherSystem';
import { IdleManager } from '../managers/IdleManager';

const { ccclass, property } = _decorator;

@ccclass('DebugConsole')
export class DebugConsole extends Component {
  @property(Button)
  btnSpawnPet: Button | null = null;

  @property(Button)
  btnAddCoins: Button | null = null;

  @property(Button)
  btnResetSave: Button | null = null;

  @property(Button)
  btnFastForwardDay: Button | null = null;

  @property(Button)
  btnFastForwardBreeding: Button | null = null;

  @property(Label)
  logLabel: Label | null = null;

  @property(Button)
  btnSim30Days: Button | null = null;

  onLoad() {
    if (this.btnSpawnPet) this.btnSpawnPet.node.on(Button.EventType.CLICK, this.spawnPet, this);
    if (this.btnAddCoins) this.btnAddCoins.node.on(Button.EventType.CLICK, this.addCoins, this);
    if (this.btnResetSave) this.btnResetSave.node.on(Button.EventType.CLICK, this.resetSave, this);
    if (this.btnFastForwardDay) this.btnFastForwardDay.node.on(Button.EventType.CLICK, this.fastForwardDay, this);
    if (this.btnFastForwardBreeding) this.btnFastForwardBreeding.node.on(Button.EventType.CLICK, this.fastForwardBreeding, this);
    if (this.btnSim30Days) this.btnSim30Days.node.on(Button.EventType.CLICK, this.sim30Days, this);
  }

  private spawnPet() {
    if (MergeManager.instance.isGridFull()) return;
    const item = MergeManager.instance.createStarterPet();
    const pos = MergeManager.instance.findEmptyCell();
    if (pos) MergeManager.instance.placeItem(item, pos.x, pos.y);
    SaveManager.instance.save();
  }

  private addCoins() {
    EconomyManager.instance.addCoins(10000, 'debug');
  }

  private resetSave() {
    SaveManager.instance.reset();
    MergeManager.instance.buildGridFromSave();
    this.log('已重置存档');
  }

  /** 模拟跨天：推进 totalPlayDays、重置天气/小游戏/育种免费次数 */
  private fastForwardDay() {
    const d = SaveManager.instance.data;
    d.totalPlayDays = (d.totalPlayDays || 1) + 1;
    d.miniGamePlayedToday = {};
    // 强制刷新天气为“新一天”（仅调试）：清空 weather，下一次获取会重新生成
    d.weather = null;
    // 重置育种每日免费
    (d as any).breedingDaily = null;
    SaveManager.instance.save();
    const w = WeatherSystem.instance.getWeatherType();
    this.log(`快进 1 天：Day=${d.totalPlayDays} 天气=${w}`);
  }

  /** 快进育种：将所有蛋时间调整为可领取 */
  private fastForwardBreeding() {
    const eggs = BreedingManager.instance.getEggs();
    eggs.forEach(e => (e.startTime = Date.now() - e.durationMs - 1));
    SaveManager.instance.save();
    this.log(`育种快进：可领取 ${BreedingManager.instance.getReadyEggs().length} 个蛋`);
  }

  private log(msg: string) {
    if (this.logLabel) this.logLabel.string = msg;
    console.log('[Debug]', msg);
  }

  /** 模拟 30 天收益（仅用当前宠物/等级 × 日成长公式，输出到 log 与 console） */
  private sim30Days() {
    const back = SaveManager.instance.data.totalPlayDays;
    const lines: string[] = [];
    for (let day = 1; day <= 30; day++) {
      SaveManager.instance.data.totalPlayDays = day;
      const r = IdleManager.instance.getHourlyRate();
      const dailyCoins = r.coins * 24;
      lines.push(`Day${day}: ~${Math.floor(dailyCoins)} 金币/天`);
    }
    SaveManager.instance.data.totalPlayDays = back;
    SaveManager.instance.save();
    const msg = '30日模拟(当前宠物): ' + lines.slice(0, 5).join(' ') + ' ...';
    this.log(msg);
    console.log('[Debug] 30-day sim:', lines);
  }
}
