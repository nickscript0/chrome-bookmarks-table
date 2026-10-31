# Changelog
## [Unreleased]

### Changed
- Match legacy stable sorting and numeric/date column detection, sorted-column colors, empty states, search control, borders, column widths, and footer layout without dependencies.
- Replace jQuery, DataTables, Day.js, and vendor styles/assets with native browser APIs and local CSS.
- Preserve the original font size, table spacing and alignment, shaded toolbar/column headers, and sort arrow appearance using CSS.
- Restore the original footer report, including entry ranges, filtered totals, and empty results.
- Use numeric English relative-date labels and sort dates directly by bookmark timestamps.
- Add accessible sorting controls, explicit loading/error/empty states, and compact overflow handling for long bookmark text.

### Added
- Dependency-free unit tests for bookmark transformation, URL safety, search, sorting, and date formatting.

## [v0.8] - 2026-10-23

### Added
- Dark mode that follows the browser's preferred color scheme, with readable link colors.
- Privacy policy describing local bookmark processing.
- Repository homepage link in Chrome's extension details.

### Fixed
- Display bookmark titles and folder paths as text to prevent HTML injection.
- Construct bookmark links safely and display bookmarklets, data URLs, and unsupported URL schemes as non-clickable text.
- Correct npm license metadata to match the project's MIT License.

## [v0.7] - 2021-09-12

### Added
- Add package.json and package update procedure in README
### Changed
- Upgrade Chrome Extension Manifest from v2 to newest v3
- Removed unnecessary permissions
- Upgrade jquery to latest version
- Replace moment.js with day.js
- Start following the [keep a changelog format](https://keepachangelog.com/en/1.0.0/) for this changelog

## [v0.6] - 2015-08-22
### Changed
- Reduce extension size from 429KB to 158KB (by removing unused assets)
