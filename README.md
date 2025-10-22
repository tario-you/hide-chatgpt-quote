# Hide ChatGPT Floating Ask/Quote (React-safe)

## Why

Don’t you hate it when you’re double-clicking to read ChatGPT text and that quote/“Ask ChatGPT” bubble pops up, steals the click, and you accidentally quote something? Annoying. This script hides it—safely.

## What it does

* Hides the floating **Ask/Quote** popup across re-renders.
* Works inside shadow DOMs and same-origin iframes.
* **React-safe:** only applies CSS (no node removals, no React errors).

## Install (Tampermonkey)

1. Install **Tampermonkey** (Chrome/Edge/Firefox).
2. Tampermonkey → **Create a new script…**
3. Paste the **React-safe** userscript.
4. Save, ensure only this script is enabled.
5. Hard refresh ChatGPT (Shift-Reload).

## Verify

Select/double-click text in ChatGPT → the bubble shouldn’t appear. Console should be clean (no React removeChild errors).

## Tweak

* If the bubble’s text changes, update `BTN_TEXT` in the script.
* If the container class changes (A/B tests), add the new selector to the CSS block.

## Uninstall

Disable or delete the script in Tampermonkey, then refresh.
