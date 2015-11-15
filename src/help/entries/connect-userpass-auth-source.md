---
title: Authentication Source
tags:
  - authentication
  - connect
---
<strong>This field represents the _Authentication Source_ (also called
_Authentication Database_) for User/Password authentication.</strong>

In MongoDB's authentication model, a username is scoped to a database, called
_Authentication Source_. The user’s privileges are not necessarily limited to
this database. The user can have privileges in additional databases.

For authentication methods other than User/Password authentication (like
_Kerberos_, _LDAP_, _X.509_), the Authentication Source is always set
to `$external` and no user input is required.

If the field is left blank, the default value `admin` is used.
