import { jws, KeyUtil, X509, crypto, hextob64u, b64tohex, AllowedSigningAlgs } from './crypto/jsrsasign';
import getJoseUtil from './JoseUtilImpl';

export const JoseUtil = getJoseUtil({ jws, KeyUtil, X509, crypto, hextob64u, b64tohex, AllowedSigningAlgs });
