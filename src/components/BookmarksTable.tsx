import * as React from "react";
import ReactTable from 'react-table';
import * as moment from 'moment';
import * as matchSorter from 'match-sorter';

export interface HelloProps { compiler: string; framework: string; }

export const Hello = (props: HelloProps) => <h1>Hello from {props.compiler} and {props.framework}!!!</h1>;

export class Hello2 extends React.Component<HelloProps, undefined> {
    render() {
        return <h1>Hello from {this.props.compiler} and {this.props.framework}!</h1>;
    }
}

const DEFAULT_MIN_WIDTH = 40;

const columns = [
    {
        Header: 'Title',
        accessor: 'title',
        minWidth: 80,
        filterMethod: (filter, rows) =>
            matchSorter(rows, filter.value, { keys: ['title', 'url', 'path'] }),
        filterAll: true
    },
    {
        Header: 'URL',
        accessor: 'url',
        minWidth: DEFAULT_MIN_WIDTH,
        Cell: row => {
            const l = document.createElement("a");
            l.href = row.value;
            return (<a href={row.value} target="_blank">{l.hostname}</a>);
        }
    },
    {
        Header: 'Path',
        minWidth: DEFAULT_MIN_WIDTH,
        accessor: 'path'
    },
    {
        Header: 'Date Added',
        minWidth: DEFAULT_MIN_WIDTH,
        accessor: 'date',
        Cell: row => {
            const m = moment.unix(row.value / 1000);
            return m.format("MMMM DD, YYYY h:mm:ss a");
        }
    },
    {
        Header: 'Relative',
        minWidth: 20,
        accessor: 'relativeDate',
        filterable: false
    }
];



export interface TableProps { data: Bookmark[] }

export class Table extends React.Component<TableProps, any> {
    render() {

        return <ReactTable
            data={this.props.data}
            columns={columns}
            defaultSorted={[{
                id: 'date',
                desc: true
            }]}
            filterable={true}
        />
    }
}

class Bookmark {
    title: string
    url: string;
    path: string;
    date: string;
    relativeDate: string;

    constructor(title, url, path, date) {
        this.title = title;
        this.url = url;
        this.path = path;

        this.date = date;
        const m = moment.unix(date / 1000);
        this.relativeDate = m.fromNow();
    }
}

function main() {
    chrome.bookmarks.getTree(bookmarks => {
        nodeListToRows(bookmarks[0])
    });
}

// Convert a bookmarks.getTree response to a DataTables input array
export function nodeListToRows(bookmarks: chrome.bookmarks.BookmarkTreeNode): Bookmark[] {
    var node_list = flattenBTNodes(bookmarks, '');
    var output: Bookmark[] = [];
    for (var i = 0; i < node_list.length; i++) {
        let b = node_list[i];
        output.push(new Bookmark(b.title, b.url, b.path, b.dateAdded));
    }
    return output;
}


interface BTNodePath extends chrome.bookmarks.BookmarkTreeNode {
    path: string;
}
// Walks through a tree of BookmarkNodes, returning a flattened array of all the nodes
// Throws out folder nodes
function flattenBTNodes(node: chrome.bookmarks.BookmarkTreeNode, path: string): BTNodePath[] {
    const btnode = node as BTNodePath;
    btnode.path = path;

    var output: BTNodePath[] = [];
    if (btnode.hasOwnProperty('children')) {
        for (var i = 0; i < btnode.children.length; i++) {
            var cur_path = path === '' ? btnode.title : path + '/' + btnode.title; // Parent nodes are directories so add them to the path
            output.push.apply(output, flattenBTNodes(btnode.children[i], cur_path));
        }
    } else {
        output = [btnode];
    }
    return output;
}