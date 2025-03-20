import os
import json
import httpx
import jwt
import logging
from functools import wraps
from quart import request, jsonify
from jwt import PyJWKClient, ExpiredSignatureError, InvalidTokenError
from pprint import pprint

# Load environment variables
TENANT_ID = os.getenv("ENTRA_ID_TENANT_ID")
CLIENT_ID = os.getenv("ENTRA_ID_CLIENT_ID")
AUDIENCE = os.getenv("ENTRA_ID_AUDIENCE")
JWKS_URL = f"https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys"

# Fetch JWKS from Azure AD
async def get_public_keys():
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(JWKS_URL)
            response.raise_for_status()
            jwks = response.json()
            return {key["kid"]: key for key in jwks["keys"]}
        except Exception as e:
            logging.error(f"Error fetching JWKS: {e}")
            return {}

# Verify JWT token
async def verify_token(token):
  
    try:
        public_keys = await get_public_keys()
        
        unverified_header = jwt.get_unverified_header(token)

        if unverified_header["kid"] not in public_keys:
            raise InvalidTokenError("Invalid token key")

        key = public_keys[unverified_header["kid"]]
        public_key = jwt.algorithms.RSAAlgorithm.from_jwk(json.dumps(key))
   
        decoded_token = jwt.decode(
            token,
            key=public_key,
            algorithms=["RS256"],
            audience=[AUDIENCE, f"api://{AUDIENCE}"],
            issuer=[
                f"https://login.microsoftonline.com/{TENANT_ID}/v2.0",
                f"https://login.microsoftonline.com/common/v2.0",
                f"https://sts.windows.net/{TENANT_ID}/"
            ]
        )
        
        return decoded_token
    except ExpiredSignatureError:
        return {"error": "Token expired"}, 401
    except InvalidTokenError:
        return {"error": "Invalid token"}, 401
    except Exception as e:
        logging.exception("JWT verification error")
        return {"error": "Authorization error"}, 401

# Authentication decorator
def require_auth(f):
    @wraps(f)
    async def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", None)
        if not auth_header:
            return jsonify({"error": "Authorization header is missing"}), 401

        token = auth_header.split(" ")[1] if " " in auth_header else None
        if not token:
            return jsonify({"error": "Invalid authorization format"}), 401

        decoded_token = await verify_token(token)
        if isinstance(decoded_token, tuple):  # If error response
            return jsonify(decoded_token[0]), decoded_token[1]

        request.user = decoded_token  # Attach user info to the request
        return f(*args, **kwargs)

    return decorated_function
