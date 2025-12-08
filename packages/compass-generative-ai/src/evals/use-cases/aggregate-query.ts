import { buildAggregateQueryPrompt } from '../../utils/gen-ai-prompt';

export const aggregateQueries = [
  {
    prompt: buildAggregateQueryPrompt({
      userInput: 'find all the movies released in 1983',
      databaseName: 'netflix',
      collectionName: 'movies',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: { year: 1983 },
      },
    ],
    name: 'basic aggregate query',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'find three movies with alien in the title, show earliest movies first, only the _id, title and year',
      databaseName: 'netflix',
      collectionName: 'movies',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: { title: { $regex: 'alien', $options: 'i' } },
      },
      {
        $project: { _id: 1, title: 1, year: 1 },
      },
      {
        $sort: { year: 1 },
      },
      {
        $limit: 3,
      },
    ],
    name: 'aggregate with filter projection sort and limit',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'find all the violations for the violation code 21 and only return the car plate',
      databaseName: 'NYC',
      collectionName: 'parking_2015',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: { 'Violation Code': 21 },
        $project: { 'Plate ID': 1 },
      },
    ],
    name: 'aggregate with filter and projection',
  },
  {
    prompt: buildAggregateQueryPrompt({
      // TODO: check this
      userInput:
        'find all the bars 10km from the berlin center, only return their names',
      databaseName: 'berlin',
      collectionName: 'cocktailbars',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: { _id: 'ObjectId("5ca652bf56618187558b4de3")' },
      },
      {
        $project: { name: 1 },
      },
    ],
    name: 'geo-based aggregate',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'Return all the properties of type "Hotel" and with ratings lte 70',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: {
          $and: [
            { property_type: 'Hotel' },
            { 'review_scores.review_scores_rating': { $lte: 70 } },
          ],
        },
      },
    ],
    name: 'complex aggregate with nested fields',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'what is the bed count that occurs the most? return it in a field called bedCount (only return the bedCount field)',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $group: {
          _id: null,
          totalReviewsOverall: { $sum: '$number_of_reviews' },
        },
      },
    ],
    name: 'aggregate with a group',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'what is the bed count that occurs the most? return it in a field called bedCount (only return the bedCount field)',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      { $group: { _id: '$beds', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 },
      { $project: { bedCount: '$_id' } },
    ],
    name: 'complex aggregate 1',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'which host id has the most reviews across all listings? return it in a field called hostId',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $group: {
          _id: '$host.host_id',
          totalReviews: { $sum: '$number_of_reviews' },
        },
      },
      { $sort: { totalReviews: -1 } },
      { $limit: 1 },
      { $project: { hostId: '$_id' } },
    ],
    name: 'complex aggregate 2',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'Which customers will be 30 in this calendar year (jan to dec)? return name and birthdate',
      databaseName: 'sample_analytics',
      collectionName: 'customers',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: {
          $and: [
            {
              birthdate: {
                $gte: new Date(`${new Date().getFullYear() - 30}-01-01`),
              },
            },
            {
              birthdate: {
                $lt: new Date(`${new Date().getFullYear() - 29}-01-01`),
              },
            },
          ],
        },
      },
      {
        $project: { name: 1, birthdate: 1 },
      },
    ],
    name: 'relative date aggregate 1',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'Give me all of the documents of sightings that happened last year, no _id',
      databaseName: 'UFO',
      collectionName: 'sightings',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: { year: new Date().getFullYear() - 1 },
      },
    ],
    name: 'relative date aggregate 2',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'give me just the price and the first 3 amenities (in a field called amenities) of the listing has "Step-free access" in its amenities.',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      { $match: { amenities: 'Step-free access' } },
      { $project: { price: 1, amenities: { $slice: 3 } } },
    ],
    name: 'complex projection aggregate',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'Return only the Plate IDs of Acura vehicles registered in New York',
      databaseName: 'NYC',
      collectionName: 'parking_2015',
      schema: {},
      // withSamples: true,
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: {
          $and: [{ 'Vehicle Make': 'ACURA' }, { 'Registration State': 'NY' }],
        },
      },
      {
        $project: { 'Plate ID': 1 },
      },
    ],
    name: 'with sample documents aggregate',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        '¿Qué alojamiento tiene el precio más bajo? devolver el número en un campo llamado "precio"',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $project: { _id: 0, precio: '$price' },
        $sort: { price: 1 },
        $limit: 1,
      },
    ],
    name: 'aggregate with non-english prompt',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'give only me the cancellation policy and host url of the most expensive listing',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      { $sort: { price: -1 } },
      { $project: { cancellation_policy: 1, 'host.host_url': 1 } },
      { $limit: 1 },
    ],
    name: 'simple aggregate with sort and limit',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'get the average price of all the items for each distinct tag, the resulting documents should only have 2 properties tag and avgPrice',
      databaseName: 'sample_supplies',
      collectionName: 'sales',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      { $unwind: '$items' },
      { $unwind: '$items.tags' },
      { $group: { _id: '$items.tags', avgPrice: { $avg: '$items.price' } } },
      { $project: { _id: 0, tag: '$_id', avgPrice: 1 } },
    ],
    name: 'aggregate with unwind and group',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'which listing has the most amenities? the resulting documents should only have the _id',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      { $project: { _id: 1, numAmenities: { $size: '$amenities' } } },
      { $sort: { numAmenities: -1 } },
      { $limit: 1 },
      { $project: { _id: 1 } },
    ],
    name: 'aggregate with size operator',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'What are the 5 most frequent words (case sensitive) used in movie titles in the 1980s and 1990s combined? Sorted first by frequency count then alphabetically. output fields count and word',
      databaseName: 'netflix',
      collectionName: 'movies',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      { $match: { year: { $regex: '^(198[0-9]|199[0-9])$' } } },
      { $addFields: { titleWords: { $split: ['$title', ' '] } } },
      { $unwind: '$titleWords' },
      { $group: { _id: '$titleWords', count: { $sum: 1 } } },
      { $sort: { count: -1, _id: 1 } },
      { $limit: 5 },
      { $project: { _id: 0, count: 1, word: '$_id' } },
    ],
    name: 'aggregate with regex, addFields and split',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'what percentage of listings have a "Washer" in their amenities? Only consider listings with more than 2 beds. Return is as a string named "washerPercentage" like "75%", rounded to the nearest whole number.',
      databaseName: 'sample_airbnb',
      collectionName: 'listingsAndReviews',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      { $match: { beds: { $gt: 2 } } },
      {
        $group: {
          _id: null,
          totalListings: { $sum: 1 },
          withWasher: {
            $sum: {
              $cond: [{ $in: ['Washer', '$amenities'] }, 1, 0],
            },
          },
        },
      },
      {
        $project: {
          washerPercentage: {
            $concat: [
              {
                $toString: {
                  $round: {
                    $multiply: [
                      { $divide: ['$withWasher', '$totalListings'] },
                      100,
                    ],
                  },
                },
              },
              '%',
            ],
          },
        },
      },
    ],
    name: 'super complex aggregate with complex project',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'Write a query that does the following: find all of the parking incidents that occurred on an ave (match all ways to write ave). Return all of the plate ids involved with their summons number and vehicle make and body type. Put the vehicle make and body type into lower case. No _id, sorted by the summons number lowest first.',
      databaseName: 'NYC',
      collectionName: 'parking_2015',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $match: { 'Street Name': { $regex: 'ave', $options: 'i' } },
      },
      {
        $sort: { 'Summons Number': 1 },
      },
      {
        $project: {
          'Summons Number': 1,
          'Plate ID': 1,
          'Vehicle Make': { $toLower: '$Vehicle Make' },
          'Vehicle Body Type': { $toLower: '$Vehicle Body Type' },
          _id: 0,
        },
      },
    ],
    name: 'complex aggregate with regex and string operators',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'join with "movies" based on a movie_id and return one document for each comment with movie_title (from movie.title) and comment_text',
      databaseName: 'netflix',
      collectionName: 'comments',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $lookup: {
          from: 'movies',
          localField: 'movie_id',
          foreignField: '_id',
          as: 'movies',
        },
      },
      { $unwind: '$movies' },
      { $project: { movie_title: '$movies.title', comment_text: '$text' } },
    ],
    name: 'prompt with sql join',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput: 'return only the customer names',
      databaseName: 'security',
      collectionName: 'usergenerated',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [{ $project: { customer_name: 1 } }],
    name: 'simple projection aggregate',
  },
  {
    prompt: buildAggregateQueryPrompt({
      userInput:
        'find all documents where the boolean field "isActive" is true',
      databaseName: 'sample_db',
      collectionName: 'users',
      schema: {},
      sampleDocuments: [],
    }),
    expectedOutput: [
      {
        $lookup: {
          from: 'movies',
          localField: 'movie_id',
          foreignField: '_id',
          as: 'movies',
        },
      },
      { $unwind: '$movies' },
      { $project: { movie_title: '$movies.title', comment_text: '$text' } },
    ],
    name: 'prompt with sql join',
  },
];
