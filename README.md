# Notion Smart Home / End

Fixes Notion’s non-standard **Home / End** behavior on macOS.

## Problem

In Notion (web), pressing:
- **Home** jumps to the *top of the page*
- **End** jumps to the *bottom of the page*

This differs from code editors and native text editors, where Home/End operate on the **current line**.

## What this script does

This Tampermonkey userscript implements **editor-grade Home/End behavior**:


https://github.com/user-attachments/assets/16ea0fec-b851-426c-a5eb-fe2d8109ed79


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
2. Click on Tampermonkey icon > `dashboard` > utilities > import from URL
   <img width="2291" height="780" alt="Screenshot 2026-01-16 at 10 33 58" src="https://github.com/user-attachments/assets/35364f4b-0a5c-4a76-8677-5d278c818b90" />
3. Paste the raw file url for `notion-smart-home-end.user.js`
   - `https://raw.githubusercontent.com/brian-xu-vlt/notion-smart-home-end/refs/heads/main/notion-smart-home-end.js`
5. Click **Install**
6. Reload Notion

## Scope

- Runs only on `https://www.notion.so/*`
- Web only (Tampermonkey does not run in the Notion desktop app)

## Why this works

Uses `Selection.modify()` with `line` and `lineboundary`, which Notion already supports internally and behaves consistently with visual lines.

## License

MIT
