# FieldScout v0.16.0

**生物多樣性野外探點、行程規劃、導航與採集紀錄 PWA**

線上版：  
https://ychsiao-tw.github.io/FieldScout/

GitHub Repository：  
https://github.com/YCHsiao-TW/FieldScout

[English README](README_EN.md)

---

## 目錄

1. [FieldScout 是什麼](#1-fieldscout-是什麼)
2. [v0.16.0 的核心功能](#2-v0160-的核心功能)
3. [快速開始](#3-快速開始)
4. [國家 Workspace](#4-國家-workspace)
5. [資料來源與地圖](#5-資料來源與地圖)
6. [探索 Explore](#6-探索-explore)
7. [候選樣點排名](#7-候選樣點排名)
8. [行程 Trips](#8-行程-trips)
9. [野外 Field](#9-野外-field)
10. [自訂採集點](#10-自訂採集點)
11. [採集／觀察紀錄 Records](#11-採集觀察紀錄-records)
12. [匯出、備份與資料安全](#12-匯出備份與資料安全)
13. [Local-first 架構](#13-local-first-架構)
14. [已知限制](#14-已知限制)
15. [GitHub Pages 部署與更新](#15-github-pages-部署與更新)
16. [目前專案檔案](#16-目前專案檔案)

---

# 1. FieldScout 是什麼？

FieldScout 是一套以手機操作為優先的 **local-first 生物多樣性野外工作工具**。

它不是單純的 occurrence viewer，也不是 Species Distribution Model。FieldScout 的目標是把真正會在採集前、採集中與採集後使用的工作流程串在一起：

> **搜尋物種 → 查看 occurrence → 判斷候選探點 → 建立行程 → 排序路線 → 野外導航 → 記錄採集／觀察結果 → 匯出與備份**

目前版本完全可以部署在 **GitHub Pages**，不需要 Firebase、後端伺服器或登入系統。

底部主要頁面為：

**探索 ｜ 行程 ｜ 野外 ｜ 採集 ｜ 設定**

各頁角色刻意分開：

| 頁面 | 主要用途 |
|---|---|
| 探索 | 搜尋物種、查看 occurrence、篩選、月份圖、候選探點 |
| 行程 | 建立／管理 Trip、加入採集目標、排序、匯入匯出 |
| 野外 | 實際跑行程：導航、訪查狀態、GPS Track、快速採集 |
| 採集 | 建立與管理 specimen / observation records |
| 設定 | Local workspace、標本號設定、Backup / Restore |

---

# 2. v0.16.0 的核心功能

## 2.1 全球／國家模式

啟動 FieldScout 時可以選擇：

- 臺灣
- 日本
- 韓國
- 澳洲
- 美國
- 其他 ISO 國家
- **Global：不限制國家**

搜尋 occurrence 時會依目前 workspace 國家調整資料查詢。

## 2.2 自訂採集點資料庫

原本地圖上的簡單「＋」已升級為完整的 **自訂採集點** 功能。

自訂點可以永久保存，之後重複加入不同 Trip。

## 2.3 Trip Manager

行程與野外頁都可以開啟 **編輯行程**：

- 改名
- 設為目前行程
- 查看目標數／紀錄數
- 刪除
- 新增行程

## 2.4 獨立「野外」頁

野外工作不再使用 overlay，而是正式獨立頁面。

它專注處理：

- 目前 A / B / C 採集點
- GPS 距離
- Google Maps 導航
- 訪查狀態
- GPS Track
- 快速建立採集紀錄

## 2.5 衛星圖

地圖提供：

- OpenStreetMap
- OpenTopoMap
- Esri World Imagery

舊版 Offline PMTiles 已移除。

---

# 3. 快速開始

## 3.1 開啟 Workspace

進入網站後：

1. 選擇 **使用國家**
2. 輸入 email
3. 按 **開啟 FieldScout**

這不是雲端帳號登入。

Email 與國家只用於識別目前瀏覽器的本機 IndexedDB workspace。

## 3.2 搜尋物種

到 **探索**：

1. 輸入學名或名稱
2. 選 autocomplete 建議
3. 按搜尋
4. 等待 GBIF / iNaturalist occurrence 載入

## 3.3 建立行程

在 occurrence 或 candidate card 上按：

**加入行程**

若目前沒有 Trip，FieldScout 可以建立一個新的行程。

## 3.4 出發

到 **野外**：

1. 選目前行程
2. 選 A / B / C 目標
3. 更新 GPS
4. 開 Google Maps 導航
5. 標記已到達／完成／無法到達／再訪
6. 按 **＋ 採集紀錄**

---

# 4. 國家 Workspace

v0.16.0 開始，FieldScout 不再只限於臺灣。

## 4.1 Workspace 如何區分？

### 臺灣

為了保留舊版資料，相同 email 的臺灣 workspace 繼續使用舊的 email-only profile ID。

因此升級 v0.16.0 後，原本臺灣的：

- Trips
- records
- photos
- settings
- specimen counter
- occurrence cache

仍會被讀到。

### 其他國家

其他國家以：

`email + country`

建立獨立 Local Workspace。

所以同一個 email 可以分別有：

- Taiwan workspace
- Japan workspace
- Australia workspace

互不混用。

### Global

Global 不加國家 occurrence 限制，適合跨國分布或大尺度探索。

## 4.2 國家如何影響搜尋？

### GBIF

使用 ISO 3166-1 alpha-2 country code 限制 occurrence。

### iNaturalist

FieldScout 先解析所選國家的 iNaturalist Place，再以 `place_id` 限制 observations。

如果 iNaturalist 的國家解析暫時失敗，GBIF 仍可獨立使用。

### TaiCOL

TaiCOL 僅在 **臺灣 workspace** 參與名稱解析。

其他國家主要使用：

- GBIF taxonomy
- iNaturalist taxonomy

## 4.3 QC

舊版的：

> 座標可能不在臺灣

只會在 Taiwan workspace 套用。

其他國家不會被臺灣經緯度範圍誤判。

---

# 5. 資料來源與地圖

## 5.1 GBIF

主要用途：

- occurrence coordinates
- event date
- locality
- basis of record
- coordinate uncertainty
- dataset metadata
- source media（若有）

## 5.2 iNaturalist

主要用途：

- occurrence / observations
- taxon autocomplete
- recent observations
- source photos
- observation links
- country Place filtering

## 5.3 TaiCOL

目前用途：

- 臺灣名稱解析
- 學名協助
- taxonomy matching

TaiCOL 不是目前的 occurrence 來源。

## 5.4 TBIA / TBN

目前 static GitHub Pages 版本沒有使用 TBIA / TBN occurrence。

原因是先前實測 browser-direct API 穩定性與 CORS 不理想。

若未來加入 backend / API proxy，可以再評估恢復。

## 5.5 地圖底圖

目前有三種：

### 一般地圖

OpenStreetMap。

適合：

- 道路
- 地名
- 一般導航判讀

### 地形

OpenTopoMap。

適合：

- 山區
- 等高與地勢
- 野外路線判讀

### 衛星影像

Esri World Imagery。

適合：

- 林緣
- 農地
- 溪谷
- 道路切線
- 棲地破碎程度
- 建物與開發區

FieldScout 不使用未公開的 Google satellite tile URL。

---

# 6. 探索 Explore

探索頁負責「找資料與選點」。

## 6.1 occurrence 清單

搜尋後整合 GBIF 與 iNaturalist 公開資料。

卡片可顯示：

- scientific name
- common name
- date
- locality
- latitude / longitude
- coordinate uncertainty
- source
- basis of record
- dataset
- source image
- source link

## 6.2 去重

FieldScout 會以：

- scientific name
- date
- 約 4 位小數座標

進行基本 occurrence merge。

這是工作流程上的去重，不代表不同平台的紀錄在生物學上一定是同一筆。

## 6.3 Marker ↔ 清單

點地圖 marker：

- 對應清單卡片會被選取
- 選取狀態會持續存在
- 不會再像舊版數秒後自動消失

點卡片「地圖」：

- 地圖移到該點
- 對應 marker / card 保持 selected

## 6.4 篩選

目前支援：

- 起始日期
- 結束日期
- 月份
- 距離
- source
- basis of record
- 最大 coordinate uncertainty
- 是否有照片
- 行政區／地名文字
- **目前地圖範圍**

「目前地圖範圍」啟用後，移動或縮放地圖會重新套用 occurrence 篩選。

## 6.5 月份紀錄圖

探索頁有 12 個月份的 occurrence record count。

可以：

- 點月份 → 套用該月份篩選
- 再點同月份 → 取消
- 按「全部月份」 → reset

這裡表示的是 **occurrence record count**，不是 biological abundance。

---

# 7. 候選樣點排名

FieldScout 會把 occurrence 依附近座標聚合成 candidate sites。

候選排名是 **fieldwork heuristic**，不是 Species Distribution Model。

目前 score 由下列項目組成：

| 指標 | 最大分數 |
|---|---:|
| occurrence density | 25 |
| recency | 20 |
| target-month support | 20 |
| distance / accessibility proxy | 15 |
| coordinate quality | 10 |
| multi-source support | 10 |

總分上限 100。

每個 candidate 可以按：

**為什麼推薦？**

查看分數拆解。

## 注意

Distance 只是目前位置到 candidate 的直線距離 proxy。

它不是：

- 道路距離
- 步行距離
- 真實 access cost
- habitat suitability

因此 candidate score 應用於 **探點決策支援**，不能當正式 SDM 結果。

---

# 8. 行程 Trips

## 8.1 Trip 可以放什麼？

Trip Point 可來自：

- occurrence
- candidate site
- 自訂採集點
- GPX waypoint

## 8.2 Trip Manager

按 **編輯行程** 可以：

- 改行程名稱
- 設為目前行程
- 查看日期
- 查看採集目標數
- 查看已綁定 field record 數
- 新增 Trip
- 刪除 Trip

刪除 Trip 時：

- Trip 會刪除
- Trip Points 會刪除
- Field records **不會刪除**
- record 的 `tripId / tripPointId` 會解除

避免留下 dangling references。

## 8.3 採集目標狀態

Trip Point 支援：

- `unvisited`
- `arrived`
- `surveyed`
- `inaccessible`
- `revisit`

狀態會直接反映在 Trip map marker。

## 8.4 路線排序

目前提供：

### 最佳化順序

nearest-neighbor heuristic。

若可取得目前 GPS，會從使用者目前位置開始排列採集目標，以減少直線回頭路。

這不是 road-routing optimization。

### 北 → 南

依 latitude 由北到南排序。

適合某些線性地理採集策略。

### 手動排序

每個點仍可：

- 上移
- 下移

## 8.5 全部移除

可以一次清空目前 Trip 的全部採集目標。

若 field records 已綁定這些點：

- records 保留
- Trip Point linkage 解除

## 8.6 Google Maps

FieldScout Trip 本身 **沒有 10 點上限**。

多點 Google Maps URL 會依：

- 安全點數
- URL length

自動分段。

下一段會承接上一段的最後一點。

野外頁則採 **單點導航**，因此不受 multi-waypoint 限制。

## 8.7 GPX

支援：

- GPX waypoint import
- Trip GPX export
- GPS Track GPX export

可接：

- QGIS
- Garmin
- GIS workflow
- GPX viewer

---

# 9. 野外 Field

「野外」是一個獨立頁面，角色是 **執行行程**。

## 9.1 目前採集目標

顯示：

- A / B / C...
- 點位名稱
- visit status
- latitude / longitude
- source
- 已綁定採集紀錄數
- 目前位置直線距離
- GPS accuracy

## 9.2 快速操作

可以：

- Google Maps 導航
- 已到達
- 完成調查
- 無法到達
- 再訪
- 上一點
- 下一點
- 更新 GPS

## 9.3 行程進度

`surveyed` 與 `inaccessible` 會計入已處理進度。

FieldScout 顯示：

- completed / total
- progress bar
- 下一個未完成目標

## 9.4 快速採集紀錄

按：

**＋ 採集紀錄**

FieldScout 會：

1. 切到採集頁
2. 自動綁定目前 Trip Point
3. 帶入行程目標物種（若有）
4. 使用目前 Trip Point 座標
5. specimen ID 為空時使用下一號
6. 儲存後回到 **野外** 頁

## 9.5 GPS Track

GPS Track 已從「行程」移到「野外」。

可：

- 開始
- 停止
- 匯出 GPX

Track point 記錄：

- latitude
- longitude
- timestamp
- accuracy

---

# 10. 自訂採集點

自訂點不是只存在單一 Trip，而是目前 workspace 的 **永久點位庫**。

## 10.1 可保存欄位

- 名稱
- latitude
- longitude
- 類型
- priority
- target taxon
- notes
- country workspace

點位類型：

- 自訂探點
- 採集點
- 停車點
- 步道入口
- 道路／入口
- 其他

Priority：

- 高
- 中
- 低

## 10.2 座標來源

### 目前 GPS

直接讀裝置定位。

### 地圖中心

使用目前 map center。

### 點地圖指定

進入 map-pick mode 後：

1. 點地圖
2. marker 出現
3. marker 可拖曳
4. 按完成
5. 回編輯器

### 手動輸入

直接輸入：

- Latitude
- Longitude

### 貼上座標

支援：

`24.21783, 120.97621`

FieldScout 會解析為：

- latitude = 24.21783
- longitude = 120.97621

## 10.3 點位庫

行程頁可開啟：

**自訂採集點 → 點位庫**

可：

- 地圖定位
- 編輯
- 加入目前 Trip
- 刪除

## 10.4 與 Trip 同步

若自訂點已加入 Trip：

- 修改名稱 → linked Trip Point 同步
- 修改座標 → linked Trip Point 同步
- 修改類型／priority／notes → 同步

若從點位庫刪除：

- library point 刪除
- 已存在的 Trip Point **保留**
- Trip Point 變成獨立 snapshot

避免過去規劃好的行程被破壞。

---

# 11. 採集／觀察紀錄 Records

## 11.1 欄位

目前 field record 可保存：

- specimen / record ID
- count
- taxon
- microhabitat
- method
- notes
- latitude
- longitude
- GPS accuracy
- photos
- Trip
- Trip Point
- country code
- created / updated timestamp

## 11.2 GPS

可以使用：

### 取得現場 GPS

重新讀取裝置 GPS。

### 使用行程點 GPS

直接使用目前選擇的 Trip Point 座標。

這兩者角色不同：

- Trip Point GPS = 規劃點座標
- 現場 GPS = 實際觀察／採集位置

## 11.3 Trip Point ↔ Record

Record 可以綁定某個 A / B / C Trip Point。

行程頁會顯示：

> X 筆採集紀錄

儲存 linked record 時，若該點原本是：

- `unvisited`
- `arrived`

FieldScout 會更新為：

`surveyed`

## 11.4 Specimen ID

設定頁可以指定：

- Prefix
- 下一號

例如：

Prefix：

`ABARA`

Counter：

`5001`

自動產生：

`ABARA05001`

下一筆：

`ABARA05002`

## 11.5 Photos

照片會在瀏覽器端：

1. resize
2. JPEG re-encode
3. 存進 IndexedDB

不會自動上傳。

## 11.6 QC

目前基本 QC 包含：

- 缺 specimen / record ID
- 缺 GPS
- GPS accuracy > 1000 m
- specimen ID 重複
- count < 1
- Taiwan workspace 額外檢查座標是否可能落在臺灣範圍外

---

# 12. 匯出、備份與資料安全

## 12.1 Occurrence

可匯出：

- CSV
- GeoJSON

## 12.2 Trip

可匯出：

- CSV
- GeoJSON
- GPX

Trip CSV / GeoJSON 會保留自訂點 metadata，例如：

- `customPointId`
- `customType`
- `priority`

## 12.3 Field Records

可匯出：

- CSV
- GeoJSON
- sensitive / obscured-coordinate CSV

## 12.4 Sensitive coordinates

FieldScout 可以產生 deterministic obscured coordinates。

原始座標不會被覆蓋。

適合：

- 初步分享
- 敏感物種
- 公開版本資料

## 12.5 Backup JSON

Backup 可包含：

- Local Profile
- settings
- custom point library
- Trips
- field records
- local photos
- occurrence cache

Backup 可能包含：

- email
- 精確座標
- specimen ID
- notes
- photos
- 未公開採集點

因此請把 Backup JSON 視為 **敏感研究資料**。

不要直接公開放在 GitHub repository。

---

# 13. Local-first 架構

目前 FieldScout：

- static frontend
- GitHub Pages
- Leaflet
- IndexedDB
- Service Worker
- public APIs
- no backend
- no authentication
- no cloud database
- no automatic cross-device sync

## IndexedDB 主要資料

- `profiles`
- `settings`
- `trips`
- `records`
- `photos`
- `cache`

Custom Point Library 目前保存於：

`settings.customPoints`

## Email 不是登入

Email 只用來產生 Local Workspace ID。

FieldScout 不驗證 email，也沒有自己的登入 server。

因此：

- 換手機不會同步
- 換 Safari / Chrome 不會同步
- 清除網站資料可能刪除 IndexedDB
- Private Browsing 不適合作為主要工作環境

---

# 14. 已知限制

## 14.1 Candidate ranking 不是 SDM

不要將 score 解讀為：

- habitat suitability
- occurrence probability
- abundance
- occupancy

## 14.2 Route optimization 不是道路最佳化

nearest-neighbor 使用直線距離。

Google Maps 才會依實際道路重新導航。

## 14.3 API 依賴

Static frontend 依賴：

- GBIF API
- iNaturalist API
- TaiCOL API（Taiwan）
- map tile providers

第三方服務若：

- downtime
- rate limit
- CORS 改變
- API schema 改變

可能造成部分功能暫時不可用。

## 14.4 iNaturalist 國家解析

非臺灣 workspace 需要先把國家名稱解析為 iNaturalist Place ID。

若該步驟失敗：

- iNaturalist occurrence 可能不可用
- GBIF 仍可工作

## 14.5 搜尋筆數

目前單次搜尋偏向 field-scouting，而不是完整 database dump：

- GBIF：最多約 300 筆
- iNaturalist：最多約 200 筆

因此結果適合探索與野外規劃，不應被解讀為該國家所有 occurrence 的完整下載。

## 14.6 Photos 與瀏覽器空間

大量照片會增加 IndexedDB 使用量。

iOS Safari 的儲存空間仍可能受系統管理。

建議定期：

- export Backup
- export field records
- 清理不需要的大量照片

---

# 15. GitHub Pages 部署與更新

## 15.1 Repository

https://github.com/YCHsiao-TW/FieldScout

## 15.2 Pages

https://ychsiao-tw.github.io/FieldScout/

## 15.3 更新方式

把新版檔案上傳／覆蓋 repository root。

主要程式檔：

- `index.html`
- `app.js`
- `api.js`
- `db.js`
- `utils.js`
- `ranking.js`
- `styles.css`
- `sw.js`
- `manifest.webmanifest`

README：

- `README.md`
- `README_ZH.md`
- `README_EN.md`

## 15.4 Cache busting

部署後可以用：

`https://ychsiao-tw.github.io/FieldScout/?v=0160`

確認載入新版。

網址的 `?v=0160` 只用於避免 Safari 拿舊頁面，不會建立另一份資料。

## 15.5 不要隨便清 Safari 網站資料

清除 Site Data 可能一起刪除：

- IndexedDB
- Trips
- records
- photos
- settings
- custom point library

若真的要清除，建議先：

**設定 → 匯出 Backup JSON**

---

# 16. 目前專案檔案

典型 repository root：

```text
FieldScout/
├── index.html
├── app.js
├── api.js
├── db.js
├── ranking.js
├── utils.js
├── styles.css
├── sw.js
├── manifest.webmanifest
├── README.md
├── README_ZH.md
└── README_EN.md
```

舊版的：

```text
offline/
```

已移除，不再需要。

---

# FieldScout 的設計原則

FieldScout 目前刻意維持幾個原則：

1. **野外工作優先於功能堆疊**
2. **Local-first，沒有網路時仍保留自己的 Trips 與 records**
3. **原始資料來源要可追溯**
4. **候選排名保持可解釋**
5. **規劃點與真正 field record 分開保存**
6. **敏感座標不因匯出模糊版本而覆蓋原始資料**
7. **先保持 static GitHub Pages 架構簡單穩定，再考慮 backend / sync**

FieldScout 目前定位為：

> **Biodiversity field scouting and field-recording decision-support tool**

而不是自動鑑定系統、SDM 平台或雲端標本資料庫。
