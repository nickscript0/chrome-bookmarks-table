# chrome-bookmarks-table
A Chrome Extension ([available on the chrome web store](https://chrome.google.com/webstore/detail/bookmarks-table/eaabmhkokgaboihbikohlooneokghmcp)) that displays your bookmarks by date in a sortable searchable table

## Privacy

See the [privacy policy](PRIVACY.md) for how bookmark data is processed locally.

## Publishing a release

The extension runs directly from the checked-in files; no compilation or npm
install is needed for a release that keeps the existing dependencies.

1. Update `manifest.json` to a version higher than the published store version and
   add the release notes to `CHANGELOG.md`. The version in `package.json` is not
   the Chrome extension version.
2. Load the folder as an unpacked extension in a separate Chrome profile. Check
   light/dark appearance, searching, sorting, and opening bookmarks. Titles and
   folder names containing HTML must appear literally; bookmarklets and data URLs
   must be non-clickable.
3. Create a fresh ZIP, then extract it and load that folder for a final smoke test:

   ```bash
   ./zip_for_submission.sh 0.8
   ```

4. Upload the ZIP to the existing item in the
   [Chrome Developer Dashboard](https://chrome.google.com/webstore/devconsole).
   Set the listing's Homepage URL to
   [the repository](https://github.com/nickscript0/chrome-bookmarks-table).
   Replace the description's "please see the website link" sentence with
   "Open Source under the MIT License. Available on GitHub:
   https://github.com/nickscript0/chrome-bookmarks-table".
   Confirm its privacy declarations describe local bookmark processing. After
   `PRIVACY.md` is published on GitHub, use
   [the public privacy policy](https://github.com/nickscript0/chrome-bookmarks-table/blob/master/PRIVACY.md)
   as the privacy policy URL in the dashboard, then submit for review.

The ZIP filename does not change the version in `manifest.json`. Always create a
new archive instead of updating an existing ZIP, which can retain deleted files.

## Updating dependencies separately

The bundled DataTables 1.9.4 is maintained manually and is not covered by npm audit.
The commands below only refresh jQuery and Day.js. A DataTables upgrade needs its
own compatibility testing.

```bash
# Update packages
npm install

# Copy the minimal deps to ext/ so we don't have to bundle node_modules
cp node_modules/jquery/dist/jquery.min.js ext/
cp node_modules/dayjs/dayjs.min.js ext/
cp node_modules/dayjs/plugin/relativeTime.js ext/
```
