# Notion Smart Home / End

Fixes Notion’s non-standard **Home / End** behavior on macOS.

## Problem

In Notion (web), pressing:
- **Home** jumps to the *top of the page*
- **End** jumps to the *bottom of the page*

This differs from code editors and native text editors, where Home/End operate on the **current line**.

## What this script does

This Tampermonkey userscript implements **editor-grade Home/End behavior**:

- **Home**
  - Move to start of the current line
  - If already at start → move to start of the **previous line**
- **End**
  - Move to end of the current line
  - If already at end → move to end of the **next line**
- **Shift + Home / End**
  - Same behavior, but **extends selection**

Works with Notion’s `contenteditable` blocks and respects visual line wrapping.

## Installation

1. Install **Tampermonkey**
2. Open the script file:
   - `notion-smart-home-end.user.js`
3. Click **Install**
4. Reload Notion

## Scope

- Runs only on `https://www.notion.so/*`
- Web only (Tampermonkey does not run in the Notion desktop app)

## Why this works

Uses `Selection.modify()` with `line` and `lineboundary`, which Notion already supports internally and behaves consistently with visual lines.

## License

MIT
