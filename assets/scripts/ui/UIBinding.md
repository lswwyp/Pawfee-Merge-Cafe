/**
 * 主场景 UI 绑定说明
 * 在 Cocos 编辑器中把以下节点/组件绑定到 GameRoot 和 UIManager
 *
 * 节点结构建议:
 * - Canvas
 *   - TopBar (Widget 顶对齐)
 *     - CoinLabel (Label)
 *     - DiamondLabel (Label)
 *     - EnergyLabel (Label)
 *     - TaskBtn (Button) -> taskRedDot 子节点
 *     - SettingsBtn (Button)
 *   - Middle (咖啡区预览)
 *     - IdleEarnLabel (Label)
 *   - Bottom (Widget 底对齐)
 *     - MergeGridRoot
 *       - MergeGridView (挂 MergeGridView 组件)
 *     - TidyBtn (Button)
 *   - OfflinePopup (默认 active=false)
 *     - OfflineCoinsLabel, OfflineDiamondsLabel
 *     - OfflineClaimBtn, OfflineDoubleBtn (看广告双倍)
 */

export {};
