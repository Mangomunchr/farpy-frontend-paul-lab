# BLENDER_ADDON_DOWNLOAD_POLISH_V1

## Scope

Frontend-only clarity pass for the Blender add-on download and install handoff.

## Changes

- Made the primary action explicitly download the add-on ZIP.
- Added the important “do not unzip” instruction beside the download and in the install steps.
- Expanded install steps to include enabling the add-on and finding its Blender panel.
- Added a manual update path for users with an older Farpy add-on installed.
- Stated the tested compatibility boundary: Blender 4.1 on Windows.
- Clarified supported package types and that payment, tracking, downloads, and receipts continue in the browser workspace.
- Added concise troubleshooting and support guidance, including a warning not to share private workspace links.
- Synchronized the add-on production audit with the current frozen ZIP checksum already published in the repository.

## Boundaries

- No backend, authentication, production data, add-on ZIP, checksum, or API changes.
