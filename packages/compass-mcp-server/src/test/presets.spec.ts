import { expect } from 'chai';
import { isToolAllowed, presetTools, ALL_PRESETS } from '../presets';
import { normalizeMcpAccess } from '@mongodb-js/connection-info';

describe('presets', function () {
  describe('preset allowlists', function () {
    it('metadata-only includes only metadata + always-on tools', function () {
      const tools = presetTools('metadata-only');
      expect(tools).to.include('list-databases');
      expect(tools).to.include('collection-schema');
      expect(tools).to.include('explain');
      expect(tools).to.not.include('find');
      expect(tools).to.not.include('count');
      expect(tools).to.not.include('aggregate');
      expect(tools).to.not.include('insert-many');
    });

    it('read-only adds find/count/aggregate over metadata-only', function () {
      const metadata = new Set(presetTools('metadata-only'));
      const ro = new Set(presetTools('read-only'));
      for (const t of metadata) {
        expect(ro.has(t), `read-only is missing ${t}`).to.equal(true);
      }
      expect(ro.has('find')).to.equal(true);
      expect(ro.has('count')).to.equal(true);
      expect(ro.has('aggregate')).to.equal(true);
      expect(ro.has('insert-many')).to.equal(false);
    });

    it('full-access adds writes over read-only', function () {
      const ro = new Set(presetTools('read-only'));
      const full = new Set(presetTools('full-access'));
      for (const t of ro) {
        expect(full.has(t), `full-access is missing ${t}`).to.equal(true);
      }
      expect(full.has('insert-many')).to.equal(true);
      expect(full.has('update-many')).to.equal(true);
      expect(full.has('delete-many')).to.equal(true);
      expect(full.has('drop-collection')).to.equal(true);
    });

    it('connect/list-connections/compass-open-collection are always allowed', function () {
      for (const preset of ALL_PRESETS) {
        expect(isToolAllowed(preset, 'connect')).to.equal(true);
        expect(isToolAllowed(preset, 'list-connections')).to.equal(true);
        expect(isToolAllowed(preset, 'compass-open-collection')).to.equal(true);
      }
    });

    it('isToolAllowed rejects unknown tools', function () {
      for (const preset of ALL_PRESETS) {
        expect(isToolAllowed(preset, 'made-up-tool')).to.equal(false);
      }
    });
  });

  describe('normalizeMcpAccess', function () {
    it('maps legacy "allowed" string to read-only preset', function () {
      expect(normalizeMcpAccess('allowed')).to.deep.equal({
        mode: 'allowed',
        preset: 'read-only',
      });
    });

    it('maps legacy "denied" string to denied mode', function () {
      expect(normalizeMcpAccess('denied')).to.deep.equal({ mode: 'denied' });
    });

    it('returns ask for undefined / null / garbage', function () {
      expect(normalizeMcpAccess(undefined)).to.deep.equal({ mode: 'ask' });
      expect(normalizeMcpAccess(null)).to.deep.equal({ mode: 'ask' });
      expect(normalizeMcpAccess(42)).to.deep.equal({ mode: 'ask' });
      expect(normalizeMcpAccess({})).to.deep.equal({ mode: 'ask' });
    });

    it('passes through valid new-shape access', function () {
      expect(
        normalizeMcpAccess({ mode: 'allowed', preset: 'metadata-only' })
      ).to.deep.equal({ mode: 'allowed', preset: 'metadata-only' });
      expect(normalizeMcpAccess({ mode: 'denied' })).to.deep.equal({
        mode: 'denied',
      });
      expect(normalizeMcpAccess({ mode: 'ask' })).to.deep.equal({
        mode: 'ask',
      });
    });

    it('falls back to read-only when the preset is invalid', function () {
      expect(
        normalizeMcpAccess({ mode: 'allowed', preset: 'super-admin' })
      ).to.deep.equal({ mode: 'allowed', preset: 'read-only' });
    });
  });
});
