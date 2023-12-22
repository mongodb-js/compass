import { sign } from './sign';

const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: node src/index.js <path-to-file-to-sign>');
  process.exit(1);
}

void sign(args[0]);
