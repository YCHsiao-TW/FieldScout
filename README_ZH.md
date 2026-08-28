# FieldScout v0.9.7

**臺灣生物多樣性野外探點、行程規劃與採集紀錄工具**

**🚀 直接開啟 App：**  
https://ychsiao-tw.github.io/FieldScout/

[English README](README_EN.md)

---

## 1. FieldScout 是什麼？

FieldScout 是一套以手機為優先、Local-first 的生物多樣性野外工具，主要目標是把「找資料 → 選採集點 → 規劃行程 → 導航 → 野外紀錄 → 匯出資料」整合在同一個介面。

目前版本完全可以部署在 **GitHub Pages**，不需要 Firebase、伺服器或登入系統。

核心流程：

**搜尋物種 → 查看 occurrence → 候選樣點排名 → 加入採集目標 → 規劃路線 → Google Maps 導航 → 野外採集／觀察紀錄 → 匯出**

---

## 2. 線上 App

FieldScout：

https://ychsiao-tw.github.io/FieldScout/

Repository：

https://github.com/YCHsiao-TW/FieldScout

---

## 3. 目前資料來源

### TaiCOL

用途：

- 名稱解析
- 協助確認學名
- taxonomy resolution

TaiCOL 目前不作為主要 occurrence 點位來源。

### GBIF

用途：

- 臺灣 occurrence records
- 座標
- 日期
- basis of record
- coordinate uncertainty
- dataset metadata
- source media（若來源提供）

### iNaturalist

用途：

- 臺灣 occurrence records
- taxon autocomplete
- 近期觀察紀錄
- 原始照片
- 觀察頁連結

### 地圖

目前提供：

- OpenStreetMap Standard
- OpenTopoMap
- CyclOSM
- Optional Offline PMTiles

### TBIA / TBN

TBIA 與 TBN occurrence 在目前純 GitHub Pages 版本中已暫時移除。

原因不是資料本身不重要，而是直接從瀏覽器呼叫 API 時，實際使用過程中出現不穩定／CORS 等問題。

目前策略：

> **先保留穩定的 GBIF + iNaturalist occurrence。**

未來如果加入 Firebase Functions 或其他 API proxy，可再把 TBIA / TBN 加回來。

---

## 4. 探索與搜尋

FieldScout 不限制生物類群，可以搜尋：

- 蜘蛛
- 昆蟲
- 兩棲類
- 爬蟲類
- 魚類
- 植物
- 其他生物

搜尋後會整合 GBIF 與 iNaturalist 的公開 occurrence 紀錄，並進行基本去重。

搜尋結果可顯示：

- 學名
- 中文名
- 日期
- locality
- 座標
- coordinate uncertainty
- source
- dataset
- basis of record
- 原始資料連結
- 原始圖片（若有）

---

## 5. 地圖介面

FieldScout 採用手機優先的 split-screen 設計：

- 上半部：地圖
- 下半部：清單與操作

地圖保持固定，下方清單可獨立捲動。

### Marker clustering

大量 occurrence 會自動 clustering，避免地圖被大量 marker 塞滿。

### Marker ↔ 清單連動

點地圖上的 marker：

1. 自動找到對應 occurrence
2. 下方清單捲到該紀錄
3. 卡片高亮
4. popup 顯示基本資訊

點清單的「地圖」：

1. 地圖移動至該點
2. 打開 marker popup
3. 高亮對應清單卡片

### Popup

marker popup 可直接：

- Google Maps 導航
- 加入行程
- 查看縮圖（若有）

---

## 6. 候選樣點排名

FieldScout 的候選樣點不是 Species Distribution Model，而是 **heuristic ranking**。

目前排名考慮：

- occurrence 密度
- 紀錄近期性
- 指定月份是否有紀錄
- 與目前位置距離
- coordinate uncertainty
- 多來源支持

結果會先顯示：

## 推薦候選樣點 Top 5

前五名固定放在原始 occurrence 前面。

其餘候選點收在：

**其他候選樣點**

可展開查看。

這個排名主要是幫助野外探點，不應被解讀為正式棲地適合度或 SDM 預測。

---

## 7. 篩選與排序

Occurrence 可依下列條件篩選：

- 起始日期
- 結束日期
- 月份
- 與目前位置距離
- 資料來源
- basis of record
- 最大 coordinate uncertainty
- 是否有照片

排序方式：

- 距離最近
- 最新紀錄
- 最舊紀錄
- 座標精度最好
- 多來源支持優先

