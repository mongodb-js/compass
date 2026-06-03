import { expect } from 'chai';
import { TransportRunnerBase } from 'mongodb-mcp-server';
import {
  COMPASS_INSTRUCTIONS,
  installCompassMcpInstructions,
} from '../instructions';

describe('installCompassMcpInstructions', function () {
  // We monkey-patch a static on the upstream TransportRunnerBase. The
  // tests below confirm:
  //   - the patch actually replaces upstream's default
  //   - it returns the expected Compass-specific guidance
  //   - it's idempotent so importing it from anywhere is safe

  it('replaces TransportRunnerBase.getInstructions with the Compass text', function () {
    installCompassMcpInstructions();
    const got = (
      TransportRunnerBase as unknown as {
        getInstructions: (config: unknown) => string;
      }
    ).getInstructions({});
    expect(got).to.equal(COMPASS_INSTRUCTIONS);
  });

  it('is idempotent — calling it twice does not stack patches', function () {
    installCompassMcpInstructions();
    installCompassMcpInstructions();
    const got = (
      TransportRunnerBase as unknown as {
        getInstructions: (config: unknown) => string;
      }
    ).getInstructions({});
    expect(got).to.equal(COMPASS_INSTRUCTIONS);
  });

  describe('COMPASS_INSTRUCTIONS content', function () {
    // The instructions string is what AI clients inject into the model's
    // system prompt. Wording changes risk regressions in how the AI follows
    // our workflow, so we pin the key phrases.

    it('describes the required list-connections → connect workflow', function () {
      expect(COMPASS_INSTRUCTIONS).to.match(/list-connections/);
      expect(COMPASS_INSTRUCTIONS).to.match(/\bconnect\b/);
    });

    it('forbids passing a connection string', function () {
      expect(COMPASS_INSTRUCTIONS).to.match(/NEVER.*connection string/);
    });

    it('mentions the three access presets by name', function () {
      expect(COMPASS_INSTRUCTIONS).to.match(/metadata-only/);
      expect(COMPASS_INSTRUCTIONS).to.match(/read-only/);
      expect(COMPASS_INSTRUCTIONS).to.match(/full-access/);
    });

    it('points the AI at compass-open-collection for interactive flows', function () {
      expect(COMPASS_INSTRUCTIONS).to.match(/compass-open-collection/);
    });

    it('is non-empty and trimmed', function () {
      expect(COMPASS_INSTRUCTIONS.length).to.be.greaterThan(0);
      expect(COMPASS_INSTRUCTIONS).to.equal(COMPASS_INSTRUCTIONS.trim());
    });
  });
});
