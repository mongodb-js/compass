package com.mongodb.mongosh.result


class CommandException(val errmsg: String, val codeName: String) : Exception(errmsg)
