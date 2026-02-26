/**
 * AlbumPanel - 图鉴/收集进度（占位）
 */

import { _decorator, Component, Label } from 'cc';
import { PetManager } from '../managers/PetManager';

const { ccclass, property } = _decorator;

@ccclass('AlbumPanel')
export class AlbumPanel extends Component {
  @property(Label)
  progressLabel: Label | null = null;

  onLoad() {
    this.refresh();
  }

  refresh() {
    const { current, total, percent } = PetManager.instance.collectionProgress();
    if (this.progressLabel) {
      this.progressLabel.string = `收集进度 ${current}/${total} (${percent}%)`;
    }
  }
}
