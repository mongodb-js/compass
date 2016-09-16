---
title: SSH Identity File
tags:
  - authentication
  - connect
  - ssh
related:
  - connect-ssh-hostname
  - connect-ssh-tunnel-port
  - connect-ssh-passphrase
  - connect-ssh-password
  - connect-ssh-username
section: Connect
---

<strong>
Provide a path to a file containing the private key you wish to use for authentication
for your ssh host.
</strong>

Select the file from which the identity (private key) for public key authentication is read.
The default is ~/.ssh/identity for protocol version 1, and ~/.ssh/id_dsa, ~/.ssh/id_ecdsa,
~/.ssh/id_ed25519 and ~/.ssh/id_rsa for protocol version 2.
