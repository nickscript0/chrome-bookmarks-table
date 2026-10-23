# Changelog
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
