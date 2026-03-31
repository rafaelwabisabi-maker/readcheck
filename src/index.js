/**
 * @module @readcheck/core
 *
 * ReadCheck — Open-source accessibility measurement engine.
 *
 * Uses canvas-based text measurement (via Pretext) to detect, score, and
 * optionally remediate accessibility barriers that traditional DOM-only
 * tools cannot express.
 *
 * @example
 * import { audit, score } from '@readcheck/core'
 *
 * const results = await audit('https://example.com')
 * console.log(results.violations)   // WCAG violations
 * console.log(results.novel)        // Canvas-measurement-based findings
 *
 * const scores = score(results)
 * console.log(scores.wcag)          // { level: 'AA', score: 72 }
 * console.log(scores.cognitive)     // { score: 35, grade: 'good' }
 */

/**
 * Run a full accessibility audit on a URL or HTML string.
 *
 * Executes all four layers:
 *   Layer 0 — Pretext canvas measurement of text elements
 *   Layer 1 — Rule-based detection (WCAG + novel measurement rules)
 *   Layer 2 — Scoring (WCAG conformance + cognitive load)
 *   Layer 3 — Remediation patch generation (if options.remediate is true)
 *
 * @param {string} target - URL to audit, or raw HTML string
 * @param {AuditOptions} [options] - Configuration options
 * @param {string[]} [options.rules] - Rule IDs to run (default: all)
 * @param {boolean} [options.remediate] - Generate remediation patches (default: false)
 * @param {boolean} [options.cognitive] - Include cognitive load scoring (default: true)
 * @param {'json'|'html'|'console'} [options.format] - Output format (default: 'json')
 * @returns {Promise<AuditResults>} Audit results with violations, passes, and scores
 *
 * @typedef {Object} AuditResults
 * @property {Violation[]} violations - Accessibility violations found
 * @property {Pass[]} passes - Rules that passed
 * @property {Incomplete[]} incomplete - Rules that need manual review
 * @property {Novel[]} novel - Findings from canvas-measurement-based rules
 * @property {Scores} scores - WCAG and cognitive scores
 * @property {Patch[]} [patches] - Remediation patches (if options.remediate is true)
 * @property {object} metadata - Audit metadata (url, timestamp, rules run, timing)
 */
export async function audit(target, options = {}) {
  throw new Error(
    'Not yet implemented — see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1).'
  );
}

/**
 * Measure text properties of a single DOM element using Pretext canvas rendering.
 *
 * This is Layer 0 exposed directly — useful for building custom rules or
 * integrating measurement into other tools.
 *
 * @param {Element} element - DOM element to measure
 * @param {MeasureOptions} [options] - Measurement configuration
 * @param {number} [options.scaleFactor] - Font scale to simulate (default: 1.0)
 * @param {number} [options.containerWidth] - Override container width (default: computed)
 * @returns {Promise<TextMeasurement>} Measurement results
 *
 * @typedef {Object} TextMeasurement
 * @property {number} actualWidth - Rendered text width in pixels
 * @property {number} containerWidth - Available container width in pixels
 * @property {boolean} overflows - Whether text exceeds container
 * @property {number} overflowAmount - Pixels of overflow (0 if no overflow)
 * @property {number[]} lineBreaks - Character indices where lines break
 * @property {number[]} charsPerLine - Character count per visual line
 * @property {number} lineCount - Total number of visual lines
 */
export async function measure(element, options = {}) {
  throw new Error(
    'Not yet implemented — see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1).'
  );
}

/**
 * Compute WCAG conformance and cognitive load scores from audit results.
 *
 * This is Layer 2 exposed directly — useful when you have results from
 * a previous audit and want to re-score with different parameters.
 *
 * @param {AuditResults} results - Results from a previous audit() call
 * @param {ScoreOptions} [options] - Scoring configuration
 * @param {boolean} [options.elderly] - Apply elderly-specific thresholds (default: false)
 * @param {string} [options.targetLevel] - Target WCAG level: 'A', 'AA', 'AAA' (default: 'AA')
 * @returns {Scores} WCAG and cognitive scores
 *
 * @typedef {Object} Scores
 * @property {WcagScore} wcag - WCAG conformance score
 * @property {CognitiveScore} cognitive - Cognitive load score
 *
 * @typedef {Object} WcagScore
 * @property {string} level - Achieved conformance level ('A', 'AA', 'AAA', or 'None')
 * @property {number} score - Numeric score (0-100)
 * @property {Object} breakdown - Violations by impact level
 *
 * @typedef {Object} CognitiveScore
 * @property {number} score - Cognitive load score (0-100, lower is better)
 * @property {string} grade - 'excellent' | 'good' | 'moderate' | 'poor' | 'severe'
 * @property {number} readability - Flesch-Kincaid grade level
 * @property {number} elementDensity - Interactive elements per viewport area
 * @property {number} charDensity - Average characters per visual line
 */
export function score(results, options = {}) {
  throw new Error(
    'Not yet implemented — see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1).'
  );
}

/**
 * Generate safe remediation patches from audit results.
 *
 * This is Layer 3 exposed directly. Only generates patches for LOW-RISK
 * fixes (aria-labels, role attributes, lang attributes). Medium and high
 * risk issues are returned as suggestions, never as auto-applicable patches.
 *
 * Remediation is ALWAYS opt-in. This function generates patches but does
 * not apply them. Use applyPatches() to apply.
 *
 * @param {AuditResults} results - Results from a previous audit() call
 * @param {RemediateOptions} [options] - Remediation configuration
 * @param {string[]} [options.riskLevels] - Risk levels to include: ['low'] (default: ['low'])
 * @param {boolean} [options.dryRun] - Only report what would be fixed (default: true)
 * @returns {RemediationPlan} Patches and suggestions
 *
 * @typedef {Object} RemediationPlan
 * @property {Patch[]} patches - Safe, auto-applicable fixes (low risk only)
 * @property {Suggestion[]} suggestions - Medium/high risk issues requiring manual fix
 * @property {object} stats - Summary: { patchable, suggestionsOnly, totalViolations }
 *
 * @typedef {Object} Patch
 * @property {string} ruleId - Rule that triggered this patch
 * @property {string} selector - CSS selector for the target element
 * @property {string} action - 'setAttribute' | 'addAttribute'
 * @property {string} attribute - Attribute name (e.g., 'aria-label')
 * @property {string} value - Attribute value to set
 * @property {string} risk - 'low' (patches are always low risk)
 * @property {boolean} reversible - Always true for ReadCheck patches
 */
export function remediate(results, options = {}) {
  throw new Error(
    'Not yet implemented — see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1).'
  );
}
