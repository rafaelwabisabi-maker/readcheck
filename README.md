# ReadCheck

**Open-source accessibility measurement engine powered by canvas-based text analysis.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![NLnet NGI Zero Commons Fund](https://img.shields.io/badge/NLnet-NGI_Zero_Commons_Fund-blue.svg)](https://nlnet.nl/commonsfund/)
[![Node.js >= 18](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![European Accessibility Act](https://img.shields.io/badge/EAA-June_2025-orange.svg)](https://ec.europa.eu/social/main.jsp?catId=1202)

---

## The Problem

**94.8% of the top 1 million websites fail WCAG compliance** (WebAIM Million, 2025). The same 6 failure categories appear on 96% of these sites. Commercial overlay products have failed catastrophically -- accessiBe was fined $1M by the FTC, and 975 accessibility experts signed the [Overlay Fact Sheet](https://overlayfactsheet.com) against them.

The European Accessibility Act takes enforcement effect June 2025, with fines up to EUR 3M. There is no open-source tool that combines text measurement, detection, cognitive scoring, and safe remediation in a single engine.

## The Solution

ReadCheck detects, scores, and reports accessibility barriers using a novel approach: **canvas-based text measurement** via [Pretext](https://github.com/chenglou/pretext) that is approximately 500x faster than traditional DOM measurement. This enables accessibility rules that existing tools structurally cannot express -- rules that require knowing the actual rendered dimensions of text, not just its DOM properties.

ReadCheck is **not** an overlay. It is a detection-first, measurement-first engine. It runs in dry-run mode by default -- it tells you what is wrong and why, without injecting anything into your page. Optional remediation is strictly opt-in and limited to low-risk attribute changes that research has shown to be safe.

ReadCheck is the **technical arm of [SilberWelt](https://github.com/readcheck)** -- an initiative for elderly digital inclusion. While SilberWelt addresses the human side (digital literacy, community support, warm technology), ReadCheck addresses the technical side: making websites readable and usable for older adults through measurement-based accessibility detection with elderly-specific rules for enhanced contrast, larger target sizes, and cognitive load scoring.

## Architecture

```
+--------------------------------------------------+
|               ReadCheck Engine                    |
+--------------------------------------------------+
|                                                   |
|   Layer 0: Pretext Measurement (Canvas API)       |
|   - measureText() for text width                  |
|   - Line-break prediction                         |
|   - Overflow detection without reflow             |
|   - Character-per-line counting                   |
|                                                   |
+--------------------------------------------------+
|                                                   |
|   Layer 1: Detection Engine (Rules)               |
|   - WCAG structural rules (DOM-only)              |
|   - WCAG measurement rules (DOM + canvas)         |
|   - Novel rules (canvas-only, unique to RC)       |
|   - Cognitive load rules (canvas + readability)    |
|                                                   |
+--------------------------------------------------+
|                                                   |
|   Layer 2: Scoring                                |
|   - WCAG 2.2 conformance (A / AA / AAA)           |
|   - Cognitive load score (0-100)                  |
|   - Flesch-Kincaid readability grade              |
|   - Elderly-specific thresholds                   |
|                                                   |
+--------------------------------------------------+
|                                                   |
|   Layer 3: Safe Remediation (opt-in only)         |
|   - Low-risk: aria-labels, role, lang (auto)      |
|   - Medium-risk: alt text (suggest only)          |
|   - High-risk: CSS, DOM (report only)             |
|   - Based on AFixt taxonomy (46% safely fixable)  |
|                                                   |
+--------------------------------------------------+
|                                                   |
|   Output: JSON (axe-core compatible) | HTML | CLI |
|                                                   |
+--------------------------------------------------+
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for full technical details.

## Novel Rules (impossible in existing tools)

These rules require canvas-based text measurement and cannot be implemented by tools that only inspect the DOM:

| Rule | What it detects | Why canvas measurement is required |
|------|-----------------|-----------------------------------|
| `text-overflow-risk` | Text that will overflow its container at current or scaled font sizes | Pretext predicts rendered layout without triggering DOM reflow, enabling detection before the user sees the broken state |
| `visual-truncation-unlabeled` | CSS `text-overflow: ellipsis` applied to text with no `aria-label` providing the full content | Measures actual rendered text width vs. available container width to confirm truncation is active -- DOM-only tools cannot determine this without forced reflow |
| `line-length-density` | Lines exceeding 80 characters or extreme character density causing cognitive overload | Counts characters per visual (rendered) line using canvas, not per DOM element -- critical for responsive layouts where line breaks are viewport-dependent |
| `font-size-scaling-break` | Elements that break layout when font size is increased to 200% (WCAG 1.4.4) | Canvas measurement predicts overflow at scaled sizes without actually scaling the page |

## Quick Start

```bash
npm install @readcheck/core

# CLI -- audit a URL and print results
npx readcheck audit https://example.com

# CLI -- output axe-core-compatible JSON
npx readcheck audit https://example.com --format axe --output results.json
```

```javascript
// Programmatic usage
import { audit, score } from '@readcheck/core'

const results = await audit('https://example.com')
console.log(results.violations)  // WCAG violations found
console.log(results.novel)       // Canvas-measurement-based findings

const scores = score(results)
console.log(scores.wcag)         // { level: 'AA', score: 72 }
console.log(scores.cognitive)    // { score: 35, grade: 'good' }
```

## Why Not Just Use axe-core?

axe-core is excellent for DOM-level WCAG checks. ReadCheck does not replace it -- it adds a measurement layer that makes new categories of rules possible.

| Capability | ReadCheck | axe-core | Pa11y | Lighthouse | accessiBe |
|---|---|---|---|---|---|
| Canvas-based measurement | **Yes** | No | No | No | No |
| Cognitive load scoring | **Yes** | No | No | No | No |
| Elderly-specific rules | **Yes** | No | No | No | No |
| Text overflow prediction | **Yes** | No | No | No | No |
| Auto-remediation | Opt-in, safe subset | No | No | No | Yes (unsafe) |
| Open source | MIT | MPL-2.0 | LGPL-3.0 | Apache-2.0 | No |
| CI/CD integration | Yes | Yes | Yes | Yes | No |
| axe-core format output | Yes | Native | No | Partial | No |

### Performance

| Operation | DOM reflow (axe-core) | Canvas (ReadCheck) | Speedup |
|---|---|---|---|
| Single text measurement | 1-10ms | 0.01-0.05ms | ~200x |
| 100 elements | 100-1000ms | 1-5ms | ~200-500x |
| Full audit (50 elements) | 200-500ms | < 60ms | ~5-8x |

## Ecosystem

ReadCheck is designed to complement, not replace, the existing accessibility toolchain:

| Project | Relationship | License |
|---|---|---|
| [Pretext](https://github.com/chenglou/pretext) | **Core dependency** -- Canvas-based text measurement engine by Cheng Lou | MIT |
| [axe-core](https://github.com/dequelabs/axe-core) | **Compatible** -- Output format follows axe-core result schema for interoperability | MPL-2.0 |
| [AccessKit](https://github.com/AccessKit/accesskit) | **Peer** -- NLnet-funded accessibility toolkit for native platforms. ReadCheck covers the web | Apache-2.0 |
| [Pa11y](https://pa11y.org/) | **Complement** -- CI pipeline integration. ReadCheck can feed Pa11y-compatible output | LGPL-3.0 |
| [NVDA](https://github.com/nvaccess/nvda) | **Validation** -- Screen reader used for end-to-end validation of detection accuracy | GPL-2.0 |

### Anti-Overlay Position

ReadCheck explicitly opposes accessibility overlay products. Our position aligns with the [Overlay Fact Sheet](https://overlayfactsheet.com) signed by 975 accessibility professionals. ReadCheck:

- **Never** injects code into the page without explicit opt-in
- **Never** claims to "fix" accessibility through a widget
- **Reports** violations transparently with evidence and WCAG references
- **Limits** auto-remediation to a safe subset of low-risk attribute changes
- **Publishes** all detection logic as open source for community audit

## Roadmap

| Version | Milestone | Status |
|---|---|---|
| **v0.1** | Core measurement engine + 7 detection rules + CLI | In progress |
| **v0.2** | axe-core-compatible JSON output + CI/CD integration (GitHub Actions, GitLab CI) | Planned |
| **v0.3** | Cognitive load scoring (Flesch-Kincaid + element density + interaction complexity) | Planned |
| **v0.4** | Safe remediation module (opt-in only, low-risk attribute changes) | Planned |
| **v0.5** | Browser extension (Chrome, Firefox) | Planned |
| **v1.0** | Full WCAG 2.2 AA coverage + plugin API + comprehensive documentation | Planned |

## Contributing

Contributions are welcome. ReadCheck's primary contribution surface is **rules** -- each rule is a self-contained module that can be developed and tested independently. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on adding rules, writing tests, and submitting pull requests.

## Research

ReadCheck's approach is grounded in published research:

- **Canvas measurement:** Cheng Lou, *Pretext: A Canvas-Based Text Layout Engine* (2023)
- **Accessibility failures:** WebAIM, *The WebAIM Million* (2025) -- annual analysis of top 1M homepages
- **Safe remediation:** AFixt study (2023) -- taxonomy of automated accessibility fixes, finding 46% are safely automatable
- **Overlay harms:** Overlay Fact Sheet, endorsed by 975 accessibility professionals
- **Elderly web use:** W3C WAI, *Web Accessibility for Older Users* (WCAG 2.2 applicability)
- **Cognitive accessibility:** WCAG 2.2 SC 3.1.5 (Reading Level), SC 2.5.8 (Target Size)

*A peer-reviewed paper describing ReadCheck's measurement approach and detection methodology is in preparation.*

## Funding

This project is applying for funding from the [NLnet Foundation](https://nlnet.nl/) through the [NGI Zero Commons Fund](https://nlnet.nl/commonsfund/), established with financial support from the European Commission's Next Generation Internet programme.

## License

[MIT](LICENSE) -- Rafael Garcia Vaz de Lima, 2026
