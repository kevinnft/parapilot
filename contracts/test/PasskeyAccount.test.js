const { expect } = require("chai");
const { ethers } = require("hardhat");

// A real P-256 assertion, produced by @noble/curves the same way a browser
// passkey signs. The contract must accept it and reject a tampered one.
const PUB_X = "0x504e8f0e99ebba15b7b4f9b8f3c6a1d2e0f1a2b3c4d5e6f70819283746556473";
const PUB_Y = "0x504e8f0e99ebba15b7b4f9b8f3c6a1d2e0f1a2b3c4d5e6f70819283746556473";

describe("PasskeyAccount", function () {
  it("accepts a genuine WebAuthn assertion and rejects a mutated one", async function () {
    const { p256 } = require("@noble/curves/p256");
    const crypto = require("crypto");

    const priv = p256.utils.randomPrivateKey();
    const pub = p256.getPublicKey(priv, false);
    const x = "0x" + Buffer.from(pub.slice(1, 33)).toString("hex");
    const y = "0x" + Buffer.from(pub.slice(33, 65)).toString("hex");

    const rpIdHash = crypto.createHash("sha256").update("parapilot.vercel.app").digest();
    const challenge = crypto.randomBytes(32);
    const b64url = Buffer.from(challenge).toString("base64url");
    const clientData = JSON.stringify({ type: "webauthn.get", challenge: b64url, origin: "https://parapilot.vercel.app" });
    const authenticatorData = Buffer.concat([rpIdHash, Buffer.from([0x01]), Buffer.from([0, 0, 0, 1])]);

    const message = crypto.createHash("sha256")
      .update(Buffer.concat([authenticatorData, crypto.createHash("sha256").update(clientData).digest()]))
      .digest();
    const sig = p256.sign(message, priv, { lowS: true });

    const Factory = await ethers.getContractFactory("PasskeyAccount");
    const account = await Factory.deploy(x, y, "0x" + rpIdHash.toString("hex"));
    await account.waitForDeployment();

    const genuine = ["0x" + authenticatorData.toString("hex"), clientData, "0x" + sig.r.toString(16).padStart(64, "0"), "0x" + sig.s.toString(16).padStart(64, "0")];
    expect(await account.verify(challenge, genuine)).to.equal(true);

    const tampered = ["0x" + authenticatorData.toString("hex"), clientData.replace("webauthn.get", "webauthn.create"), genuine[2], genuine[3]];
    expect(await account.verify(challenge, tampered)).to.equal(false);

    const wrongChallenge = crypto.randomBytes(32);
    expect(await account.verify(wrongChallenge, genuine)).to.equal(false);
  });
});
