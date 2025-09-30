import process from 'node:process';
import child_process from 'node:child_process';
import fs from 'node:fs/promises';
import path from 'node:path';
import timers from 'node:timers/promises';
import { pipeline } from 'node:stream/promises';
import { Transform } from 'node:stream';

// Get raw arguments after the script name, skipping node and script path
const args = process.argv.slice(2);

// Check if help flag appears before any target (making it "our" help)
const validTargets = ['desktop', 'sandbox', 'sync'];
const firstTargetIndex = args.findIndex((arg) => validTargets.includes(arg));
const helpIndex = args.findIndex((arg) => arg === '-h' || arg === '--help');

const isOurHelp =
  helpIndex !== -1 && (firstTargetIndex === -1 || helpIndex < firstTargetIndex);

if (isOurHelp) {
  console.log(
    await fs.readFile(path.join(import.meta.dirname, 'start.md'), 'utf8')
  );
  process.exit(0);
}

// Parse positional arguments and group them by target
const targets = {
  desktop: { enabled: false, args: [] as string[] },
  sandbox: { enabled: false, args: [] as string[] },
  sync: { enabled: false, args: [] as string[] },
};

let currentTarget: keyof typeof targets | null = null;

for (const arg of args) {
  if (validTargets.includes(arg as keyof typeof targets)) {
    // Switch to new target
    currentTarget = arg as keyof typeof targets;
    targets[currentTarget].enabled = true;
  } else if (currentTarget) {
    // Add argument to current target's args (including help flags destined for targets)
    targets[currentTarget].args.push(arg);
  }
  // If arg is not a valid target and no current target, ignore it
}

// Check for mutually exclusive targets
if (
  targets.sandbox.enabled &&
  (targets.desktop.enabled || targets.sync.enabled)
) {
  console.error('Error: sandbox target must be run alone.');
  console.error(
    'Please run sandbox by itself, not combined with other targets.'
  );
  process.exit(1);
}

// If no targets specified, default to desktop
if (
  !targets.desktop.enabled &&
  !targets.sandbox.enabled &&
  !targets.sync.enabled
) {
  targets.desktop.enabled = true;
}

// Check if we need prefixing (more than one target enabled)
const enabledTargets = Object.values(targets).filter((t) => t.enabled);
const usePrefixing = enabledTargets.length > 1;
const startPrefix = usePrefixing ? `start    | ` : ``;

const subProcesses: child_process.ChildProcess[] = [];
let isCleaningUp = false;

async function cleanup(signal: NodeJS.Signals) {
  if (isCleaningUp) return; // Prevent multiple cleanup calls
  isCleaningUp = true;

  console.log(`\n${startPrefix}received ${signal}, terminating processes...`);

  // Kill all processes immediately with the received signal
  for (const p of subProcesses) {
    if (p.pid && p.exitCode === null) {
      try {
        process.kill(-p.pid, signal); // Kill entire process group
      } catch {
        p.kill(signal); // Fallback to killing just the process
      }
    }
  }

  // Wait a shorter time for graceful shutdown
  await timers.setTimeout(3000);

  // Force kill any remaining processes
  const stillRunning = subProcesses.filter((p) => p.exitCode === null);
  if (stillRunning.length > 0) {
    console.log(
      `${startPrefix}force killing ${stillRunning.length} remaining processes...`
    );
    for (const p of stillRunning) {
      if (p.pid) {
        try {
          process.kill(-p.pid, 'SIGKILL'); // Kill entire process group
        } catch {
          p.kill('SIGKILL'); // Fallback
        }
      }
    }
  }

  console.log(`${startPrefix}done.`);
  process.exit(signal === 'SIGTERM' ? 0 : 1);
}

// Handle signals properly even when child processes inherit stdio
process.on('SIGINT', () => cleanup('SIGINT'));
process.on('SIGTERM', () => cleanup('SIGTERM'));

