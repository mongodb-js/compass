const oldPlatform = process.platform;

afterEach(() => {
  jest.resetModules();
})

afterAll(() => {
  process.platform = oldPlatform;
});

test('separator returns the correct separator for win32', () => {
  let separator;

  process.platform = 'win32';
  separator = require('../../src/utils/separator').separator;
  expect(separator).toBe('\\');
});

test('separator returns the correct separator for unix', () => {
  let separator;

  process.platform = 'linux';
  separator = require('../../src/utils/separator').separator;
  expect(separator).toBe('/');
});