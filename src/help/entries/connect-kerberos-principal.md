---
title: Kerberos Principal
tags:
  - authentication
  - connect
  - kerberos
  - needs review
related:
  - connect-kerberos-service-name
section: Connect
---

<strong>
A Kerberos principal is a unique identity to which Kerberos can assign tickets.
</strong>

Principals can have an arbitrary number of components. Each component is
separated by a component separator, generally `/`. The last component is the
realm, separated from the rest of the principal by the realm separator,
generally `@`.

An example for a Kerberos Principal is: `primary/instance@REALM`.
