const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ParaPilot: Policy Engine & Session Key Guardrails", function () {
  let validator;
  let account;
  let mockDEX;
  let mockUSDC;
  let owner, agent, attacker, other;

  const ONE_DAY = 24 * 60 * 60;
  const MAX_SPEND = ethers.parseEther("1.0"); // 1.0 MON/ETH max spend per 24h

  beforeEach(async function () {
    [owner, agent, attacker, other] = await ethers.getSigners();

    // 1. Deploy SessionKeyValidator
    const ValidatorFactory = await ethers.getContractFactory("SessionKeyValidator");
    validator = await ValidatorFactory.deploy();
    await validator.waitForDeployment();

    // 2. Deploy ParaPilotAccount (Smart Account)
    const AccountFactory = await ethers.getContractFactory("ParaPilotAccount");
    account = await AccountFactory.deploy(owner.address, await validator.getAddress());
    await account.waitForDeployment();

    // Fund the smart account with 10 ETH
    await owner.sendTransaction({
      to: await account.getAddress(),
      value: ethers.parseEther("10.0"),
    });

    // 3. Deploy Mock DEX and Mock USDC
    const DEXFactory = await ethers.getContractFactory("MockDEX");
    mockDEX = await DEXFactory.deploy();
    await mockDEX.waitForDeployment();

    const ERC20Factory = await ethers.getContractFactory("MockERC20");
    mockUSDC = await ERC20Factory.deploy("USD Coin", "USDC", 6);
    await mockUSDC.waitForDeployment();
  });

  describe("1. Policy Registration & Configuration", function () {
    it("Should allow owner to register a session key with spend limits", async function () {
      const now = await time.latest();
      const validUntil = now + 7 * ONE_DAY;

      await expect(
        validator.connect(owner).registerSessionKey(
          agent.address,
          now,
          validUntil,
          MAX_SPEND,
          ONE_DAY
        )
      )
        .to.emit(validator, "SessionKeyRegistered")
        .withArgs(owner.address, agent.address, validUntil, MAX_SPEND);

      const isValid = await validator.isSessionValid(owner.address, agent.address);
      expect(isValid).to.be.true;
    });

    it("Should reject registration with invalid timeframe or zero address", async function () {
      const now = await time.latest();
      await expect(
        validator.connect(owner).registerSessionKey(
          ethers.ZeroAddress,
          now,
          now + ONE_DAY,
          MAX_SPEND,
          ONE_DAY
        )
      ).to.be.revertedWith("Invalid session key");

      await expect(
        validator.connect(owner).registerSessionKey(
          agent.address,
          now + ONE_DAY,
          now, // validUntil < validAfter
          MAX_SPEND,
          ONE_DAY
        )
      ).to.be.revertedWith("Invalid timeframe");
    });
  });

  describe("2. Policy-Gated Agent Execution", function () {
    let swapCalldata;
    let swapSelector;

    beforeEach(async function () {
      const now = await time.latest();
      // Register session key
      await validator.connect(owner).registerSessionKey(
        agent.address,
        now,
        now + 7 * ONE_DAY,
        MAX_SPEND,
        ONE_DAY
      );

      // Whitelist Mock DEX router
      await validator.connect(owner).setWhitelistedContract(
        agent.address,
        await mockDEX.getAddress(),
        true
      );

      // Encode call to swapExactETHForTokens(address,uint256)
      const iface = mockDEX.interface;
      swapCalldata = iface.encodeFunctionData("swapExactETHForTokens", [
        await mockUSDC.getAddress(),
        ethers.parseUnits("100", 6),
      ]);
      swapSelector = iface.getFunction("swapExactETHForTokens").selector;

      // Whitelist swap method
      await validator.connect(owner).setWhitelistedMethod(
        agent.address,
        await mockDEX.getAddress(),
        swapSelector,
        true
      );
    });

    it("Should allow agent to execute a valid swap within spending limit", async function () {
      const spendAmount = ethers.parseEther("0.4");

      await expect(
        account.connect(agent).executeViaSessionKey(
          await mockDEX.getAddress(),
          spendAmount,
          swapCalldata
        )
      )
        .to.emit(account, "ExecutionSuccess")
        .withArgs(agent.address, await mockDEX.getAddress(), spendAmount, swapCalldata);

      const policy = await validator.sessionPolicies(owner.address, agent.address);
      expect(policy.currentIntervalSpent).to.equal(spendAmount);
    });

    it("Should reject execution if spending limit is exceeded", async function () {
      const excessiveAmount = ethers.parseEther("1.5"); // MAX_SPEND is 1.0

      await expect(
        account.connect(agent).executeViaSessionKey(
          await mockDEX.getAddress(),
          excessiveAmount,
          swapCalldata
        )
      ).to.be.revertedWithCustomError(validator, "SpendLimitExceeded");
    });

    it("Should reject execution if target contract is not whitelisted", async function () {
      // Unwhitelisted target
      const rogueContract = other.address;
      const spendAmount = ethers.parseEther("0.1");

      await expect(
        account.connect(agent).executeViaSessionKey(
          rogueContract,
          spendAmount,
          "0x12345678"
        )
      ).to.be.revertedWithCustomError(validator, "ContractNotWhitelisted");
    });

    it("Should reject execution if method is not whitelisted", async function () {
      const iface = mockDEX.interface;
      const unauthorizedCalldata = iface.encodeFunctionData("unauthorizedMethod");

      await expect(
        account.connect(agent).executeViaSessionKey(
          await mockDEX.getAddress(),
          0,
          unauthorizedCalldata
        )
      ).to.be.revertedWithCustomError(validator, "MethodNotWhitelisted");
    });

    it("Should reject execution if session key is expired", async function () {
      // Advance time beyond validUntil (7 days)
      await time.increase(8 * ONE_DAY);

      await expect(
        account.connect(agent).executeViaSessionKey(
          await mockDEX.getAddress(),
          ethers.parseEther("0.1"),
          swapCalldata
        )
      ).to.be.revertedWithCustomError(validator, "SessionExpired");
    });

    it("Should reset spend interval after intervalDuration expires", async function () {
      const spendAmount = ethers.parseEther("0.8");

      // First spend
      await account.connect(agent).executeViaSessionKey(
        await mockDEX.getAddress(),
        spendAmount,
        swapCalldata
      );

      // Second spend within same day: 0.8 + 0.5 = 1.3 > 1.0 -> Reverts
      await expect(
        account.connect(agent).executeViaSessionKey(
          await mockDEX.getAddress(),
          ethers.parseEther("0.5"),
          swapCalldata
        )
      ).to.be.revertedWithCustomError(validator, "SpendLimitExceeded");

      // Fast-forward 1 day (24 hours)
      await time.increase(ONE_DAY + 1);

      // Now spend succeeds because new interval started!
      await expect(
        account.connect(agent).executeViaSessionKey(
          await mockDEX.getAddress(),
          ethers.parseEther("0.5"),
          swapCalldata
        )
      ).to.emit(account, "ExecutionSuccess");
    });
  });

  describe("3. Emergency Kill-Switch & Owner Authority", function () {
    it("Should immediately block agent execution when owner revokes session key", async function () {
      const now = await time.latest();
      await validator.connect(owner).registerSessionKey(
        agent.address,
        now,
        now + 7 * ONE_DAY,
        MAX_SPEND,
        ONE_DAY
      );

      // Owner hits Emergency Kill-Switch
      await expect(validator.connect(owner).revokeSessionKey(agent.address))
        .to.emit(validator, "SessionKeyRevoked")
        .withArgs(owner.address, agent.address);

      expect(await validator.isSessionValid(owner.address, agent.address)).to.be.false;

      // Subsequent agent call reverts immediately
      await expect(
        account.connect(agent).executeViaSessionKey(
          await mockDEX.getAddress(),
          0,
          "0x12345678"
        )
      ).to.be.revertedWithCustomError(validator, "SessionNotActive");
    });

    it("Owner can always execute direct calls without validator restrictions", async function () {
      const directAmount = ethers.parseEther("3.0"); // Even larger than session limit

      const balanceBefore = await ethers.provider.getBalance(other.address);
      await account.connect(owner).executeDirect(other.address, directAmount, "0x");
      const balanceAfter = await ethers.provider.getBalance(other.address);

      expect(balanceAfter - balanceBefore).to.equal(directAmount);
    });
  });
});
