# FieldScout Mobile Web v0.3.0

這一版改成 **純前端、mobile-first PWA**。

## 使用方式

不需要 Python、不需要 FastAPI、不需要資料庫伺服器。

只要把整個資料夾部署到任何 HTTPS 靜態網站服務：

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages

之後用 iPhone Safari 打開網址即可。

> GPS 在 iPhone 瀏覽器上通常需要 HTTPS；直接雙擊本機 HTML 不適合作為正式使用方式。

## 已完成

- 手機優先 UI
- Leaflet 地圖
- iPhone / Android browser GPS
- TBIA occurrence live query (`name` + `bioGroup=蜘蛛`)
- occurrence 地圖顯示
- 距離目前位置篩選
- heuristic 候選探點排名
- 今日行程
- localStorage 本機保存
- 現場採集紀錄
- CSV / GeoJSON 匯出
- PWA manifest
- service worker app-shell cache

## 重要限制

1. TBIA 是否可被瀏覽器直接跨網域讀取取決於 API 的 CORS 設定。若正式部署後被 CORS 阻擋，需要加一個很薄的 serverless proxy。
2. OpenStreetMap 線上圖磚目前不是完整離線地圖。正式野外版應改為合法授權的 PMTiles/vector tiles。
3. localStorage 只存在該瀏覽器/裝置；尚未做帳號與雲端同步。
4. 候選探點是 heuristic，不是 SDM。

## iPhone

部署至 HTTPS 後：

Safari → 分享 → 加入主畫面

即可用接近 App 的 standalone 模式開啟。


## v0.3.0 search changes

Search now uses a fallback chain suitable for a static GitHub Pages site:

1. TaiCOL `nameMatch` resolves Chinese/scientific names where browser access is available.
2. FieldScout tries TBIA occurrence data first.
3. If TBIA is blocked by browser CORS, FieldScout automatically queries GBIF Taiwan occurrences and iNaturalist Taiwan observations.
4. Records are normalized into the same map/list/ranking workflow.
5. A new `全臺` radius option prevents GPS location from hiding valid records elsewhere in Taiwan.

This remains a client-only prototype. A future first-party proxy is still recommended for reliable TBIA access.


## v0.3.1 field-record editing

- Existing field records can be edited.
- Edit loads specimen ID, count, taxon, microhabitat, method, notes and GPS back into the form.
- Saving while editing updates the original record instead of creating a duplicate.
- Records can be deleted with confirmation.
- Records can be located on the map when GPS exists.
- Created and updated timestamps are retained.
- Legacy localStorage records from v0.2/v0.3 are migrated in the browser.
