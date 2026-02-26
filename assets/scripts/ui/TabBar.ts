/**
 * TabBar - 底部/顶部 Tab：Merge / Cafe / Album / Shop / Social
 * 切换显示对应面板，红点由 UIManager 驱动
 */

import { _decorator, Component, Node, Button } from 'cc';

const { ccclass, property } = _decorator;

export type TabId = 'merge' | 'cafe' | 'album' | 'shop' | 'social';

@ccclass('TabBar')
export class TabBar extends Component {
  @property([Node])
  panels: Node[] = [];

  @property([Button])
  tabButtons: Button[] = [];

  @property([Node])
  redDots: Node[] = [];

  private _current: TabId = 'merge';

  onLoad() {
    this.tabButtons.forEach((btn, i) => {
      if (btn) {
        const id = (['merge', 'cafe', 'album', 'shop', 'social'] as TabId[])[i];
        btn.node.on(Button.EventType.CLICK, () => this.switchTo(id), this);
      }
    });
    this.switchTo('merge');
  }

  switchTo(id: TabId) {
    this._current = id;
    const index = ['merge', 'cafe', 'album', 'shop', 'social'].indexOf(id);
    this.panels.forEach((p, i) => {
      if (p) p.active = i === index;
    });
  }

  setRedDot(index: number, on: boolean) {
    if (this.redDots[index]) this.redDots[index].active = on;
  }
}
