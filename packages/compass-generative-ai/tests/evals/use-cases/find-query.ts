import type { GenAiUsecase } from '.';

export const findQueries: GenAiUsecase[] = [
  {
    namespace: 'netflix.movies',
    userInput: 'find all the movies released in 1983',
    expectedOutput: `<filter>{year: 1983}</filter>`,
    name: 'simple find',
  },
  {
    namespace: 'netflix.movies',
    userInput:
      'find three movies with alien in the title, show earliest movies first, only the _id, title and year',
    expectedOutput: `
      <filter>{title: {$regex: "alien", $options: "i"}}</filter>
      <project>{_id: 1, title: 1, year: 1}</project>
      <sort>{year: 1}</sort>
      <limit>3</limit>
    `,
    name: 'find with filter projection sort and limit',
  },
  // TODO: Geo query
  // {
  //   namespace: 'berlin.cocktailbars',
  //   userInput:
  //     'find all the bars 10km from the berlin center, only return their names',
  //   expectedOutput: `
  //     <filter>{_id: 'ObjectId("5ca652bf56618187558b4de3")'}</filter>
  //     <project>{name: 1}</project>
  //   `,
  //   name: 'geo-based find',
  // },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'Return all the properties of type "Hotel" and with ratings lte 70',
    expectedOutput: `
      <filter>{
        $and: [
          { property_type: "Hotel" },
          { "review_scores.review_scores_rating": { $lte: 70 } }
        ]
      }</filter>
    `,
    name: 'find with nested match fields',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'what is the bed count that occurs the most? return it in a field called bedCount (only return the bedCount field)',
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
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'whats the total number of reviews across all listings? return it in a field called totalReviewsOverall',
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
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'which host id has the most reviews across all listings? return it in a field called hostId',
    expectedOutput: `<aggregation>[
      {
        $group: {
          _id: "$host_id",
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
    namespace: 'netflix.movies',
    userInput: 'find all of the movies from last year',
    expectedOutput: `<filter>{year: ${new Date().getFullYear() - 1}}</filter>`,
    name: 'relative date find 1',
  },
  {
    namespace: 'netflix.comments',
    userInput:
      'Which comments were posted in last 30 years. return name and date',
    expectedOutput: `<filter>{
        $and: [
          {
            date: {
              $gte: ${new Date().getFullYear() - 30}
            }
          },
          {
            date: {
              $lt: ${new Date().getFullYear() - 29}
            }
          }
        ]
      }</filter>
      <project>{name: 1, date: 1}</project>
    `,
    name: 'relative date find 2',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput: 'get all docs where accommodates is 6',
    expectedOutput: `<filter>{accommodates: 6}</filter>`,
    name: 'number field find',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'give me just the price and the first 3 amenities (in a field called amenities) of the listing has "Step-free access" in its amenities.',
    expectedOutput: `
      <filter>{amenities: "Step-free access"}</filter>
      <project>{price: 1, amenities: {$slice: 3}}</project>
    `,
    name: 'find with complex projection',
  },
  {
    namespace: 'nyc.parking',
    userInput:
      'Return only the Plate IDs of Acura vehicles registered in New York',
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
    name: 'find with $and operator',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      '¿Qué alojamiento tiene el precio más bajo? devolver el número en un campo llamado "precio" en español',
    expectedOutput: `
      <project>{_id: 0, precio: "$price"}</project>
      <sort>{price: 1}</sort>
      <limit>1</limit>
    `,
    name: 'find with non-english prompt',
  },
  {
    namespace: 'nyc.parking',
    userInput:
      'Write a query that does the following: find all of the parking incidents that occurred on an ave (match all ways to write ave). Return all of the plate ids involved with their summons number and vehicle make and body type. Put the vehicle make and body type into lower case. No _id, sorted by the summons number lowest first.',
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
    name: 'find with regex and string operators',
  },
  {
    namespace: 'netflix.comments',
    userInput: 'return only the customer email',
    expectedOutput: `<project>{email: 1, _id: 0}</project>`,
    name: 'find with simple projection',
  },
];
