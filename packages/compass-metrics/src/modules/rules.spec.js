import rules from './rules';

describe('rules', () => {
  describe('compass:query-bar:query-changed', () => {
    let rule;
    beforeEach(() => {
      rule = rules.find(({registryEvent}) => registryEvent === 'compass:query-bar:query-changed');
      expect(rule).to.exist;
    });

    it('sets metatada to `true` for options that are set', () => {
      expect(rule.metadata(
        'v1.0.0',
        {
          filter: { x: 1 },
          project: { x: 1 },
          sort: { x: 1 },
          skip: 1,
          limit: 1
        }
      )).to.deep.equal({
        has_filter: true,
        has_project: true,
        has_sort: true,
        skip: 1,
        limit: 1,
        compass_version: 'v1.0.0'
      });
    });

    it('sets metatada to `false` for options that are empty objects', () => {
      expect(rule.metadata(
        'v1.0.0',
        {
          filter: {},
          project: {},
          sort: {},
          skip: 1,
          limit: 1
        }
      )).to.deep.equal({
        has_filter: false,
        has_project: false,
        has_sort: false,
        skip: 1,
        limit: 1,
        compass_version: 'v1.0.0'
      });
    });

    it('sets metatada to `false` for options that are undefined or null', () => {
      expect(rule.metadata(
        'v1.0.0',
        {
          filter: undefined,
          project: undefined,
          sort: undefined,
          skip: 1,
          limit: 1
        }
      )).to.deep.equal({
        has_filter: false,
        has_project: false,
        has_sort: false,
        skip: 1,
        limit: 1,
        compass_version: 'v1.0.0'
      });

      expect(rule.metadata(
        'v1.0.0',
        {
          filter: null,
          project: null,
          sort: null,
          skip: 1,
          limit: 1
        }
      )).to.deep.equal({
        has_filter: false,
        has_project: false,
        has_sort: false,
        skip: 1,
        limit: 1,
        compass_version: 'v1.0.0'
      });
    });
  });
});
