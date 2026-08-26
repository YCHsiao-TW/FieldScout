# FieldScout v0.9.4 — Route Planner

**🚀 直接開啟 App：<https://ychsiao-tw.github.io/FieldScout/>**

## v0.9.4 行程介面

行程頁改成以「本次採集路線」為核心。從探索頁加入 A、B、C 等採集目標後，FieldScout 會依加入／排列順序顯示 A → B → C，並自動產生 Google Maps 多點導航連結。點位過多時自動分段；每個點也保留單點導航。行程點可用「上移／下移」調整導航順序。

## v0.9.4 修正

修正所有「加入行程」入口：若尚未建立行程會自動建立今日行程；舊版行程資料會自動正規化；無效經緯度與重複點位會顯示明確提示。清單、marker popup、候選探點、全部加入與自訂點共用同一套安全流程。

FieldScout 是一套以手機為優先、Local-first 的臺灣生物多樣性野外探點、行程規劃、導航與採集紀錄 PWA。

目前仍維持 **GitHub Pages / 無 Firebase backend**。

## v0.9.4 新增資料來源

Occurrence 搜尋現在整合：

- TBIA
- **TBN 台灣生物多樣性網絡 API v2.6**
- GBIF
- iNaturalist

FieldScout 會同時嘗試各資料來源，正規化後進行去重。

## TBN

FieldScout 使用 TBN 官方 **Open API v2.6**。

TBN occurrence 資料會保留：

- occurrence ID
- scientific / vernacular name
- 日期
- 公開座標
- coordinate uncertainty
- basis of record
- dataset UUID
- dataset name
- dataset URL
- dataset author
- dataset publisher
- license
- media license
- recordedBy
- identification status
- TBN sensitive category
- dataGeneralizations
- source URL
- associated media metadata

TBN API 對敏感資料可能進行模糊化或不提供座標。FieldScout **只使用 TBN Open API 公開回傳的座標**，不會嘗試推算或還原被隱藏的位置。

沒有公開座標的 TBN occurrence 不會被加入地圖點位。

## 臺灣蛛式會社

臺灣蛛式會社的 TBN 正式資料集：

**TBN-DP 臺灣蛛式會社 (蜘蛛公民科學調查)**

Dataset UUID：

`3edadeb1-36e6-4dc0-9a4c-8c6ca9c44618`

FieldScout 偵測到此 dataset 時，來源會顯示：

`TBN` + `臺灣蛛式會社`

因此在來源篩選器可以選：

- 全部
- TBIA
- TBN
- **臺灣蛛式會社**
- GBIF
- iNaturalist

臺灣蛛式會社原站：

<https://spider.tbn.org.tw/>

TBN dataset：

<https://www.tbn.org.tw/dataset/3edadeb1-36e6-4dc0-9a4c-8c6ca9c44618>

## Occurrence 詳情

點「詳情」現在會額外顯示 TBN 提供的：

- Dataset
- Dataset UUID
- dataset author
- license
- 記錄者
- 鑑定狀態
- 海拔（若有）
- sensitive category
- 是否已由資料來源泛化

並提供原始資料來源連結。

## 匯出

搜尋結果 CSV / GeoJSON 現在會額外保留：

- datasetUUID
- datasetName
- datasetURL
- license
- sensitiveCategory
- dataGeneralizations
- sourceUrls

方便回到原始資料與保留 attribution。

## TBN API 筆數

TBN API v2.6 單次最多回傳 1000 筆。

FieldScout 靜態版目前每次 taxon search 讀取 TBN 前 1000 筆；如果 TBN 回報總筆數超過 1000，狀態列會顯示：

`TBN 共 N 筆，本次讀取前 1000 筆`

未來有 backend 時可再改成 server-side pagination / cache。

## 其他功能

v0.9.4 仍包含：

- Local email profile
- IndexedDB
- 上地圖／下清單 split view
- map marker ↔ list 連動
- marker clustering
- marker popup Google Maps / 加入行程
- OSM / OpenTopoMap / CyclOSM
- Local raster PMTiles import
- taxonomy autocomplete
- advanced filter / sorting
- 季節性摘要
- Candidate Ranking v2
- 多 Field Trips
- 自訂探點
- GPX import/export
- GPS track
- batch collection site
- automatic specimen numbering
- local photos
- QC
- CSV / GeoJSON
- obscured-coordinate export
- Dashboard
- Backup / Restore

## 注意

目前仍為 GitHub Pages，因此各 API 是否能由瀏覽器直接取得仍受到來源端 CORS 與服務狀態影響。

如果 TBN 或其他來源暫時無法從瀏覽器取得，FieldScout 會繼續使用其他可用來源，而不是讓整個搜尋失敗。

未來 Firebase/backend 最重要的工作之一會是建立穩定的 API proxy 與 cache。
