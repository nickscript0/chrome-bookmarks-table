import * as React from "react";
import * as ReactDOM from "react-dom";

import {Hello, Table} from './components/BookmarksTable';

console.log('hello worlds');

ReactDOM.render(
    <Table />,
    document.getElementById("example")
);
