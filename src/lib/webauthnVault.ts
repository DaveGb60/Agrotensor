// WebAuthn-based local vault for the Cloud Identity (recovery code).
// Uses the PRF extension to derive a stable AES-GCM key from the user's
// platform authenticator (Face ID / Touch ID / Windows Hello / Android biometrics).
// The recovery code never leaves the device unencrypted — decryption requires
// the biometric/device prompt every time it is read from storage.

import { CloudIdentity } from './cloudBackup';

const VAULT_KEY = 'agrotensor-cloud-vault';
const RP_NAME = 'AgroTensor Cloud';

interface VaultBlob {
  credentialId: string; // base64url
  salt: string;         // base64
  iv: string;           // base64
  ciphertext: string;   // base64
  createdAt: string;
}

// ---------- helpers ----------
function b64(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s);
}
function ub64(s: string): Uint8Array {
  const bin = atob(s);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}
function b64url(buf: ArrayBuffer | Uint8Array): string {
  return b64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function ub64url(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return ub64(s.replace(/-/g, '+').replace(/_/g, '/') + pad);
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined'
    && !!window.PublicKeyCredential
    && typeof navigator.credentials?.create === 'function';
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function hasVault(): boolean {
  return !!localStorage.getItem(VAULT_KEY);
}

export function clearVault() {
  localStorage.removeItem(VAULT_KEY);
}

function getVault(): VaultBlob | null {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as VaultBlob;
  } catch {
    return null;
  }
}

async function derivePrfOutput(credentialId: Uint8Array, salt: Uint8Array): Promise<ArrayBuffer> {
  const assertion = (await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)) as BufferSource,
      allowCredentials: [{ id: credentialId as BufferSource, type: 'public-key' }],
      userVerification: 'required',
      timeout: 60_000,
      extensions: { prf: { eval: { first: salt } } } as any,
    },
  })) as PublicKeyCredential | null;

  if (!assertion) throw new Error('Biometric verification cancelled');
  const ext = (assertion.getClientExtensionResults() as any)?.prf?.results?.first as ArrayBuffer | undefined;
  if (!ext) throw new Error('This device does not support PRF — cannot protect with biometrics');
  return ext;
}

async function deriveAesKey(prfOutput: ArrayBuffer): Promise<CryptoKey> {
  const hkdfKey = await crypto.subtle.importKey('raw', prfOutput, 'HKDF', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('agrotensor-cloud-vault'),
      info: new TextEncoder().encode('aes-gcm-256'),
    },
    hkdfKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

// ---------- public API ----------

/**
 * Register a new platform credential and store the identity, encrypted with a
 * PRF-derived key. After this call, the identity can only be read via
 * `unlockVault()` (which triggers a biometric prompt).
 */
export async function createVault(identity: CloudIdentity): Promise<void> {
  if (!isWebAuthnSupported()) throw new Error('WebAuthn is not supported on this device');

  const userId = crypto.getRandomValues(new Uint8Array(16));
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: RP_NAME, id: window.location.hostname },
      user: {
        id: userId,
        name: `cloud-${identity.cloudId.slice(0, 8)}`,
        displayName: 'AgroTensor Cloud Vault',
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },   // ES256
        { type: 'public-key', alg: -257 }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'required',
        residentKey: 'preferred',
      },
      timeout: 60_000,
      attestation: 'none',
      extensions: { prf: {} } as any,
    },
  })) as PublicKeyCredential | null;

  if (!cred) throw new Error('Registration cancelled');

  const credentialId = new Uint8Array(cred.rawId);
  const salt = crypto.getRandomValues(new Uint8Array(32));

  // Some authenticators don't return PRF output on create — run an immediate
  // assertion to fetch it for encryption.
  const prfOutput = await derivePrfOutput(credentialId, salt);
  const aesKey = await deriveAesKey(prfOutput);

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plaintext = new TextEncoder().encode(JSON.stringify(identity));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, plaintext);

  const vault: VaultBlob = {
    credentialId: b64url(credentialId),
    salt: b64(salt),
    iv: b64(iv),
    ciphertext: b64(ciphertext),
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
}

/** Prompts biometric, decrypts and returns the identity. */
export async function unlockVault(): Promise<CloudIdentity> {
  const vault = getVault();
  if (!vault) throw new Error('No vault on this device');

  const credentialId = ub64url(vault.credentialId);
  const salt = ub64(vault.salt);
  const iv = ub64(vault.iv);
  const ciphertext = ub64(vault.ciphertext);

  const prfOutput = await derivePrfOutput(credentialId, salt);
  const aesKey = await deriveAesKey(prfOutput);

  const plaintext = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: iv as BufferSource }, aesKey, ciphertext as BufferSource);
  return JSON.parse(new TextDecoder().decode(plaintext)) as CloudIdentity;
}
