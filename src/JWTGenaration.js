import React, { useState } from 'react';
import Button from './components/Button';
import styles from './JWTGeneration.module.css';
import { importPKCS8, SignJWT } from 'jose';
import forge from 'node-forge';

function JWTGeneration() {
  const [tenantId, setTenantId] = useState('');
  const [userId, setUserId] = useState('');
  const [planId, setPlanId] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [encryptionType, setEncryptionType] = useState('RS256');
  const [jwtToken, setJwtToken] = useState('');

  const handleGenerateToken = async () => {
    console.log('start');
    if (isNaN(Number(tenantId))) {
      alert('Tenant ID must be a number.');
      return;
    }

    if (planId && isNaN(Number(planId))) {
      alert('Plan ID must be a number.');
      return;
    }

    console.log('start 2',isNaN(Number(planId)), Number(planId));

    const payload = {
      tenant_id: Number(tenantId),
      user_id: userId,
    };

    if (planId) {
      payload.plan_id = Number(planId);
    }

    async function importPkcs1RsaKey(pem, alg) {
      const privateKey = forge.pki.privateKeyFromPem(pem);
      function bigIntegerToUint8Array(bn) {
        let hex = bn.toString(16);
        if (hex.length % 2) hex = '0' + hex;
        const bytes = hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16));
        return new Uint8Array(bytes);
      }
      
      function base64urlEncodeBytes(bytes) {
        const str = String.fromCharCode(...bytes);
        const b64 = btoa(str);
        return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      }
      const jwk = {
        kty: "RSA",
        n: base64urlEncodeBytes(bigIntegerToUint8Array(privateKey.n)),
        e: base64urlEncodeBytes(bigIntegerToUint8Array(privateKey.e)),
        d: base64urlEncodeBytes(bigIntegerToUint8Array(privateKey.d)),
        p: base64urlEncodeBytes(bigIntegerToUint8Array(privateKey.p)),
        q: base64urlEncodeBytes(bigIntegerToUint8Array(privateKey.q)),
        dp: base64urlEncodeBytes(bigIntegerToUint8Array(privateKey.dP)),
        dq: base64urlEncodeBytes(bigIntegerToUint8Array(privateKey.dQ)),
        qi: base64urlEncodeBytes(bigIntegerToUint8Array(privateKey.qInv)),
        alg: alg,
        ext: true,
        key_ops: ["sign"]
      };

      const algo = alg.startsWith("PS")
        ? { name: "RSA-PSS", hash: { name: "SHA-" + alg.slice(2) }, saltLength: parseInt(alg.slice(2)) / 8 }
        : { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-" + alg.slice(2) } };

      return await crypto.subtle.importKey("jwk", jwk, algo, true, ["sign"]);
    }

    async function importKeyFromPem(pem, alg) {
      if (pem.includes("-----BEGIN PRIVATE KEY-----")) {
        return await importPKCS8(pem, alg);
      } else if (pem.includes("-----BEGIN EC PRIVATE KEY-----")) {
        // Optional: parse EC private key (node-forge doesn't support it directly)
        throw new Error("EC PRIVATE KEY (PKCS#1 EC) not supported in this demo. Use PKCS#8.");
      } else if (pem.includes("-----BEGIN RSA PRIVATE KEY-----")) {
        return await importPkcs1RsaKey(pem, alg);
      } else {
        throw new Error("Unsupported key format.");
      }
    }

    try {
      const key = await importKeyFromPem(privateKey.trim(), encryptionType);

      const jwt = await new SignJWT(payload)
        .setProtectedHeader({ alg: encryptionType })
        .sign(key);

      setJwtToken(jwt);
    } catch (err) {
      alert("❌ Error: " + err.message);
      console.error(err);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(jwtToken).then(() => {
      alert('JWT Token copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy: ', err);
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <h2>JWT Token Generation</h2>
        <input
          type="number"
          placeholder="Tenant ID"
          value={tenantId}
          onChange={(e) => setTenantId(e.target.value)}
        />
        <input
          type="text"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
        <input
          type="number"
          placeholder="Plan ID (optional)"
          value={planId}
          onChange={(e) => setPlanId(e.target.value)}
        />
        <div className={styles.buttonContainer}>
          <Button onClick={handleGenerateToken}>Generate Token</Button>
        </div>
        {jwtToken && (
          <div className={styles.tokenDisplay}>
            <h3>Generated JWT Token:</h3>
            <textarea readOnly value={jwtToken} />
            <Button onClick={handleCopyToken}>Copy</Button>
          </div>
        )}
      </div>
      <div className={styles.rightPanel}>
        <h3>Private Key and Signature Type</h3>
        <textarea
          placeholder="Private Key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          style={{ minHeight: '300px', width: '100%' }}
        />
        <select
          value={encryptionType}
          onChange={(e) => setEncryptionType(e.target.value)}
        >
          <option value="RS256">RS256</option>
          <option value="RS384">RS384</option>
          <option value="RS512">RS512</option>
          <option value="ES256">ES256</option>
          <option value="ES384">ES384</option>
          <option value="ES512">ES512</option>
          <option value="PS256">PS256</option>
          <option value="PS384">PS384</option>
          <option value="PS512">PS512</option>
        </select>
      </div>
    </div>
  );
}

export default JWTGeneration;