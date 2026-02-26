/**
 * LoadingView - 加载界面：显示进度，ResourceLoader 完成后隐藏
 */

import { _decorator, Component, Node, Label } from 'cc';
import { ResourceLoader } from '../managers/ResourceLoader';

const { ccclass, property } = _decorator;

@ccclass('LoadingView')
export class LoadingView extends Component {
  @property(Label)
  progressLabel: Label | null = null;

  onLoad() {
    if (this.progressLabel) this.progressLabel.string = '0%';
  }

  async run() {
    const loader = this.getComponent(ResourceLoader) || this.node.getComponentInChildren(ResourceLoader);
    if (loader) {
      await loader.runLoad();
    } else {
      await ResourceLoader.loadAll((p, msg) => {
        if (this.progressLabel) this.progressLabel.string = Math.floor(p * 100) + '%';
      });
      this.node.active = false;
    }
  }
}
