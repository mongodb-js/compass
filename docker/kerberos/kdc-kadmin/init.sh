# Copy the keytab back in the volume
mv /mongodb.keytab /etc/krb5-keytabs/mongodb.keytab
krb5kdc
kadmind -nofork
