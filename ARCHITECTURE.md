# ReadCheck Architecture

This document describes the technical architecture of ReadCheck, an accessibility measurement engine that uses canvas-based text analysis to detect, score, and optionally remediate web accessibility barriers.

## Design Principles

1. **Measure, then detect.** Most accessibility tools parse the DOM and check for attribute presence. ReadCheck adds a measurement layer that computes actual rendered properties (text width, line count, overflow state) before running detection rules. This enables a new class of rules that are structurally impossible in DOM-only tools.

2. **Detection-first, remediation-last.** The engine is dry-run by default. Remediation is a separate, opt-in layer with a strict safety taxonomy. We report what is wrong; the developer decides what to fix.

3. **axe-core compatibility.** Rule results follow the axe-core schema so ReadCheck output can be consumed by existing CI/CD pipelines, dashboards, and reporting tools without adaptation.

4. **Performance budget: < 60ms.** A full audit of a typical page (50-100 text elements) should complete within 60ms. Canvas measurement via Pretext is the key enabler -- approximately 500x faster than DOM reflow-based measurement for individual text operations.

5. **Elderly-first design.** Scoring thresholds are tuned for the needs of elderly and low-literacy users, applying stricter requirements than WCAG minimums where research supports it.

## The Four Layers

### Layer 0: Pretext Measurement

