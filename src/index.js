/**
 * @module @readcheck/core
 *
 * ReadCheck -- Open-source accessibility measurement engine.
 *
 * Uses canvas-based text measurement (via Pretext by Cheng Lou) to detect,
 * score, and optionally remediate accessibility barriers that traditional
 * DOM-only tools cannot express.
 *
 * ReadCheck is the technical arm of SilberWelt, an initiative for elderly
 * digital inclusion. Scoring thresholds are tuned for elderly and low-
 * literacy users, applying stricter requirements than WCAG minimums where
 * research supports it.
 *
 * @see https://github.com/readcheck/readcheck
 * @see https://github.com/chenglou/pretext
 * @see ARCHITECTURE.md for the four-layer design
 *
 * @example
 * import { audit, score } from '@readcheck/core'
 *
 * // Full audit of a URL
 * const results = await audit('https://example.com')
 * console.log(results.violations)   // WCAG violations
 * console.log(results.novel)        // Canvas-measurement-based findings
 *
 * // Score the results
 * const scores = score(results)
 * console.log(scores.wcag)          // { level: 'AA', score: 72 }
 * console.log(scores.cognitive)     // { score: 35, grade: 'good' }
 *
 * @example
 * // Measure a single element (Layer 0 exposed directly)
 * import { measure } from '@readcheck/core'
 *
 * const m = await measure(document.querySelector('#title'))
 * console.log(m.actualWidth)        // 342.5 (pixels, sub-pixel accurate)
 * console.log(m.overflows)          // true (text exceeds container)
 * console.log(m.charsPerLine)       // [45, 42, 38] (per visual line)
 */

// ═══════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════

/**
 * Run a full accessibility audit on a URL or HTML string.
 *
 * Executes all four layers:
 *   Layer 0 -- Pretext canvas measurement of text elements
 *   Layer 1 -- Rule-based detection (WCAG + novel measurement rules)
 *   Layer 2 -- Scoring (WCAG conformance + cognitive load)
 *   Layer 3 -- Remediation patch generation (if options.remediate is true)
 *
 * @param {string} target - URL to audit, or raw HTML string
 * @param {AuditOptions} [options] - Configuration options
 * @param {string[]} [options.rules] - Rule IDs to run (default: all)
 * @param {boolean} [options.remediate] - Generate remediation patches (default: false)
 * @param {boolean} [options.cognitive] - Include cognitive load scoring (default: true)
 * @param {boolean} [options.elderly] - Apply elderly-specific thresholds (default: false)
 * @param {'json'|'html'|'console'} [options.format] - Output format (default: 'json')
 * @returns {Promise<AuditResults>} Audit results with violations, passes, and scores
 *
 * @typedef {Object} AuditOptions
 * @property {string[]} [rules] - Rule IDs to run (default: all registered rules)
 * @property {boolean} [remediate] - Generate remediation patches (default: false)
 * @property {boolean} [cognitive] - Include cognitive load scoring (default: true)
 * @property {boolean} [elderly] - Apply elderly-specific thresholds (default: false)
 * @property {'json'|'html'|'console'} [format] - Output format (default: 'json')
 *
 * @typedef {Object} AuditResults
 * @property {Violation[]} violations - WCAG violations found (axe-core compatible)
 * @property {Pass[]} passes - Rules that passed
 * @property {Incomplete[]} incomplete - Rules that need manual review
 * @property {Novel[]} novel - Findings from canvas-measurement-based rules
 * @property {Scores} scores - WCAG and cognitive scores (from Layer 2)
 * @property {Patch[]} [patches] - Remediation patches (only if options.remediate is true)
 * @property {AuditMetadata} metadata - Audit metadata
 *
 * @typedef {Object} AuditMetadata
 * @property {string} url - URL or identifier of the audited page
 * @property {string} timestamp - ISO 8601 timestamp of the audit
 * @property {string[]} rulesRun - IDs of rules that were executed
 * @property {PerformanceData} performance - Timing and measurement data
 *
 * @typedef {Object} PerformanceData
 * @property {number} totalMs - Total audit time in milliseconds
 * @property {number} measurementMs - Layer 0 measurement time
 * @property {number} detectionMs - Layer 1 detection time
 * @property {number} scoringMs - Layer 2 scoring time
 * @property {number} canvasMeasurements - Number of canvas measurements performed
 * @property {number} domQueriesAvoided - DOM reflow queries avoided by using canvas
 */
