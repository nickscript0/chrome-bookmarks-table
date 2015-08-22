function main() {
  chrome.bookmarks.getTree(function(bookmarks) {
    loadDatatable(nodeListToRows(bookmarks[0]));
  });
}

function buildHostnameLink(url) {
  var l = document.createElement("a");
  l.href = url;
  return '<a href="' + url + '" target="_blank">' + l.hostname + '</a>';
}

// Convert a bookmarks.getTree response to a DataTables input array
function nodeListToRows(bookmarks) {
  var node_list = flattenBTNodes(bookmarks, '');
  var output = [];
  for (var i = 0; i < node_list.length; i++) {
    b = node_list[i];
    var url = b.hasOwnProperty('url') ? b.url : '';
    var m = moment.unix(b.dateAdded / 1000);
    var date_added = m.format("MMMM DD, YYYY h:mm:ss a");
    output.push([b.title, buildHostnameLink(url), b.path, date_added, m.fromNow()]);
  }
  return output;
}

// Walks through a tree of BookmarkNodes, returning a flattened array of all the nodes
// Throws out folder nodes
function flattenBTNodes(node, path) {
  node.path = path;
  var output = [];
  if (node.hasOwnProperty('children')) {
    for (var i = 0; i < node.children.length; i++) {
      var cur_path = path === '' ? node.title : path + '/' + node.title; // Parent nodes are directories so add them to the path
      output.push.apply(output, flattenBTNodes(node.children[i], cur_path));
    }
  } else {
    output = [node];
  }
  return output;
}

// PROBLEM: unbroken text (e.g. search for pdf) extends the table past 100%

// load datatable with Collection data
function loadDatatable(aDataSet) {
  $("div#collection_div").html('<table cellpadding="0" cellspacing="0" border="1" class="display" id="collection"></table>');
  $("table#collection").dataTable({
    "bJQueryUI": true,
    "aaData": aDataSet,
    "aaSorting": [
      [3, 'desc']
    ],
    "aoColumns": [{
      "sTitle": "Title"
    }, {
      "sTitle": "URL"
    }, {
      "sTitle": "Path"
    }, {
      "sTitle": "Date Added",
      "sType": "date"
    }, {
      "sTitle": "Relative",
      "bSortable": false,
      "sWidth": "80px"
    }],
    "bPaginate": false,
    "bAutoWidth": false
  });
  $('div.dataTables_filter input').focus(); // Default focus to search field
}

main();