The foundation of ReadCheck is [Pretext](https://github.com/chenglou/pretext), a canvas-based text measurement engine by Cheng Lou.

#### The Problem with DOM Measurement

Traditional accessibility tools inspect DOM properties using `getComputedStyle()`, `getBoundingClientRect()`, and `offsetWidth/offsetHeight`. Each of these methods **forces the browser to perform layout reflow** -- a synchronous, blocking operation where the engine must:

1. Recalculate all CSS styles in the subtree
2. Compute the layout geometry of every affected element
3. Return the requested property

This costs **1-10ms per element** on complex pages and **cannot be parallelized** because each measurement potentially invalidates the previous layout state (layout thrashing). On a page with 100 text elements, DOM-based measurement alone can take 100-1000ms.

#### The Canvas Alternative

Canvas-based measurement takes a fundamentally different approach:

1. Create a single offscreen `<canvas>` element (never attached to the DOM)
2. Set the canvas rendering context's `font` property to match the element's computed style
3. Call `ctx.measureText(text)` to get the rendered width

This works because `measureText()` uses the **same font metrics engine** as the browser's layout engine -- it produces identical width values without triggering any layout computation. The canvas exists only in memory; nothing is painted to screen.

```javascript
// The core technique (simplified)
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

function measureTextWidth(text, font) {
  ctx.font = font;  // e.g., "400 16px Arial"
  return ctx.measureText(text).width;  // Same result as DOM, ~0.02ms
}
```

#### Performance Comparison

| Operation | DOM reflow | Canvas (Pretext) | Ratio |
|---|---|---|---|
| Single text width | 1-10ms | 0.01-0.05ms | 100-500x |
| 100 elements | 100-1000ms | 1-5ms | 100-500x |
| Impact on page | Blocks main thread, causes jank | Zero impact | N/A |
| Scales with | Page complexity (entire layout tree) | Text count only | N/A |

#### What Canvas Measurement Enables

Beyond raw speed, canvas measurement makes new categories of detection rules possible:

| Capability | DOM-only tools | ReadCheck (canvas) |
|---|---|---|
| Text width without reflow | No | **Yes** |
| Overflow prediction (before it happens) | No | **Yes** |
| Character count per visual line | No | **Yes** |
| Scaled-text overflow prediction (200% zoom) | No | **Yes** |
| Line-break prediction for a given container | No | **Yes** |

#### Integration Pattern

```
Page DOM
  |
  +---> Extract text nodes + computed styles
  |       (font-family, font-size, font-weight, container width)
  |
  +---> Pretext.measure(text, styles)
          |
          +---> actualWidth: number
          +---> lineBreaks: number[]
          +---> overflows: boolean
          +---> charsPerLine: number[]
          +---> overflowAmount: number (pixels beyond container)
```

Layer 0 produces a `MeasurementMap`: a dictionary mapping each text node to its measured properties. This map is the input to Layer 1.

### Layer 1: Detection Engine

The detection engine evaluates rules against the combined DOM state and measurement data.

#### Rule Format (axe-core compatible)

```javascript
{
  id: 'text-overflow-risk',
  impact: 'serious',
  tags: ['wcag2aa', 'readcheck-novel', 'cognitive'],

  // CSS selector: which elements to evaluate
  selector: '[style*="overflow"], [class]',

  // The evaluation function receives both the DOM node and
  // its canvas measurements (from Layer 0)
  check: (node, measurements) => {
    const m = measurements.get(node);
    if (!m) return { result: 'inapplicable' };

    if (m.overflows && !hasVisibleScrollbar(node)) {
      return {
        result: 'violation',
        message: `Text overflows container by ${m.overflowAmount}px`,
        data: {
          overflowAmount: m.overflowAmount,
          actualWidth: m.actualWidth,
          containerWidth: m.containerWidth
        }
      };
    }
    return { result: 'pass' };
  }
}
```

#### Rule Categories

| Category | Data Source | Example Rules |
|---|---|---|
| WCAG structural | DOM only | `missing-alt-text`, `empty-link`, `missing-form-label`, `missing-lang` |
| WCAG measurement | DOM + canvas | `text-overflow-risk`, `target-size-insufficient`, `small-text` |
| Cognitive | DOM + canvas + readability | `line-length-density`, `reading-level-high`, `element-density-high` |
| Novel | Canvas only | `visual-truncation-unlabeled`, `font-size-scaling-break` |

Novel rules are ReadCheck's unique contribution. These rules are structurally impossible in tools that only inspect the DOM, because they require knowing the **rendered dimensions** of text content.

#### Execution Pipeline

```
MeasurementMap + DOM
  |
  +---> Rule selector --> candidate nodes
  |
  +---> Rule check(node, measurements) --> result per node
  |
  +---> Aggregate: violations, passes, incomplete, inapplicable
  |
  +---> Deduplicate: merge findings on same element
  |
  +---> Output: axe-core-compatible result object
```

### Layer 2: Scoring

The scoring layer takes detection results and produces two scores:

#### WCAG Conformance Score

- Based on violation count, impact severity, and WCAG level (A, AA, AAA)
- Severity weights: critical (15 points), serious (8 points), moderate (3 points)
- Output: conformance level (A, AA, AAA, or None) + numeric score (0-100)
- Score formula: `max(0, 100 - sum(severity_deductions))`

#### Cognitive Load Score

A composite score designed for elderly and low-literacy populations:

- **Flesch-Kincaid readability** grade level of visible page text
- **Element density:** interactive elements per viewport area
- **Character density:** average characters per visual line (from Layer 0 measurements)
- **Contrast margin:** how far above WCAG minimums (elderly users need more headroom)
- **Target size margin:** how far above WCAG minimums (motor accessibility)
- Output: cognitive load score (0-100, lower is better) + per-dimension subscores

#### Elderly-Specific Thresholds

The cognitive score applies stricter thresholds based on research on elderly web users (W3C WAI "Web Accessibility for Older Users"):

| Metric | WCAG 2.2 AA Minimum | ReadCheck Elderly Threshold | Rationale |
|---|---|---|---|
| Color contrast (normal text) | 4.5:1 | 7:1 | Age-related vision changes reduce contrast sensitivity |
| Touch target size | 24x24px | 44x44px | Reduced motor precision and tremor prevalence |
| Line length | No requirement | 50-75 characters | Reduced working memory and tracking ability |
| Reading level | No requirement | Grade 8 or below | Lower average literacy in 65+ populations |
| Line height | No requirement | 1.5x minimum | Reduced ability to track across dense text |

### Layer 3: Safe Remediation

Remediation is **opt-in only** and **limited to a safe subset** of possible fixes.

#### Research Basis

The AFixt study (2023) analyzed automated accessibility fixes and found that only **46% of automated repairs are safe** -- the rest risk breaking page functionality, altering visual appearance, or introducing new accessibility barriers.

ReadCheck's remediation layer uses a strict safety taxonomy:

| Fix Type | Risk Level | ReadCheck Action | Example |
|---|---|---|---|
| Add `aria-label` to truncated text | Low | **Apply** (opt-in) | Add full text as aria-label to ellipsis element |
| Add `role` attribute | Low | **Apply** (opt-in) | Add role="img" to decorative SVG |
| Add `lang` attribute | Low | **Apply** (opt-in) | Add lang="en" to html element |
| Add `alt` text (generated) | Medium | **Suggest only** | Suggest description but never auto-apply |
| Modify CSS properties | High | **Report only** | Report needed contrast or size changes |
| Restructure DOM | High | **Report only** | Report needed heading hierarchy changes |
| Add/remove elements | High | **Report only** | Report needed label elements |

#### Remediation Output Format

```javascript
{
  patches: [
    {
      ruleId: 'visual-truncation-unlabeled',
      selector: '#product-title',
      action: 'setAttribute',
      attribute: 'aria-label',
      value: 'Organic Cold-Pressed Pomegranate Juice 500ml',
      risk: 'low',
      reversible: true
    }
  ],
  suggestions: [
    {
      ruleId: 'missing-alt-text',
      selector: 'img#hero',
      suggestion: 'Add descriptive alt text for this product image',
      risk: 'medium',
      reason: 'Auto-generated alt text may be inaccurate or misleading'
    }
  ],
  stats: {
    patchable: 3,
    suggestionsOnly: 5,
    totalViolations: 12
  }
}
```

## Output Formats

ReadCheck produces results in three formats:

1. **JSON (axe-core-compatible):** For CI/CD integration. Follows the axe-core `Results` schema with extensions for cognitive scores and canvas measurement data.
2. **HTML report:** Self-contained HTML file with Lighthouse-style score circle, severity breakdown, violation details, and visual indicators.
3. **Console (CLI):** Colored terminal output with summary, score, and violation list.

## Distribution Channels

| Channel | Format | Use Case |
|---|---|---|
| npm (`@readcheck/core`) | ES modules + CJS | Programmatic integration into build tools and test suites |
| CLI (`npx readcheck`) | Binary via npm | One-off audits, CI/CD pipeline scripts |
| GitHub Action | YAML action | Pull request-level accessibility gates |
| Browser extension | WebExtension | Developer tools panel for real-time auditing |

## Performance Targets

| Metric | Target | How Measured |
|---|---|---|
| Full audit (50 elements) | < 60ms | Layer 0 + Layer 1 + Layer 2 combined |
| Measurement only (50 elements) | < 5ms | Layer 0 alone |
| Rule evaluation (20 rules, 50 elements) | < 50ms | Layer 1 alone |
| Scoring | < 5ms | Layer 2 alone |
| Memory overhead | < 10MB | Total heap allocation during audit |
| Cold start (CLI) | < 500ms | Process start to first measurement |

## Security Model

- ReadCheck runs in the same origin as the page being audited (browser) or in a headless browser (CLI/CI)
- **No data is sent to external servers** -- all processing is local
- Remediation patches are generated locally and applied locally
- The engine has zero network dependencies at runtime
- No telemetry, no analytics, no tracking

## Directory Structure

```
@readcheck/core
+-- src/
|   +-- index.js                  # Public API (audit, measure, score, remediate)
|   +-- measurement/              # Layer 0: Pretext integration
|   |   +-- measure.js            # Canvas measurement primitives
|   |   +-- canvas-utils.js       # Font parsing, line prediction
|   |   +-- measurement-map.js    # MeasurementMap data structure
|   +-- detection/                # Layer 1: Rule engine
|   |   +-- engine.js             # Rule executor and aggregator
|   |   +-- rules/                # Individual rule files
|   |   |   +-- index.js          # Rule registry
|   |   |   +-- missing-lang.js
|   |   |   +-- small-text.js
|   |   |   +-- low-contrast.js
|   |   |   +-- missing-alt.js
|   |   |   +-- cramped-targets.js
|   |   |   +-- text-overflow-risk.js
|   |   |   +-- visual-truncation-unlabeled.js
|   |   |   +-- line-length-density.js
|   |   |   +-- missing-label.js
|   |   |   +-- font-size-scaling-break.js
|   |   +-- rule-schema.js        # Rule format validation
|   +-- scoring/                  # Layer 2: WCAG + cognitive scoring
|   |   +-- wcag-score.js         # WCAG conformance scoring
|   |   +-- cognitive-score.js    # Cognitive load scoring
|   |   +-- elderly-thresholds.js # Enhanced thresholds for elderly users
|   +-- remediation/              # Layer 3: Safe fixes
|   |   +-- patch.js              # Patch generation
|   |   +-- safety-taxonomy.js    # Risk classification for fix types
|   +-- output/                   # Formatters
|       +-- json.js               # axe-core-compatible JSON
|       +-- html.js               # Self-contained HTML report
|       +-- console.js            # CLI colored output
+-- cli/
|   +-- readcheck.js              # CLI entry point
+-- test/
|   +-- measurement/              # Layer 0 tests
|   +-- detection/                # Layer 1 tests (per-rule)
|   +-- scoring/                  # Layer 2 tests
|   +-- fixtures/                 # HTML fixtures for testing
+-- demo/                         # Proof-of-concept demo (standalone HTML)
+-- package.json
+-- README.md
+-- ARCHITECTURE.md
+-- CONTRIBUTING.md
+-- LICENSE
```
