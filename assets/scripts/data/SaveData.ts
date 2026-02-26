/**
 * 存档数据结构 - 用于 localStorage 持久化
 * 扩展：育种、天气、咖啡厅家具、 prestige、公会
 */

/** 单个网格上的合并物 (宠物/家具等) */
export interface GridItemData {
  id: string;
  type: 'pet' | 'furniture' | 'menu' | 'decor';
  level: number;
  rarity: 'N' | 'R' | 'SR' | 'SSR';
  petId?: string;
  /** 杂交宠物 id（育种产出） */
  hybridId?: string;
}

/** 已收集宠物 (图鉴) */
export interface CollectedPetData {
  petId: string;
  level: number;
  count: number;
}

/** 育种中的蛋 */
export interface BreedingEggData {
  id: string;
  hybridId: string;
  startTime: number;
  durationMs: number;
  parentPetId1: string;
  parentPetId2: string;
}

/** 咖啡厅家具放置 */
export interface PlacedFurnitureData {
  id: string;
  furnitureId: string;
  level: number;
  x: number;
  y: number;
}

/** 货币与资源 */
export interface CurrencyData {
  coins: number;
  diamonds: number;
  energy: number;
  lastEnergyTime: number;
  /**  prestige 星币（永久加成） */
  stars?: number;
}

/** 每日任务进度 */
export interface DailyTaskProgress {
  taskId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

/** 新手指引进度（扩展步骤：育种、小游戏、天气） */
export interface TutorialProgress {
  step: number;
  completed: boolean;
  /** 已触发的步骤掩码 */
  seenSteps?: number;
}

/** 天气状态（按日种子） */
export interface WeatherState {
  date: string; // YYYY-MM-DD
  type: 'sunny' | 'rain' | 'storm';
  seed: number;
}

/** 公会 mock */
export interface GuildData {
  id: string;
  name: string;
  memberIds: string[];
  sharedDailyClaimedDate: string | null;
  giftEggSentToday: boolean;
  lastGiftResetDate?: string;
  /** 当日协作合并目标进度（集体合并数） */
  coopMergeGoal: number;
  coopMergeProgress: number;
  coopEggClaimedDate: string | null;
}

/** 育种每日限制（免费 1 次，可看广告追加） */
export interface BreedingDailyState {
  date: string; // YYYY-MM-DD
  freeUsed: boolean;
  adExtraUsed: number;
}

/** 星币升级（Prestige 商店） */
export interface StarUpgrades {
  incomeLevel: number; // 每级 +5% 收益
  spawnSpeedLevel: number; // 每级 -3% 自动生成间隔
  breedingSlotLevel: number; // 每级 +1 育儿所槽位（上限由代码控制）
}

/** 完整存档 */
export interface SaveData {
  version: number;
  lastSaveTime: number;
  logoutTime: number;
  currency: CurrencyData;
  gridItems: GridItemData[];
  gridCols: number;
  gridRows: number;
  collectedPets: CollectedPetData[];
  playerLevel: number;
  cafeLevel: number;
  dailyTasks: DailyTaskProgress[];
  dailyTaskResetDate: string;
  streakCount: number;
  tutorial: TutorialProgress;
  adWatchCount: number;
  totalMerges: number;
  totalCustomersServed: number;
  totalCoinsEarned: number;
  // 扩展
  breedingEggs: BreedingEggData[];
  weather: WeatherState | null;
  placedFurniture: PlacedFurnitureData[];
  prestigeCount: number;
  starsEarned: number;
  guild: GuildData | null;
  /** 累计游戏天数（用于平衡） */
  totalPlayDays: number;
  /** 小游戏今日是否已玩（节奏/顾客潮） */
  miniGamePlayedToday: { rhythm?: boolean; rush?: boolean };

  /** 育种每日状态 */
  breedingDaily: BreedingDailyState | null;

  /** 星币升级状态 */
  starUpgrades: StarUpgrades;

  /** 好友赠送的蛋（下次登录领取） */
  pendingGiftEggs: number;

  /** 暴风 Boss 事件：当日进度与是否已领取 */
  stormBossProgress: number;
  stormBossGoal: number;
  stormBossClaimedDate: string | null;
}

export function createDefaultSaveData(): SaveData {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  return {
    version: 2,
    lastSaveTime: now,
    logoutTime: now,
    currency: {
      coins: 5000,
      diamonds: 10,
      energy: 100,
      lastEnergyTime: now,
      stars: 0,
    },
    gridItems: [],
    gridCols: 5,
    gridRows: 5,
    collectedPets: [],
    playerLevel: 1,
    cafeLevel: 1,
    dailyTasks: [],
    dailyTaskResetDate: today,
    streakCount: 0,
    tutorial: { step: 0, completed: false, seenSteps: 0 },
    adWatchCount: 0,
    totalMerges: 0,
    totalCustomersServed: 0,
    totalCoinsEarned: 0,
    breedingEggs: [],
    weather: null,
    placedFurniture: [],
    prestigeCount: 0,
    starsEarned: 0,
    guild: null,
    totalPlayDays: 1,
    miniGamePlayedToday: {},
    breedingDaily: null,
    starUpgrades: { incomeLevel: 0, spawnSpeedLevel: 0, breedingSlotLevel: 0 },
    pendingGiftEggs: 0,
    stormBossProgress: 0,
    stormBossGoal: 20,
    stormBossClaimedDate: null,
  };
}
