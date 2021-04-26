package com.mongodb.mongosh

import org.junit.Test

class DbTest : ShellTestCase() {

    @Test fun testCreateCollection()   = test()
    @Test fun testCreateView()         = test()
    @Test fun testDbHelp()             = test()
    @Test fun testDefaultDb()          = test()
    @Test fun testGetCollection()      = test()
    @Test fun testGetCollectionInfos() = test()
    @Test fun testHelp()               = test()
    @Test fun testRunCommand()         = test()
    @Test fun testRunCommandUserInfo() = test()
    @Test fun testServerStatus()       = test()
    @Test fun testShowCollections()    = test()
    @Test fun testShowDatabases()      = test()
    @Test fun testUseDb()              = test()
    @Test fun testVersion()            = test()
    @Test fun testGetName()            = test()
    @Test fun testDropDatabase()       = test()

    private fun test() {
        val name = (Throwable()).stackTrace[1].methodName.removePrefix("test")

        withShell { shell ->
            doTest(name, shell, TEST_DATA_PATH)
        }
    }

    companion object {
        private const val TEST_DATA_PATH = "src/test/resources/db"
    }
}
