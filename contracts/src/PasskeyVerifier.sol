// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/P256.sol";

/**
 * @title PasskeyVerifier
 * @notice Stateless WebAuthn ES256 (P-256) verifier. Any passkey can be checked;
 *         the public key is an argument, not a constructor constant.
 * @dev P256.verify uses RIP-7212 where the chain has it and a Solidity fallback
 *      where it does not. Monad testnet is the second case.
 */
contract PasskeyVerifier {
    struct Assertion {
        bytes authenticatorData;
        string clientDataJson;
        bytes32 r;
        bytes32 s;
    }

    /**
     * @notice Confirms that `pubX`/`pubY` signed `challenge` under WebAuthn.
     * @dev `s` must sit in the lower half of the curve order. Browsers do not
     *      guarantee that, so the caller flips it (s = N - s) when it does not.
     */
    function verify(
        bytes32 challenge,
        bytes32 rpIdHash,
        uint256 pubX,
        uint256 pubY,
        Assertion calldata a
    ) external view returns (bool) {
        if (!P256.isValidPublicKey(bytes32(pubX), bytes32(pubY))) return false;
        if (a.authenticatorData.length < 37) return false;
        if (bytes32(a.authenticatorData[:32]) != rpIdHash) return false;
        if (uint8(a.authenticatorData[32]) & 0x01 == 0) return false;

        bytes memory clientData = bytes(a.clientDataJson);
        if (!_contains(clientData, bytes("\"type\":\"webauthn.get\""))) return false;
        if (!_contains(clientData, bytes(_challengeField(challenge)))) return false;

        bytes32 message = sha256(bytes.concat(a.authenticatorData, sha256(clientData)));
        return P256.verify(message, a.r, a.s, bytes32(pubX), bytes32(pubY));
    }

    function _challengeField(bytes32 challenge) private pure returns (string memory) {
        return string.concat("\"challenge\":\"", _b64url(abi.encodePacked(challenge)), "\"");
    }

    function _contains(bytes memory haystack, bytes memory needle) private pure returns (bool) {
        if (needle.length == 0 || needle.length > haystack.length) return false;
        for (uint256 i = 0; i + needle.length <= haystack.length; i++) {
            bool ok = true;
            for (uint256 j = 0; j < needle.length; j++) {
                if (haystack[i + j] != needle[j]) {
                    ok = false;
                    break;
                }
            }
            if (ok) return true;
        }
        return false;
    }

    function _b64url(bytes memory data) private pure returns (string memory) {
        bytes memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
        uint256 full = data.length / 3;
        uint256 rem = data.length % 3;
        bytes memory out = new bytes(full * 4 + (rem == 0 ? 0 : rem + 1));
        uint256 j;
        for (uint256 i = 0; i < full; i++) {
            uint256 n = (uint256(uint8(data[i * 3])) << 16)
                | (uint256(uint8(data[i * 3 + 1])) << 8)
                | uint256(uint8(data[i * 3 + 2]));
            out[j++] = table[(n >> 18) & 63];
            out[j++] = table[(n >> 12) & 63];
            out[j++] = table[(n >> 6) & 63];
            out[j++] = table[n & 63];
        }
        if (rem == 1) {
            uint256 n = uint256(uint8(data[data.length - 1])) << 16;
            out[j++] = table[(n >> 18) & 63];
            out[j++] = table[(n >> 12) & 63];
        } else if (rem == 2) {
            uint256 n = (uint256(uint8(data[data.length - 2])) << 16)
                | (uint256(uint8(data[data.length - 1])) << 8);
            out[j++] = table[(n >> 18) & 63];
            out[j++] = table[(n >> 12) & 63];
            out[j++] = table[(n >> 6) & 63];
        }
        return string(out);
    }
}
