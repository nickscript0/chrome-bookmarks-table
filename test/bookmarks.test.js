import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { test } from "node:test";
import {
  buildBookmarkRows, classifyBookmarkUrl, filterRows,
  formatAbsoluteDate, formatRelativeDate, sortRows, updateSorting,
} from "../src/bookmarks.js";

const now = Date.UTC(2026, 9, 26, 12);
const day = 24 * 60 * 60 * 1000;
const bookmark = (title, dateAdded = now, url = "https://example.com/hidden-path") => ({ title, dateAdded, url });

test("flatten nested folders in tree order without changing Chrome's nodes", () => {
  const tree = [{ title: "", children: [
    { title: "Bookmarks bar", children: [
      bookmark("First"),
      { title: "<Work & Research>", children: [bookmark("<script>alert(1)</script>")] },
      { title: "Empty", children: [] },
    ] },
    { title: "Other bookmarks", children: [bookmark("Last")] },
  ] }];
  const original = structuredClone(tree);
  const rows = buildBookmarkRows(tree, now);
  assert.deepEqual(rows.map((row) => [row.title, row.path, row.index]), [
    ["First", "Bookmarks bar", 0],
    ["<script>alert(1)</script>", "Bookmarks bar/<Work & Research>", 1],
    ["Last", "Other bookmarks", 2],
  ]);
  assert.deepEqual(tree, original);
  assert.deepEqual(buildBookmarkRows([], now), []);
  assert.deepEqual(buildBookmarkRows([{ title: "Empty" }], now), []);
});

test("flatten a deeply nested tree without exhausting the call stack", () => {
  let node = bookmark("Deep bookmark");
  for (let index = 0; index < 15000; index++) node = { title: "f", children: [node] };
  const [row] = buildBookmarkRows([node], now);
  assert.equal(row.title, "Deep bookmark");
  assert.equal(row.path.split("/").length, 15000);
});

test("allow the existing URL protocols and show hostname labels where available", () => {
  for (const [url, href, label] of [
    ["HTTPS://Example.COM/path?q=1", "https://example.com/path?q=1", "example.com"],
    ["http://example.com", "http://example.com/", "example.com"],
    ["ftp://example.com/a", "ftp://example.com/a", "example.com"],
    ["file:///tmp/a.pdf", "file:///tmp/a.pdf", "file:///tmp/a.pdf"],
    ["chrome://settings/", "chrome://settings/", "settings"],
    ["chrome-extension://abcdef/main.html", "chrome-extension://abcdef/main.html", "abcdef"],
    ["about:blank", "about:blank", "about:blank"],
  ]) assert.deepEqual(classifyBookmarkUrl(url), { href, label });
});

test("bookmarklets, data URLs, unknown schemes, and malformed URLs stay plain text", () => {
  for (const url of [
    "javascript:alert(1)", "JaVaScRiPt:alert(1)", "java\nscript:alert(1)",
    "data:text/html,<script>alert(1)</script>", "vbscript:msgbox(1)",
    "mailto:someone@example.com", "custom:example", "blob:https://example.com/id",
    "https://", "not a URL", "/relative", "", "<img src=x onerror=alert(1)>",
  ]) assert.deepEqual(classifyBookmarkUrl(url), { href: null, label: url });
});

test("search matches literal terms across displayed columns in any order", () => {
  const rows = buildBookmarkRows([{ title: "Research", children: [
    bookmark("PDF [draft].* A&B", now - 2 * day),
    bookmark("Other page", now),
  ] }], now);
  for (const query of ["PDF RESEARCH", " research\tPDF\n", "ago example.com", "[draft].*", "a&b"]) {
    assert.deepEqual(filterRows(rows, query).map((row) => row.index), [0]);
  }
  assert.equal(filterRows(rows, "").length, 2);
  assert.equal(filterRows(rows, " \n\t ").length, 2);
  assert.equal(filterRows(rows, "PDF missing").length, 0);
  assert.equal(filterRows(rows, "hidden-path").length, 0);
  assert.equal(filterRows(rows, rows[0].dateLabel).length, 1);
  assert.equal(filterRows(rows, "(").length, 0);
});

test("absolute dates preserve English text, local time, padding, and 12-hour clocks", () => {
  for (const [date, expected] of [
    [new Date(2026, 0, 2, 0, 3, 4), "January 02, 2026 12:03:04 am"],
    [new Date(2026, 0, 2, 12, 3, 4), "January 02, 2026 12:03:04 pm"],
    [new Date(2024, 1, 29, 23, 59, 59), "February 29, 2024 11:59:59 pm"],
  ]) assert.equal(formatAbsoluteDate(date.getTime()), expected);
});