---

## 8. 月份紀錄圖

Dashboard 會根據目前搜尋物種的 occurrence 建立 12 個月份的紀錄圖。

每個月份直接顯示：

- 月份
- occurrence 筆數
- 相對柱高

月份圖可互動：

- 點某月 → 自動回探索頁並套用該月篩選
- 再點同一月份 → 取消月份篩選

這裡表示的是 **occurrence record count**，不是生物個體 abundance。

---

## 9. 原始資料圖片

如果 GBIF 或 iNaturalist 提供原始媒體 URL，FieldScout 會顯示縮圖。

目前設計：

- 清單：56 × 56 px 小縮圖
- marker popup：小型預覽圖
- occurrence 詳情：最多 4 張縮圖
- 點縮圖：開啟來源原圖

圖片仍屬原始提供者。

FieldScout 會盡可能保留：

- media license
- source URL
- dataset metadata

使用圖片時仍應遵守來源授權。

---

## 10. Field Trips

從探索頁看到想去的點後，可以按：

**加入行程**

如果目前沒有行程，FieldScout 會自動建立一個今日 Field Trip。

行程可以包含：

- occurrence
- candidate site
- 自訂點
- GPX waypoint

---

## 11. 路線規劃

行程頁會把加入的採集目標顯示成：

A → B → C → D

並自動建立 Google Maps 多點導航。

### 路線排序

可以快速重新排列：

**北 → 南**

依緯度由高到低排列。

**離我近 → 遠**

讀取目前 GPS，依目前位置與各點位的直線距離排序。

也可使用：

- 上移
- 下移

手動調整採集順序。

Google Maps 會使用 FieldScout 排好的順序作為 waypoints。

如果點位很多，FieldScout 會自動把導航拆成多段。

---

## 12. Google Maps 導航

每個點位都有：

**導航此點**

整個行程則可以：

**開始多點導航**

Google Maps 會以目前位置作為起點。

最後一個 FieldScout 點位作為 destination，其餘點依 A → B → C 順序作為 waypoints。

---

## 13. GPX

FieldScout 支援：

### GPX Import

可以把既有 waypoint 加入目前行程。

### GPX Export

可以匯出：

- Field Trip waypoints
- GPS track

適合後續使用：

- QGIS
- Garmin
- GPX viewer
- GIS workflow

---

## 14. GPS Track

行程中可以開始 GPS track recording。

FieldScout 會記錄：

- latitude
- longitude
- timestamp
- accuracy

結束後可以匯出 GPX track。

---

## 15. Local Profile

啟動 FieldScout 時會要求輸入 email。

這個 email 的用途是建立 **Local Profile**。

例如：

`abc@example.com`

在同一支手機、同一個瀏覽器中，再輸入相同 email，就會讀取同一份：

- Trips
- 採集紀錄
- 本機照片
- 設定
- specimen counter
- occurrence cache

不同 email 會建立不同本機資料空間。

### 重要限制

這不是帳號登入。

FieldScout 不會驗證 email，也不會把 email 傳送到自己的 server。

因此：

- 換手機不會自動同步
- 換瀏覽器不會同步
- 清除 Safari 網站資料可能遺失資料

真正的登入與跨裝置同步要等未來 backend。

---

## 16. IndexedDB

FieldScout 的主要本機資料使用 IndexedDB，而不是把所有內容都塞進 localStorage。

IndexedDB 用於：

- profiles
- settings
- trips
- field records
- photos
- occurrence cache
- offline map data

優點：

- 容量較大
- 適合結構化資料
- 可保存 Blob / 圖片
- 更適合 PWA

---

## 17. 採集／觀察紀錄

FieldScout 可建立本機 field records。

欄位包含：

- specimen / record ID
- taxon
- count
- microhabitat
- collection / observation method
- notes
- GPS
- GPS accuracy
- photo
- timestamp

支援：

- 新增
- 編輯
- 刪除

---

## 18. 批次採集點

野外在同一個 locality 採很多標本時，可以使用：

**開始採集點**

FieldScout 會先取得一次 GPS。

之後新增多筆紀錄時，可以直接：

**使用採集點 GPS**

不用每隻標本重新定位。

---

## 19. 自動 specimen ID

可在設定中指定：

- Prefix
- 下一號

例如：

Prefix：

`ABARA`

Counter：

`5001`

下一筆會自動生成：

`ABARA05001`

