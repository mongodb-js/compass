# Certificate Files

This directory contains all certificates and keys used in testing.

To recreate the certificates follow the steps outlined below.

## Setup CA
1. Create a new key to use for the CA:
   ```
   openssl genrsa -out ca.key 4096
   ```
2. Create a X509 certificate for the CA key (valid for 99.999 days):
   ```
   openssl req -new -x509 -key ca.key -out ca.crt -days 99999
   ```
   * Organization Name: `MongoDB`
   * Organizational Unit Name: `DevTools`
   * Common Name: `DevTools CA`
3. To sign and revoke certificates, an openssl config files is required. Create `ca.cnf` with the following content:
   ```
   [ca]
   default_ca=CA_default

   [CA_default]
   certificate=ca.crt
   private_key=ca.key

   database=ca.db
   new_certs_dir=.
   serial=ca.serial

   default_md=sha256
   default_crl_days=99999

   policy=policy_anything

   [policy_anything]
   countryName=optional
   stateOrProvinceName=optional
   localityName=optional
   organizationName=optional
   organizationalUnitName=optional
   commonName=supplied
   emailAddress=optional
   ```
4. Ensure the `ca.db` file exists:
   ```
   touch ca.db
   ```

## Setup Server Certificate
1. Create a new key to use for the server:
   ```
   openssl genrsa -out server.key 4096
   ```
2. Generate a Certificate Signing Request (CSR) with validity 99.999 days:
   ```
   openssl req -new -key server.key -out server.csr -days 99999
   ```
   * Organization Name: `MongoDB`
   * Organizational Unit Name: `DevTools`
   * Common Name: `localhost`
3. Sign the CSR to generate server certificate:
   ```
   openssl ca -create_serial -config ca.cnf -in server.csr -out server.pem -days 99999
   ```
   This will also generate a `<FINGERPRINT>.pem` file which can be removed.
4. Create a bundle with server key and certificate to use for `mongod`:
   ```
   cat server.pem server.key > server.bundle.pem
   ```

## Setup "Non-CA" for testing invalid CA cert
1. Create a new key to use for the Non CA:
   ```
   openssl genrsa -out non-ca.key 4096
   ```
2. Generate a X509 certificate for the Non CA key (valid for 99.999 days):
   ```
   openssl req -new -x509 -key non-ca.key -out non-ca.crt -days 99999
   ```
   * Organization Name: `MongoDB`
   * Organizational Unit Name: `DevTools`
   * Common Name: `NOT DevTools CA`

## Revoke Server Certificate and generate CRL
1. Revoke the server's certificate:
   ```
   openssl ca -config ca.cnf -revoke server.pem
   ```
2. Generate a CRL from the CA:
   ```
   openssl ca -config ca.cnf -gencrl -out ca-server.crl
   ```

## Create Client Certificate from CA
1. Create a new key to use for the client:
   ```
   openssl genrsa -out client.key 4096
   ```
2. Generate a Certificate Signing Request (CSR) with validity 99.999 days:
   ```
   openssl req -new -key client.key -out client.csr -days 99999
   ```
   * Organization Name: `MongoDB`
   * Organizational Unit Name: `DevTools Testers`
   * Common Name: `Wonderwoman`
   * E-Mail: `tester@example.com`
3. Sign the CSR to generate server certificate:
   ```
   openssl ca -create_serial -config ca.cnf -in client.csr -out client.pem -days 99999
   ```
   This will also generate a `<FINGERPRINT>.pem` file which can be removed.
4. Create a bundle with client key and certificate to use for connecting:
   ```
   cat client.pem client.key > client.bundle.pem
   ```

## Create Client Certificate not from CA
1. Create a new key to use for the Non CA:
   ```
   openssl genrsa -out invalid-client.key 4096
   ```
2. Generate a X509 certificate for the Non CA key (valid for 99.999 days):
   ```
   openssl req -new -x509 -key invalid-client.key -out invalid-client.crt -days 99999
   ```
   * Organization Name: `MongoDB`
   * Organizational Unit Name: `DevTools Testers`
   * Common Name: `Wonderwoman`
   * E-Mail: `tester@example.com`
3. Create a bundle with client key and certificate to use for connecting:
   ```
   cat invalid-client.crt invalid-client.key > invalid-client.bundle.pem
   ```
