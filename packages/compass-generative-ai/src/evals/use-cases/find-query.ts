import { buildFindQueryPrompt } from '../../utils/gen-ai-prompt';

export const findQueries = [
  {
    prompt: buildFindQueryPrompt({
      userInput: 'find all the movies released in 1983',
      databaseName: 'netflix',
      collectionName: 'movies',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `<filter>{year: 1983}</filter>`,
    name: 'simple find',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'find three movies with alien in the title, show earliest movies first, only the _id, title and year',
      databaseName: 'netflix',
      collectionName: 'movies',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `
      <filter>{title: {$regex: "alien", $options: "i"}}</filter>
      <project>{_id: 1, title: 1, year: 1}</project>
      <sort>{year: 1}</sort>
      <limit>3</limit>
    `,
    name: 'find with filter projection sort and limit',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'find all users older than 30 and younger than 50, only return their name and age',
      databaseName: 'appdata',
      collectionName: 'users',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `
      <filter>{"Violation Code": 21}</filter>
      <project>{"Plate ID": 1}</project>
    `,
    name: 'find with filter and projection',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'find all the bars 10km from the berlin center, only return their names',
      databaseName: 'berlin',
      collectionName: 'cocktailbars',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `
      <filter>{_id: 'ObjectId("5ca652bf56618187558b4de3")'}</filter>
      <project>{name: 1}</project>
    `,
    name: 'geo-based find',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'Return all the properties of type "Hotel" and with ratings lte 70',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `
      <filter>{
        $and: [
          { property_type: "Hotel" },
          { "review_scores.review_scores_rating": { $lte: 70 } }
        ]
      }</filter>
    `,
    name: 'complex find with nested fields',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'what is the bed count that occurs the most? return it in a field called bedCount (only return the bedCount field)',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `
      <aggregation>[
        { $group: { _id: "$beds", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 1 },
        { $project: { bedCount: "$_id" } }
      ]</aggregation>
    `,
    name: 'find query that translates to aggregation 1',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'whats the total number of reviews across all listings? return it in a field called totalReviewsOverall',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `<aggregation>[
        {
          $group: {
            _id: null,
            totalReviewsOverall: { $sum: "$number_of_reviews" }
          }
        }
      ]</aggregation>
    `,
    name: 'find query that translates to aggregation 2',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'which host id has the most reviews across all listings? return it in a field called hostId',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `<aggregation>[
      {
        $group: {
          _id: "$host.host_id",
          totalReviews: { $sum: "$number_of_reviews" }
        }
      },
      { $sort: { totalReviews: -1 } },
      { $limit: 1 },
      { $project: { hostId: "$_id" } }
    ]</aggregation>`,
    name: 'find query that translates to aggregation 3',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'find all of the documents of sightings that happened last year, no _id',
      databaseName: 'UFO',
      collectionName: 'sightings',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `<filter>{year: ${new Date().getFullYear() - 1}}</filter>`,
    name: 'relative date find 1',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'Which customers will be 30 in this calendar year (jan to dec)? return name and birthdate',
      databaseName: 'sample_analytics',
      collectionName: 'customers',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `<filter>{
        $and: [
          {
            birthdate: {
              $gte: new Date("${new Date().getFullYear() - 30}-01-01")
            }
          },
          {
            birthdate: {
              $lt: new Date("${new Date().getFullYear() - 29}-01-01")
            }
          }
        ]
      }</filter>
      <project>{name: 1, birthdate: 1}</project>
    `,
    name: 'relative date find 2',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput: 'get all docs where filter is true',
      databaseName: 'delimiters',
      collectionName: 'filter',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `<filter>{filter: true}</filter>`,
    name: 'boolean field find',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'give me just the price and the first 3 amenities (in a field called amenities) of the listing has "Step-free access" in its amenities.',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `
      <filter>{amenities: "Step-free access"}</filter>
      <project>{price: 1, amenities: {$slice: 3}}</project>
    `,
    name: 'complex projection find',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'Return only the Plate IDs of Acura vehicles registered in New York',
      databaseName: 'NYC',
      collectionName: 'parking_2015',
      schema: {},
      // withSamples: true,
      sampleDocuments: [],
    }),
    expectedOutput: `
      <filter>
        {
          $and: [
            {"Vehicle Make": "ACURA"}, 
            {"Registration State": "NY"}
          ]
        }
      </filter>
      <project>{"Plate ID": 1}</project>
    `,
    name: 'with sample documents find',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        '¿Qué alojamiento tiene el precio más bajo? devolver el número en un campo llamado "precio" en español',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `
      <project>{_id: 0, precio: "$price"}</project>
      <sort>{precio: 1}</sort>
      <limit>1</limit>
    `,
    name: 'find with non-english prompt',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput:
        'Write a query that does the following: find all of the parking incidents that occurred on an ave (match all ways to write ave). Return all of the plate ids involved with their summons number and vehicle make and body type. Put the vehicle make and body type into lower case. No _id, sorted by the summons number lowest first.',
      databaseName: 'NYC',
      collectionName: 'parking_2015',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `
      <filter>{"Street Name": {$regex: "ave", $options: "i"}}</filter>
      <sort>{"Summons Number": 1}</sort>
      <project>{
        "Summons Number": 1,
        "Plate ID": 1,
        "Vehicle Make": {$toLower: "$Vehicle Make"},
        "Vehicle Body Type": {$toLower: "$Vehicle Body Type"},
        _id: 0
      }</project>
    `,
    name: 'complex find with regex and string operators',
  },
  {
    prompt: buildFindQueryPrompt({
      userInput: 'return only the customer names',
      databaseName: 'security',
      collectionName: 'usergenerated',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: `<project>{customer_name: 1}</project>`,
    name: 'simple projection find',
  },
];
