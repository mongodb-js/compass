import { execFile as execFileCallback, execFileSync } from 'child_process';
import { promisify } from 'util';
import which from 'which';

const execFile = promisify(execFileCallback);

const parse = (stdout: Buffer | string): string | null => {
  const tag = stdout.toString('utf-8').split('\n')[0];
  return tag || null;
};

const getExecArgs = (
  sha: string
): [string, string[], { cwd: string; env: NodeJS.ProcessEnv }] => {
  const GIT = which.sync('git');
  const opts = {
    cwd: process.cwd(),
    env: process.env,
  };

  const args = ['describe', '--exact-match', sha];

  return [GIT, args, opts];
};

export const isTag = async (sha: string): Promise<boolean> => {
  const tag = await getTag(sha);
  return tag !== null;
};

export const isTagSync = (sha: string): boolean => {
  return getTagSync(sha) !== null;
};

export const getTag = async (sha: string): Promise<string | null> => {
  const args = getExecArgs(sha);
  const { stdout } = await execFile(...args);
  return parse(stdout);
};

export const getTagSync = (sha: string): string | null => {
  const args = getExecArgs(sha);
  const stdout = execFileSync(...args);
  return parse(stdout);
};
