import { ChangeEvent } from 'react';

// The structure of these Message objects is arbitrary given it is dependent on the user's backend data structure
const baseMessages: Array<unknown> = [
  {
    id: 1,
    messageBody: 'Hi! Ask me anything.',
    isMongo: true,
  },
  {
    id: 2,
    messageBody: 'Can you tell me the answer to this thing?',
    userName: 'Sean Park',
  },
  {
    id: 3,
    messageBody: `This thing is \`something\`.`,
    isMongo: true,
  },
  {
    id: 4,
    messageBody: `This should do the trick.\n
\`\`\`typescript
type HelloWorld = "Hello, world!"

function helloWorld() {
return "Hello, world!" satisfies HelloWorld;
}
\`\`\`
      `,
    isMongo: true,
    messageRatingProps: {
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        // eslint-disable-next-line no-console
        console.log(`Message 4 was ${e.target.value}.`),
    },
  },
  {
    id: 5,
    messageBody: 'How about another question?',
    userName: 'Sean Park',
  },
  {
    id: 6,
    messageBody: `Sorry, MongoAI can't do that right now.

Refer to [LeafyGreen UI](mongodb.design) or [LeafyGreen UI](mongodb.design) for more details. I'm filling out this space to see if the message will line up to the right side.
    `,
    isMongo: true,
    messageRatingProps: {
      onChange: (e: ChangeEvent<HTMLInputElement>) =>
        // eslint-disable-next-line no-console
        console.log(`Message 6 was ${e.target.value}.`),
    },
  },
];

export default baseMessages;
