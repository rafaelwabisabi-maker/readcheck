# Contributing to ReadCheck

Thank you for your interest in contributing to ReadCheck. This project aims to make the web more accessible by providing measurement-based accessibility detection that existing tools cannot offer.

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/version/2/1/code_of_conduct/). By participating, you agree to uphold a welcoming, inclusive, and harassment-free environment for everyone.

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm 9 or later

### Setup

```bash
git clone https://github.com/readcheck/readcheck.git
cd readcheck
npm install
npm test
```

### Project Structure

```
src/
  index.js              # Public API entry point
  measurement/          # Layer 0: Canvas-based text measurement
  detection/            # Layer 1: Rule engine and individual rules
  scoring/              # Layer 2: WCAG + cognitive scoring
  remediation/          # Layer 3: Safe remediation (opt-in)
  output/               # Output formatters (JSON, HTML, console)
test/
  fixtures/             # HTML test fixtures
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed technical documentation.

## How to Contribute

### Reporting Bugs

Open an issue with:
- Description of the bug
- Steps to reproduce
- Expected vs actual behavior
- URL of the page where the issue occurs (if applicable)
- ReadCheck version (`npx readcheck --version`)

### Adding a New Rule

Rules are the primary contribution surface. To add a new accessibility rule:

1. **Create the rule file** in `src/detection/rules/`:

```javascript
/**
 * @rule your-rule-id
 * @impact serious | moderate | minor
 * @tags wcag2aa, readcheck-novel, cognitive (as applicable)
 */
export default {
  id: 'your-rule-id',
  impact: 'serious',
  tags: ['wcag2aa'],
  description: 'What this rule detects and why it matters',

  // CSS selector for candidate elements
  selector: 'img, [role="img"]',

  // Evaluation function
  // node: the DOM element
  // measurements: Map of element -> Pretext measurements (may be null)
  check: (node, measurements) => {
    // Return one of:
    // { result: 'violation', message: '...', data: {} }
    // { result: 'pass' }
    // { result: 'incomplete', message: '...' }  (needs manual review)
    // { result: 'inapplicable' }
  }
};
```

2. **Add test fixtures** in `test/fixtures/`:
   - Create an HTML file that triggers the violation
   - Create an HTML file that passes the rule
   - Include edge cases (dynamic content, responsive layouts)

3. **Write tests** in `test/detection/`:

```javascript
import { test } from 'node:test';
import assert from 'node:assert';
import { runRule } from '../../src/detection/engine.js';
import rule from '../../src/detection/rules/your-rule-id.js';

test('your-rule-id detects violation', async () => {
  const results = await runRule(rule, 'test/fixtures/your-rule-violation.html');
  assert.strictEqual(results.violations.length, 1);
});

test('your-rule-id passes clean page', async () => {
  const results = await runRule(rule, 'test/fixtures/your-rule-pass.html');
  assert.strictEqual(results.violations.length, 0);
});
```

4. **Register the rule** in `src/detection/rules/index.js`

5. **Document the rule** in your PR description:
   - Which WCAG criterion it relates to (if any)
   - Whether it requires canvas measurement (novel rule) or is DOM-only
   - Real-world examples of the violation

### Rule Design Guidelines

- **One rule, one concern.** Each rule should detect exactly one type of accessibility barrier.
- **Prefer measurement over heuristics.** If Pretext can measure it, measure it. Do not guess.
- **Impact levels must be justified.** `critical` and `serious` require a WCAG criterion reference or published research citation.
- **No false-positive tolerance for `critical`.** A rule marked `critical` must have zero false positives on the test suite.
- **Include `inapplicable` returns.** If the rule does not apply to a given element, return `inapplicable`, not `pass`.

### Writing Tests

```bash
# Run all tests
npm test

# Run a specific test file
npm test -- test/detection/text-overflow-risk.test.js

# Run with coverage
npm run test:coverage
```

Tests use Node.js built-in test runner (`node:test`) and assertion module (`node:assert`). No external test framework is required.

### Code Style

```bash
# Check formatting and lint
npm run lint

# Auto-fix what can be fixed
npm run lint:fix
```

The project uses ESLint with a minimal configuration. Key rules:
- ES modules (`import`/`export`), no CommonJS
- No unused variables
- Strict equality (`===`)
- JSDoc comments on all public functions

## Pull Request Process

1. Fork the repository and create a branch from `main`
2. Write your changes with tests
3. Run `npm test` and `npm run lint` -- both must pass
4. Write a clear PR description explaining what and why
5. Link any related issues

PRs are reviewed for:
- Correctness (does the rule detect what it claims?)
- False positives (does it flag things that are not violations?)
- Performance (does it stay within the 60ms audit budget?)
- Documentation (is the rule described clearly?)

## Communication

- **Issues:** Bug reports, feature requests, rule proposals
- **Discussions:** Architecture questions, research references, roadmap input
- **Pull Requests:** Code contributions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
