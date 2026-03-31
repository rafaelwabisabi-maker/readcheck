# ReadCheck Demo -- Proof of Concept

Open-source accessibility measurement engine using canvas-based text detection.
Inspired by [Pretext](https://github.com/chenglou/pretext) by Cheng Lou.

Part of the [SilberWelt](https://github.com/readcheck) initiative for elderly digital inclusion.

## Running the Demo

Open `index.html` in any modern browser. No build tools, npm, or server required.

```
open index.html
```

## What It Demonstrates

### Core Innovation: Canvas-Based Measurement

ReadCheck measures text dimensions via `CanvasRenderingContext2D.measureText()` instead of DOM reflow methods (`getBoundingClientRect`, `getComputedStyle` layout queries). This is approximately **500x faster** and enables detection rules that are structurally impossible in DOM-only tools like axe-core, Pa11y, or Lighthouse.

### Seven Detection Rules

Covering the failure categories responsible for 96% of web accessibility errors (per [WebAIM Million 2025](https://webaim.org/projects/million/)):

| Rule | Severity | WCAG | Canvas? | What it detects |
|------|----------|------|---------|-----------------|
| `missing-lang` | Critical | 3.1.1 | No | No language attribute on the page |
| `small-text` | Serious | 1.4.4 | **Yes** | Font sizes below 16px, verified via canvas measurement |
| `low-contrast` | Critical | 1.4.3 | **Yes** | Insufficient color contrast ratio |
| `missing-alt` | Critical | 1.1.1 | No | Images without alt text or ARIA alternative |
| `cramped-targets` | Serious | 2.5.8 | No | Touch targets smaller than 44px, insufficient spacing |
| `text-overflow` | Moderate | 1.3.1 | **Yes** | Truncated text without accessible full-text label |
| `missing-label` | Critical | 1.3.1 | No | Form inputs without associated labels |

### Additional Features

- **ReadCheck Score** -- Lighthouse-style 0-100 score with severity breakdown
- **Performance stats** -- Real-time display of canvas measurements and avoided DOM reflows
- **Before/after toggle** -- Shows what the page looks like when violations are fixed
- **WCAG badges** -- Each violation references specific WCAG success criteria
- **Canvas badges** -- Violations that used canvas measurement are tagged

### Detect-Only Mode

ReadCheck reports violations without injecting overlays or modifying the DOM. This explicitly distances it from accessibility overlay products that break sites while claiming to fix them. See [overlayfactsheet.com](https://overlayfactsheet.com).

## Architecture (PoC)

```
index.html      -- Demo page with deliberately inaccessible sample content
readcheck.js    -- ~400-line detection engine with canvas measurement layer
style.css       -- Lighthouse-style score, severity-coded violation cards
```

In the full implementation, the canvas measurement layer will use Pretext's text layout engine for sub-pixel accuracy, line-break prediction, and batch processing across thousands of text nodes.

## Ecosystem

- **Built on:** [Pretext](https://github.com/chenglou/pretext) (MIT) -- Canvas text engine
- **Compatible with:** [axe-core](https://github.com/dequelabs/axe-core) (MPL-2.0) -- Output format compatibility
- **Complements:** [AccessKit](https://github.com/AccessKit/accesskit) (Apache-2.0) -- NLnet-funded native a11y
- **CI complement:** [Pa11y](https://pa11y.org/) (LGPL-3.0) -- CI pipeline integration

## License

MIT
