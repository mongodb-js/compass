// before
db.survey.deleteMany({});
db.survey.insertMany([
    {_id: 1, empNumber: "abc123", feedback: {management: 3, environment: 3}, department: "A"},
    {_id: 2, empNumber: "xyz987", feedback: {management: 2, environment: 3}, department: "B"},
    {_id: 3, empNumber: "ijk555", feedback: {management: 3, environment: 4}, department: "A"}
]);
// command
db.createView(
    "managementFeedback",
    "survey",
    [ { $project: { "management": "$feedback.management", department: 1 } } ]
)
// command
db.managementFeedback.find()
// clear
db.managementFeedback.drop();
db.survey.drop();
