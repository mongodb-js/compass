const fs = require('fs');
const { execSync } = require('child_process');
const doctrine = require('doctrine');

function getGitTrackedFiles() {
  try {
    const stdout = execSync('git ls-files').toString();
    return stdout
      .split('\n')
      .filter(
        (file) =>
          file.match(/\.(ts|tsx|js|jsx)$/) && !file.includes('node_modules')
      );
  } catch (err) {
    console.error('Error executing git command:', err);
    process.exit(1);
  }
}

function extractTelemetryComments(content) {
  const telemetryComments = [];
  const jsDocRegex = /\/\*\*([\s\S]*?)\*\//g;

  let match;
  while ((match = jsDocRegex.exec(content)) !== null) {
    const parsed = doctrine.parse(match[0], { unwrap: true, sloppy: true });
    const hasTelemetry = parsed.tags.some((tag) => tag.title === 'track');

    if (hasTelemetry) {
      telemetryComments.push(parsed);
    }
  }

  return telemetryComments;
}

const files = getGitTrackedFiles();

const telemetryDocs = files.reduce((acc, file) => {
  const content = fs.readFileSync(file, 'utf8');
  const comments = extractTelemetryComments(content);
  if (comments.length > 0) {
    comments.forEach((comment) => {
      let eventName = '';
      let category = 'Uncategorized';
      let description = comment.description || '';
      const params = [];

      comment.tags.forEach((tag) => {
        if (tag.title === 'track') {
          eventName = tag.description;
        } else if (tag.title === 'category') {
          category = tag.description;
        } else if (tag.title === 'param') {
          const paramName = tag.name || '';
          const paramType = tag.type ? tag.type.name : '';
          const paramDescription = tag.description || '';
          const required = !/^\[.*\]$/.test(paramName); // Check if param is required
          params.push({
            name: paramName.replace(/[\[\]]/g, ''),
            type: paramType,
            required,
            description: paramDescription,
          });
        }
      });

      if (category && eventName) {
        acc[category] = acc[category] || [];
        acc[category].push({ eventName, description, params });
      }
    });
  }
  return acc;
}, {});

let markdownOutput = '';
let tocOutput = '# Table of Contents\n\n';

Object.keys(telemetryDocs).forEach((category) => {
  const categorySlug = category.toLowerCase().replace(/\s+/g, '-');
  tocOutput += `- [${category}](#${categorySlug})\n`;
  markdownOutput += `# ${category}\n\n`;
  telemetryDocs[category].forEach((event) => {
    const eventSlug = event.eventName.toLowerCase().replace(/\s+/g, '-');
    tocOutput += `  - [${event.eventName}](#${eventSlug})\n`;
    markdownOutput += `## ${event.eventName}\n\n`;
    markdownOutput += `${event.description}\n\n`;
    markdownOutput += `| Name | Type | Required | Description |\n`;
    markdownOutput += `|------|------|----------|-------------|\n`;
    event.params.forEach((param) => {
      markdownOutput += `| ${param.name} | ${param.type} | ${
        param.required ? 'Yes' : 'No'
      } | ${param.description} |\n`;
    });
    markdownOutput += `\n`;
  });
});

const fullOutput = tocOutput + '\n' + markdownOutput;

console.log(fullOutput);
