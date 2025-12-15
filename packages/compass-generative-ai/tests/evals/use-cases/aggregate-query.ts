import type { GenAiUsecase } from '.';

export const aggregateQueries: GenAiUsecase[] = [
  {
    namespace: 'netflix.movies',
    userInput: 'find all the movies released in 1983',
    expectedOutput: `<aggregation>[{$match: {year: 1983}}]</aggregation>`,
    name: 'basic aggregate query',
  },
  {
    namespace: 'netflix.movies',
    userInput:
      'find three movies with alien in the title, show earliest movies first, only the _id, title and year',
    expectedOutput: `<aggregation>
      [
        {$match: {title: {$regex: "alien", $options: "i"}}},
        {$project: {_id: 1, title: 1, year: 1}},
        {$sort: {year: 1}},
        {$limit: 3}
      ]
    </aggregation>`,
    name: 'aggregate with filter projection sort and limit',
  },
  {
    namespace: 'nyc.parking',
    userInput:
      'find all the violations for the violation code 21 and only return the car plate',
    expectedOutput: `<aggregation>
      [{$match: {"Violation Code": 21}}, {$project: {"Plate ID": 1, _id: 0}}]
    </aggregation>`,
    name: 'aggregate with filter and projection',
  },
  {
    namespace: 'berlin.cocktailbars',
    userInput:
      'find all the bars 10km from the berlin center, only return their names. Berlin center is at longitude 13.4050 and latitude 52.5200. use correct key for coordinates.',
    expectedOutput: `<aggregation>
      [
        {$geoNear: { near: {type: "Point", coordinates: [13.4050, 52.5200]}, distanceField: "dist", maxDistance: 10000, spherical: true, key: "koordinaten" }},
        {$project: {name: 1, _id: 0}}
      ]
    </aggregation>`,
    name: 'geo-based aggregate',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'Return all the properties of type "Hotel" and with ratings lte 70',
    expectedOutput: `<aggregation>
      [{
        $match: {
          property_type: "Hotel",
          "review_scores.review_scores_rating": { $lte: 70 }
        }
      }]
    </aggregation>`,
    name: 'aggregate with nested fields in $match',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'what is the bed count that occurs the most? return it in a field called bedCount (only return the bedCount field)',
    expectedOutput: `<aggregation>
      [
        {$group: {_id: "$beds", count: {$sum: 1}}},
        {$sort: {count: -1}},
        {$limit: 1},
        {$project: {bedCount: "$_id", _id: 0}}
      ]
    </aggregation>`,
    name: 'aggregate with group sort limit and project',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'which host id has the most reviews across all listings? return it in only a field called hostId',
    expectedOutput: `<aggregation>
      [
        {$group: {_id: "$host.host_id", totalReviews: {$sum: "$number_of_reviews"}}},
        {$sort: {totalReviews: -1}},
        {$limit: 1},
        {$project: {hostId: "$_id", _id: 0}}
      ]
    </aggregation>`,
    name: 'aggregate with group sort limit and project 2',
  },
  {
    namespace: 'netflix.movies',
    userInput:
      'Which movies were released 30 years ago (consider whole year). return title and year',
    expectedOutput: `<aggregation>
      [
        {
          $match: {
            $and: [
              {year: {$gte: ${new Date().getFullYear() - 30}}},
              {year: {$lt: ${new Date().getFullYear() - 29}}},
            ]
          }
        },
        {$project: {title: 1, year: 1}}
      ]
    </aggregation>`,
    name: 'relative date aggregate 1',
  },
  {
    namespace: 'netflix.movies',
    userInput: 'find all of the movies from last year',
    expectedOutput: `<aggregation>
      [{$match: {year: ${new Date().getFullYear() - 1}}}]
    </aggregation>`,
    name: 'relative date aggregate 2',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'give me just the price and the first 3 amenities (in a field called amenities) of the listing that has "Step-free access" in its amenities.',
    expectedOutput: `<aggregation>
      [
        {$match: {amenities: "Step-free access"}},
        {$project: {price: 1, amenities: {$slice: ["$amenities", 3]}}}
      ]
    </aggregation>`,
    name: 'aggregate with array slice',
  },
  {
    namespace: 'nyc.parking',
    userInput:
      'Return only the Plate IDs of Acura vehicles registered in New York',
    expectedOutput: `<aggregation>
      [
        {$match: {$and: [{"Vehicle Make": "ACURA"}, {"Registration State": "NY"}]}},
        {$project: {"Plate ID": 1}}
      ]
    </aggregation>`,
    name: 'aggregate with multiple conditions in match',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      '¿Qué alojamiento tiene el precio más bajo? devolver el número en un campo llamado "precio"',
    expectedOutput: `<aggregation>
      [{
        $project: {_id: 0, precio: "$price"},
        $sort: {price: 1},
        $limit: 1
      }]
    </aggregation>`,
    name: 'aggregate with non-english prompt',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'give me only cancellation policy and listing url of the most expensive listing',
    expectedOutput: `<aggregation>
      [
        {$sort: {price: -1}},
        {$project: {cancellation_policy: 1, "listing_url": 1, _id: 0}},
        {$limit: 1}
      ]
    </aggregation>`,
    name: 'simple aggregate with sort and limit',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'group all the listings based on the amenities tags and return only count and tag name',
    expectedOutput: `<aggregation>
      [
        {$unwind: "$amenities"},
        {$group: {_id: "$amenities", count: {$sum: 1}}},
        {$project: {_id: 0, tag: "$_id", count: 1}}
      ]
    </aggregation>`,
    name: 'aggregate with unwind and group',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'which listing has the most amenities? the resulting documents should only have the _id',
    expectedOutput: `<aggregation>
      [
        {$project: {_id: 1, numAmenities: {$size: "$amenities"}}},
        {$sort: {numAmenities: -1}},
        {$limit: 1},
        {$project: {_id: 1}}
      ]
    </aggregation>`,
    name: 'aggregate with size operator',
  },
  {
    namespace: 'netflix.movies',
    userInput:
      'What are the 5 most frequent words (case sensitive) used in movie titles in the 1980s and 1990s combined? Sorted first by frequency count then alphabetically. output fields count and word',
    expectedOutput: `<aggregation>
      [
        {$match: {year: { $gte: 1980, $lte: 1999 }}},
        {$addFields: {titleWords: {$split: ["$title", " "]}}},
        {$unwind: "$titleWords"},
        {$group: {_id: "$titleWords", count: {$sum: 1}}},
        {$sort: {count: -1, _id: 1}},
        {$limit: 5},
        {$project: {_id: 0, count: 1, word: "$_id"}}
      ]
    </aggregation>`,
    name: 'aggregate with regex, addFields and split',
  },
  {
    namespace: 'airbnb.listingsAndReviews',
    userInput:
      'what percentage of listings have a "Washer" in their amenities? Only consider listings with more than 2 beds. Return is as a string named "washerPercentage" like "75%", rounded to the nearest whole number.',
    expectedOutput: `<aggregation>
      [
        {$match: {beds: {$gt: 2}}},
        {
          $group: {
            _id: null,
            totalListings: {$sum: 1},
            withWasher: {
              $sum: {
                $cond: [{$in: ["Washer", "$amenities"]}, 1, 0]
              }
            }
          }
        },
        {
          $project: {
            washerPercentage: {
              $concat: [
                {
                  $toString: {
                    $round: {
                      $multiply: [
                        {$divide: ["$withWasher", "$totalListings"]},
                        100
                      ]
                    }
                  }
                },
                "%"
              ]
            }
          }
        }
      ]
    </aggregation>`,
    name: 'super complex aggregate with complex project',
  },
  {
    namespace: 'nyc.parking',
    userInput:
      'Write a query that does the following: find all of the parking incidents that occurred on any ave. Return all of the plate ids involved with their summons number and vehicle make and body type. Put the vehicle make and body type into lower case. No _id, sorted by the summons number lowest first.',
    expectedOutput: `<aggregation>
      [
        {$match: {"Street Name": {$regex: "ave", $options: "i"}}},
        {$sort: {"Summons Number": 1}},
        {
          $project: {
            "Summons Number": 1,
            "Plate ID": 1,
            "Vehicle Make": {$toLower: "$Vehicle Make"},
            "Vehicle Body Type": {$toLower: "$Vehicle Body Type"},
            _id: 0
          }
        }
      ]
    </aggregation>`,
    name: 'complex aggregate with regex and string operators',
  },
  {
    namespace: 'netflix.comments',
    userInput:
      'join with "movies" based on a movie_id and return one document for each comment with movie_title (from movie.title) and comment_text',
    expectedOutput: `<aggregation>[
      {
        $lookup: {
          from: 'movies',
          localField: 'movie_id',
          foreignField: '_id',
          as: 'movies',
        },
      },
      { $unwind: '$movies' },
      { $project: { movie_title: '$movies.title', comment_text: '$text', _id: 0 } },
    ]</aggregation>`,
    name: 'aggregate prompt with sql join',
  },
  {
    namespace: 'netflix.comments',
    userInput: 'return only the customer email',
    expectedOutput: `<aggregation>
      [{$project: {email: 1, _id: 0}}]
    </aggregation>`,
    name: 'simple projection aggregate',
  },
];
