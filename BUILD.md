# 构建与运行说明 - 萌宠咖啡合并馆

## 环境要求

- **Cocos Creator 3.x**（推荐 3.6+ 或 3.8 稳定版）
- Node.js 14+（编辑器自带或单独安装）

## 用 Cocos Creator 打开项目

1. 启动 Cocos Creator，选择「打开其他项目」。
2. 选择本仓库根目录（`萌宠咖啡合并馆`）。
3. 等待编辑器加载与脚本编译。

## 主场景配置（首次运行必做）

当前 `assets/scenes/Main.scene` 为占位，需在编辑器中完善：

1. **打开 Main 场景**
   - 在 `assets/scenes/` 下双击 `Main.scene` 打开。

2. **挂载 GameRoot**
   - 在层级管理器中选中根节点或 Canvas。
   - 在属性检查器中「添加组件」→ 选择「自定义脚本」→ `GameRoot`。
   - 将 Canvas 下用于 UI 的根节点拖到 `GameRoot` 的 `Ui Root` 上；将合并网格根节点拖到 `Merge Grid Root` 上。

3. **挂载 UIManager**
   - 在 Ui Root 节点上添加组件 `UIManager`。
   - 创建/绑定以下子节点并拖到对应属性：
     - `Coin Label`、`Diamond Label`、`Energy Label`、`Star Label`、`Weather Label`（Label）
     - `Idle Earn Label`（Label，显示 "+xxx / N 客"）
     - `Offline Popup`（Node，默认勾掉 Active）
     - `Offline Coins Label`、`Offline Diamonds Label`
     - `Offline Claim Btn`、`Offline Double Btn`（Button）
     - `Task Red Dot`（Node，用于任务红点）
     - `Toast Root`、`Toast Label`（可选：2 秒提示条）
     - `Version Label`（可选：连续点 5 次打开调试台）
     - `Debug Console`（可选：挂 `DebugConsole`，默认隐藏）

4. **挂载 MergeGridView**
   - 在 `MergeGridRoot` 下创建一个空节点，命名为 `MergeGridView`。
   - 在该节点上添加组件 `MergeGridView`。
   - （可选）若有格子/物品 Prefab，可拖到 `Cell Prefab` / `Item Prefab`；未绑定时脚本会用代码生成占位矩形。

5. **可选按钮**
   - 在底部栏添加按钮，挂载 `TidyButton`（整理）。
   - 再添加一个按钮，挂载 `SpawnButton`，可绑定 `Cost Label` 显示花费（100 金币）。
   - 育儿所面板可挂 `NurseryPanel`（含选择A/B、开始育种、领取按钮）。
   - 小游戏面板：挂 `MiniGameController`，子面板挂 `PetTrainingRhythm` / `CustomerRush`。
   - 咖啡厅家具拖放：Cafe 面板挂 `CafeDragView`，绑定 furnitureRoot。
   - 天气：在顶层挂 `WeatherOverlay`（绑定 overlayNode 或留空自动生成）；暴风日可挂 `StormBossBar`（进度条+领取）。
   - 教程：挂 `TutorialController`，绑定 popupRoot、messageLabel、nextButton。
   - 公会/社交 Tab：挂 `GuildPanel`，绑定协作进度、收件箱、领取每日/协作/赠送/收件箱按钮。
   - 调试台：`DebugConsole` 可增加 `btnSim30Days`、`logLabel`，用于 30 日收益模拟。

6. **保存场景**（Ctrl+S）。

## 运行预览

- **浏览器**：菜单「项目」→「运行预览」或快捷键，选择浏览器。
- **竖屏**：在「项目」→「项目设置」→「项目数据」中设置默认横竖屏为竖屏；设计分辨率 720×1280 已在 `GameConfig` 与 Canvas 中设置。

## 构建 H5

1. 菜单「项目」→「构建发布」。
2. 选择「Web Mobile」或「WeChat Mini Game」等目标平台。
3. 设计分辨率保持 720×1280，竖屏。
4. 构建完成后在 `build/web-mobile`（或对应目录）下用本地服务器或上传到服务器/H5 容器中运行。

## 构建 WeChat 小游戏

1. 构建时选择「WeChat Mini Game」。
2. 填写小游戏 AppID，构建。
3. 用微信开发者工具打开构建输出目录，预览与真机调试。
4. 分享、好友等接口在原型中为 mock（console.log），正式接入需替换为 wx API。

## 目标 60 FPS

- 已使用对象池思路（MergeManager 的 grid 与物品列表）；大量宠物时可将宠物节点池化。
- 减少每帧 GC：避免在 update 内频繁创建临时对象；MergeGridView 的 syncItems 已降频到 0.2s。
- 美术：合并粒子、宠物动画可先用简单 tween，再替换为预制粒子与动画片段。

## 常见问题

- **脚本不显示在组件列表**：确认 `assets/scripts` 下 .ts 已保存且无语法错误；查看控制台是否有编译报错。
- **找不到 SaveManager / EconomyManager 等**：确认路径为 `managers/SaveManager` 等，与 `assets/scripts` 下目录一致。
- **存档不生效**：H5 需同源或本地；小游戏用 wx.setStorageSync / wx.getStorageSync 替换 localStorage（在 SaveManager 中做平台分支）。
- **资源加载失败**：远程 URL 可能因 CORS 或网络失败；GameRoot 已对 ResourceLoader.loadAll 做 try/catch，失败时游戏仍会继续，宠物用占位色块显示。
- **收件箱领取**：网格满时只会放入能放的数量，剩余蛋保留在收件箱；提示「网格已满，无法领取」表示当前没有空位，可先合并或整理后再领。

完成以上步骤后即可在编辑器中运行预览并构建 H5/小游戏。
