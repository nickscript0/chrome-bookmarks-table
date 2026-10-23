dayjs.extend(window.dayjs_plugin_relativeTime);

function main() {
  chrome.bookmarks.getTree(function(bookmarks) {
    loadDatatable(nodeListToRows(bookmarks[0]));
  });
}

function escapeHTML(text) {
  var span = document.createElement("span");
  span.textContent = text;
  return span.innerHTML;
}

function buildHostnameLink(url) {
  var link = document.createElement("a");
  try {
    var parsed = new URL(url);
    // Bookmarklets and other executable or unknown schemes stay plain text.
    if (!/^(https?|ftp|file|chrome|chrome-extension|about):$/.test(parsed.protocol)) {
      return escapeHTML(url);
    }
    link.href = parsed.href;
  } catch (_error) {
    return escapeHTML(url);
  }
  link.textContent = link.hostname || url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link.outerHTML;
}

// Convert a bookmarks.getTree response to a DataTables input array
function nodeListToRows(bookmarks) {
  var node_list = flattenBTNodes(bookmarks, '');
  var output = [];
  for (var i = 0; i < node_list.length; i++) {
    var b = node_list[i];
    var url = b.hasOwnProperty('url') ? b.url : '';
    var m = dayjs(b.dateAdded);
    var date_added = m.format("MMMM DD, YYYY h:mm:ss a");
    output.push([escapeHTML(b.title), buildHostnameLink(url), escapeHTML(b.path), date_added, m.fromNow()]);
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
