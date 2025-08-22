// The structure of these Message objects is arbitrary given it is dependent on the user's backend data structure
const baseMessages: Array<unknown> = [
  {
    id: 0,
    messageBody: 'Hi! Ask me anything.',
    isMongo: true,
  },
  {
    id: 1,
    messageBody: 'Can you tell me the answer to this thing?',
    userName: 'Sean Park',
  },
  {
    id: 2,
    messageBody: `This thing is \`something\`.`,
    isMongo: true,
    sourceType: 'text',
  },
  {
    id: 3,
    messageBody: `This should do the trick.\n
\`\`\`typescript
type HelloWorld = "Hello, world!"

function helloWorld() {
return "Hello, world!" satisfies HelloWorld;
}
\`\`\`
      `,
    isMongo: true,
    hasMessageRating: true,
  },
  {
    id: 4,
    messageBody: 'How about another question?',
    userName: 'Sean Park',
  },
  {
    id: 5,
    messageBody: `Sorry, MongoAI can't do that right now.

Refer to [LeafyGreen UI](mongodb.design) or [LeafyGreen UI](mongodb.design) for more details. I'm filling out this space to see if the message will line up to the right side.
    `,
    isMongo: true,
    hasMessageRating: true,
  },
];

export default baseMessages;
