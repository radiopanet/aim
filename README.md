# Aim

A lightweight Firefox extension for planning tomorrow's goals
and tracking daily progress.

## Features

- Evening reminder to plan tomorrow's goals.
- Morning reminder to review today's goals.
- Create, edit, and delete goals.
- Optional descriptions and planned times.
- Persistent, date-keyed goal storage.
- Configurable reminder times and notification toggle.
- Completion checkboxes and progress summaries.
- No external libraries or build tools.

## Requirements

- Mozilla Firefox 128 or newer.
- Notifications permitted by the browser and operating system.

## Install for development

1. Create the Aim folder.
2. Add manifest.json, background.js, popup.html,
   popup.css, popup.js, icon.svg, and README.md.
3. Open Firefox.
4. Navigate to about:debugging.
5. Select This Firefox.
6. Click Load Temporary Add-on.
7. Select the extension's manifest.json.

The extension should appear in the toolbar.
Pin it if necessary, then click it to open Aim.

Temporary add-ons are removed when Firefox restarts.
Load the extension again to continue testing.

## Test the extension

1. Open the toolbar popup.
2. Select Tomorrow and create a goal.
3. Edit and delete a goal to verify management.
4. Mark a goal complete when it appears under Today.
5. Change the reminder times to test alarm scheduling.
6. Toggle notifications off and save.
7. Test notification clicks and verify the relevant view opens.

For testing reminders, choose a time a minute or two in
the future. Firefox alarms are not guaranteed to execute
at an exact minute.

## Storage

Goals are saved in browser.storage.local by local date.
Settings and reminder deduplication dates are stored
alongside the goals.

Uninstalling the extension can remove its local data.

## Package for Mozilla Add-ons (AMO)

1. Ensure all extension files are in the Aim folder.
2. Validate manifest.json and test the extension.
3. Create a ZIP containing the extension files at the
   archive root (not an extra enclosing folder).
4. Open the Mozilla Add-ons Developer Hub:
   https://addons.mozilla.org/developers/
5. Sign in and submit the ZIP for review.
6. Complete the requested listing, privacy, and
   permissions information.

Mozilla may require additional review or changes before
publication. Follow its current submission requirements.

## Browser compatibility

This implementation targets Firefox and uses browser.*.
Chrome may require changes to the background configuration
and API compatibility handling before it can be loaded.

## Limitations

- Notifications require Firefox to be running and the
  operating system to permit them.
- Browser alarms can be delayed during sleep or shutdown.
- This version does not sync goals across devices.
- Goals are stored locally, without a remote account.