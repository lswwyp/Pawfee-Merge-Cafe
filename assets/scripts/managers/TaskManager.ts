/**
 * TaskManager - 每日任务、新手指引、成就
 */

import { SaveManager } from './SaveManager';
import { EconomyManager } from './EconomyManager';
import { DAILY_TASK_COUNT, STREAK_TASKS_FOR_EGG } from '../config/GameConfig';
import type { DailyTaskProgress } from '../data/SaveData';

export interface DailyTaskDef {
  taskId: string;
  nameKey: string;
  target: number;
  rewardCoins?: number;
  rewardDiamonds?: number;
  rewardEgg?: boolean;
}

/** 每日任务模板池 */
const DAILY_TASK_DEFS: DailyTaskDef[] = [
  { taskId: 'merge_5', nameKey: 'task_merge_5', target: 5, rewardCoins: 1000 },
  { taskId: 'merge_10', nameKey: 'task_merge_10', target: 10, rewardCoins: 2000 },
  { taskId: 'serve_50', nameKey: 'task_serve_50', target: 50, rewardCoins: 1500 },
  { taskId: 'serve_100', nameKey: 'task_serve_100', target: 100, rewardCoins: 3000 },
  { taskId: 'earn_10k', nameKey: 'task_earn_10k', target: 10000, rewardCoins: 500 },
  { taskId: 'chain_3', nameKey: 'task_chain_3', target: 3, rewardCoins: 800 },
  { taskId: 'chain_10', nameKey: 'task_chain_10', target: 10, rewardDiamonds: 5 },
  { taskId: 'visit_3', nameKey: 'task_visit_3', target: 3, rewardCoins: 1000 },
];

export class TaskManager {
  private static _instance: TaskManager;

  static get instance(): TaskManager {
    if (!TaskManager._instance) {
      TaskManager._instance = new TaskManager();
    }
    return TaskManager._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  /** 检查是否跨天，重置每日任务 */
  ensureDailyTasks(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (this.data.dailyTaskResetDate !== today) {
      this.data.dailyTaskResetDate = today;
      this.data.dailyTasks = this.generateDailyTasks();
      this.data.streakCount = 0; // 简化：跨天清空连续
      SaveManager.instance.save();
    }
    if (this.data.dailyTasks.length === 0) {
      this.data.dailyTasks = this.generateDailyTasks();
      SaveManager.instance.save();
    }
  }

  private generateDailyTasks(): DailyTaskProgress[] {
    const shuffled = [...DAILY_TASK_DEFS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, DAILY_TASK_COUNT).map(d => ({
      taskId: d.taskId,
      progress: 0,
      completed: false,
      claimed: false,
    }));
  }

  getDailyTasks(): DailyTaskProgress[] {
    this.ensureDailyTasks();
    return this.data.dailyTasks;
  }

  getDailyTaskDef(taskId: string): DailyTaskDef | undefined {
    return DAILY_TASK_DEFS.find(d => d.taskId === taskId);
  }

  getStreakCount(): number {
    return this.data.streakCount || 0;
  }

  onMerge(count: number): void {
    this.addProgress('merge_5', count);
    this.addProgress('merge_10', count);
  }

  onChainMerge(count: number): void {
    this.addProgress('chain_3', count);
    this.addProgress('chain_10', count);
  }

  onCustomersServed(count: number): void {
    this.addProgress('serve_50', count);
    this.addProgress('serve_100', count);
  }

  onCoinsEarned(amount: number): void {
    this.addProgress('earn_10k', amount);
  }

  onVisitFriend(): void {
    this.addProgress('visit_3', 1);
  }

  private addProgress(taskId: string, delta: number): void {
    this.ensureDailyTasks();
    const t = this.data.dailyTasks.find(x => x.taskId === taskId);
    if (!t || t.completed) return;
    t.progress += delta;
    const def = this.getDailyTaskDef(taskId);
    if (def && t.progress >= def.target) {
      t.completed = true;
    }
    SaveManager.instance.save();
  }

  claimTask(taskId: string): boolean {
    const t = this.data.dailyTasks.find(x => x.taskId === taskId);
    if (!t || !t.completed || t.claimed) return false;
    const def = this.getDailyTaskDef(taskId);
    if (!def) return false;
    t.claimed = true;
    if (def.rewardCoins) EconomyManager.instance.addCoins(def.rewardCoins, 'task');
    if (def.rewardDiamonds) EconomyManager.instance.addDiamonds(def.rewardDiamonds);
    this.data.streakCount = (this.data.streakCount || 0) + 1;
    if (this.data.streakCount >= STREAK_TASKS_FOR_EGG) {
      EconomyManager.instance.addCoins(500, 'streak'); // 额外蛋奖励可接 PetManager
    }
    SaveManager.instance.save();
    return true;
  }

  getTutorialStep(): number {
    return this.data.tutorial.step;
  }

  setTutorialStep(step: number): void {
    this.data.tutorial.step = step;
    if (step >= 5) this.data.tutorial.completed = true;
    SaveManager.instance.save();
  }

  unfinishedCount(): number {
    return this.getDailyTasks().filter(t => t.completed && !t.claimed).length;
  }
}
