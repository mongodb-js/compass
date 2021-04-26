// before
db.coll.drop();
db.collWithValidator.drop();
// command
db.createCollection('coll')
// command
db.createCollection('collWithValidator', {
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["phone"],
            properties: {
                phone: {
                    bsonType: "string",
                    description: "must be a string and is required"
                },
                email: {
                    bsonType: "string",
                    pattern: "@mongodb\.com$",
                    description: "must be a string and match the regular expression pattern"
                },
                status: {
                    enum: ["Unknown", "Incomplete"],
                    description: "can only be one of the enum values"
                }
            }
        }
    }
})
// command
db.collWithValidator.insertOne({ name: "Amanda", status: "Updated" })
// clear
db.coll.drop();
db.collWithValidator.drop();