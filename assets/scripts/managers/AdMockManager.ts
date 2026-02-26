/**
 * AdMockManager - 激励视频广告模拟
 * 3 秒倒计时，期间可禁用按钮；完成后回调发放奖励
 */

export class AdMockManager {
  private static _instance: AdMockManager;
  private _watching = false;

  static get instance(): AdMockManager {
    if (!AdMockManager._instance) AdMockManager._instance = new AdMockManager();
    return AdMockManager._instance;
  }

  get watching(): boolean {
    return this._watching;
  }

  /** 模拟观看激励视频，返回是否“观看完成” */
  async watchRewarded(reason: string, onTick?: (secLeft: number) => void): Promise<boolean> {
    if (this._watching) return false;
    this._watching = true;
    try {
      let sec = 3;
      while (sec > 0) {
        onTick?.(sec);
        await new Promise<void>(r => setTimeout(r, 1000));
        sec--;
      }
      onTick?.(0);
      return true;
    } finally {
      this._watching = false;
    }
  }
}

