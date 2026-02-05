import { useEffect, useState } from "react";
import Button from "./components/Button";
import styles from "./JWTGeneration.module.css";
import { importPKCS8, SignJWT } from "jose";
import forge from "node-forge";
import Tooltip from "./components/Tooltip";
import { getDateTimeString, getDefaultExpireDate } from "./utils";

function JWTGeneration() {
  const [tenantId, setTenantId] = useState("");
  const [userId, setUserId] = useState("");
  const [planId, setPlanId] = useState("");
  const [privateKey, setPrivateKey] = useState("");
  const [encryptionType, setEncryptionType] = useState("RS512");
  const [jwtToken, setJwtToken] = useState("");
  const [noPersonalSpace, setNoPersonalSpace] = useState(true);
  const [expiredAt, setExpiredAt] = useState(getDefaultExpireDate());
  const [grantees, setGrantees] = useState([]);

  const handleGenerateToken = async () => {
    if (isNaN(Number(tenantId))) {
      alert("Tenant ID must be a number.");
      return;
    }

    if (planId && isNaN(Number(planId))) {
      alert("Plan ID must be a number.");
      return;
    }

    if (grantees.length) {
      if (grantees.some((grantee) => isNaN(Number(grantee.space_id)))) {
        alert("Space ID must be a number.");
        return;
      }

      if (grantees.some((grantee) => isNaN(Number(grantee.role_id)))) {
        alert("Role ID must be a number.");
        return;
      }

      if (grantees.some((grantee) => grantee.space_id <= 0)) {
        alert("Space ID must be greater than 0.");
        return;
      }

      if (grantees.some((grantee) => grantee.role_id < 2)) {
        alert("Role ID must be greater than 1.");
        return;
      }
    }

    const payload = {
      tenant_id: Number(tenantId),
      user_id: userId,
      exp: new Date(expiredAt).getTime() / 1000,
      no_personal_space: noPersonalSpace,
    };

    if (planId) {
      payload.plan_id = Number(planId);
    }

    if (grantees.length) {
      payload.grant_access = grantees.map((grantee) => ({
        space_id: +grantee.space_id,
        role_id: +grantee.role_id,
      }));
    }

    async function importPkcs1RsaKey(pem, alg) {
      const privateKey = forge.pki.privateKeyFromPem(pem);
      function bigIntegerToUint8Array(bn) {
        let hex = bn.toString(16);
        if (hex.length % 2) hex = "0" + hex;
        const bytes = hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16));
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
        key_ops: ["sign"],
      };

      const algo = alg.startsWith("PS")
        ? {
            name: "RSA-PSS",
            hash: { name: "SHA-" + alg.slice(2) },
            saltLength: parseInt(alg.slice(2)) / 8,
          }
        : { name: "RSASSA-PKCS1-v1_5", hash: { name: "SHA-" + alg.slice(2) } };

      return await crypto.subtle.importKey("jwk", jwk, algo, true, ["sign"]);
    }

    async function importKeyFromPem(pem, alg) {
      if (pem.includes("-----BEGIN PRIVATE KEY-----")) {
        return await importPKCS8(pem, alg);
      } else if (pem.includes("-----BEGIN EC PRIVATE KEY-----")) {
        // Optional: parse EC private key (node-forge doesn't support it directly)
        throw new Error(
          "EC PRIVATE KEY (PKCS#1 EC) not supported in this demo. Use PKCS#8.",
        );
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
    navigator.clipboard
      .writeText(jwtToken)
      .then(() => {
        alert("JWT Token copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy: ", err);
      });
  };

  const addGrantee = () =>
    setGrantees((prev) => [...prev, { space_id: "", role_id: "" }]);

  const removeGrantee = (idx) =>
    setGrantees((prev) => {
      const copy = [...prev];
      copy.splice(idx, 1);
      return copy;
    });

  const getGranteeField = (idx, field) => grantees[idx]?.[field];

  const updateGranteeField = (idx, field, value) => {
    setGrantees((prev) => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: value,
      };
      return copy;
    });
  };

  useEffect(() => {
    if (!noPersonalSpace) {
      setGrantees([]);
    }
  }, [noPersonalSpace]);

  return (
    <div className={styles.container}>
      <div className={styles.leftPanel}>
        <h2>JWT Token Generation</h2>
        <div className={styles.fieldsContainer}>
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
          <div className={styles.checkboxContainer}>
            <input
              id="personal-space-checkbox"
              type="checkbox"
              checked={noPersonalSpace}
              onChange={(e) => setNoPersonalSpace(e.target.checked)}
            />
            <label htmlFor="personal-space-checkbox">No Personal Space</label>
          </div>
          <div>
            <span>Grant Access</span>
          </div>
          <div className={styles.addGranteeBtnContainer}>
            <Tooltip
              title={
                !noPersonalSpace
                  ? `Available only if "No Personal Space" option is enabled`
                  : null
              }
            >
              <Button onClick={addGrantee} disabled={!noPersonalSpace}>
                Add Space
              </Button>
            </Tooltip>
          </div>
          <div className={styles.granteesContainer}>
            {!!grantees.length &&
              grantees.map((grantee, idx) => (
                <div className={styles.granteeRow}>
                  <input
                    type="number"
                    placeholder="Space ID"
                    value={getGranteeField(idx, "space_id")}
                    onChange={(e) =>
                      updateGranteeField(idx, "space_id", e.target.value)
                    }
                    min={1}
                  />
                  <input
                    type="number"
                    placeholder="Role ID"
                    value={getGranteeField(idx, "role_id")}
                    onChange={(e) =>
                      updateGranteeField(idx, "role_id", e.target.value)
                    }
                    min={2}
                  />
                  <Button
                    onClick={() => {
                      removeGrantee(idx);
                    }}
                  >
                    Remove
                  </Button>
                </div>
              ))}
          </div>
          <label htmlFor="expire-date" className={styles.expireDateLabel}>
            Expiration Time:
          </label>
          <input
            id="expire-date"
            type="datetime-local"
            placeholder="Expired At"
            value={expiredAt}
            onChange={(e) => setExpiredAt(e.target.value)}
            min={getDateTimeString(new Date())}
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
      </div>
      <div className={styles.rightPanel}>
        <h3>Private Key and Signature Type</h3>
        <textarea
          placeholder="Private Key"
          value={privateKey}
          onChange={(e) => setPrivateKey(e.target.value)}
          style={{ minHeight: "300px", width: "100%" }}
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
