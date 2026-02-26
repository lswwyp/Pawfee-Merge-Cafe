/**
 * 游戏常量与配置 - 萌宠咖啡合并馆
 * 设计稿: 720x1280 竖屏，平衡: Day1 ~5k → Day30 ~500k
 */

// 设计分辨率
export const DESIGN_WIDTH = 720;
export const DESIGN_HEIGHT = 1280;

// 合并网格
export const GRID_COLS = 5;
export const GRID_ROWS = 5;
export const GRID_CELL_SIZE = 100;
export const GRID_MAX_EXPAND = 7;

// 货币
export const COIN_DAILY_CAP_MULTIPLIER = 1000;
export const ENERGY_MAX = 100;
export const ENERGY_REGEN_MINUTES = 5;
export const DIAMOND_RATE_FROM_CUSTOMER = 0.01;

// 顾客与收益（中期提高产出）
export const CUSTOMER_SPAWN_RATE_BASE = 0.5;
export const SERVICE_TIME_BASE = 5;
export const COIN_PER_CUSTOMER_BASE = 10;
export const COIN_LEVEL_MULTIPLIER = 0.1;
/** 每日金币成长系数：DayN 收益 ≈ base * (1 + DAY_PROGRESSION_GROWTH * N) */
export const DAY_PROGRESSION_GROWTH = 0.08;

// 离线
export const OFFLINE_MAX_HOURS = 24;

// 自动生成
export const AUTO_SPAWN_INTERVAL_MS = 10000;
export const CHAIN_REACTION_CHANCE = 0.2;
export const CHAIN_BONUS_COIN = 50;

// 宠物
export const EGG_RARITY_WEIGHTS = { N: 70, R: 20, SR: 9, SSR: 1 };
export const PET_EVOLUTION_LEVELS = 10;
/** 育种所需最低等级 */
export const BREEDING_MIN_LEVEL = 5;
/** 杂交蛋孵化时长 ms */
export const BREEDING_EGG_DURATION_MS = 24 * 60 * 60 * 1000;

// 每日任务
export const DAILY_TASK_COUNT = 5;
export const STREAK_TASKS_FOR_EGG = 3;

// 天气
export const WEATHER_SUNNY_CUSTOMER_BONUS = 1.2;
export const WEATHER_RAIN_INDOOR_BONUS = 1.15;
export const WEATHER_STORM_RARE_DROP_BONUS = 1.5;

// Prestige
export const PRESTIGE_COLLECTION_PERCENT = 80;
export const PRESTIGE_STAR_PER_RESET = 1;
export const PRESTIGE_INCOME_PER_STAR = 0.1;

// 公会 mock
export const GUILD_DAILY_BONUS_COINS = 500;
export const GUILD_GIFT_EGG_COOLDOWN_DAYS = 1;
/** 公会协作：当日集体合并目标（本地 mock 只算自己） */
export const GUILD_COOP_MERGE_GOAL = 30;
/** 暴风 Boss：当日合并次数目标 */
export const STORM_BOSS_GOAL = 20;

// 本地存储
export const SAVE_KEY = 'merge_cafe_save_v2';
export const LAST_LOGOUT_KEY = 'merge_cafe_logout_time';