接著：

`ABARA05002`

`ABARA05003`

---

## 20. 本機照片

Field record 可以加入照片。

照片會：

1. 在瀏覽器端重新編碼成 JPEG
2. 縮小尺寸
3. 存進 IndexedDB

不會自動上傳雲端。

---

## 21. Data Quality / QC

採集紀錄會進行基本 QC。

目前包含：

- 缺 specimen ID
- 缺 GPS
- GPS accuracy 過差
- 座標可能不在臺灣
- specimen ID 重複
- count 異常

Dashboard 會顯示 QC 摘要。

---

## 22. 匯出

### Occurrence

可匯出：

- CSV
- GeoJSON

### Field records

可匯出：

- CSV
- GeoJSON
- obscured-coordinate CSV

### Trips

可匯出：

- CSV
- GeoJSON
- GPX

---

## 23. Sensitive coordinates

Field records 可以產生模糊座標版本。

例如設定：

`1000 m`

FieldScout 會產生 deterministic obscured coordinates。

用途：

- 分享資料
- 公開資料
- 敏感物種初步保護

原始 GPS 不會因此被覆蓋。

---

## 24. Backup / Restore

可以匯出：

**FieldScout Backup JSON**

內容包含：

- Local Profile
- settings
- trips
- records
- local photos
- occurrence cache

之後可再匯入恢復。

在尚未有 Firebase cloud sync 前，建議定期做 backup。

---

## 25. Offline

FieldScout 是 PWA。

目前離線支援：

- app shell
- 已保存 Trips
- field records
- local photos
- occurrence cache
- optional raster PMTiles

### Offline PMTiles

使用者可以在：

**設定 → 離線地圖**

匯入自己的：

`.pmtiles`

目前設計以 raster PMTiles 為主。

PMTiles 不會隨 repository 一起附送，原因包括：

- 地圖授權
- GitHub repository 大小
- 不同使用者需要的 zoom level 不同

---

## 26. GitHub Pages 部署

Repository：

https://github.com/YCHsiao-TW/FieldScout

GitHub：

**Settings → Pages**

設定：

`Deploy from a branch`

Branch：

`main`

Folder：

`/(root)`

部署後網址：

https://ychsiao-tw.github.io/FieldScout/

---

## 27. 目前架構

```text
FieldScout
│
├── GitHub Pages
│
├── HTML / CSS / JavaScript
│
├── Leaflet
│   ├── OSM
│   ├── OpenTopoMap
│   ├── CyclOSM
│   └── PMTiles
│
├── Taxonomy
│   ├── TaiCOL
│   ├── GBIF
│   └── iNaturalist
│
├── Occurrence
│   ├── GBIF
│   └── iNaturalist
│
├── IndexedDB
│   ├── Local Profiles
│   ├── Trips
│   ├── Records
│   ├── Photos
│   └── Cache
│
└── Google Maps navigation
```

---

## 28. 目前限制

因為目前仍是純靜態 GitHub Pages：

- 無真正帳號登入
- 無跨裝置同步
- 無多人協作
- 無雲端照片
- 無中央 community database
- 無 server-side API proxy
- 無 server-side coordinate privacy
- 無 server-side cache
- 某些第三方 API 仍可能受到 CORS 或服務狀態影響

---

## 29. 未來 Backend

未來如果 FieldScout 進入正式多人使用階段，可以再加入 Firebase：

### Authentication

- Google login
- Gmail account

### Firestore

- cloud Trips
- field records
- settings
- shared projects

### Cloud Storage

- field photos
- specimen photos
- habitat photos

### Firebase Functions / API Proxy

這會是重新加入 TBIA / TBN 最合理的位置。

用途：

- server-side API requests
- cache
- normalization
- pagination
- CORS handling
- rate-limit control

### Community

未來可以增加：

- public records
- shared projects
- contributor attribution
- moderation
- sensitive-coordinate rules

---

## 30. FieldScout 的定位

FieldScout 不是：

- SDM
- 自動物種鑑定系統
- 官方資料庫
- 導航服務本身

FieldScout 是：

> **把生物多樣性公開資料轉成可用於野外探點、採集規劃、導航與紀錄的工作介面。**

候選樣點排名應視為野外決策輔助，而不是生態模型結果。

---

## 31. Version

Current version:

**FieldScout v0.9.7**

目前階段：

**Static / GitHub Pages / Local-first**

下一個 major architecture 預計才會導入 backend。