// Ensure we exit cleanly on uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  cleanup('SIGTERM');
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  cleanup('SIGTERM');
});

// Helper function to create a transform stream that prefixes lines
function createPrefixTransform(prefix: string) {
  let buffer = '';
  return new Transform({
    transform(chunk, _, callback) {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      // Keep the last line in buffer (might be incomplete)
      buffer = lines.pop() || '';
      // Process complete lines
      for (const line of lines) {
        this.push(`${prefix} | ${line}\n`);
      }
      callback();
    },

    flush(callback) {
      // Process any remaining data in buffer
      if (buffer) {
        this.push(`${prefix} | ${buffer}\n`);
      }
      callback();
    },
  });
}

// Helper function to spawn a target process
function spawnTarget(
  command: string,
  workspace: string,
  args: string[],
  targetName: string
) {
  // Only set color-forcing env vars if user hasn't set color preferences
  const colorEnv: Record<string, string> = {};
  if (
    !process.env.NO_COLOR &&
    !process.env.FORCE_COLOR &&
    !process.env.CLICOLOR_FORCE
  ) {
    colorEnv.FORCE_COLOR = '1';
    colorEnv.CLICOLOR_FORCE = '1';
  }

  // Desktop needs full terminal control for shortcuts, others need piped output for prefixing
  const stdio: child_process.StdioOptions =
    targetName === 'desktop' && !usePrefixing
      ? 'inherit'
      : ['inherit', 'pipe', 'pipe'];

  const spawnArgs: Parameters<typeof child_process.spawn> = [
    'npm',
    [
      'run',
      command,
      `--workspace=${workspace}`,
      ...(args.length ? ['--', ...args] : []),
    ],
    {
      stdio,
      env: { ...process.env, ...colorEnv },
      // Create a new process group so we can kill the entire tree
      detached: true,
    },
  ];

  const paddedName = targetName.padEnd(8);
  console.log(`${startPrefix}${spawnArgs[0]} ${spawnArgs[1].join(' ')}`);
  const subProcess = child_process.spawn(...spawnArgs);

  // Only set up output piping if we're not using full inheritance
  if (stdio !== 'inherit') {
    // Set up stdout pipeline with error handling
    if (subProcess.stdout) {
      subProcess.stdout.setEncoding('utf-8');
      if (usePrefixing) {
        pipeline(
          subProcess.stdout,
          createPrefixTransform(paddedName),
          process.stdout,
          { end: false }
        ).catch((err) =>
          console.error(`start    | stdout pipeline error:`, err)
        );
      } else {
        pipeline(subProcess.stdout, process.stdout, { end: false }).catch(
          (err) => console.error(`start    | stdout pipeline error:`, err)
        );
      }
    }

    // Set up stderr pipeline with error handling
    if (subProcess.stderr) {
      subProcess.stderr.setEncoding('utf-8');
      if (usePrefixing) {
        pipeline(
          subProcess.stderr,
          createPrefixTransform(paddedName),
          process.stderr,
          { end: false }
        ).catch((err) =>
          console.error(`${startPrefix}stderr pipeline error:`, err)
        );
      } else {
        pipeline(subProcess.stderr, process.stderr, { end: false }).catch(
          (err) => console.error(`${startPrefix}stderr pipeline error:`, err)
        );
      }
    }
  }

  return subProcess;
}

if (targets.desktop.enabled) {
  subProcesses.push(
    spawnTarget('start', 'mongodb-compass', targets.desktop.args, 'desktop')
  );
}

if (targets.sync.enabled) {
  subProcesses.push(
    spawnTarget('sync', '@mongodb-js/compass-web', targets.sync.args, 'sync')
  );
}

if (targets.sandbox.enabled) {
  subProcesses.push(
    spawnTarget(
      'start',
      '@mongodb-js/compass-web',
      targets.sandbox.args,
      'sandbox'
    )
  );
}
