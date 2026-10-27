#!/bin/bash
set -eu

version=${1:?Usage: ./zip_for_submission.sh VERSION}
archive="bookmarks_table_ext_v${version}.zip"
if [ -e "$archive" ]; then
    echo "Refusing to update existing archive: $archive. Move it aside first." >&2
    exit 1
fi

zip -r "$archive" icons src main.html manifest.json -x '*.git*' '*.DS_Store'
