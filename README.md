# chrome-bookmarks-table
A Chrome Extension ([available on the chrome web store](https://chrome.google.com/webstore/detail/bookmarks-table/eaabmhkokgaboihbikohlooneokghmcp)) that displays your bookmarks by date in a sortable searchable table

## Privacy

See the [privacy policy](PRIVACY.md) for how bookmark data is processed locally.

## Development

The extension uses native browser APIs with no third-party dependencies, package
installation, compilation, or build step. Load this folder as an unpacked extension
from `chrome://extensions` with Developer mode enabled.

Run the unit tests with Node.js 22 or newer:

```bash
npm test
```

Search matches every whitespace-separated term across the displayed columns,
ignoring case and term order. Click a column header to sort; Shift-click to add
another column, reverse its direction, or remove it from the sorting order.

Dates use English labels in your local timezone. Relative dates are calculated
when the tab loads, with elapsed 24-hour days, 30-day months, and 365-day years.

## Publishing a release

The extension runs directly from the checked-in files; no compilation or npm
install is needed.

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
