# FieldScout v0.9.0 — GitHub Pages 穩定版

FieldScout 是一套以手機為優先、面向臺灣生物多樣性調查的野外探點、行程規劃、導航與採集紀錄工具。

本版定位為 **Firebase/backend 之前的最終純前端穩定版**。

## Local Profile

啟動時使用者輸入 email。

相同瀏覽器中：

- 相同 email → 同一組 Trips、採集紀錄、照片、設定與搜尋快取
- 不同 email → 各自獨立資料空間

Email 僅作為 IndexedDB profile key，不是登入驗證，也不會自動跨裝置同步。

## v0.9.0 主要功能

### 地圖與搜尋

- 固定上半部地圖 / 下半部清單
- 地圖 marker ↔ 清單卡片雙向連動
- Leaflet marker clustering
- 不限生物類群
- TaiCOL / TBIA / GBIF / iNaturalist
- TBIA + GBIF + iNaturalist 同時查詢
- 去重與多來源標籤
- taxonomy autocomplete
- 日期、月份、距離、來源、basis、座標誤差、照片篩選
- 依距離、日期、座標精度、多來源支持排序
- 季節性月份摘要
- 候選探點 Ranking v2

### 行程

- 多個命名 Field Trips
- Trip 日期、目標物種、狀態、備註
- occurrence / candidate / 自訂點加入
- 一鍵加入全部篩選點位
- 到訪狀態循環：
  - unvisited
  - arrived
  - surveyed
  - inaccessible
  - revisit
- arrived 時記錄抵達時間與和目標點距離
- Google Maps 導航
- CSV / GeoJSON / GPX export
- GPX waypoint import
- GPS track recording + GPX export

### 採集／觀察紀錄

- IndexedDB 儲存
- 新增 / 編輯 / 刪除
- 標本號、數量、taxon、微棲地、方法、備註
- GPS + accuracy
- 本機照片
- 批次採集點：多筆紀錄沿用同一個 GPS
- 自動標本號，例如 `ABARA00001 → ABARA00002`
- QC：
  - 缺 GPS
  - GPS 誤差過高
  - 座標可能不在臺灣
  - 重複 specimen ID
  - 數量異常
- CSV / GeoJSON
- 敏感座標模糊 CSV

### Dashboard

- Trips 數
- Trip points
- 已到訪點位
- 採集紀錄數
- taxa 數
- GPS accuracy median
- 搜尋物種 12 個月 occurrence bar chart
- QC 摘要

### Backup / Restore

完整 JSON backup 可保存：

- Local Profile
- settings
- trips
- records
- local photos
- occurrence cache

可在相同或另一個 profile 匯入。

## Offline

目前支援：

- PWA app shell cache
- IndexedDB trips / records / photos / cache
- 已保存資料離線查看
- optional raster PMTiles

真正的臺灣 PMTiles 不隨專案附送，避免授權與檔案體積問題。

## 目前限制

純 GitHub Pages 無 backend，因此：

- TBIA 可能受 CORS 影響
- 無真正登入驗證
- email profile 無法跨裝置同步
- 無多人協作
- 無雲端照片
- 無社群資料庫
- 無伺服器端敏感座標
- 無可靠伺服器 API aggregation

這些功能留給未來 Firebase/backend。

## 部署

將所有檔案放在 GitHub repository root，GitHub Pages 設定：

`Settings → Pages → Deploy from a branch → main → /(root)`

## 未來

下一個 major architecture 才建議加入：

- Firebase Authentication
- Firestore sync
- Cloud Storage
- API proxy
- shared projects
- community records
- private/public coordinate separation

本版前端 workflow 可以保留，不需要重寫。