test("absolute dates use the browser's local timezone across DST transitions", () => {
  const moduleUrl = new URL("../src/bookmarks.js", import.meta.url).href;
  const source = `import { formatAbsoluteDate } from ${JSON.stringify(moduleUrl)};
    console.log(JSON.stringify([
      formatAbsoluteDate(Date.parse('2026-03-08T05:59:59Z')),
      formatAbsoluteDate(Date.parse('2026-03-08T06:00:00Z')),
      formatAbsoluteDate(Date.parse('2026-11-01T04:59:59Z')),
      formatAbsoluteDate(Date.parse('2026-11-01T05:00:00Z'))
    ]));`;
  const output = execFileSync(process.execPath, ["--input-type=module", "-e", source], {
    encoding: "utf8", env: { ...process.env, TZ: "America/Halifax" },
  });
  assert.deepEqual(JSON.parse(output), [
    "March 08, 2026 1:59:59 am", "March 08, 2026 3:00:00 am",
    "November 01, 2026 1:59:59 am", "November 01, 2026 1:00:00 am",
  ]);
});

test("relative dates select elapsed units, round quantities, and support future timestamps", () => {
  for (const [elapsed, expected] of [
    [0, "now"], [999, "now"], [1000, "1 second ago"],
    [1499, "1 second ago"], [1500, "2 seconds ago"],
    [59999, "60 seconds ago"], [60000, "1 minute ago"],
    [90 * 1000, "2 minutes ago"], [60 * 60 * 1000, "1 hour ago"],
    [day, "1 day ago"], [30 * day, "1 month ago"],
    [364 * day, "12 months ago"], [365 * day, "1 year ago"],
    [2 * 365 * day, "2 years ago"],
  ]) {
    assert.equal(formatRelativeDate(now - elapsed, now), expected);
    assert.equal(formatRelativeDate(now + elapsed, now), expected === "now" ? "now" : `in ${expected.replace(" ago", "")}`);
  }
});

test("relative days are elapsed 24-hour periods, including across DST and leap days", () => {
  assert.equal(formatRelativeDate(Date.parse("2026-03-07T12:00:00-04:00"), Date.parse("2026-03-08T12:00:00-03:00")), "23 hours ago");
  assert.equal(formatRelativeDate(Date.parse("2024-02-29T12:00:00Z"), Date.parse("2024-03-01T12:00:00Z")), "1 day ago");
});

test("missing, invalid, and out-of-range dates stay unavailable; epoch zero is valid", () => {
  for (const value of [undefined, null, NaN, Infinity, "1234", 9e15]) {
    assert.equal(formatAbsoluteDate(value), "—");
    assert.equal(formatRelativeDate(value, now), "—");
    const [row] = buildBookmarkRows([{ title: "Missing", url: "https://example.com", dateAdded: value }], now);
    assert.equal(row.dateAdded, null);
  }
  assert.equal(buildBookmarkRows([{ title: "Missing", url: "https://example.com" }], now)[0].dateAdded, null);
  assert.equal(buildBookmarkRows([bookmark("Epoch", 0)], now)[0].dateAdded, 0);
  assert.notEqual(formatAbsoluteDate(0), "—");
});

test("sort timestamps directly with stable ties and unavailable dates last in both directions", () => {
  const rows = buildBookmarkRows([
    bookmark("Newest", now), bookmark("Older", now - day),
    bookmark("Same time", now), bookmark("Missing", null), bookmark("Invalid", NaN),
  ], now);
  assert.deepEqual(sortRows(rows, [{ column: "dateAdded", direction: "desc" }]).map((row) => row.title),
    ["Newest", "Same time", "Older", "Missing", "Invalid"]);
  assert.deepEqual(sortRows(rows, [{ column: "dateAdded", direction: "asc" }]).map((row) => row.title),
    ["Older", "Newest", "Same time", "Missing", "Invalid"]);
  assert.deepEqual(rows.map((row) => row.index), [0, 1, 2, 3, 4]);
});

