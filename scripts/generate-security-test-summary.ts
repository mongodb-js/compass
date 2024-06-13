#!/usr/bin/env ts-node
import { execFile } from 'child_process';
import { promisify } from 'util';
import ts from 'typescript';
import { readFile } from 'fs/promises';
import path from 'path';

const securityTestTag = '@securityTest';

(async function () {
  const template = await readFile(
    path.join(__dirname, 'security-test-summary-template.md'),
    'utf8'
  );

  const gitGrepResult = await promisify(execFile)('git', [
    'grep',
    '-Fz',
    securityTestTag,
  ]);
  const files = gitGrepResult.stdout
    .split('\n')
    .map((file) => file.split('\0')[0])
    .filter(Boolean);

  const comments = new Set();

  for (const file of files) {
    const program = ts.createProgram([file], { allowJs: true });
    const sourceFile = program.getSourceFile(file)!;
    const text = sourceFile.getFullText();
    ts.forEachChild(sourceFile, (node) => {
      for (const { pos, end } of [
        ...(ts.getLeadingCommentRanges(text, node.pos) || []),
        ...(ts.getTrailingCommentRanges(text, node.pos) || []),
      ]) {
        let commentText = text.substring(pos, end).trim();
        if (!commentText.includes(securityTestTag)) continue;
        if (!commentText.startsWith('/**'))
          throw new Error(
            `${securityTestTag} comments must be multiline doc comments`
          );
        commentText = commentText.replace(/^\s*\/\**\s*/gm, ''); // strip /**
        commentText = commentText.replace(/\s*\*\/$/gm, ''); // strip  */
        commentText = commentText.replace(/^\s*\*/gm, ''); // strip  *
        commentText = commentText.replace(`${securityTestTag}`, '##');
        commentText = commentText
          .split('\n')
          .map((line) => line.trim())
          .join('\n');
        commentText += `\n\n<!-- Source File: \`${file}\` -->\n`;

        comments.add(commentText);
      }
    });
  }

  process.stdout.write(
    template.replace(/__SUMMARY__/, [...comments].join('\n\n'))
  );
})().catch((err) => {
  queueMicrotask(() => {
    throw err;
  });
});
