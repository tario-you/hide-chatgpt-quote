// ==UserScript==
// @name         Hide ChatGPT Floating Ask/Quote (React-safe)
// @namespace    https://tario.dev
// @version      4.0
// @description  Hide the floating "Ask ChatGPT"/quote popup without removing nodes (no React errors)
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  // --- What we target (tuned to your snippet) ---
  // outer: <div class="aria-live=polite fixed select-none" ...>
  const OUTER_FLOATING_SELECTOR = 'div.aria-live\\=polite.fixed.select-none';
  const BTN_TEXT = 'ask chatgpt';

  // Hide rules only (do NOT remove nodes)
  const CSS = `
    ${OUTER_FLOATING_SELECTOR},
    button[title="Quote"],
    [aria-label="Quote"],
    [data-testid="quote-button"] {
      opacity: 0 !important;
      visibility: hidden !important;
      pointer-events: none !important;
      transform: translateX(-9999px) !important; /* move off-screen so it won't be hit-tested */
      position: absolute !important;
    }

    /* Fallback: any button whose visible text is exactly "Ask ChatGPT" */
    button, [role="button"] {
      /* no-op here; we handle via attribute/text observer below */
    }
  `;

  const STYLE_ID = 'tm-hide-quote-react-safe';
  const seenRoots = new WeakSet();

  function ensureStyle(root) {
    if (!root || seenRoots.has(root)) return;
    seenRoots.add(root);
    try {
      // Prefer Constructable Stylesheets if available (nice with shadow roots)
      if ('adoptedStyleSheets' in root) {
        const sheet = new CSSStyleSheet();
        sheet.replaceSync(CSS);
        const sheets = root.adoptedStyleSheets || [];
        // Avoid duplicates
        if (!sheets.some(s => s._tmHideQuoteSheet)) {
          sheet._tmHideQuoteSheet = true;
          root.adoptedStyleSheets = sheets.concat(sheet);
        }
      } else {
        // Fallback <style> tag
        const doc = root instanceof Document ? root : root.ownerDocument || document;
        if (doc.getElementById(STYLE_ID)) return;
        const style = doc.createElement('style');
        style.id = STYLE_ID;
        style.textContent = CSS;
        (doc.head || doc.documentElement).appendChild(style);
      }
    } catch {}
  }

  // Patch attachShadow to ensure every shadow root gets the CSS (no removals)
  const origAttachShadow = Element.prototype.attachShadow;
  Object.defineProperty(Element.prototype, 'attachShadow', {
    value: function (init) {
      const forced = Object.assign({}, init, { mode: 'open' }); // force-open
      const sr = origAttachShadow.call(this, forced);
      // inject styles safely
      try { ensureStyle(sr); } catch {}
      // observe text changes to catch "Ask ChatGPT" buttons created later
      observeForText(sr);
      return sr;
    },
    writable: false,
    configurable: false
  });

  // Observe for newly-added buttons and hide if their text === "Ask ChatGPT"
  function hideByText(el) {
    if (!(el instanceof Element)) return;
    const maybeButtons = el.matches?.('button, [role="button"]') ? [el] : el.querySelectorAll?.('button, [role="button"]');
    if (!maybeButtons) return;
    for (const btn of maybeButtons) {
      const t = (btn.textContent || '').trim().toLowerCase();
      if (t === BTN_TEXT) {
        btn.style.opacity = '0';
        btn.style.visibility = 'hidden';
        btn.style.pointerEvents = 'none';
        btn.style.transform = 'translateX(-9999px)';
        btn.style.position = 'absolute';
      }
    }
  }

  function observeForText(root) {
    const mo = new MutationObserver(muts => {
      for (const m of muts) {
        if (m.type === 'childList') {
          m.addedNodes?.forEach(n => {
            if (n.nodeType === 1) hideByText(n);
          });
        } else if (m.type === 'characterData') {
          const el = m.target.parentElement;
          if (el) hideByText(el);
        } else if (m.type === 'attributes') {
          if (m.attributeName === 'class' || m.attributeName === 'style' || m.attributeName === 'title' || m.attributeName === 'aria-label' || m.attributeName === 'data-testid') {
            hideByText(m.target);
          }
        }
      }
    });
    mo.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true
    });
  }

  // Document-level setup
  ensureStyle(document);
  observeForText(document);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ensureStyle(document);
      observeForText(document);
      // handle already-open shadow roots
      document.querySelectorAll('*').forEach(el => {
        if (el.shadowRoot) {
          ensureStyle(el.shadowRoot);
          observeForText(el.shadowRoot);
        }
      });
    });
  } else {
    // handle already-open shadow roots
    document.querySelectorAll('*').forEach(el => {
      if (el.shadowRoot) {
        ensureStyle(el.shadowRoot);
        observeForText(el.shadowRoot);
      }
    });
  }

  // Same-origin iframes (just in case)
  function watchIframes() {
    document.querySelectorAll('iframe').forEach(f => {
      try {
        const d = f.contentDocument;
        if (d) {
          ensureStyle(d);
          observeForText(d);
        }
      } catch {}
    });
  }
  watchIframes();
  setInterval(() => {
    ensureStyle(document);
    watchIframes();
  }, 1000);
})();