export async function audit(target, options = {}) {
  throw new Error(
    'Not yet implemented -- see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1). ' +
    'See demo/index.html for a working proof-of-concept.'
  );
}

/**
 * Measure text properties of a single DOM element using Pretext canvas rendering.
 *
 * This is Layer 0 exposed directly -- useful for building custom rules or
 * integrating ReadCheck's measurement capability into other tools.
 *
 * The measurement uses an offscreen canvas with the element's computed font
 * properties, producing the same width values as the browser's layout engine
 * without triggering any DOM reflow. Cost: ~0.02ms per measurement vs.
 * ~5ms for getBoundingClientRect().
 *
 * @param {Element} element - DOM element to measure
 * @param {MeasureOptions} [options] - Measurement configuration
 * @param {number} [options.scaleFactor] - Font scale to simulate (default: 1.0)
 * @param {number} [options.containerWidth] - Override container width (default: computed)
 * @returns {Promise<TextMeasurement>} Measurement results
 *
 * @typedef {Object} MeasureOptions
 * @property {number} [scaleFactor] - Simulate font scaling (1.0 = 100%, 2.0 = 200%)
 * @property {number} [containerWidth] - Override container width for overflow detection
 *
 * @typedef {Object} TextMeasurement
 * @property {number} actualWidth - Rendered text width in CSS pixels (sub-pixel accurate)
 * @property {number} containerWidth - Available container width in CSS pixels
 * @property {boolean} overflows - Whether text exceeds container at current scale
 * @property {number} overflowAmount - Pixels of overflow (0 if no overflow)
 * @property {number[]} lineBreaks - Character indices where visual lines break
 * @property {number[]} charsPerLine - Character count per visual line
 * @property {number} lineCount - Total number of visual lines
 * @property {string} font - CSS font shorthand used for measurement
 */
export async function measure(element, options = {}) {
  throw new Error(
    'Not yet implemented -- see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1). ' +
    'See demo/readcheck.js for a working canvas measurement implementation.'
  );
}

/**
 * Compute WCAG conformance and cognitive load scores from audit results.
 *
 * This is Layer 2 exposed directly -- useful when you have results from
 * a previous audit and want to re-score with different parameters (e.g.,
 * toggling elderly-specific thresholds to compare scores).
 *
 * @param {AuditResults} results - Results from a previous audit() call
 * @param {ScoreOptions} [options] - Scoring configuration
 * @param {boolean} [options.elderly] - Apply elderly-specific thresholds (default: false)
 * @param {string} [options.targetLevel] - Target WCAG level: 'A', 'AA', 'AAA' (default: 'AA')
 * @returns {Scores} WCAG and cognitive scores
 *
 * @typedef {Object} ScoreOptions
 * @property {boolean} [elderly] - Apply elderly-specific thresholds
 * @property {string} [targetLevel] - Target WCAG conformance level
 *
 * @typedef {Object} Scores
 * @property {WcagScore} wcag - WCAG conformance score
 * @property {CognitiveScore} cognitive - Cognitive load score
 *
 * @typedef {Object} WcagScore
 * @property {string} level - Achieved conformance level ('A', 'AA', 'AAA', or 'None')
 * @property {number} score - Numeric score (0-100)
 * @property {string} grade - 'excellent' | 'good' | 'needs-work' | 'poor' | 'failing'
 * @property {Object} breakdown - Violations by impact level
 * @property {number} breakdown.critical - Count of critical violations
 * @property {number} breakdown.serious - Count of serious violations
 * @property {number} breakdown.moderate - Count of moderate violations
 *
 * @typedef {Object} CognitiveScore
 * @property {number} score - Cognitive load score (0-100, lower is better)
 * @property {string} grade - 'excellent' | 'good' | 'moderate' | 'poor' | 'severe'
 * @property {number} readability - Flesch-Kincaid grade level of page text
 * @property {number} elementDensity - Interactive elements per viewport area
 * @property {number} charDensity - Average characters per visual line (from canvas)
 * @property {number} contrastMargin - Average contrast margin above WCAG minimum
 * @property {number} targetSizeMargin - Average target size margin above WCAG minimum
 */