test("combine case-insensitive sorts and retain input order for final ties", () => {
  const rows = buildBookmarkRows([
    bookmark("beta", now), bookmark("alpha", now - day),
    bookmark("Alpha", now), bookmark("ALPHA", now),
  ], now);
  assert.deepEqual(sortRows(rows, [
    { column: "title", direction: "asc" }, { column: "dateAdded", direction: "desc" },
  ]).map((row) => row.index), [2, 3, 1, 0]);
  assert.deepEqual(sortRows(rows, [{ column: "title", direction: "desc" }]).map((row) => row.index), [0, 1, 2, 3]);
  assert.deepEqual(sortRows(rows, []).map((row) => row.index), [0, 1, 2, 3]);
});

test("ties preserve previous sorts, including after filtering and removing the last sort", () => {
  const rows = buildBookmarkRows([
    bookmark("Shared", now - day), bookmark("Shared", now), bookmark("Other", now - 2 * day),
  ], now);
  const newest = sortRows(rows, [{ column: "dateAdded", direction: "desc" }]);
  const titled = sortRows(newest, [{ column: "title", direction: "asc" }]);
  assert.deepEqual(titled.map(row => row.index), [2, 1, 0]);
  assert.deepEqual(filterRows(titled, "shared").map(row => row.index), [1, 0]);
  assert.deepEqual(sortRows(titled, []), titled);
});

test("infer legacy numeric/date types and retain escaped-text punctuation order", () => {
  for (const [titles, expected] of [
    [["10", "2", "100", "1"], ["1", "2", "10", "100"]],
    [["March 01, 2024", "January 01, 2024", "February 01, 2024"], ["January 01, 2024", "February 01, 2024", "March 01, 2024"]],
    [["/ path", "<literal>", "& ampersand", "! bang"], ["! bang", "& ampersand", "<literal>", "/ path"]],
  ]) {
    const rows = buildBookmarkRows(titles.map(title => bookmark(title)), now);
    assert.deepEqual(sortRows(rows, [{ column: "title", direction: "asc" }]).map(row => row.title), expected);
    assert.deepEqual(sortRows(rows, [{ column: "title", direction: "desc" }]).map(row => row.title), [...expected].reverse());
  }
  const mixed = buildBookmarkRows([bookmark("10"), bookmark("2"), bookmark("Text")], now);
  assert.deepEqual(sortRows(mixed, [{ column: "title", direction: "asc" }]).map(row => row.title), ["10", "2", "Text"]);
  const blanks = buildBookmarkRows(["10", "", "2", "-"].map(title => bookmark(title)), now);
  assert.deepEqual(sortRows(blanks, [{ column: "title", direction: "asc" }]).map(row => row.title), ["", "-", "2", "10"]);
  assert.deepEqual(sortRows(blanks, [{ column: "title", direction: "desc" }]).map(row => row.title), ["10", "2", "", "-"]);
});

test("sort URLs by their displayed labels and paths by literal text", () => {
  const rows = buildBookmarkRows([
    { title: "Z folder", children: [bookmark("A", now, "https://a.example/z")] },
    { title: "a folder", children: [bookmark("Z", now, "https://z.example/a")] },
  ], now);
  assert.deepEqual(sortRows(rows, [{ column: "url", direction: "asc" }]).map((row) => row.index), [0, 1]);
  assert.deepEqual(sortRows(rows, [{ column: "path", direction: "asc" }]).map((row) => row.index), [1, 0]);
});

test("header activation toggles single sorting and Shift cycles added sorts without mutation", () => {
  const initial = [{ column: "dateAdded", direction: "desc" }];
  assert.deepEqual(updateSorting(initial, "dateAdded"), [{ column: "dateAdded", direction: "asc" }]);
  const title = updateSorting(initial, "title");
  assert.deepEqual(title, [{ column: "title", direction: "asc" }]);
  assert.deepEqual(updateSorting(title, "title"), [{ column: "title", direction: "desc" }]);
  const combined = updateSorting(initial, "title", true);
  assert.deepEqual(combined, [...initial, ...title]);
  const reversed = updateSorting(combined, "title", true);
  assert.deepEqual(reversed[1], { column: "title", direction: "desc" });
  assert.deepEqual(updateSorting(reversed, "title", true), initial);
  assert.deepEqual(updateSorting(combined, "dateAdded", true), title);
  assert.deepEqual(updateSorting(initial, "dateAdded", true), []);
  assert.deepEqual(updateSorting(combined, "title"), title);
  assert.deepEqual(updateSorting(initial, "relative", true), initial);
  assert.deepEqual(initial, [{ column: "dateAdded", direction: "desc" }]);
});
