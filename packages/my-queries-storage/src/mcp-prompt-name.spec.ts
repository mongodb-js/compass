import { expect } from 'chai';
import {
  MCP_PROMPT_NAME_MAX_LENGTH,
  isValidMcpPromptName,
  suggestMcpPromptName,
  validateMcpPromptName,
} from './mcp-prompt-name';

describe('mcp-prompt-name', function () {
  describe('isValidMcpPromptName', function () {
    it('accepts short kebab-case names', function () {
      expect(isValidMcpPromptName('search-trips')).to.equal(true);
      expect(isValidMcpPromptName('q')).to.equal(true);
      expect(isValidMcpPromptName('active-customers-q4-2025')).to.equal(true);
    });

    it('accepts digits anywhere after the first character', function () {
      expect(isValidMcpPromptName('top-10')).to.equal(true);
      expect(isValidMcpPromptName('q4-2025')).to.equal(true);
    });

    it('rejects names starting with a digit', function () {
      expect(isValidMcpPromptName('4q-customers')).to.equal(false);
    });

    it('rejects uppercase, spaces, underscores, dots', function () {
      expect(isValidMcpPromptName('SearchTrips')).to.equal(false);
      expect(isValidMcpPromptName('search trips')).to.equal(false);
      expect(isValidMcpPromptName('search_trips')).to.equal(false);
      expect(isValidMcpPromptName('search.trips')).to.equal(false);
    });

    it('rejects leading / trailing hyphens', function () {
      expect(isValidMcpPromptName('-search')).to.equal(false);
      expect(isValidMcpPromptName('search-')).to.equal(false);
    });

    it('rejects empty / non-string input', function () {
      expect(isValidMcpPromptName('')).to.equal(false);
      expect(isValidMcpPromptName(undefined)).to.equal(false);
      expect(isValidMcpPromptName(null)).to.equal(false);
      expect(isValidMcpPromptName(42)).to.equal(false);
    });

    it('rejects names longer than the max length', function () {
      const tooLong = 'a' + 'b'.repeat(MCP_PROMPT_NAME_MAX_LENGTH);
      expect(isValidMcpPromptName(tooLong)).to.equal(false);
    });
  });

  describe('validateMcpPromptName', function () {
    // Returns a specific user-facing reason. Pin the phrasings so a
    // careless edit doesn't produce a regression in the inline error.

    it('returns null for valid input', function () {
      expect(validateMcpPromptName('search-trips')).to.equal(null);
    });

    it('returns null for empty (treat empty as "not set", not "invalid")', function () {
      expect(validateMcpPromptName('')).to.equal(null);
    });

    it('explains length violations', function () {
      const tooLong = 'a' + 'b'.repeat(MCP_PROMPT_NAME_MAX_LENGTH);
      expect(validateMcpPromptName(tooLong)).to.match(/at most/);
    });

    it('explains first-character requirement', function () {
      expect(validateMcpPromptName('4-q')).to.match(/start with a lowercase/);
    });

    it('explains trailing-hyphen rule', function () {
      expect(validateMcpPromptName('search-')).to.match(/end with a hyphen/);
    });

    it('explains the character set fallthrough', function () {
      expect(validateMcpPromptName('a_b')).to.match(/lowercase letters/);
    });
  });

  describe('suggestMcpPromptName', function () {
    it('lowercases, replaces spaces with hyphens, and strips non-ASCII', function () {
      expect(suggestMcpPromptName('Search Trips')).to.equal('search-trips');
      expect(suggestMcpPromptName('Café orders')).to.equal('cafe-orders');
    });

    it('collapses repeated separators and trims edges', function () {
      expect(suggestMcpPromptName('---Search   Trips---')).to.equal(
        'search-trips'
      );
    });

    it('returns empty string when no ASCII letters survive', function () {
      expect(suggestMcpPromptName('----')).to.equal('');
      expect(suggestMcpPromptName('123!')).to.equal('');
    });

    it('caps at the max length without leaving a trailing hyphen', function () {
      const long = 'a'.repeat(MCP_PROMPT_NAME_MAX_LENGTH) + '-extra';
      const result = suggestMcpPromptName(long);
      expect(result.length).to.be.lessThanOrEqual(MCP_PROMPT_NAME_MAX_LENGTH);
      expect(result.endsWith('-')).to.equal(false);
    });
  });
});