export function score(results, options = {}) {
  throw new Error(
    'Not yet implemented -- see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1). ' +
    'See demo/readcheck.js for a working scoring implementation.'
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
 * not apply them. Use applyPatches() to apply generated patches to a page.
 *
 * Safety taxonomy (based on AFixt 2023 research):
 *   - Low risk (patchable): aria-label, role, lang attributes
 *   - Medium risk (suggest only): generated alt text, title attributes
 *   - High risk (report only): CSS changes, DOM restructuring
 *
 * @param {AuditResults} results - Results from a previous audit() call
 * @param {RemediateOptions} [options] - Remediation configuration
 * @param {string[]} [options.riskLevels] - Risk levels to include (default: ['low'])
 * @param {boolean} [options.dryRun] - Only report what would be fixed (default: true)
 * @returns {RemediationPlan} Patches and suggestions
 *
 * @typedef {Object} RemediateOptions
 * @property {string[]} [riskLevels] - Risk levels: ['low'] | ['low', 'medium']
 * @property {boolean} [dryRun] - Report without applying (default: true)
 *
 * @typedef {Object} RemediationPlan
 * @property {Patch[]} patches - Safe, auto-applicable fixes (low risk only by default)
 * @property {Suggestion[]} suggestions - Medium/high risk issues requiring manual fix
 * @property {RemediationStats} stats - Summary statistics
 *
 * @typedef {Object} RemediationStats
 * @property {number} patchable - Number of violations fixable by auto-patch
 * @property {number} suggestionsOnly - Number requiring manual fix
 * @property {number} totalViolations - Total violations in the input results
 *
 * @typedef {Object} Patch
 * @property {string} ruleId - Rule that triggered this patch
 * @property {string} selector - CSS selector for the target element
 * @property {string} action - 'setAttribute' | 'addAttribute'
 * @property {string} attribute - Attribute name (e.g., 'aria-label')
 * @property {string} value - Attribute value to set
 * @property {string} risk - 'low' (patches are always low risk by default)
 * @property {boolean} reversible - Always true for ReadCheck patches
 *
 * @typedef {Object} Suggestion
 * @property {string} ruleId - Rule that triggered this suggestion
 * @property {string} selector - CSS selector for the target element
 * @property {string} suggestion - Human-readable fix description
 * @property {string} risk - 'medium' | 'high'
 * @property {string} reason - Why auto-fix is not safe for this issue
 */
export function remediate(results, options = {}) {
  throw new Error(
    'Not yet implemented -- see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1).'
  );
}

/**
 * Apply generated patches to a live page.
 *
 * Takes patches from remediate() and applies them to the current document.
 * Each patch is a low-risk attribute change (aria-label, role, lang) that
 * can be reversed by calling revertPatches().
 *
 * @param {Patch[]} patches - Patches from remediate().patches
 * @param {ApplyOptions} [options] - Application options
 * @param {Document} [options.document] - Target document (default: window.document)
 * @returns {ApplyResult} Applied patches and any failures
 *
 * @typedef {Object} ApplyResult
 * @property {number} applied - Number of patches successfully applied
 * @property {number} failed - Number of patches that failed (element not found, etc.)
 * @property {RevertHandle} revert - Call revert.undo() to reverse all applied patches
 */
export function applyPatches(patches, options = {}) {
  throw new Error(
    'Not yet implemented -- see ARCHITECTURE.md for the planned design. ' +
    'ReadCheck is in early development (v0.0.1).'
  );
}

/**
 * ReadCheck version string.
 * @type {string}
 */
export const VERSION = '0.0.1';
