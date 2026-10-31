import { buildBookmarkRows, filterRows, sortRows, updateSorting } from "./bookmarks.js";

const search = document.querySelector("#search");
const body = document.querySelector("#bookmark-rows");
const emptyRow = document.querySelector("#empty-row");
const count = document.querySelector("#result-count");
const errorMessage = document.querySelector("#error-message");
const buttons = [...document.querySelectorAll("button[data-column]")];

let rows = [];
let sorting = [{ column: "dateAdded", direction: "desc" }];
const rowElements = new Map();

function createRow(bookmark) {
  const row = document.createElement("tr");
  for (const value of [bookmark.title, bookmark.urlLabel, bookmark.path,
    bookmark.dateLabel, bookmark.relativeLabel]) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.append(cell);
  }
  if (bookmark.href !== null) {
    const link = document.createElement("a");
    link.href = bookmark.href;
    link.textContent = bookmark.urlLabel;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    row.cells[1].replaceChildren(link);
  }
  return row;
}

function updateHeaders() {
  for (const button of buttons) {
    const { column, label } = button.dataset;
    const priority = sorting.findIndex((sort) => sort.column === column);
    const sort = sorting[priority];
    const header = button.closest("th");
    header.removeAttribute("aria-sort");
    if (priority === 0) {
      header.setAttribute("aria-sort", sort.direction === "asc" ? "ascending" : "descending");
    }
    const indicator = button.querySelector(".sort-indicator");
    indicator.dataset.direction = sort?.direction || "none";
    indicator.textContent = "";
    const state = sort
      ? `${sort.direction === "asc" ? "ascending" : "descending"}, sort priority ${priority + 1}`
      : "not sorted";
    const nextDirection = sorting.length === 1 && sort?.direction === "asc" ? "descending" : "ascending";
    const shiftAction = !sort ? "add ascending sorting"
      : sort.direction === "asc" ? "sort descending" : "remove this sort";
    const description = `${label}, ${state}. Click to sort ${nextDirection} by this column only. Shift-click to ${shiftAction}.`;
    button.setAttribute("aria-label", description);

  }
}

function render() {
  const visible = filterRows(rows, search.value);
  const fragment = document.createDocumentFragment();
  const columnPriorities = buttons.map(button => sorting.findIndex(sort => sort.column === button.dataset.column) + 1);
  for (const bookmark of visible) {
    const row = rowElements.get(bookmark.index);
    for (let index = 0; index < row.cells.length; index++) {
      const priority = columnPriorities[index] || 0;
      row.cells[index].dataset.sortPriority = priority ? String(Math.min(priority, 3)) : "";
    }
    fragment.append(row);
  }
  if (visible.length === 0) {
    emptyRow.cells[0].textContent = rows.length === 0 ? "No data available in table" : "No matching records found";
    fragment.append(emptyRow);
  }
  body.replaceChildren(fragment);
  const displayed = visible.length.toLocaleString("en");
  count.textContent = `Showing ${visible.length === 0 ? 0 : 1} to ${displayed} of ${displayed} entries`;
  if (visible.length !== rows.length) {
    count.textContent += ` (filtered from ${rows.length.toLocaleString("en")} total entries)`;
  }
  updateHeaders();
}

function showError(error) {
  body.replaceChildren();
  count.textContent = "Bookmarks could not be loaded.";
  errorMessage.textContent = `Could not load bookmarks. ${error.message || "Please try reopening this tab."}`;
  errorMessage.hidden = false;
}

search.addEventListener("input", render);
for (const button of buttons) {
  button.addEventListener("click", (event) => {
    sorting = updateSorting(sorting, button.dataset.column, event.shiftKey);
    rows = sortRows(rows, sorting);
    render();
  });
}

updateHeaders();
try {
  chrome.bookmarks.getTree((tree) => {
    const error = chrome.runtime.lastError;
    if (error) {
      showError(error);
      return;
    }
    try {
      rows = sortRows(buildBookmarkRows(tree), sorting);
      for (const bookmark of rows) {
        rowElements.set(bookmark.index, createRow(bookmark));
      }
      render();
      search.disabled = false;
      for (const button of buttons) button.disabled = false;
      search.focus();
    } catch (error) {
      showError(error);
    }
  });
} catch (error) {
  showError(error);
}
