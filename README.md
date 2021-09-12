# chrome-bookmarks-table
A Chrome Extension ([available on the chrome web store](https://chrome.google.com/webstore/detail/bookmarks-table/eaabmhkokgaboihbikohlooneokghmcp)) that displays your bookmarks by date in a sortable searchable table

## Updating
```bash
# Update packages
npm install

# Copy the minimal deps to ext/ so we don't have to bundle node_modules
cp node_modules/jquery/dist/jquery.min.js ext/
cp ext/datatables/js/jquery.dataTables.min.js ext/
cp node_modules/dayjs/dayjs.min.js ext/
cp node_modules/dayjs/plugin/relativeTime.js ext/

# Zip and upload new version to the Chrome Developer Dashboard https://chrome.google.com/webstore/devconsole
./zip_for_submission.sh <next-version-number>
```