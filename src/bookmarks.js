const monthFormatter = new Intl.DateTimeFormat("en", { month: "long" });
const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "always" });
const allowedProtocols = new Set(["http:", "https:", "ftp:", "file:", "chrome:", "chrome-extension:", "about:"]);
const sortableColumns = new Set(["title", "url", "path", "dateAdded"]);
const relativeUnits = [
  ["year", 365 * 24 * 60 * 60 * 1000],
  ["month", 30 * 24 * 60 * 60 * 1000],
  ["day", 24 * 60 * 60 * 1000],
  ["hour", 60 * 60 * 1000],
  ["minute", 60 * 1000],
  ["second", 1000],
];

function isValidTimestamp(value) {
  return Number.isFinite(value) && !Number.isNaN(new Date(value).getTime());
}

export function formatAbsoluteDate(timestamp) {
  if (!isValidTimestamp(timestamp)) return "—";
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");
  return `${monthFormatter.format(date)} ${pad(date.getDate())}, ${date.getFullYear()} ${date.getHours() % 12 || 12}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ${date.getHours() < 12 ? "am" : "pm"}`;
}

export function formatRelativeDate(timestamp, now = Date.now()) {
  if (!isValidTimestamp(timestamp) || !isValidTimestamp(now)) return "—";
  const difference = timestamp - now;
  const magnitude = Math.abs(difference);
  if (magnitude < 1000) return "now";
  const [unit, duration] = relativeUnits.find(([, duration]) => magnitude >= duration);
  return relativeFormatter.format(Math.sign(difference) * Math.round(magnitude / duration), unit);
}

export function classifyBookmarkUrl(url) {
  try {
    const parsed = new URL(url);
    if (allowedProtocols.has(parsed.protocol)) {
      return { href: parsed.href, label: parsed.hostname || url };
    }
  } catch {
    // Malformed URLs and executable schemes are displayed as plain text.
  }
  return { href: null, label: url };
}

// Flatten without changing Chrome's nodes or depending on JavaScript's recursion limit.
export function buildBookmarkRows(tree, now = Date.now()) {
  const pending = tree.map((node) => ({ node, path: "" })).reverse();
  const rows = [];
  while (pending.length > 0) {
    const { node, path } = pending.pop();
    const title = node.title || "";
    if (Array.isArray(node.children)) {
      const childPath = path === "" ? title : `${path}/${title}`;
      for (let index = node.children.length - 1; index >= 0; index--) {
        pending.push({ node: node.children[index], path: childPath });
      }
    } else if (typeof node.url === "string") {
      const { href, label: urlLabel } = classifyBookmarkUrl(node.url);
      const dateAdded = isValidTimestamp(node.dateAdded) ? node.dateAdded : null;
      const dateLabel = formatAbsoluteDate(dateAdded);
      const relativeLabel = formatRelativeDate(dateAdded, now);
      rows.push({
        index: rows.length, title, url: node.url, href, urlLabel, path, dateAdded,
        dateLabel, relativeLabel,
        searchText: [title, urlLabel, path, dateLabel, relativeLabel].join("  ").replace(/[\r\n]/g, " ").toLowerCase(),
        sortValues: { title: title.toLowerCase(), url: urlLabel.toLowerCase(), path: path.toLowerCase(), dateAdded },
      });
    }
  }
  return rows;
}

export function filterRows(rows, query) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return terms.length === 0 ? rows : rows.filter((row) => terms.every((term) => row.searchText.includes(term)));
}

export function sortRows(rows, sorting) {
  return [...rows].sort((left, right) => {
    for (const { column, direction } of sorting) {
      const a = left.sortValues[column];
      const b = right.sortValues[column];
      if (column === "dateAdded" && (a === null || b === null)) {
        if (a !== b) return a === null ? 1 : -1;
        continue;
      }
      const comparison = a < b ? -1 : a > b ? 1 : 0;
      if (comparison !== 0) return direction === "desc" ? -comparison : comparison;
    }
    return left.index - right.index;
  });
}

export function updateSorting(sorting, column, additive = false) {
  if (!sortableColumns.has(column)) return sorting;
  if (!additive) {
    const direction = sorting.length === 1 && sorting[0].column === column && sorting[0].direction === "asc"
      ? "desc" : "asc";
    return [{ column, direction }];
  }
  const current = sorting.find((sort) => sort.column === column);
  if (!current) return [...sorting, { column, direction: "asc" }];
  return current.direction === "asc"
    ? sorting.map((sort) => sort.column === column ? { column, direction: "desc" } : sort)
    : sorting.filter((sort) => sort.column !== column);
}
