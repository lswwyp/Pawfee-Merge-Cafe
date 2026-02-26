# 萌宠咖啡合并馆 (Cute Pet Coffee Merge Cafe)

竖屏 H5 超休闲合并 + 放置 + 宠物收集，Cocos Creator 3.x + TypeScript。含育种、天气、小游戏、咖啡厅布置、Prestige、公会 mock。

## 项目结构

```
assets/scripts/
├── config/         GameConfig, PetMeta, AssetUrls, SaveData 类型
├── data/           SaveData（含 breedingEggs, weather, placedFurniture, prestige, guild）
├── managers/       SaveManager, EconomyManager, IdleManager, MergeManager,
│                   TaskManager, PetManager, AudioManager, ResourceLoader,
│                   WeatherSystem, BreedingManager, PrestigeManager, GuildManager, FurnitureManager
├── ui/             UIManager, MergeGridView, TabBar, NurseryPanel, LoadingView,
│                   CafeDragView, DebugConsole, TidyButton, SpawnButton, TaskPanel, AlbumPanel,
│                   WeatherOverlay, StormBossBar, TutorialController, GuildPanel
├── minigames/      MiniGameController, PetTrainingRhythm, CustomerRush
└── GameRoot.ts     主场景入口（加载 → 初始化 → 主循环）
```

## 核心与扩展玩法

- **合并**：5×5 网格拖拽合并，链式反应，自动生成，整理；合并动画+粒子+音效。
- **放置/收益**：宠物数/等级/家具/天气/日成长/prestige 星币 影响顾客与金币；离线 24h 领取（可广告双倍）。
- **育儿所**：两只 Lv5+ 同系宠物配对 → 杂交蛋（24h 孵化），10+ 杂交宠物（猫狗/猫兔/狗兔等），混合特质（服务速度+吸引力）。
- **天气**：每日随机晴/雨/暴风雨，晴 +20% 顾客，雨室内加成，暴风雨稀有掉落加成。
- **小游戏**：节奏（点击时机得分）、顾客潮（限时完成 N 次合并），每日各一次奖励。
- **咖啡厅**：家具拖放布置，解锁通过合并数/咖啡店等级。
- **Prestige**：收集 80% 后可重置，获得星币，永久 +10% 收益。
- **公会 mock**：每日领取公会奖励、协作合并目标（当日合并满 N 可领协作蛋）、赠送蛋（送后自己下次登录收件箱+1）、收件箱领取到网格。
- **暴风 Boss**：暴风日合并累计满目标可领钻石+金币；仅当日有效。
- **教程**：链式弹窗（合并→收益→育儿所→天气→小游戏→Prestige→完成），可跳过。
- **调试**：版本号连续点击 5 次打开调试控制台（生成宠物、加币、重置、快进 1 天、快进育种、**30 日收益模拟**）。

## 资源与构建

- **资源**：`ResourceLoader` 启动时异步加载；URL 见 `config/AssetUrls.ts`（CC0/免费）。CORS 受限时可使用占位图与内置音效。
- **存档**：`merge_cafe_save_v2`、`merge_cafe_logout_time`（localStorage）；小游戏需改为 wx 存储。
- 运行与构建见 [BUILD.md](BUILD.md)；H5/微信小游戏导出步骤已写明。

## 平衡与调试

- 日成长：Day1 约 5k 级收益，Day30 约 500k 级（`DAY_PROGRESSION_GROWTH`）。
- 调试控制台：版本 Label 点击 5 次；含「模拟 30 日」按钮（按当前宠物与日成长公式输出 Day1–30 预估收益到 log 与 console）。
