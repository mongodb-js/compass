import React from 'react';
import {
  Body,
  Code,
  Copyable,
  css,
  cx,
  InlineCode,
  Language,
  Link,
  Overline,
  palette,
  spacing,
  useDarkMode,
} from '@mongodb-js/compass-components';

const RUN_SCRIPT_COMMAND = `
mongosh "mongodb+srv://<your-cluster>.mongodb.net/mockDataDB" \\
  --username <yourUsername> \\
  --password "<yourPassword>" \\
  mockdatascript.js
`;

const outerSectionStyles = css({
  display: 'flex',
  flexDirection: 'column',
  gap: spacing[400],
});

const listStyles = css({
  listStylePosition: 'inside',
  listStyleType: 'disc',
  marginLeft: spacing[200],
});

const copyableStyles = css({
  marginLeft: spacing[400],
});

const sectionInstructionStyles = css({
  margin: `${spacing[200]}px 0`,
});

const resourceSectionStyles = css({
  padding: `${spacing[400]}px ${spacing[800]}px`,
  borderRadius: spacing[400],
});

const resourceSectionLightStyles = css({
  backgroundColor: palette.gray.light3,
});

const resourceSectionDarkStyles = css({
  backgroundColor: palette.gray.dark3,
});

const resourceSectionHeader = css({
  marginBottom: spacing[300],
});

const ScriptScreen = () => {
  const isDarkMode = useDarkMode();

  return (
    <section className={outerSectionStyles}>
      <section>
        <Body baseFontSize={16} weight="medium">
          Prerequisites
        </Body>
        <Body className={css({ marginTop: spacing[200] })}>
          To run the generated script, you must:
        </Body>
        <ul className={listStyles}>
          <li>
            Install{' '}
            <Link href="https://www.mongodb.com/docs/mongodb-shell/install/">
              mongosh
            </Link>
          </li>
          <li>
            Install{' '}
            <Link href="https://fakerjs.dev/guide/#installation">faker.js</Link>
            <Copyable className={copyableStyles}>
              npm install @faker-js/faker
            </Copyable>
          </li>
        </ul>
      </section>
      <section>
        <Body baseFontSize={16} weight="medium">
          1. Create a .js file with the following script
        </Body>
        <Body className={sectionInstructionStyles}>
          In the directory that you created, create a file
          named mockdatascript.js (or any name you’d like).
        </Body>
        {/* TODO: Fill in with real code */}
        <Code copyable language={Language.JavaScript}>
          TK
        </Code>
      </section>
      <section>
        <Body baseFontSize={16} weight="medium">
          2. Run the script with <InlineCode>mongosh</InlineCode>
        </Body>
        <Body className={sectionInstructionStyles}>
          In the same working directory run the command below. Please{' '}
          <strong>paste in your username and password</strong> where there are
          placeholders.{' '}
          <em>
            Note that this will add data to your cluster and will not be
            reversible.
          </em>
        </Body>
        <Code copyable language={Language.Bash}>
          {RUN_SCRIPT_COMMAND}
        </Code>
      </section>
      <section
        className={cx(
          resourceSectionStyles,
          isDarkMode ? resourceSectionDarkStyles : resourceSectionLightStyles
        )}
      >
        <Overline className={resourceSectionHeader}>Resources</Overline>
        <ul>
          <li>
            <Link href="https://www.mongodb.com/docs/atlas/synthetic-data/">
              Generating Synthetic Data with MongoDB
            </Link>
          </li>
          <li>
            <Link href="https://www.mongodb.com/docs/mongodb-shell/">
              Learn About the MongoDB Shell
            </Link>
          </li>
          <li>
            {/* TODO: Update URL */}
            <Link href="#">Access your Database Users</Link>
          </li>
        </ul>
      </section>
    </section>
  );
};

export default ScriptScreen;
