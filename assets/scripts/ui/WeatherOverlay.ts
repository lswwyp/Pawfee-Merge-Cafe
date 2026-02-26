/**
 * WeatherOverlay - 天气覆盖层（雨/暴风时显示半透明遮罩或粒子）
 * 无外部资源时用简单色块+动画模拟
 */

import { _decorator, Component, Node, Sprite, Color, UITransform } from 'cc';
import { WeatherSystem } from '../managers/WeatherSystem';

const { ccclass, property } = _decorator;

@ccclass('WeatherOverlay')
export class WeatherOverlay extends Component {
  @property(Node)
  overlayNode: Node | null = null;

  onLoad() {
    if (!this.overlayNode) {
      const n = new Node('WeatherOverlay');
      const ui = n.addComponent(UITransform);
      ui.setContentSize(2000, 2000);
      n.setPosition(0, 0, 0);
      const sp = n.addComponent(Sprite);
      try {
        (sp as any).color = new Color(100, 120, 180, 25);
      } catch (_) {}
      this.node.addChild(n);
      this.overlayNode = n;
    }
  }

  onEnable() {
    this.refresh();
  }

  refresh() {
    const type = WeatherSystem.instance.getWeatherType();
    const show = type === 'rain' || type === 'storm';
    if (this.overlayNode) {
      this.overlayNode.active = show;
      const sp = this.overlayNode.getComponent(Sprite);
      if (sp && show) {
        try {
          (sp as any).color = type === 'storm'
            ? new Color(60, 60, 80, 45)
            : new Color(100, 120, 180, 25);
        } catch (_) {}
      }
    }
  }
}
