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
Select the file from which the identity (private key) for SSH public key authentication is read.
</strong>

On OS X using OpenSSH, identity files are found in `~/.ssh`. By default, the filenames of private keys are one of the following.

```
id_dsa
id_ecdsa,
id_ed25519
id_rsa
```

On Windows, the location of identify files depends on your choice of SSH client. PuTTY is one commonly used SSH client.
