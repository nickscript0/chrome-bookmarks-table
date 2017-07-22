import * as React from "react";
import * as ReactDOM from "react-dom";

import { Table, nodeListToRows } from './components/BookmarksTable';

chrome.bookmarks.getTree(bookmarks => {
    const rows = nodeListToRows(bookmarks[0]);
    ReactDOM.render(
        <Table data={rows} />,
        document.getElementById("example")
    );
});


