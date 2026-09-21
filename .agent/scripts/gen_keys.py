
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes
import datetime

# Generate private key
key = rsa.generate_private_key(
    public_exponent=65537,
    key_size=2048,
)

# Private key to PEM
private_key_pem = key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode('utf-8')

# Generate a self-signed certificate
subject = issuer = x509.Name([
    x509.NameAttribute(NameOID.COUNTRY_NAME, u"BR"),
    x509.NameAttribute(NameOID.STATE_OR_PROVINCE_NAME, u"Sao Paulo"),
    x509.NameAttribute(NameOID.LOCALITY_NAME, u"Sao Paulo"),
    x509.NameAttribute(NameOID.ORGANIZATION_NAME, u"Doacoes BM"),
    x509.NameAttribute(NameOID.COMMON_NAME, u"doacoesbm.local"),
])

cert = x509.CertificateBuilder().subject_name(
    subject
).issuer_name(
    issuer
).public_key(
    key.public_key()
).serial_number(
    x509.random_serial_number()
).not_valid_before(
    datetime.datetime.utcnow()
).not_valid_after(
    # Our certificate will be valid for 100 years
    datetime.datetime.utcnow() + datetime.timedelta(days=36500)
).add_extension(
    x509.SubjectAlternativeName([x509.DNSName(u"localhost")]),
    critical=False,
).sign(key, hashes.SHA256())

# Certificate to PEM
certificate_pem = cert.public_bytes(serialization.Encoding.PEM).decode('utf-8')

print("---CERTIFICATE---")
print(certificate_pem)
print("---PRIVATE KEY---")
print(private_key_pem)
