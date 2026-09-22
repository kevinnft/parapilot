const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("PasskeyVerifier", function () {
  it("accepts any genuine WebAuthn assertion and rejects a mutated one", async function () {
    const { p256 } = require("@noble/curves/p256");
    const crypto = require("crypto");

    const priv = p256.utils.randomPrivateKey();
    const pub = p256.getPublicKey(priv, false);
    const x = "0x" + Buffer.from(pub.slice(1, 33)).toString("hex");
    const y = "0x" + Buffer.from(pub.slice(33, 65)).toString("hex");

    const rpId = "parapilot-ruby.vercel.app";
    const rpIdHash = crypto.createHash("sha256").update(rpId).digest();
    const challenge = crypto.randomBytes(32);
    const clientData = JSON.stringify({
      type: "webauthn.get",
      challenge: Buffer.from(challenge).toString("base64url"),
      origin: "https://" + rpId,
    });
    const authenticatorData = Buffer.concat([rpIdHash, Buffer.from([0x05]), Buffer.from([0, 0, 0, 1])]);

    const message = crypto.createHash("sha256")
      .update(Buffer.concat([authenticatorData, crypto.createHash("sha256").update(clientData).digest()]))
      .digest();
    const sig = p256.sign(message, priv, { lowS: true });

    const Factory = await ethers.getContractFactory("PasskeyVerifier");
    const verifier = await Factory.deploy();
    await verifier.waitForDeployment();

    const assertion = [
      "0x" + authenticatorData.toString("hex"),
      clientData,
      "0x" + sig.r.toString(16).padStart(64, "0"),
      "0x" + sig.s.toString(16).padStart(64, "0"),
    ];
    expect(await verifier.verify(challenge, "0x" + rpIdHash.toString("hex"), x, y, assertion)).to.equal(true);

    const tampered = [assertion[0], clientData.replace("webauthn.get", "webauthn.create"), assertion[2], assertion[3]];
    expect(await verifier.verify(challenge, "0x" + rpIdHash.toString("hex"), x, y, tampered)).to.equal(false);

    const wrongChallenge = crypto.randomBytes(32);
    expect(await verifier.verify(wrongChallenge, "0x" + rpIdHash.toString("hex"), x, y, assertion)).to.equal(false);

    const wrongRp = crypto.createHash("sha256").update("evil.example").digest();
    expect(await verifier.verify(challenge, "0x" + wrongRp.toString("hex"), x, y, assertion)).to.equal(false);

    // A second, unrelated key is accepted by the same contract. The old
    // PasskeyAccount could not do this: its public key was immutable.
    const priv2 = p256.utils.randomPrivateKey();
    const pub2 = p256.getPublicKey(priv2, false);
    const sig2 = p256.sign(message, priv2, { lowS: true });
    const assertion2 = [
      assertion[0],
      clientData,
      "0x" + sig2.r.toString(16).padStart(64, "0"),
      "0x" + sig2.s.toString(16).padStart(64, "0"),
    ];
    expect(await verifier.verify(
      challenge,
      "0x" + rpIdHash.toString("hex"),
      "0x" + Buffer.from(pub2.slice(1, 33)).toString("hex"),
      "0x" + Buffer.from(pub2.slice(33, 65)).toString("hex"),
      assertion2,
    )).to.equal(true);
  });
});
