# FieldScout v1.1.2

FieldScout 是以手機操作為優先的 local-first 生物多樣性野外工作工具，將資料探索、探點、行程、導航與紀錄整合在同一個 PWA。

[開啟線上版](https://ychsiao-tw.github.io/FieldScout/) · [English documentation](README_EN.md) · [Repository](https://github.com/YCHsiao-TW/FieldScout)

> **物種搜尋 → occurrence 檢視 → 候選探點 → Trip 規劃 → 野外執行 → 採集／觀察紀錄 → 匯出與備份**

## 快速開始

1. 選擇國家或 Global、介面語言，輸入 email 後開啟本機 workspace。
2. 在「探索」搜尋物種，檢視 GBIF／iNaturalist occurrence、篩選結果與候選樣點。
3. 將 occurrence、candidate、自訂點或 GPX waypoint 加入 Trip。
4. 在「野外」逐點導航、更新訪查狀態、記錄 GPS Track，並建立採集紀錄。
5. 匯出 CSV／GeoJSON／GPX，並定期建立 Backup JSON。

底部五個主要頁面各自負責：

| 頁面 | 用途 |
|---|---|
| 探索 | 搜尋物種、檢視與篩選 occurrence、月份圖、候選探點 |
| 行程 | 建立 Trips、管理採集目標、排序、導航與匯入匯出 |
| 野外 | 執行目前 Trip、逐點導航、訪查狀態、GPS Track |
| 採集 | 建立與管理 specimen／observation records 與照片 |
| 設定 | 語言、標本號、Backup／Restore 與本機 Profile 管理 |

## Workspace、國家與語言

- 可選任何 ISO 國家或 **Global（不限制國家）**。
- 非臺灣 workspace 以 `email + country` 分開保存；同一 email 可建立多個互不混用的國家工作空間。
- 臺灣 workspace 保留既有 email workspace 的資料相容性。
- email 只用來在目前瀏覽器產生 workspace ID，並非身份驗證，也不會傳到 FieldScout 自有伺服器。
- 介面支援繁體中文與英文；語言和國家互相獨立，可在啟動畫面或設定中切換。
- Trips、records、photos、settings 與 cache 保存在 IndexedDB，沒有自動跨裝置同步。

## 探索與資料來源

### 物種解析

- **GBIF taxonomy**：學名比對與分類資訊。
- **iNaturalist taxonomy**：autocomplete、學名與 common name 建議。
- **TaiCOL**：只在臺灣 workspace 協助名稱解析；目前不是 occurrence 來源。

### Occurrence 搜尋

- GBIF 依所選國家的 ISO code 篩選；Global 不套用 country filter。
- iNaturalist 先解析國家 Place，再用 `place_id` 篩選；Global 不限制 Place。
- FieldScout 使用 GBIF 分頁與 iNaturalist observation ID 遞減接續讀取（`id_below`），不使用 iNaturalist 有筆數視窗限制的頁碼方式，也不另設應用程式總筆數上限。
- 搜尋期間會分來源顯示已讀取筆數、有效座標數與完成狀態，並可隨時取消；取消後會保留先前結果，若已有部分新結果也不會無故丟失。
- [GBIF Search API](https://techdocs.gbif.org/en/openapi/v1/occurrence) 的官方分頁上限是 100,000 筆；[iNaturalist API](https://www.inaturalist.org/pages/developers) 可取得量仍受服務、速率限制與網路狀況影響。極大型研究下載應改用資料來源提供的正式下載流程。
- 兩個來源獨立查詢；其中一個暫時不可用時，另一個仍可顯示。
- 若故障來源已有完整快取，會以 `◷` 顯示並補入先前結果；不完整的即時查詢不會覆蓋完整快取。
- 兩個來源都無法連線時，可載入最近一次本機 occurrence cache。
- 超出經緯度範圍的資料會在正規化階段排除。

### 合併與 provenance

FieldScout 會以學名、日期與約四位小數座標做工作流程上的基本合併。合併後仍保留：

- GBIF／iNaturalist 來源標籤與原始紀錄網址
- dataset name、UUID、URL、license 與記錄者（來源有提供時）
- locality、event date、basis of record 與 coordinate uncertainty
- source photos 與 media license
- obscured、withheld 或 generalized 等敏感資料標記

這種合併只用來減少畫面重複，不代表不同平台的紀錄在生物學上必然是同一筆。

### 篩選、排序與顯示

支援下列篩選：

- 起始／結束日期與月份
- 距離 1、5、10、25 或 50 km（需要目前 GPS）
- GBIF／iNaturalist
- observation／preserved specimen
- 最大座標誤差
- 有照片
- 行政區／地名文字
- 目前地圖範圍；移動或縮放地圖後會重新篩選

排序可選距離最近、最新、最舊、座標精度最好或多來源支持。12 個月份柱狀圖顯示 record count，可點月份套用／取消篩選；這不是生物豐度。

地圖在背景分批加入全部篩選點位；清單每頁最多 200 張卡片，可按上一頁／下一頁或直接輸入頁碼，避免 DOM 隨資料量無限增長。點選地圖會切到對應清單頁，marker 彈窗也能直接開啟詳情。分頁不限制總筆數；篩選、月份統計、候選排名、全部加入行程與 CSV／GeoJSON 匯出仍使用完整已載入結果。詳情可查看原始圖片、metadata、授權、敏感資料標記、原始來源與 Google Maps。

## 候選樣點排名

Occurrence 會按約 0.01 度的座標格聚合成最多 20 個 candidate sites，前五名獨立顯示。每張卡可開啟「為什麼推薦？」查看分數拆解。

| 指標 | 上限 | 內容 |
|---|---:|---|
| 紀錄密度 | 25 | 同一候選格中的有效紀錄數，採對數縮放 |
| 近期性 | 20 | 以不晚於目前年份的最新有效紀錄計算 |
| 月份支持 | 20 | 選定月份所占比例；未選月份時使用目前月份 |
| 距離／可達性 proxy | 15 | 目前 GPS 到候選點的直線距離；沒有 GPS 時給中性預設值 |
| 座標品質 | 10 | 非負 coordinate uncertainty 的真正中位數；偶數筆取中間兩值平均 |
| 多來源支持 | 10 | 單一來源 5 分，GBIF 與 iNaturalist 同時支持為 10 分 |

分數會限制在 0–100；無效座標、未來年份與無效月份不會把分數推過上限。

此分數只是一個 field-scouting heuristic。它不是 Species Distribution Model，也不能解讀為棲地適合度、出現機率、occupancy 或 abundance。

## 地圖與自訂採集點

### 底圖

- **OpenStreetMap**：道路、地名與一般判讀。
- **OpenTopoMap**：等高線與地形判讀。
- **Esri World Imagery**：衛星影像、林緣、農地、溪谷與開發區判讀。

地圖圖磚與 Leaflet 元件需要網路，FieldScout 不提供離線地圖包。

### 自訂採集點資料庫

自訂點保存在目前 workspace，可重複加入不同 Trips。欄位包含名稱、緯度、經度、點位類型、priority、目標物種與備註。

點位類型有自訂探點、採集點、停車點、步道入口、道路／入口與其他；priority 有高、中、低。

座標可以來自：

- 裝置目前 GPS
- 目前地圖中心
- 點地圖並拖曳 marker 微調
- 手動輸入 latitude／longitude
- 貼上 `24.21783, 120.97621` 格式的座標

點位庫可定位、編輯、加入目前 Trip 或刪除。修改已加入 Trip 的自訂點會同步到 linked Trip Points；從點位庫刪除時，既有 Trip Point 會保留為 snapshot，避免破壞已規劃的行程。

## Trips

Trip Point 可來自 occurrence、candidate site、自訂採集點或 GPX waypoint。點位標籤會從 A 到 Z，再繼續 AA、AB……，Trip 本身沒有點數上限。

### Trip Manager

- 建立多個具名 Trips，切換目前行程或改名。
- 保存目標物種、日期、planned／active／completed 狀態與備註。
- 查看採集目標數與已綁定 field record 數。
- 刪除 Trip 時保留 field records，並解除其 `tripId`／`tripPointId`，避免 dangling references。

### 採集目標與排序

每個 Trip Point 支援 `unvisited`、`arrived`、`surveyed`、`inaccessible` 與 `revisit`，狀態會反映在清單與 marker。

排序方式包括：

- 最近鄰 heuristic；有 GPS 時從目前位置開始，減少直線回頭路。
- 北到南排列。
- 單點上移／下移。
- 一次移除全部目標；linked records 保留但解除連結。

最近鄰是直線距離排序，不是道路最佳化。Google Maps 開啟後才會依實際道路重新導航。

### 路線、匯入與匯出

- Google Maps 多點 URL 會依安全點數與 URL 長度自動分段，下一段承接上一段終點。
- 野外頁使用逐點 Google Maps 導航，不受多 waypoint URL 限制。
- Trip 可匯出 CSV、GeoJSON 與 GPX waypoint。
- 可把 GPX waypoint 匯入目前 Trip。
- Trip CSV／GeoJSON 會保留 source、customPointId、customType、priority 與 visitStatus 等欄位。

## 野外 Field

野外頁用來實際執行目前 Trip：

- 切換行程與 A／B／C…目標，查看座標、source、visit status 與 linked record 數。
- 讀取目前 GPS，顯示定位精度及到目標的直線距離。
- 開啟單點 Google Maps 導航。
- 標記已到達、完成調查、無法到達或再訪。
- 顯示已處理數、進度條與下一個未完成目標；`surveyed` 與 `inaccessible` 計入進度。
- 快速建立採集紀錄：自動綁定目前 Trip Point、帶入物種與點位座標，儲存後回到野外頁。
- GPS Track 綁定開始時的 Trip，定位點會逐批自動保存；再次開始會新增段落，不覆蓋前段。GPX 匯出保留段落、latitude、longitude 與 timestamp，本機另保存 accuracy。若儲存失敗，未保存點會留在記憶體並提供停止按鈕重試，請勿直接關閉頁面。

## 採集／觀察紀錄

每筆 field record 可保存：

- specimen／record ID 與 count
- taxon、microhabitat、method、notes
- latitude、longitude 與 GPS accuracy
- country code、Trip、Trip Point
- 本機照片
- created／updated timestamp

記錄可新增、編輯、刪除、在地圖定位、開啟 Google Maps 或查看照片。座標可直接讀現場 GPS，或使用已選 Trip Point 的規劃座標；兩者用途不同。

紀錄表單可獨立選擇所屬行程與採集點；編輯時保留原關聯，不受目前導航行程影響。快速紀錄會建立新紀錄，已有表單內容時先詢問是否放棄。照片、紀錄與採集點狀態以單一交易儲存；禁止重複送出，失敗時保留表單。使用規劃座標時不沿用之前的 GPS 精度。

若新紀錄綁定的目標原為 `unvisited` 或 `arrived`，儲存後會自動更新為 `surveyed`。

### 標本號與照片

- 設定頁可指定 prefix 與下一號；自動編號以五位數補零，例如 `ABARA05001`。
- 照片會在瀏覽器端縮放到最長邊 1600 px、重新編碼為 JPEG，再存入 IndexedDB，不會自動上傳。

### QC

目前檢查：

- 缺 specimen／record ID
- 缺 GPS 或經緯度超出合法範圍
- GPS accuracy 大於 1000 m
- specimen／record ID 重複
- count 小於 1
- 臺灣 workspace 額外提示座標可能不在臺灣；其他國家不套用臺灣範圍

QC 是輸入檢查，不是物種鑑定或完整 Darwin Core 驗證。

## 匯出、備份與還原

### 資料匯出

| 資料 | 格式 |
|---|---|
| 目前篩選後的 occurrence | CSV、GeoJSON |
| 目前 Trip | CSV、GeoJSON、GPX waypoint |
| Field records | CSV、GeoJSON |
| GPS Track | GPX track |
| 模糊座標 records | CSV |

所有 CSV 欄位都會加引號並中和以 `=`, `+`, `@` 或非數值 `-` 開頭的試算表公式型字串；負數經緯度仍保留為數值內容。

模糊座標 CSV 依使用者指定半徑，以 profile 與 record ID 產生 deterministic 位移；相同紀錄和半徑會得到相同結果，原始座標不會被改寫。它是分享輔助工具，不替代正式敏感物種政策。

### Backup JSON

Backup 包含目前 Profile、settings、自訂點、Trips、field records 與照片；搜尋快取預設不包含，可勾選加入，不包含離線地圖。100 MiB 以內使用一般 JSON；較大的備份自動拆成附 SHA-256 校驗的多個 JSON 檔。請下載全部分檔，還原時一次選取同一組全部檔案，選取順序不限。處理備份仍需要足夠的瀏覽器記憶體與儲存空間。

還原時會：

1. 每個輸入檔案上限為 100 MiB；分檔缺漏、重複、混組或校驗失敗時，在寫入前拒絕還原。
2. 驗證版本、profile、資料陣列、ID 唯一性與照片 data URL，並可讀取支援版本的一般 JSON 備份。
3. 將每張照片轉換並限制在 15 MB 內。
4. 完成全部驗證後，以單一 IndexedDB transaction 寫入 settings、Trips、records、photos 與 cache；任一步驟失敗時不會留下半套匯入資料。
5. 跨工作空間匯入時為行程、點位、紀錄及照片建立新 ID 並維持關聯，保留原工作空間資料，以及目的工作空間的設定與既有自訂點；不跨工作空間匯入國家搜尋快取。同工作空間還原會更新相同 ID，不刪除其他未包含的資料。

Backup 可能含 email、精確座標、specimen IDs、notes、照片與未公開地點，應視為敏感研究資料，不要直接公開。

## 本機資料與使用限制

- FieldScout 沒有帳號伺服器、後端資料庫或自動 cloud sync。
- 換裝置、換瀏覽器或使用 Private Browsing 不會自動取得原 workspace。
- 清除網站資料可能刪除 IndexedDB；重要調查前後應匯出 Backup 與主要資料格式。
- GPS 需要瀏覽器持續執行；鎖屏、背景暫停、拒絕定位或儲存失敗可能中斷記錄，不能取代原生背景 GPS 記錄器。
- 搜尋、taxonomy、來源圖片、地圖圖磚與 Google Maps 依賴網路及第三方服務。
- 第三方 API 的 downtime、rate limit、CORS 或 schema 變更可能使部分來源暫時不可用。
- GBIF 的 100,000 筆官方上限、iNaturalist 的服務限制與搜尋期間的資料變動，仍可能讓結果不同於來源的正式 database download。
- GPS 距離是直線距離；GPS accuracy、來源端 obscuring 與 coordinate uncertainty 都會影響判讀。
- 大量照片會消耗瀏覽器儲存空間，iOS 仍可能由系統管理空間配額。

設定頁可切換 Profile，或永久刪除目前 Profile 在此瀏覽器中的 settings、Trips、records、photos 與 cache。刪除前請先備份。
