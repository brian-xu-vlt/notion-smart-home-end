// ==UserScript==
// @name         Notion: Smart Home/End (line + prev/next line) + Shift Select
// @namespace    http://tampermonkey.net/
// @version      2026-01-16
// @description  Home/End go to start/end of line; if already there, jump to previous/next line start/end. Shift keeps selection (Notion-friendly).
// @author       You
// @match        https://www.notion.so/*
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  function isEditable(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea') return true;
    if (el.isContentEditable) return true;
    return !!(el.closest && el.closest('[contenteditable="true"]'));
  }

  function isHomeEvent(e) {
    return e.key === 'Home' || e.code === 'Home' || e.keyCode === 36 || e.which === 36;
  }
  function isEndEvent(e) {
    return e.key === 'End' || e.code === 'End' || e.keyCode === 35 || e.which === 35;
  }

  function snapshotSelection(sel) {
    return {
      anchorNode: sel.anchorNode,
      anchorOffset: sel.anchorOffset,
      focusNode: sel.focusNode,
      focusOffset: sel.focusOffset,
      isCollapsed: sel.isCollapsed,
    };
  }

  function sameCaretPos(a, b) {
    return (
      a.anchorNode === b.anchorNode &&
      a.anchorOffset === b.anchorOffset &&
      a.focusNode === b.focusNode &&
      a.focusOffset === b.focusOffset
    );
  }

  // ---------- INPUT/TEXTAREA MODE ----------
  function smartMoveInInput(el, key /* 'Home'|'End' */, extend /* boolean */) {
    const v = el.value ?? '';
    const pos = el.selectionStart ?? 0;

    // Determine the "moving caret" side.
    // If extending, we want to move the caret while keeping the anchor stable.
    // We'll treat selectionEnd as caret when direction is forward, selectionStart when backward.
    const caret = extend
      ? (key === 'Home' ? (el.selectionStart ?? pos) : (el.selectionEnd ?? pos))
      : pos;

    const before = v.lastIndexOf('\n', Math.max(0, caret - 1));
    const lineStart = before === -1 ? 0 : before + 1;

    const after = v.indexOf('\n', caret);
    const lineEnd = after === -1 ? v.length : after;

    let nextCaretPos;

    if (key === 'Home') {
      if (caret !== lineStart) {
        nextCaretPos = lineStart;
      } else {
        // Already at start: go to previous line start (if any)
        if (lineStart === 0) return;
        const prevLineEndIdx = lineStart - 1; // '\n'
        const prevBefore = v.lastIndexOf('\n', Math.max(0, prevLineEndIdx - 1));
        nextCaretPos = prevBefore === -1 ? 0 : prevBefore + 1;
      }
    } else {
      // End
      if (caret !== lineEnd) {
        nextCaretPos = lineEnd;
      } else {
        // Already at end: go to next line end (if any)
        if (lineEnd >= v.length) return;
        const nextLineStart = lineEnd + 1;
        const nextAfter = v.indexOf('\n', nextLineStart);
        nextCaretPos = nextAfter === -1 ? v.length : nextAfter;
      }
    }

    if (!extend) {
      el.setSelectionRange(nextCaretPos, nextCaretPos);
      return;
    }

    // Extend selection: keep anchor fixed and move focus/caret.
    // In inputs, anchor is the opposite end of the current selection.
    // We'll preserve the "start" anchor as the existing non-moving end.
    const anchor =
      key === 'Home'
        ? (el.selectionEnd ?? caret) // moving backward, keep end as anchor
        : (el.selectionStart ?? caret); // moving forward, keep start as anchor

    const start = Math.min(anchor, nextCaretPos);
    const end = Math.max(anchor, nextCaretPos);
    el.setSelectionRange(start, end, nextCaretPos < anchor ? 'backward' : 'forward');
  }

  // ---------- CONTENTEDITABLE (NOTION) MODE ----------
  function smartMoveInContentEditable(key /* 'Home'|'End' */, extend /* boolean */) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    // Step 1: move/extend to line boundary
    const before = snapshotSelection(sel);

    try {
      const action = extend ? 'extend' : 'move';
      if (key === 'Home') {
        sel.modify(action, 'backward', 'lineboundary');
      } else {
        sel.modify(action, 'forward', 'lineboundary');
      }
    } catch (_) {
      return;
    }

    const afterBoundary = snapshotSelection(sel);

    // If selection/caret changed, we’re done (we were not at boundary).
    if (!sameCaretPos(before, afterBoundary)) return;

    // Step 2: already at boundary → go one visual line up/down, then to boundary again
    try {
      const action = extend ? 'extend' : 'move';

      if (key === 'Home') {
        sel.modify(action, 'backward', 'line');
        sel.modify(action, 'backward', 'lineboundary');
      } else {
        sel.modify(action, 'forward', 'line');
        sel.modify(action, 'forward', 'lineboundary');
      }
    } catch (_) {
      // no-op
    }
  }

  function onKeyDown(e) {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    const home = isHomeEvent(e);
    const end = isEndEvent(e);
    if (!home && !end) return;

    const active = document.activeElement;
    const target = e.target;
    if (!isEditable(target) && !isEditable(active)) return;

    e.preventDefault();
    e.stopPropagation();

    const el = active || target;
    const tag = (el.tagName || '').toLowerCase();
    const key = home ? 'Home' : 'End';
    const extend = !!e.shiftKey;

    if (tag === 'input' || tag === 'textarea') {
      smartMoveInInput(el, key, extend);
    } else {
      smartMoveInContentEditable(key, extend);
    }
  }

  // Capture phase so we beat Notion’s own handlers.
  window.addEventListener('keydown', onKeyDown, true);
})();
