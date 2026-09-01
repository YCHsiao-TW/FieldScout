# FieldScout v1.1.1

> Mobile-first biodiversity field scouting, trip planning, navigation, and field-recording PWA
>
> 以手機為優先的生物多樣性探點、行程規劃、野外導航與採集紀錄工具

[開啟 FieldScout](https://ychsiao-tw.github.io/FieldScout/) · [繁體中文完整說明](README_ZH.md) · [Full English documentation](README_EN.md)

FieldScout 把野外調查前後的工作串在同一個 local-first 網頁應用程式中：

**物種搜尋 → occurrence 檢視 → 候選探點排名 → Trip 規劃 → 野外導航 → 採集／觀察紀錄 → 匯出與備份**

## v1.1.1 完整功能

- **國家工作空間**：可選任何國家或 Global；同一 email 可依國家分開保存本機資料。
- **繁體中文／英文介面**：啟動時選擇，也可在設定中立即切換。
- **完整分頁 occurrence 搜尋**：整合 GBIF、iNaturalist，自動逐頁讀取，不再由 FieldScout 限制為 300／200 筆；臺灣工作空間另使用 TaiCOL 協助名稱解析。
- **進度、取消與可靠快取**：分別顯示兩個來源的讀取進度，可隨時取消；某一來源暫時故障時，可用該來源先前完整快取補足，且不會以不完整結果覆蓋完整快取。
- **完整地圖與分批清單**：地圖在背景分批加入全部篩選點位，清單每次建立 200 張卡片並在捲動到底時繼續載入；畫面分別顯示地圖與清單進度，篩選、候選排名、全部加入與匯出也都使用完整已載入結果。
- **探索與篩選**：日期、月份、距離、來源、basis of record、座標誤差、照片、地名、目前地圖範圍，以及多種排序模式。
- **候選探點排名**：依紀錄密度、近期性、月份支持、直線距離、座標品質與多來源支持計算 0–100 分，並可查看分數拆解。
- **互動地圖**：marker 與清單同步選取；提供 OpenStreetMap、OpenTopoMap 與 Esri World Imagery。
- **自訂採集點資料庫**：以 GPS、地圖中心、地圖點選、拖曳或手動座標建立；可重複加入不同 Trips。
- **Trips**：多行程管理、無行程點數限制、手動排序、由北到南、最近鄰排序、Google Maps 分段導航，以及 CSV／GeoJSON／GPX 匯出與 GPX 匯入。
- **Field 模式**：逐點導航、GPS 距離、訪查狀態、行程進度、快速建立綁定紀錄與 GPS Track GPX。
- **採集／觀察紀錄**：標本號自動編號、數量、物種、微棲地、方法、備註、現場或 Trip Point GPS、照片、Trip 關聯、編輯、刪除與 QC。
- **資料匯出**：occurrence、Trip 與 field records 的 CSV／GeoJSON／GPX；另有 deterministic 模糊座標 CSV。CSV 會中和試算表公式型內容。
- **完整備份與還原**：備份 settings、Trips、records、照片與 occurrence cache；匯入前驗證格式與大小，再以單一 IndexedDB transaction 寫入。
- **Local-first 資料管理**：資料預設留在目前瀏覽器的 IndexedDB；可切換或刪除本機 Profile，沒有自動雲端同步。

## 重要說明

- 啟動畫面輸入的 email 只用來識別本機 workspace，**不是登入帳號**，FieldScout 不會把它傳到自己的伺服器。
- 候選分數是野外探點的 heuristic decision-support score，**不是** SDM、棲地適合度、出現機率或豐度。
- FieldScout 不另設搜尋筆數上限；[GBIF Search API](https://techdocs.gbif.org/en/openapi/v1/occurrence) 本身最多可分頁到 100,000 筆，[iNaturalist API](https://www.inaturalist.org/pages/developers) 的可取得量仍受來源服務、速率限制與網路狀況影響。極大型研究資料集仍應使用來源的正式下載機制。
- 搜尋、原始圖片、導航與地圖圖磚需要網路；已保存的 workspace 資料與 occurrence cache 留在本機。
- 清除瀏覽器網站資料可能刪除 Trips、records、照片與設定，重要資料請先匯出 Backup JSON。
- Backup 可能包含 email、精確座標、照片與未公開地點，請視為敏感研究資料。

完整操作與欄位說明請見 [README_ZH.md](README_ZH.md) 或 [README_EN.md](README_EN.md)。
