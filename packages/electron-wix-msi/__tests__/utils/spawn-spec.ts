import { spawnPromise } from '../../src/utils/spawn';
import { mockSpawn } from '../mocks/mock-spawn';

beforeAll(() => {
  jest.mock('child_process', () => ({
    spawn(name: string, args: Array<string>, o: any, fs: any) {
      return new mockSpawn(name, args, o, fs);
    }
  }));
});

afterAll(() => {
  jest.resetAllMocks();
});

test('spawnPromise() spawns a process and returns data on close', async () => {
  const { code, stderr, stdout } = await spawnPromise('hi', ['yup']);

  expect(code).toEqual(0);
  expect(stderr).toEqual('A bit of error');
  expect(stdout).toEqual('A bit of data');
});
