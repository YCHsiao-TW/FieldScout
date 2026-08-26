# FieldScout GitHub Pages deployment

1. Create a new GitHub repository, for example `FieldScout`.
2. Upload **all files and folders in this package** to the repository root.
3. Make sure the default branch is `main`.
4. In GitHub open: **Settings → Pages**.
5. Under **Build and deployment**, set **Source** to **GitHub Actions**.
6. Push/commit the files.
7. Open the repository's **Actions** tab and wait for `Deploy FieldScout to GitHub Pages` to complete.
8. Your site will be available at a URL like:

   `https://YOUR_GITHUB_USERNAME.github.io/FieldScout/`

On iPhone:
Safari → Share → Add to Home Screen.

Important:
- GPS works best on HTTPS, which GitHub Pages provides.
- TBIA live queries may still require a small proxy if browser CORS blocks direct API access.
- The map tiles are currently online; full offline Taiwan maps are planned for a later version.
