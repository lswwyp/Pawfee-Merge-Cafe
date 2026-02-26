import { SaveManager } from './SaveManager';
import { EconomyManager } from './EconomyManager';
import { MergeManager } from './MergeManager';
import { PetManager } from './PetManager';
import { GUILD_DAILY_BONUS_COINS, GUILD_COOP_MERGE_GOAL } from '../config/GameConfig';
import type { GuildData } from '../data/SaveData';

const MOCK_GUILD_ID = 'guild_mock_1';

export class GuildManager {
  private static _instance: GuildManager;

  static get instance(): GuildManager {
    if (!GuildManager._instance) {
      GuildManager._instance = new GuildManager();
    }
    return GuildManager._instance;
  }

  private get data() {
    return SaveManager.instance.data;
  }

  getGuild(): GuildData | null {
    if (!this.data.guild) {
      this.data.guild = {
        id: MOCK_GUILD_ID,
        name: '萌宠咖啡同好会',
        memberIds: ['self', 'friend1', 'friend2'],
        sharedDailyClaimedDate: null,
        giftEggSentToday: false,
        coopMergeGoal: GUILD_COOP_MERGE_GOAL,
        coopMergeProgress: 0,
        coopEggClaimedDate: null,
      };
      SaveManager.instance.save();
    }
    return this.data.guild;
  }

  /** 公会协作：贡献合并数（每次合并后调用） */
  contributeMerge(count: number): void {
    const g = this.getGuild();
    if (!g) return;
    const today = new Date().toISOString().slice(0, 10);
    if (g.coopEggClaimedDate === today) return; // 今日已领过协作蛋
    if (g.coopMergeProgress >= g.coopMergeGoal) return;
    g.coopMergeProgress = Math.min(g.coopMergeGoal, (g.coopMergeProgress || 0) + count);
    SaveManager.instance.save();
  }

  /** 是否可领取公会协作蛋 */
  canClaimCoopEgg(): boolean {
    const g = this.getGuild();
    if (!g) return false;
    const today = new Date().toISOString().slice(0, 10);
    if (g.coopEggClaimedDate === today) return false;
    return (g.coopMergeProgress || 0) >= (g.coopMergeGoal || GUILD_COOP_MERGE_GOAL);
  }

  /** 领取公会协作蛋（1 个随机蛋） */
  claimCoopEgg(): boolean {
    if (!this.canClaimCoopEgg()) return false;
    const g = this.getGuild();
    if (!g) return false;
    g.coopEggClaimedDate = new Date().toISOString().slice(0, 10);
    SaveManager.instance.save();
    const petId = PetManager.instance.hatchFreeEgg();
    if (petId) {
      const item = MergeManager.instance.createPetFromId(petId);
      if (item) {
        const pos = MergeManager.instance.findEmptyCell();
        if (pos) MergeManager.instance.placeItem(item, pos.x, pos.y);
        SaveManager.instance.save();
      }
    }
    return true;
  }

  /** 今日是否已领取公会每日奖励 */
  hasClaimedGuildDaily(): boolean {
    const g = this.getGuild();
    const today = new Date().toISOString().slice(0, 10);
    return g?.sharedDailyClaimedDate === today;
  }

  claimGuildDaily(): boolean {
    if (this.hasClaimedGuildDaily()) return false;
    const g = this.getGuild();
    if (!g) return false;
    EconomyManager.instance.addCoins(GUILD_DAILY_BONUS_COINS, 'guild');
    g.sharedDailyClaimedDate = new Date().toISOString().slice(0, 10);
    SaveManager.instance.save();
    return true;
  }

  /** 赠送蛋（模拟：发送后自己下次登录收到 1 个赠送蛋） */
  canSendGiftEgg(): boolean {
    const g = this.getGuild();
    return !!g && !g.giftEggSentToday;
  }

  sendGiftEgg(): boolean {
    const g = this.getGuild();
    if (!g || g.giftEggSentToday) return false;
    g.giftEggSentToday = true;
    this.data.pendingGiftEggs = (this.data.pendingGiftEggs || 0) + 1;
    SaveManager.instance.save();
    return true;
  }

  /** 领取收件箱中的赠送蛋（登录后调用，返回领取数量） */
  claimPendingGiftEggs(): number {
    const n = this.data.pendingGiftEggs || 0;
    if (n <= 0) return 0;
    this.data.pendingGiftEggs = 0;
    SaveManager.instance.save();
    return n;
  }

  getPendingGiftEggs(): number {
    return this.data.pendingGiftEggs || 0;
  }

  /** 领取收件箱赠送蛋并放入网格（公会/社交面板“领取”按钮调用） */
  claimPendingGiftEggsToGrid(): number {
    const n = this.data.pendingGiftEggs || 0;
    if (n <= 0) return 0;
    let added = 0;
    for (let i = 0; i < n; i++) {
      const pos = MergeManager.instance.findEmptyCell();
      if (!pos) break;
      const petId = PetManager.instance.hatchFreeEgg();
      if (!petId) continue;
      const item = MergeManager.instance.createPetFromId(petId);
      if (!item) continue;
      MergeManager.instance.placeItem(item, pos.x, pos.y);
      added++;
    }
    this.data.pendingGiftEggs = (this.data.pendingGiftEggs || 0) - added;
    SaveManager.instance.save();
    return added;
  }

  getCoopProgress(): { progress: number; goal: number } {
    const g = this.getGuild();
    return {
      progress: g?.coopMergeProgress ?? 0,
      goal: g?.coopMergeGoal ?? GUILD_COOP_MERGE_GOAL,
    };
  }

  /** 重置每日赠送状态（跨天时调用） */
  resetDailyGift() {
    const g = this.getGuild();
    if (!g) return;
    const today = new Date().toISOString().slice(0, 10);
    if (g.lastGiftResetDate !== today) {
      g.giftEggSentToday = false;
      g.lastGiftResetDate = today;
      g.coopMergeProgress = 0;
      g.coopEggClaimedDate = null;
      SaveManager.instance.save();
    }
  }
}
