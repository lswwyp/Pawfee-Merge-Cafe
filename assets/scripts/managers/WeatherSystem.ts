/**
 * WeatherSystem - 每日随机天气，影响顾客/收益/稀有掉落
 * 使用日期种子保证同一天一致
 */

import { SaveManager } from './SaveManager';
import {
  WEATHER_SUNNY_CUSTOMER_BONUS,
  WEATHER_RAIN_INDOOR_BONUS,
  WEATHER_STORM_RARE_DROP_BONUS,
  STORM_BOSS_GOAL,
} from '../config/GameConfig';
import type { WeatherState } from '../data/SaveData';

export type WeatherType = 'sunny' | 'rain' | 'storm';

export class WeatherSystem {
  private static _instance: WeatherSystem;

  static get instance(): WeatherSystem {
    if (!WeatherSystem._instance) {
      WeatherSystem._instance = new WeatherSystem();
    }
    return WeatherSystem._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  /** 暴风 Boss：是否当日暴风且未领奖 */
  isStormBossActive(): boolean {
    const w = this.getTodayWeather();
    if (w.type !== 'storm') return false;
    const today = new Date().toISOString().slice(0, 10);
    return this.data.stormBossClaimedDate !== today;
  }

  /** 暴风 Boss 进度（合并数） */
  getStormBossProgress(): { progress: number; goal: number } {
    const goal = this.data.stormBossGoal ?? STORM_BOSS_GOAL;
    return { progress: this.data.stormBossProgress ?? 0, goal };
  }

  /** 暴风日：每次合并 +1 进度 */
  addStormBossProgress(count: number): void {
    if (this.getTodayWeather().type !== 'storm') return;
    const today = new Date().toISOString().slice(0, 10);
    if (this.data.stormBossClaimedDate === today) return;
    this.data.stormBossProgress = Math.min(
      this.data.stormBossGoal ?? STORM_BOSS_GOAL,
      (this.data.stormBossProgress ?? 0) + count
    );
    SaveManager.instance.save();
  }

  /** 领取暴风 Boss 奖励（钻石+金币） */
  claimStormBossReward(): boolean {
    const { progress, goal } = this.getStormBossProgress();
    if (progress < goal || !this.isStormBossActive()) return false;
    const today = new Date().toISOString().slice(0, 10);
    this.data.stormBossClaimedDate = today;
    SaveManager.instance.save();
    return true;
  }

  /** 跨天重置暴风进度 */
  resetStormBossIfNewDay(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (this.data.weather?.date !== today) {
      this.data.stormBossProgress = 0;
      this.data.stormBossClaimedDate = null;
      SaveManager.instance.save();
    }
  }

  /** 获取当日天气（按日期种子） */
  getTodayWeather(): WeatherState {
    const today = new Date().toISOString().slice(0, 10);
    if (this.data.weather?.date === today) {
      return this.data.weather;
    }
    const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const r = (seed * 9301 + 49297) % 233280;
    const normalized = r / 233280;
    let type: WeatherType = 'sunny';
    if (normalized < 0.5) type = 'sunny';
    else if (normalized < 0.85) type = 'rain';
    else type = 'storm';
    const state: WeatherState = { date: today, type, seed: r };
    this.data.weather = state;
    SaveManager.instance.save();
    return state;
  }

  /** 顾客数量倍率 */
  getCustomerMultiplier(): number {
    const w = this.getTodayWeather();
    if (w.type === 'sunny') return WEATHER_SUNNY_CUSTOMER_BONUS;
    if (w.type === 'rain') return WEATHER_RAIN_INDOOR_BONUS;
    return 0.9; // storm 略减顾客，但稀有掉落高
  }

  /** 稀有掉落（钻石等）倍率 */
  getRareDropMultiplier(): number {
    const w = this.getTodayWeather();
    if (w.type === 'storm') return WEATHER_STORM_RARE_DROP_BONUS;
    return 1;
  }

  getWeatherType(): WeatherType {
    return this.getTodayWeather().type;
  }

  /** 用于 UI 显示 */
  getWeatherNameKey(): string {
    const t = this.getTodayWeather().type;
    if (t === 'sunny') return 'weather_sunny';
    if (t === 'rain') return 'weather_rain';
    return 'weather_storm';
  }
}
