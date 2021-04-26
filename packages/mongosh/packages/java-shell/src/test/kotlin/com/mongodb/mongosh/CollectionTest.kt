package com.mongodb.mongosh

import org.junit.Test

class CollectionTest : ShellTestCase() {

    @Test fun testAggregate()              = test()
    @Test fun testAggregateAllowDiskUse()  = test()
    @Test fun testAggregateWithBatchSize() = test()
    @Test fun testAggregateWithCollation() = test()
    @Test fun testAggregateWithExplain()   = test()
    @Test fun testAggregateWithMaxTime()   = test()
    @Test fun testAggregateWithNegativeBatchSize() = test()
    @Test fun testAggregateWithoutArray()  = test()
    @Test fun testAggregateWithReadConcern() = test()
    @Test fun testBulkWrite()              = test()
    @Test fun testBulkWriteException()     = test()
    @Test fun testCollectionHelp()         = test()
    @Test fun testCount()                  = test()
    @Test fun testCountDocuments()         = test()
    @Test fun testCountWithLimit()         = test()
    @Test fun testCountWithQuery()         = test()
    @Test fun testCountWithUnknownOption() = test()
    @Test fun testCreateIndex()            = test()
    @Test fun testCreateIndexes()          = test()
    @Test fun testDeleteMany()             = test()
    @Test fun testDeleteOne()              = test()
    @Test fun testDistinct()               = test()
    @Test fun testDrop()                   = test()
    @Test fun testDropIndex()              = test()
    @Test fun testDropIndexes()            = test()
    @Test fun testEmptyCollection()        = test()
    @Test fun testEstimatedDocumentCount() = test()
    @Test fun testEstimatedDocumentCountWithMaxTime() = test()
    @Test fun testFind()                   = test()
    @Test fun testFindAndCount()           = test()
    @Test fun testFindMap()                = test()
    @Test fun testFindOne()                = test()
    @Test fun testFindOneAndDelete()       = test()
    @Test fun testFindOneAndReplace()      = test()
    @Test fun testFindOneAndReplaceWithReturnDocument() = test()
    @Test fun testFindOneAndUpdate()       = test()
    @Test fun testFindOneAndUpdateWithReturnDocument() = test()
    @Test fun testFindWithProjection()     = test()
    @Test fun testFindWithQuery()          = test()
    @Test fun testFindWithRegexp()         = test()
    @Test fun testFindWithRegexpCaseInsensitive() = test()
    @Test fun testGetIndexes()             = test()
    @Test fun testInsertMany()             = test()
    @Test fun testInsertManyNotOrdered()   = test()
    @Test fun testInsertOne()              = test()
    @Test fun testInsertOneWriteConcern()  = test()
    @Test fun testInsertOneWrongWriteConcern() = test()
    @Test fun testInsertOneWrongWriteConcern2() = test()
    @Test fun testIsCapped()               = test()
    @Test fun testRef()                    = test()
    @Test fun testReplaceOne()             = test()
    @Test fun testReplaceOneUpsert()       = test()
    @Test fun testStats()                  = test()
    @Test fun testTotalIndexSize()         = test()
    @Test fun testUniqueIndex()            = test()
    @Test fun testUpdateMany()             = test()
    @Test fun testUpdateManyPipeline()     = test()
    @Test fun testUpdateManyUpsert()       = test()
    @Test fun testUpdateOne()              = test()
    @Test fun testUpdateOnePipeline()      = test()
    @Test fun testUpdateOneUpsert()        = test()
    @Test fun testWithPeriod()             = test()

    private fun test() {
        val name = (Throwable()).stackTrace[1].methodName.removePrefix("test")

        withShell { shell ->
            doTest(name, shell, TEST_DATA_PATH, db = DB)
        }
    }

    companion object {
        private const val TEST_DATA_PATH = "src/test/resources/collection"
    }
}
