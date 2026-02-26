/**
 * TaskPanel - 每日任务列表（占位）
 * 可扩展：列表项 Prefab，领取按钮，红点
 */

import { _decorator, Component, Node, Label, Button } from 'cc';
import { TaskManager } from '../managers/TaskManager';
import type { DailyTaskProgress } from '../data/SaveData';

const { ccclass, property } = _decorator;

@ccclass('TaskPanel')
export class TaskPanel extends Component {
  @property(Node)
  listContent: Node | null = null;

  @property(Label)
  streakLabel: Label | null = null;

  onLoad() {
    this.refresh();
  }

  refresh() {
    const tasks = TaskManager.instance.getDailyTasks();
    if (this.streakLabel) {
      this.streakLabel.string = `连续完成: ${TaskManager.instance.getStreakCount()}`;
    }
    // 可在此动态生成 listContent 子节点
  }

  claimAll() {
    const tasks = TaskManager.instance.getDailyTasks();
    tasks.forEach(t => {
      if (t.completed && !t.claimed) TaskManager.instance.claimTask(t.taskId);
    });
    this.refresh();
  }
}
