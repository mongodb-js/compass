const fs = require('fs');
const path = require('path');

const mainNoticesPath = path.join(
  __dirname,
  '..',
  'build',
  'third-party-notices-main.json'
);
const rendererNoticesPath = path.join(
  __dirname,
  '..',
  'build',
  'third-party-notices-renderer.json'
);

const mainNotices = fs.readFileSync(mainNoticesPath);
const rendererNotices = fs.readFileSync(rendererNoticesPath);

const uniqueData = [
  ...JSON.parse(mainNotices),
  ...JSON.parse(rendererNotices),
].filter((elem, index, self) => {
  return (
    index ===
    self.findIndex((t) => t.name === elem.name && t.version === elem.version)
  );
});

const sortedData = [...uniqueData].sort((a, b) => a.name.localeCompare(b.name));

let markdown = '# Third-Party Notices\n\n';

sortedData.forEach((entry) => {
  markdown += `## ${entry.name} ${entry.version}\n\n`;
  markdown += `**License**: ${entry.license}\n\n`;
  if (entry.author) {
    markdown += `**Author**: ${entry.author}\n\n`;
  }
  if (entry.repository) {
    markdown += `**Repository**: ${entry.repository}\n\n`;
  }
  if (entry.source) {
    markdown += `**Source**: ${entry.source}\n\n`;
  }
  if (entry.licenseText) {
    markdown += `**License Text**:\n\n\`\`\`\n${entry.licenseText}\n\`\`\`\n\n`;
  }
});

// Write the Markdown file
fs.writeFileSync(
  path.join(__dirname, '..', 'THIRD-PARTY-NOTICES.md'),
  markdown
);

fs.unlinkSync(mainNoticesPath);
fs.unlinkSync(rendererNoticesPath);

console.log('Merged JSON files and generated Markdown file.');
