from passlib.context import CryptContext


pwd_context = CryptContext(schemes=["bcrypt"],deprecated="auto")

def hash_password(password:str):
    return pwd_context.hash(password[:72])

def verify_password(plain_password,password_hash):
    return pwd_context.verify(plain_password,password_hash)