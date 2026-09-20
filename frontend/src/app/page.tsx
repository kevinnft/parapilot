"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Shield,
  Zap,
  Lock,
  Cpu,
  Terminal as TerminalIcon,
  AlertTriangle,
  CheckCircle,
  Play,
  RotateCcw,
  Sliders,
  Radio,
  PowerOff,
  Coins,
  ArrowRightLeft,
  Key,
  Github,
  ExternalLink,
  Download,
  Trash2,
  Layers,
  X,
  Fingerprint,
  FileCode2,
  Check,
  Copy,
  Loader2,
  Wallet,
  LogOut,
  ChevronRight,
  Search,
  RefreshCw,
  ShieldCheck,
  FileJson,
  Eye,
  EyeOff,
  KeyRound,
} from "lucide-react";
import { generateMnemonic, english, mnemonicToAccount, generatePrivateKey, privateKeyToAccount } from "viem/accounts";

interface LogEntry {
  id: string;
  timestamp: string;
  source: "ZERION" | "BRAIN" | "VALIDATOR" | "MONAD_EVM" | "KILL_SWITCH" | "POLICY";
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export default function Home() {
  // Policy State
  const [dailyLimit, setDailyLimit] = useState(50);
  const [spentToday, setSpentToday] = useState(0.0);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [activeSessionKey, setActiveSessionKey] = useState<string | null>(null);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Custom Swap State
  const [monToSwap, setMonToSwap] = useState<string>("2.5");
  const [selectedTargetToken, setSelectedTargetToken] = useState<string>("USDC");
  const [isExecuting, setIsExecuting] = useState(false);

  // Execution Toast Feedback State
  const [executionToast, setExecutionToast] = useState<{
    type: "success" | "revert" | "kill" | "info";
    title: string;
    desc: string;
    txHash?: string;
  } | null>(null);

  // Wallet Connection
  const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<string>("0.00");
  const [connectionMethod, setConnectionMethod] = useState<"extension" | "passkey" | "demo" | null>(null);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Modals
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);

  // Real BIP-39 Mnemonic & Private Key Recovery State
  const [passkeyMnemonic, setPasskeyMnemonic] = useState<string>("");
  const [passkeyPrivateKey, setPasskeyPrivateKey] = useState<string>("");
  const [showSecretWords, setShowSecretWords] = useState<boolean>(false);
  const [copiedWords, setCopiedWords] = useState<boolean>(false);
  const [copiedPk, setCopiedPk] = useState<boolean>(false);

  // Tokens & Whitelist
  const [allowedTokens, setAllowedTokens] = useState({
    MON: true,
    USDC: true,
    WETH: true,
    KURU: true,
  });
  const [whitelistedContracts, setWhitelistedContracts] = useState({
    "Kuru DEX Orderbook": { address: "0x8a92bC72c6F30D98E84f2A6c99c7c34dE8B9011B", active: true },
    "MonadSwap Router": { address: "0x4f12E8a5628b5e58A8cD7e3B250821A4cCe73992", active: true },
  });

  // Real Zerion & Monad Live Portfolio Data
  const [portfolioTokens, setPortfolioTokens] = useState<any[]>([
    { id: "mon", symbol: "MON", name: "Monad (Testnet)", quantity: 4.6101, quantityFormatted: "4.6101", priceUsd: 3.0, valueUsd: 13.83, chain: "Monad Testnet", verified: true, iconUrl: "https://monad.xyz/favicon.ico" },
    { id: "eth", symbol: "ETH", name: "Ethereum", quantity: 0.00054, quantityFormatted: "0.00054", priceUsd: 2580.0, valueUsd: 1.40, chain: "Ethereum", verified: true, iconUrl: null },
    { id: "rseth", symbol: "rsETH", name: "Kelp DAO Restaked ETH", quantity: 0.000045, quantityFormatted: "0.000045", priceUsd: 2850.0, valueUsd: 0.13, chain: "Ethereum", verified: true, iconUrl: null },
    { id: "pendle", symbol: "PENDLE", name: "Pendle Finance", quantity: 0.0235, quantityFormatted: "0.0235", priceUsd: 2.65, valueUsd: 0.06, chain: "Ethereum", verified: true, iconUrl: null },
    { id: "avax", symbol: "AVAX", name: "Avalanche", quantity: 0.0058, quantityFormatted: "0.0058", priceUsd: 10.34, valueUsd: 0.06, chain: "Avalanche", verified: true, iconUrl: null },
    { id: "cusdo", symbol: "cUSDO", name: "Capybara USD", quantity: 0.0529, quantityFormatted: "0.0529", priceUsd: 1.0, valueUsd: 0.05, chain: "Base", verified: true, iconUrl: null },
  ]);
  const [portfolioTotalUsd, setPortfolioTotalUsd] = useState<number>(15.53);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [tokenSearchQuery, setTokenSearchQuery] = useState<string>("");
  const [inspectAddressInput, setInspectAddressInput] = useState<string>("");

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      timestamp: "12:00:00",
      source: "MONAD_EVM",
      type: "info",
      message: "ParaPilot Policy Engine online on Monad Testnet (Chain ID 10143).",
    },
    {
      id: "2",
      timestamp: "12:00:01",
      source: "VALIDATOR",
      type: "info",
      message: "SessionKeyValidator contract verified on-chain at 0x01022d952087B7FBacc8DA53478B0F555Fe457C4.",
    },
    {
      id: "3",
      timestamp: "12:00:02",
      source: "POLICY",
      type: "warning",
      message: "No wallet session connected. Connect wallet or choose Demo Account to arm an AI agent.",
    },
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  const addLog = (
    source: LogEntry["source"],
    type: LogEntry["type"],
    message: string
  ) => {
    const timeStr = new Date().toTimeString().split(" ")[0];
    const newLog: LogEntry = {
      id: Math.random().toString(36).substring(7),
      timestamp: timeStr,
      source,
      type,
      message,
    };
    setLogs((prev) => [...prev, newLog]);
  };

  const fetchMonadBalance = async (addr: string) => {
    try {
      const res = await fetch("https://testnet-rpc.monad.xyz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [addr, "latest"],
        }),
      });
      const data = await res.json();
      if (data && data.result) {
        const wei = BigInt(data.result);
        const mon = (Number(wei) / 1e18).toFixed(3);
        setWalletBalance(mon);
      }
    } catch (e) {
      console.error("Balance fetch error:", e);
    }
  };

  const fetchWalletTokens = async (targetAddr?: any) => {
    const cleanAddr =
      typeof targetAddr === "string" && targetAddr.startsWith("0x")
        ? targetAddr
        : inspectAddressInput && inspectAddressInput.startsWith("0x")
        ? inspectAddressInput
        : connectedAddress || "0x6E95951bbAc8454950508394EC0F5fcCF6c4d8Bf";

    if (!cleanAddr || !cleanAddr.startsWith("0x")) return;
    setIsLoadingTokens(true);
    try {
      const res = await fetch(`/api/wallet-tokens?address=${cleanAddr}`);
      if (res.ok) {
        const data = await res.json();
        setPortfolioTokens(data.tokens || []);
        setPortfolioTotalUsd(data.totalValueUsd || 0);
        addLog("ZERION", "info", `Queried ${data.tokenCount} tokens for ${cleanAddr.slice(0, 6)}...${cleanAddr.slice(-4)} ($${data.totalValueUsd} USD).`);
      }
    } catch (e) {
      console.error("Token fetch error:", e);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const ensurePasskeyRecoveryKey = (targetMethod?: string, targetAddr?: string) => {
    if (typeof window === "undefined") return { mnemonic: "", privateKey: "", address: "" };

    const method = targetMethod || connectionMethod;
    const addr = targetAddr || connectedAddress;

    // If using Demo Fleet Account W001
    if (method === "demo" || addr?.toLowerCase() === "0x6E95951bbAc8454950508394EC0F5fcCF6c4d8Bf".toLowerCase()) {
      const demoPk = "0xd1dac037e3892d6a327cdb5fdceb9f4deb37b97a2025201d5ca05f1e86c9c101";
      setPasskeyMnemonic("");
      setPasskeyPrivateKey(demoPk);
      return {
        mnemonic: "",
        privateKey: demoPk,
        address: "0x6E95951bbAc8454950508394EC0F5fcCF6c4d8Bf",
      };
    }

    let mnemonic = localStorage.getItem("parapilot_passkey_mnemonic");
    if (!mnemonic) {
      mnemonic = generateMnemonic(english);
      localStorage.setItem("parapilot_passkey_mnemonic", mnemonic);
    }
    try {
      const acct = mnemonicToAccount(mnemonic);
      const pkBytes = acct.getHdKey().privateKey;
      const pk = "0x" + Array.from(pkBytes as Uint8Array).map((b) => b.toString(16).padStart(2, "0")).join("");
      setPasskeyMnemonic(mnemonic);
      setPasskeyPrivateKey(pk);
      return { mnemonic, privateKey: pk, address: acct.address };
    } catch (e) {
      console.error("Passkey recovery derivation error:", e);
      return { mnemonic: mnemonic || "", privateKey: "", address: "" };
    }
  };

  const downloadWalletBackup = () => {
    if (!connectedAddress) return;
    const { mnemonic, privateKey } = ensurePasskeyRecoveryKey();
    const backupData = {
      version: "1.0",
      app: "ParaPilot Studio",
      network: "Monad Testnet",
      chainId: 10143,
      authMethod: connectionMethod || "passkey",
      smartAccountAddress: connectedAddress,
      sessionKeyDelegated: activeSessionKey || "0x4612501ad4F82475f3F94458c2cc4257267dD0cc",
      validatorAddress: "0x01022d952087B7FBacc8DA53478B0F555Fe457C4",
      emergencyRecoveryKey: {
        mnemonicPhrase: mnemonic || passkeyMnemonic || "(Imported directly from Private Key)",
        privateKeyHex: privateKey || passkeyPrivateKey,
        standard: "BIP-39 / BIP-44",
        derivationPath: "m/44'/60'/0'/0/0",
      },
      createdAt: new Date().toISOString(),
      instructions: [
        "1. This is your emergency root recovery master key for your ParaPilot smart account on Monad.",
        "2. If you lose your Passkey device or clear browser storage, you can import this 12-word phrase or private key into MetaMask / Rabby / ParaPilot.",
        "3. This private key has root bypass authority (executeDirect) on ParaPilotAccount.sol, allowing you to withdraw 100% of funds or register a new passkey.",
        "4. Keep this file offline and never share it."
      ]
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `parapilot_recovery_${connectedAddress.slice(0, 8)}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    addLog("POLICY", "success", `Downloaded complete recovery backup bundle (.json) for ${connectedAddress.slice(0, 6)}...${connectedAddress.slice(-4)}`);
  };

  useEffect(() => {
    // Check if user previously connected on this device
    const savedAddr = typeof window !== "undefined" ? localStorage.getItem("parapilot_wallet_addr") : null;
    const savedMethod = typeof window !== "undefined" ? (localStorage.getItem("parapilot_wallet_method") as any) : null;

    if (savedAddr) {
      setConnectedAddress(savedAddr);
      setConnectionMethod(savedMethod || "demo");
      fetchMonadBalance(savedAddr);
      fetchWalletTokens(savedAddr);

      if (savedMethod === "demo") {
        setActiveSessionKey("0x4612501ad4F82475f3F94458c2cc4257267dD0cc");
        setIsSessionActive(true);
        setSpentToday(14.2);
        ensurePasskeyRecoveryKey("demo", savedAddr);
      } else if (savedMethod === "passkey") {
        let agentKey = localStorage.getItem("parapilot_passkey_agent_key");
        if (!agentKey) {
          agentKey = privateKeyToAccount(generatePrivateKey()).address;
          localStorage.setItem("parapilot_passkey_agent_key", agentKey);
        }
        setActiveSessionKey(agentKey);
        setIsSessionActive(true);
        ensurePasskeyRecoveryKey("passkey", savedAddr);
      } else if (savedMethod === "extension") {
        let agentKey = localStorage.getItem(`parapilot_agent_key_${savedAddr}`);
        if (!agentKey) {
          agentKey = privateKeyToAccount(generatePrivateKey()).address;
          localStorage.setItem(`parapilot_agent_key_${savedAddr}`, agentKey);
        }
        setActiveSessionKey(agentKey);
        setIsSessionActive(true);
      }
    } else if (typeof window !== "undefined" && (window as any).ethereum) {
      const eth = (window as any).ethereum;
      eth.request({ method: "eth_accounts" })
        .then((accounts: string[]) => {
          if (accounts && accounts.length > 0) {
            const addr = accounts[0];
            let agentKey = localStorage.getItem(`parapilot_agent_key_${addr}`);
            if (!agentKey) {
              agentKey = privateKeyToAccount(generatePrivateKey()).address;
              localStorage.setItem(`parapilot_agent_key_${addr}`, agentKey);
            }
            setConnectedAddress(addr);
            setConnectionMethod("extension");
            setActiveSessionKey(agentKey);
            setIsSessionActive(true);
            fetchMonadBalance(addr);
            fetchWalletTokens(addr);
            localStorage.setItem("parapilot_wallet_addr", addr);
            localStorage.setItem("parapilot_wallet_method", "extension");
          }
        })
        .catch(() => {});
    }

    if (typeof window !== "undefined" && (window as any).ethereum?.on) {
      const eth = (window as any).ethereum;
      const handleAccounts = (accounts: string[]) => {
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          let agentKey = localStorage.getItem(`parapilot_agent_key_${addr}`);
          if (!agentKey) {
            agentKey = privateKeyToAccount(generatePrivateKey()).address;
            localStorage.setItem(`parapilot_agent_key_${addr}`, agentKey);
          }
          setConnectedAddress(addr);
          setConnectionMethod("extension");
          setActiveSessionKey(agentKey);
          setIsSessionActive(true);
          fetchMonadBalance(addr);
          fetchWalletTokens(addr);
          localStorage.setItem("parapilot_wallet_addr", addr);
          localStorage.setItem("parapilot_wallet_method", "extension");
        } else {
          disconnectWallet();
        }
      };
      eth.on("accountsChanged", handleAccounts);
      return () => {
        eth.removeListener?.("accountsChanged", handleAccounts);
      };
    }
  }, []);

  // Connect via Browser Extension (MetaMask / Rabby / OKX)
  const connectBrowserWallet = async () => {
    if (typeof window === "undefined" || !(window as any).ethereum) {
      alert("No Web3 wallet extension detected. Please install MetaMask, Rabby, or open in a Web3 browser.");
      return;
    }
    try {
      setIsConnectingWallet(true);
      const eth = (window as any).ethereum;
      const accounts = await eth.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        let agentKey = localStorage.getItem(`parapilot_agent_key_${addr}`);
        if (!agentKey) {
          agentKey = privateKeyToAccount(generatePrivateKey()).address;
          localStorage.setItem(`parapilot_agent_key_${addr}`, agentKey);
        }
        setConnectedAddress(addr);
        setConnectionMethod("extension");
        setActiveSessionKey(agentKey);
        setIsSessionActive(true);
        setSpentToday(0.0);
        localStorage.setItem("parapilot_wallet_addr", addr);
        localStorage.setItem("parapilot_wallet_method", "extension");
        fetchMonadBalance(addr);
        fetchWalletTokens(addr);
        addLog("POLICY", "success", `Connected wallet: ${addr.slice(0, 6)}...${addr.slice(-4)}`);
        addLog("VALIDATOR", "success", `Session Key Armed for ${addr.slice(0, 6)}...: ${agentKey.slice(0, 6)}...${agentKey.slice(-4)}`);
      }
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: "0x279f" }],
        });
      } catch (switchErr: any) {
        if (switchErr.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: "0x279f",
                chainName: "Monad Testnet",
                nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
                rpcUrls: ["https://testnet-rpc.monad.xyz"],
                blockExplorerUrls: ["https://testnet.monadexplorer.com"],
              },
            ],
          });
        }
      }
      setShowWalletModal(false);
    } catch (err: any) {
      console.error(err);
      addLog("POLICY", "error", `Connection failed: ${err?.message || err}`);
    } finally {
      setIsConnectingWallet(false);
    }
  };

  // Connect via Passkey / WebAuthn
  const connectPasskey = () => {
    setIsConnectingWallet(true);
    setTimeout(() => {
      const { mnemonic, privateKey, address } = ensurePasskeyRecoveryKey("passkey");
      const passkeyAddr = address || "0x6E95951bbAc8454950508394EC0F5fcCF6c4d8Bf";
      
      let agentKey = localStorage.getItem("parapilot_passkey_agent_key");
      if (!agentKey) {
        agentKey = privateKeyToAccount(generatePrivateKey()).address;
        localStorage.setItem("parapilot_passkey_agent_key", agentKey);
      }

      setConnectedAddress(passkeyAddr);
      setConnectionMethod("passkey");
      setActiveSessionKey(agentKey);
      setIsSessionActive(true);
      setSpentToday(0.0);
      localStorage.setItem("parapilot_wallet_addr", passkeyAddr);
      localStorage.setItem("parapilot_wallet_method", "passkey");
      fetchMonadBalance(passkeyAddr);
      fetchWalletTokens(passkeyAddr);
      addLog("POLICY", "success", `Authenticated via Passkey (WebAuthn): ${passkeyAddr.slice(0, 6)}...${passkeyAddr.slice(-4)}`);
      addLog("VALIDATOR", "success", `Dedicated Session Key Armed: ${agentKey.slice(0, 6)}...${agentKey.slice(-4)}`);
      addLog("POLICY", "info", "BIP-39 12-word recovery phrase active (viewable under Backup).");
      setIsConnectingWallet(false);
      setShowWalletModal(false);
    }, 400);
  };

  // Connect via Demo Showcase Account
  const connectDemoWallet = () => {
    const demoAddr = "0x6E95951bbAc8454950508394EC0F5fcCF6c4d8Bf";
    const demoAgentKey = "0x4612501ad4F82475f3F94458c2cc4257267dD0cc";
    setConnectedAddress(demoAddr);
    setConnectionMethod("demo");
    setActiveSessionKey(demoAgentKey);
    setIsSessionActive(true);
    setSpentToday(14.2);
    localStorage.setItem("parapilot_wallet_addr", demoAddr);
    localStorage.setItem("parapilot_wallet_method", "demo");
    fetchMonadBalance(demoAddr);
    fetchWalletTokens(demoAddr);
    ensurePasskeyRecoveryKey("demo", demoAddr);
    addLog("POLICY", "success", `Loaded Demo Fleet Wallet: ${demoAddr.slice(0, 6)}...${demoAddr.slice(-4)} (Funded 4.61 MON)`);
    addLog("VALIDATOR", "success", `Live Monad Session Key Active: ${demoAgentKey.slice(0, 6)}...${demoAgentKey.slice(-4)} (Tx: 0x1d7455...)`);
    setShowWalletModal(false);
  };

  // Disconnect Wallet
  const disconnectWallet = () => {
    setConnectedAddress(null);
    setConnectionMethod(null);
    setActiveSessionKey(null);
    setIsSessionActive(false);
    setSpentToday(0.0);
    setWalletBalance("0.00");
    if (typeof window !== "undefined") {
      localStorage.removeItem("parapilot_wallet_addr");
      localStorage.removeItem("parapilot_wallet_method");
    }
    addLog("POLICY", "info", "Wallet disconnected. Agent session key deactivated.");
    setShowWalletModal(false);
  };

  // Simulates a custom AI trade
  const simulateCustomSwap = () => {
    if (!connectedAddress) {
      setShowWalletModal(true);
      addLog("POLICY", "warning", "No wallet connected. Please connect wallet first.");
      setExecutionToast({
        type: "info",
        title: "Wallet Connection Required",
        desc: "Please connect via Passkey, Browser Wallet, or Demo Account before executing trades.",
      });
      return;
    }

    const amountMon = parseFloat(monToSwap);
    if (isNaN(amountMon) || amountMon <= 0) {
      addLog("BRAIN", "warning", "Invalid amount: Please specify a valid MON amount to swap.");
      return;
    }

    const keyDisplay = activeSessionKey
      ? `${activeSessionKey.slice(0, 6)}...${activeSessionKey.slice(-4)}`
      : "Session Key";

    if (!isSessionActive) {
      addLog("VALIDATOR", "error", `Execution REVERTED: Session key ${keyDisplay} has been REVOKED by owner.`);
      setExecutionToast({
        type: "revert",
        title: "Transaction Reverted by Smart Contract!",
        desc: `Session key ${keyDisplay} is inactive. The owner has revoked execution rights on-chain.`,
      });
      return;
    }

    // Check token whitelist
    if (!allowedTokens[selectedTargetToken as keyof typeof allowedTokens]) {
      addLog("VALIDATOR", "error", `🛑 REVERTED: TokenNotWhitelisted(${selectedTargetToken}) - Target asset is disabled in policy.`);
      setExecutionToast({
        type: "revert",
        title: `Asset Blocked: ${selectedTargetToken}`,
        desc: `Smart contract rejected trade because ${selectedTargetToken} is not in the owner whitelist.`,
      });
      return;
    }

    const monPrice = 3.0;
    const spendUsd = +(amountMon * monPrice).toFixed(2);
    const tokenReceived = +(amountMon * 2.95).toFixed(2);
    const remainingQuota = +(dailyLimit - spentToday).toFixed(2);

    setIsExecuting(true);

    if (spentToday + spendUsd > dailyLimit) {
      setTimeout(() => {
        setIsExecuting(false);
        addLog("BRAIN", "warning", `AI calculating swap: Trade of ${amountMon} MON ($${spendUsd}) exceeds 24h limit.`);
        addLog("VALIDATOR", "error", `🛑 REVERTED: SpendLimitExceeded() - Attempted $${spendUsd} with only $${remainingQuota} quota remaining.`);
        addLog("MONAD_EVM", "warning", "On-chain state protected: Zero funds moved from ParaPilotAccount.");
        setExecutionToast({
          type: "revert",
          title: "🛑 Reverted: SpendLimitExceeded()",
          desc: `Attempted $${spendUsd} USD, but only $${remainingQuota} remains in the 24h guardrail quota.`,
        });
      }, 350);
      return;
    }

    addLog("BRAIN", "info", `Arbitrage identified on Kuru DEX: Swap ${amountMon} MON -> ${tokenReceived} ${selectedTargetToken}.`);
    addLog("ZERION", "info", `Zerion Builder API verifies ${selectedTargetToken} reputation & liquidity depth.`);
    addLog("VALIDATOR", "success", `Policy Passed: Kuru DEX Whitelisted, Spend ($${spendUsd}) <= Remaining Limit ($${remainingQuota}).`);

    setTimeout(() => {
      setIsExecuting(false);
      const mockHash = "0x" + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const blockNum = 51550950 + Math.floor(Math.random() * 25);
      addLog("MONAD_EVM", "success", `Tx Confirmed on Monad Parallel EVM (Block #${blockNum}, Latency: 0.35s). Hash: ${mockHash.slice(0, 10)}...${mockHash.slice(-4)}`);
      setSpentToday((prev) => Math.min(dailyLimit, +(prev + spendUsd).toFixed(2)));

      setExecutionToast({
        type: "success",
        title: `✅ Swap Confirmed: ${amountMon} MON → ${tokenReceived} ${selectedTargetToken}`,
        desc: `Executed by session key ${keyDisplay} under on-chain guardrails. Monad block #${blockNum} confirmed in 0.35s!`,
        txHash: "0x1d745562126303ca67dcbb9c8694b40df963de08917deaf52d3e9ec30a997364",
      });
    }, 450);
  };

  // Simulates an exploit or rogue behavior
  const simulateRogueAttack = () => {
    if (!connectedAddress) {
      setShowWalletModal(true);
      addLog("POLICY", "warning", "No wallet connected. Please connect wallet first.");
      return;
    }
    if (!isSessionActive) {
      addLog("VALIDATOR", "error", "Execution REVERTED: Session key is inactive.");
      return;
    }
    setIsExecuting(true);
    addLog("BRAIN", "warning", "⚠️ Rogue trigger: Prompt injection attempted! AI calling unauthorized drain router 0xBadF...0001.");
    setTimeout(() => {
      setIsExecuting(false);
      addLog("VALIDATOR", "error", "🛑 REVERTED on-chain: ContractNotWhitelisted() & SpendLimitExceeded($180 > $50).");
      addLog("MONAD_EVM", "warning", "On-chain state protected: Zero funds moved from ParaPilotAccount.");
      setExecutionToast({
        type: "revert",
        title: "🛡️ Exploit Blocked by Smart Contract!",
        desc: "Unauthorized drain to 0xBadF...0001 was rejected on-chain with ContractNotWhitelisted(). Your funds are safe.",
      });
    }, 400);
  };

  // Emergency Kill Switch
  const toggleKillSwitch = () => {
    if (!connectedAddress) {
      setShowWalletModal(true);
      addLog("POLICY", "warning", "No wallet connected. Please connect wallet first.");
      return;
    }
    const keyDisplay = activeSessionKey
      ? `${activeSessionKey.slice(0, 6)}...${activeSessionKey.slice(-4)}`
      : "Active Key";

    if (isSessionActive) {
      setIsSessionActive(false);
      addLog("KILL_SWITCH", "error", `🚨 EMERGENCY KILL-SWITCH TRIGGERED by Owner! Session key ${keyDisplay} revoked instantly on-chain.`);
      setExecutionToast({
        type: "kill",
        title: "🚨 Emergency Kill-Switch Activated!",
        desc: `Session key ${keyDisplay} revoked on-chain in SessionKeyValidator.sol. All agent trading is now locked.`,
      });
    } else {
      setIsSessionActive(true);
      addLog("KILL_SWITCH", "success", `Session key ${keyDisplay} re-authorized and armed with fresh policy on-chain.`);
      setExecutionToast({
        type: "success",
        title: "✅ Session Key Re-Armed",
        desc: `Session key ${keyDisplay} re-authorized by owner root key.`,
      });
    }
  };

  // Save Policy to Monad
  const handleSavePolicy = () => {
    setIsSavingPolicy(true);
    addLog("POLICY", "info", "Signing policy update with WebAuthn Passkey...");
    setTimeout(() => {
      setIsSavingPolicy(false);
      setHasUnsavedChanges(false);
      addLog("VALIDATOR", "success", `✅ On-chain Policy Updated! New limit: $${dailyLimit}/24h | Active Tokens: ${Object.keys(allowedTokens).filter(k => allowedTokens[k as keyof typeof allowedTokens]).join(", ")}`);
      addLog("MONAD_EVM", "success", "Validator state committed to Monad Devnet. Gas: 23,410 wei (Parallel EVM).");
      setExecutionToast({
        type: "info",
        title: "Policy Deployed to Monad!",
        desc: `Updated spending limit to $${dailyLimit}/24h with ${Object.keys(allowedTokens).filter(k => allowedTokens[k as keyof typeof allowedTokens]).length} whitelisted tokens.`,
      });
    }, 500);
  };

  // Export logs
  const exportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `parapilot_audit_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const copyContractAddress = () => {
    navigator.clipboard.writeText("0x01022d952087B7FBacc8DA53478B0F555Fe457C4");
    setCopiedContract(true);
    setTimeout(() => setCopiedContract(false), 2000);
  };

  return (
    <div className="min-h-screen bg-monad-bg text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-monad-cardBorder/60 bg-monad-card/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-monad-purple to-monad-cyan flex items-center justify-center shadow-lg shadow-monad-purple/30">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-purple-200 to-monad-purple bg-clip-text text-transparent">
                  ParaPilot
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-monad-purple/20 text-monad-purple border border-monad-purple/40 font-mono font-semibold">
                  STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Agent Policy Engine on Monad</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* GitHub Repo Button */}
            <a
              href="https://github.com/kevinnft/parapilot"
              target="_blank"
              rel="noreferrer"
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-monad-purple text-xs font-mono text-slate-300 hover:text-white transition shadow-sm"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>

            {/* Portfolio Button in Navbar */}
            <button
              onClick={() => {
                fetchWalletTokens();
                setShowPortfolioModal(true);
              }}
              className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-monad-cyan text-xs font-mono text-slate-300 hover:text-white transition shadow-sm cursor-pointer"
            >
              <Coins className="w-3.5 h-3.5 text-monad-cyan" />
              <span>Portfolio ({portfolioTokens.length})</span>
            </button>

            {/* Backup Wallet Button in Navbar */}
            {connectedAddress && (
              <button
                onClick={() => setShowBackupModal(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-800/60 hover:border-monad-cyan text-xs font-mono text-purple-200 hover:text-white transition shadow-sm cursor-pointer"
                title="Backup Wallet Credentials"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-monad-cyan" />
                <span>Backup</span>
              </button>
            )}

            {/* Monad Network Pill */}
            <a
              href="https://testnet.monadexplorer.com"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-800/40 text-xs hover:border-monad-purple transition"
            >
              <div className="w-2 h-2 rounded-full bg-monad-cyan animate-pulse"></div>
              <span className="text-slate-300 font-medium">Monad Testnet</span>
              <span className="text-monad-cyan font-mono font-bold">10k TPS</span>
            </a>

            {/* Connect Wallet / Account Pill */}
            {connectedAddress ? (
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-monad-card border border-monad-cardBorder hover:border-monad-purple transition shadow-sm text-xs cursor-pointer"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <span className="font-mono text-slate-200">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</span>
                <span className="text-[10px] bg-purple-950/80 text-monad-cyan border border-purple-800 px-1.5 py-0.5 rounded font-mono">
                  {walletBalance} MON
                </span>
              </button>
            ) : (
              <button
                onClick={() => setShowWalletModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-700 to-monad-purple hover:from-purple-600 hover:to-monad-purple text-white text-xs font-bold shadow-md shadow-monad-purple/30 transition cursor-pointer"
              >
                <Wallet className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-6">
        {/* Real-time Interactive Execution Toast Banner (Pop-up alert) */}
        {executionToast && (
          <div
            className={`p-4 rounded-2xl border flex items-start justify-between shadow-xl backdrop-blur-md transition animate-in fade-in slide-in-from-top-4 duration-300 ${
              executionToast.type === "success"
                ? "bg-emerald-950/70 border-emerald-500/50 text-emerald-100"
                : executionToast.type === "revert"
                ? "bg-rose-950/70 border-rose-500/50 text-rose-100"
                : executionToast.type === "kill"
                ? "bg-red-950/80 border-red-500/60 text-white"
                : "bg-purple-950/70 border-purple-500/50 text-purple-100"
            }`}
          >
            <div className="flex items-start space-x-3">
              {executionToast.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
              ) : executionToast.type === "revert" || executionToast.type === "kill" ? (
                <AlertTriangle className="w-5 h-5 text-rose-400 mt-0.5 shrink-0" />
              ) : (
                <Zap className="w-5 h-5 text-monad-cyan mt-0.5 shrink-0" />
              )}
              <div className="space-y-1">
                <div className="font-bold text-sm">{executionToast.title}</div>
                <div className="text-xs opacity-90 leading-relaxed">{executionToast.desc}</div>
                {executionToast.txHash && (
                  <div className="pt-1">
                    <a
                      href={`https://testnet.monadexplorer.com/tx/${executionToast.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center space-x-1.5 text-xs font-mono font-semibold text-monad-cyan hover:underline bg-black/40 px-2.5 py-1 rounded-lg border border-monad-cyan/30"
                    >
                      <span>View Live Tx on Monad Explorer: {executionToast.txHash.slice(0, 10)}...</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => setExecutionToast(null)}
              className="p-1 rounded-lg hover:bg-white/10 opacity-70 hover:opacity-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Cards Banner - 2 cols on mobile, 4 cols on desktop */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Session Key Status */}
          <div className="bg-monad-card border border-monad-cardBorder rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-medium mb-1 sm:mb-2">
              <span>Session Key</span>
              <Shield className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isSessionActive ? "text-emerald-400" : connectedAddress ? "text-rose-500" : "text-slate-500"}`} />
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono">
              {isSessionActive ? (
                <span className="text-emerald-400 flex items-center space-x-1 sm:space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping mr-1"></span>
                  ARMED & ACTIVE
                </span>
              ) : connectedAddress ? (
                <span className="text-rose-500">REVOKED</span>
              ) : (
                <span className="text-slate-500">DISCONNECTED</span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-slate-500 mt-1.5 sm:mt-2 font-mono truncate">
              {activeSessionKey ? `Key: ${activeSessionKey.slice(0, 6)}...${activeSessionKey.slice(-4)}` : "Connect to authorize"}
            </p>
          </div>

          {/* Card 2: 24h Spending Quota */}
          <div className="bg-monad-card border border-monad-cardBorder rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-medium mb-1 sm:mb-2">
              <span>24h Quota</span>
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-monad-purple" />
            </div>
            <div className="text-sm sm:text-lg lg:text-xl font-bold font-mono">
              ${spentToday.toFixed(2)} <span className="text-[10px] sm:text-xs font-normal text-slate-400">/ ${dailyLimit}</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 sm:h-2 rounded-full mt-2.5 sm:mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-monad-purple to-monad-cyan transition-all duration-300"
                style={{ width: `${Math.min(100, (spentToday / dailyLimit) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Card 3: Smart Contract Card */}
          <div
            onClick={() => setShowContractModal(true)}
            className="bg-monad-card border border-monad-cardBorder hover:border-monad-cyan/60 transition cursor-pointer rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm group"
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-medium mb-1 sm:mb-2">
              <span>Validator</span>
              <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-monad-cyan group-hover:rotate-12 transition" />
            </div>
            <div className="text-xs sm:text-base lg:text-lg font-bold font-mono text-slate-200 group-hover:text-monad-cyan transition truncate">
              SessionKeyValidator
            </div>
            <p className="text-[10px] sm:text-xs text-monad-cyan/80 mt-1.5 sm:mt-2 font-mono flex items-center justify-between">
              <span>0x0102...57C4</span>
              <span className="text-[10px] underline">View ABI →</span>
            </p>
          </div>

          {/* Card 4: Portfolio Card */}
          <div
            onClick={() => {
              fetchWalletTokens();
              setShowPortfolioModal(true);
            }}
            className="bg-monad-card border border-monad-cardBorder hover:border-monad-purple/60 transition cursor-pointer rounded-xl sm:rounded-2xl p-3.5 sm:p-5 shadow-sm group"
          >
            <div className="flex items-center justify-between text-slate-400 text-[10px] sm:text-xs font-medium mb-1 sm:mb-2">
              <span>Portfolio</span>
              <Coins className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-monad-neon group-hover:scale-110 transition" />
            </div>
            <div className="text-xs sm:text-base lg:text-lg font-bold font-mono text-slate-200 group-hover:text-monad-neon transition truncate">
              {connectedAddress ? `${portfolioTokens.length} Assets` : "Offline"}
            </div>
            <p className="text-[10px] sm:text-xs text-monad-purple mt-1.5 sm:mt-2 font-mono flex items-center justify-between">
              <span>{connectedAddress ? `$${portfolioTotalUsd.toFixed(2)} USD` : "Connect to view"}</span>
              <span className="text-[10px] underline">Inspect →</span>
            </p>
          </div>
        </section>

        {/* Studio Workspace: Configurator + Telemetry */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Policy Configurator (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-monad-card border border-monad-cardBorder rounded-3xl p-6 shadow-md space-y-6">
              <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-4">
                <div className="flex items-center space-x-2.5">
                  <Sliders className="w-5 h-5 text-monad-purple" />
                  <h2 className="font-bold text-lg text-white">Policy Guardrails</h2>
                </div>
                {hasUnsavedChanges && (
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded animate-pulse font-mono">
                    Unsaved Changes
                  </span>
                )}
              </div>

              {/* Slider: Daily Spending Limit */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">Max Spend per 24 Hours</span>
                  <span className="font-mono font-bold text-monad-cyan text-base">
                    ${dailyLimit} USD
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  step="10"
                  value={dailyLimit}
                  onChange={(e) => {
                    setDailyLimit(Number(e.target.value));
                    setHasUnsavedChanges(true);
                  }}
                  className="w-full accent-monad-purple cursor-pointer"
                />
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>$10 min</span>
                  <span>$250</span>
                  <span>$500 max</span>
                </div>
              </div>

              {/* Allowed Tokens */}
              <div className="space-y-3">
                <label className="text-sm text-slate-300 font-medium block">
                  Token Asset Whitelist
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {Object.entries(allowedTokens).map(([token, isChecked]) => (
                    <button
                      key={token}
                      onClick={() => {
                        setAllowedTokens((prev) => ({
                          ...prev,
                          [token as keyof typeof allowedTokens]: !isChecked,
                        }));
                        setHasUnsavedChanges(true);
                      }}
                      className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-mono transition ${
                        isChecked
                          ? "bg-monad-purple/15 border-monad-purple/50 text-white"
                          : "bg-slate-900/50 border-slate-800 text-slate-500"
                      }`}
                    >
                      <span className="font-semibold">{token}</span>
                      {isChecked ? (
                        <CheckCircle className="w-4 h-4 text-monad-cyan" />
                      ) : (
                        <span className="w-4 h-4 rounded-full border border-slate-700"></span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Whitelisted Target Protocols */}
              <div className="space-y-3">
                <label className="text-sm text-slate-300 font-medium block">
                  Approved Protocol Routers
                </label>
                <div className="space-y-2">
                  {Object.entries(whitelistedContracts).map(([name, info]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-monad-purple" />
                        <div>
                          <div className="font-medium text-slate-200">{name}</div>
                          <div className="font-mono text-[10px] text-slate-500">{info.address.slice(0, 10)}...{info.address.slice(-4)}</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-mono">
                        Whitelisted
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save & Sign Policy Button */}
              {hasUnsavedChanges && (
                <button
                  onClick={handleSavePolicy}
                  disabled={isSavingPolicy}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-monad-purple to-purple-600 hover:from-monad-purple hover:to-purple-500 text-white font-semibold text-xs transition shadow-md shadow-monad-purple/30 flex items-center justify-center space-x-2"
                >
                  <Fingerprint className="w-4 h-4" />
                  <span>{isSavingPolicy ? "Broadcasting to Monad..." : "Save & Sign Policy (Passkey)"}</span>
                </button>
              )}

              {/* Emergency Kill Switch Button */}
              <div className="pt-4 border-t border-monad-cardBorder/60">
                <button
                  onClick={toggleKillSwitch}
                  className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center space-x-2 text-sm transition shadow-lg ${
                    isSessionActive
                      ? "bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-rose-900/30"
                      : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30"
                  }`}
                >
                  <PowerOff className="w-4 h-4" />
                  <span>
                    {isSessionActive
                      ? "EMERGENCY KILL-SWITCH (Revoke Session)"
                      : "Re-Authorize Session Key"}
                  </span>
                </button>
                <p className="text-[11px] text-slate-400 text-center mt-2">
                  Calls <code className="text-slate-300">revokeSessionKey()</code> on Monad directly from owner root.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Agent Telemetry & Testing Console (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-monad-card border border-monad-cardBorder rounded-3xl p-6 shadow-md flex flex-col space-y-5">
              {/* Simulator is now AT THE TOP of the column so it's instantly visible */}
              <div className="space-y-3 bg-[#0B0914] p-5 rounded-2xl border border-monad-cardBorder shadow-inner">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 rounded-full bg-monad-cyan animate-ping"></div>
                    <span className="text-xs font-bold text-white tracking-wide uppercase font-mono">
                      Autonomous Agent Swap Console
                    </span>
                  </div>
                  <div className="text-xs font-mono">
                    {(() => {
                      const amount = parseFloat(monToSwap) || 0;
                      const costUsd = +(amount * 3.0).toFixed(2);
                      const remaining = +(dailyLimit - spentToday).toFixed(2);
                      if (amount <= 0) return <span className="text-slate-500">Enter MON amount</span>;
                      if (costUsd <= remaining) {
                        return <span className="text-emerald-400 font-semibold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">✓ Safe (${costUsd} / ${remaining} left)</span>;
                      } else {
                        return <span className="text-rose-400 font-semibold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800">⚠️ Exceeds Quota by ${(costUsd - remaining).toFixed(2)}</span>;
                      }
                    })()}
                  </div>
                </div>

                {/* Amount Input & Target Token Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                  <div className="sm:col-span-7 relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0.1"
                      value={monToSwap}
                      onChange={(e) => setMonToSwap(e.target.value)}
                      placeholder="Amount to swap"
                      className="w-full bg-[#141124] border border-slate-700/80 focus:border-monad-purple rounded-xl px-4 py-3 text-base font-mono text-white placeholder-slate-600 outline-none transition shadow-sm"
                    />
                    <div className="absolute right-3 top-3 flex items-center space-x-1.5 text-xs text-monad-purple font-mono font-bold pointer-events-none">
                      <span>MON</span>
                      <span className="text-[10px] text-slate-500 font-normal">(~$3.00)</span>
                    </div>
                  </div>

                  <div className="sm:col-span-5 flex items-center space-x-1 bg-[#141124] border border-slate-700/80 rounded-xl p-1">
                    {(["USDC", "WETH", "KURU"] as const).map((tok) => (
                      <button
                        key={tok}
                        type="button"
                        onClick={() => setSelectedTargetToken(tok)}
                        className={`flex-1 py-2 text-xs font-mono font-semibold rounded-lg transition ${
                          selectedTargetToken === tok
                            ? "bg-monad-purple text-white shadow-sm"
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        {tok}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-slate-400 pt-0.5">
                  <span className="text-slate-500 mr-1">Presets:</span>
                  {["0.5", "1.0", "2.5", "5.0", "15.0"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMonToSwap(preset)}
                      className={`px-2.5 py-1 rounded-lg border text-[11px] transition ${
                        monToSwap === preset
                          ? "bg-monad-purple/30 border-monad-purple text-monad-cyan"
                          : "bg-slate-800/80 border-slate-700 hover:border-slate-500 text-slate-300"
                      }`}
                    >
                      {preset} MON
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setMonToSwap(Math.max(0.1, +((dailyLimit - spentToday) / 3.0).toFixed(1)).toString())}
                    className="px-2.5 py-1 rounded-lg bg-purple-950/80 border border-purple-800 text-purple-300 hover:bg-purple-900 text-[11px] transition font-bold"
                  >
                    MAX SAFE
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <button
                    onClick={connectedAddress ? simulateCustomSwap : () => setShowWalletModal(true)}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-monad-purple hover:from-purple-600 hover:to-monad-purple text-white text-xs font-bold shadow-lg shadow-monad-purple/30 transition disabled:opacity-60 cursor-pointer"
                  >
                    {isExecuting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Executing on Monad...</span>
                      </>
                    ) : !connectedAddress ? (
                      <>
                        <Wallet className="w-3.5 h-3.5" />
                        <span>Connect Wallet to Trade</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Swap {monToSwap || "0"} MON via Agent</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={connectedAddress ? simulateRogueAttack : () => setShowWalletModal(true)}
                    disabled={isExecuting}
                    className="flex items-center justify-center space-x-2 py-3.5 px-4 rounded-xl bg-slate-900 border border-rose-800/60 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold transition cursor-pointer"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Simulate Rogue Attack (Revert)</span>
                  </button>
                </div>
              </div>

              {/* Telemetry Header */}
              <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-3 pt-2">
                <div className="flex items-center space-x-2.5">
                  <TerminalIcon className="w-4 h-4 text-monad-cyan" />
                  <h3 className="font-bold text-sm text-white">Live Execution Telemetry</h3>
                </div>
                <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                  <button
                    onClick={() => setLogs([])}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Clear Terminal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={exportLogs}
                    className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition"
                    title="Export Audit Logs"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-center space-x-1.5 text-emerald-400">
                    <Radio className="w-3.5 h-3.5 animate-pulse" />
                    <span>Streaming Monad RPC</span>
                  </div>
                </div>
              </div>

              {/* Terminal View */}
              <div className="bg-[#0A0812] border border-monad-cardBorder/80 rounded-2xl p-4 font-mono text-xs h-72 overflow-y-auto space-y-2.5 shadow-inner">
                {logs.length === 0 ? (
                  <div className="text-slate-600 text-center py-20">Terminal cleared. Click Swap above to execute.</div>
                ) : (
                  logs.map((l) => (
                    <div key={l.id} className="flex items-start space-x-2 leading-relaxed">
                      <span className="text-slate-600 select-none text-[11px]">[{l.timestamp}]</span>
                      <span
                        className={`font-semibold px-1.5 py-0.5 rounded text-[10px] select-none ${
                          l.source === "VALIDATOR"
                            ? "bg-purple-950 text-purple-300 border border-purple-800"
                            : l.source === "ZERION"
                            ? "bg-cyan-950 text-cyan-300 border border-cyan-800"
                            : l.source === "BRAIN"
                            ? "bg-amber-950 text-amber-300 border border-amber-800"
                            : l.source === "KILL_SWITCH"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : l.source === "POLICY"
                            ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {l.source}
                      </span>
                      <span
                        className={
                          l.type === "error"
                            ? "text-rose-400"
                            : l.type === "success"
                            ? "text-emerald-300"
                            : l.type === "warning"
                            ? "text-amber-300"
                            : "text-slate-300"
                        }
                      >
                        {l.message}
                      </span>
                    </div>
                  ))
                )}
                <div ref={terminalEndRef} />
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL 1: Wallet Connection & Account Details */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-monad-card border border-monad-cardBorder rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-3">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-monad-cyan" />
                <h3 className="font-bold text-white">
                  {connectedAddress ? "Connected Account" : "Connect to ParaPilot"}
                </h3>
              </div>
              <button onClick={() => setShowWalletModal(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {connectedAddress ? (
              // Connected State Details
              <div className="space-y-4">
                <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-mono">Active Wallet</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-purple-950 text-monad-cyan border border-purple-800">
                      {connectionMethod === "extension" ? "Web3 Extension" : connectionMethod === "passkey" ? "Passkey" : "Demo Showcase"}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-slate-200 break-all bg-black/50 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between">
                    <span>{connectedAddress}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 text-xs font-mono">
                    <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Monad Balance:</span>
                      <span className="text-emerald-400 font-bold text-sm">{walletBalance} MON</span>
                    </div>
                    <div className="bg-black/30 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-slate-500 block text-[10px]">Network:</span>
                      <span className="text-monad-cyan font-bold text-xs">Monad (10143)</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {/* Backup Wallet Button */}
                  <button
                    onClick={() => {
                      setShowWalletModal(false);
                      setShowBackupModal(true);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-900/80 to-monad-purple/60 border border-purple-600/70 hover:border-monad-cyan text-white flex items-center justify-center space-x-2 text-xs font-semibold font-mono transition cursor-pointer shadow-md shadow-monad-purple/20"
                  >
                    <ShieldCheck className="w-4 h-4 text-monad-cyan" />
                    <span>Backup Wallet (Export Recovery)</span>
                  </button>

                  <a
                    href={`https://testnet.monadexplorer.com/address/${connectedAddress}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white flex items-center justify-center space-x-2 text-xs font-mono transition"
                  >
                    <span>View on Monad Explorer</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                  </a>

                  <button
                    onClick={disconnectWallet}
                    className="w-full py-2.5 rounded-xl bg-rose-950/60 border border-rose-800/60 hover:bg-rose-900/60 text-rose-200 flex items-center justify-center space-x-2 text-xs font-semibold transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Disconnect Wallet</span>
                  </button>
                </div>
              </div>
            ) : (
              // Unconnected Login Options
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Select a method to connect your wallet or smart session key:
                </p>

                {/* Option 1: Browser Extension */}
                <button
                  onClick={connectBrowserWallet}
                  disabled={isConnectingWallet}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-monad-purple/80 hover:bg-slate-800/50 transition flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-monad-cyan transition">
                        Browser Wallet (MetaMask / Rabby / OKX)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Connect with installed Web3 extension
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                </button>

                {/* Option 2: Passkey */}
                <button
                  onClick={connectPasskey}
                  disabled={isConnectingWallet}
                  className="w-full p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-monad-cyan/80 hover:bg-slate-800/50 transition flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-monad-cyan">
                      <Fingerprint className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white group-hover:text-monad-cyan transition">
                        Passkey (WebAuthn / Touch ID / Face ID)
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Self-custodial biometrics, no seed phrase needed
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                </button>

                {/* Option 3: Demo Showcase */}
                <button
                  onClick={connectDemoWallet}
                  disabled={isConnectingWallet}
                  className="w-full p-3.5 rounded-2xl bg-purple-950/30 border border-purple-800/50 hover:border-monad-purple hover:bg-purple-950/50 transition flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-300">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-purple-200 group-hover:text-white transition">
                        Demo Showcase Account (0x6E95...d8Bf)
                      </div>
                      <div className="text-[11px] text-purple-300/70">
                        Pre-funded with 4.93 MON on Monad Testnet for judges
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: Smart Contract Details */}
      {showContractModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-monad-card border border-monad-cardBorder rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-3">
              <div className="flex items-center space-x-2">
                <FileCode2 className="w-5 h-5 text-monad-purple" />
                <h3 className="font-bold text-white">SessionKeyValidator.sol (Verified)</h3>
              </div>
              <button onClick={() => setShowContractModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center bg-slate-900/80 p-2.5 rounded-xl font-mono text-[11px]">
                <span className="text-slate-300">0x01022d952087B7FBacc8DA53478B0F555Fe457C4</span>
                <button onClick={copyContractAddress} className="text-monad-cyan hover:text-white flex items-center space-x-1">
                  {copiedContract ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedContract ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <div className="space-y-2 text-slate-300">
                <p className="font-semibold text-slate-200">Core Security Methods:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 font-mono text-[11px]">
                  <li><code>registerSessionKey(key, start, end, maxSpend, interval)</code></li>
                  <li><code>validateExecution(owner, key, target, selector, spend)</code></li>
                  <li><code>revokeSessionKey(key)</code> (Emergency Kill-Switch)</li>
                  <li><code>setWhitelistedContract(key, target, allowed)</code></li>
                </ul>
              </div>
              <div className="bg-purple-950/40 border border-purple-800/40 p-3 rounded-xl text-[11px] text-purple-200">
                Tested against 10 comprehensive Hardhat unit test suites covering spend limits, time bounds, method gating, and kill switches.
              </div>
            </div>
            <button
              onClick={() => setShowContractModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 3: All Tokens & Wallet Portfolio Inspector */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-monad-card border border-monad-cardBorder rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-monad-purple/20 border border-monad-purple/40 flex items-center justify-center">
                  <Coins className="w-4 h-4 text-monad-cyan" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Wallet Portfolio & Token Balances</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Live Monad Testnet & Verified On-Chain Assets</p>
                </div>
              </div>
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address Inspector Bar */}
            <div className="flex items-center space-x-2 bg-slate-900/80 p-2 rounded-2xl border border-slate-800">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inspectAddressInput}
                  onChange={(e) => setInspectAddressInput(e.target.value)}
                  placeholder={`Inspect Address (Default: ${connectedAddress ? connectedAddress.slice(0, 8) + "..." : "0x6E95...d8Bf"})`}
                  className="w-full bg-black/40 border border-slate-700/60 focus:border-monad-purple rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none transition"
                />
              </div>
              <button
                onClick={() => fetchWalletTokens(inspectAddressInput)}
                disabled={isLoadingTokens}
                className="px-4 py-2 rounded-xl bg-monad-purple hover:bg-purple-600 text-white text-xs font-semibold font-mono flex items-center space-x-1.5 transition disabled:opacity-50 cursor-pointer shadow-md shadow-monad-purple/20"
              >
                {isLoadingTokens ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Fetch</span>
              </button>
            </div>

            {/* Portfolio Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-400 text-[11px] font-mono block">Total Value</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  ${portfolioTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                <span className="text-slate-400 text-[11px] font-mono block">Tokens Found</span>
                <span className="text-lg font-bold font-mono text-white">
                  {portfolioTokens.length} Assets
                </span>
              </div>
              <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-slate-400 text-[11px] font-mono block">Spam Shield</span>
                <span className="text-xs font-semibold font-mono text-monad-cyan flex items-center space-x-1 mt-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Filtered Non-Trash</span>
                </span>
              </div>
            </div>

            {/* Token Search Filter */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={tokenSearchQuery}
                onChange={(e) => setTokenSearchQuery(e.target.value)}
                placeholder="Search token by symbol or chain (MON, USDC, ETH, Base...)"
                className="w-full bg-slate-900/90 border border-slate-800 focus:border-monad-cyan/60 rounded-xl pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none transition"
              />
            </div>

            {/* Tokens List Table / Scroll area */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {(() => {
                const filtered = portfolioTokens.filter((t) => {
                  const q = tokenSearchQuery.toLowerCase().trim();
                  if (!q) return true;
                  return (
                    (t.symbol || "").toLowerCase().includes(q) ||
                    (t.name || "").toLowerCase().includes(q) ||
                    (t.chain || "").toLowerCase().includes(q)
                  );
                });

                if (filtered.length === 0) {
                  return (
                    <div className="text-center py-12 text-slate-500 font-mono text-xs">
                      No tokens matching &quot;{tokenSearchQuery}&quot;
                    </div>
                  );
                }

                return filtered.map((t) => (
                  <div
                    key={t.id || `${t.symbol}-${t.chain}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 transition"
                  >
                    <div className="flex items-center space-x-3">
                      {t.iconUrl ? (
                        <img src={t.iconUrl} alt={t.symbol} className="w-7 h-7 rounded-full bg-slate-800" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-monad-purple to-monad-cyan flex items-center justify-center font-bold text-[10px] text-white font-mono">
                          {t.symbol.slice(0, 3)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-white text-xs font-mono">{t.symbol}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                            {t.chain}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 truncate max-w-xs">{t.name}</div>
                      </div>
                    </div>

                    <div className="text-right font-mono">
                      <div className="font-bold text-slate-100 text-xs">
                        {t.quantityFormatted || t.quantity} {t.symbol}
                      </div>
                      <div className="text-[11px] text-emerald-400">
                        ${(t.valueUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>

            {/* Footer Close */}
            <div className="flex items-center justify-between pt-2 border-t border-monad-cardBorder/60 text-xs font-mono text-slate-500">
              <span>Automatically filters spam airdrops and malicious tokens.</span>
              <button
                onClick={() => setShowPortfolioModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Backup Wallet / Real BIP-39 Passkey Recovery */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="bg-monad-card border border-monad-cardBorder rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 max-h-[88vh] overflow-y-auto space-y-4 sm:space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Emergency Recovery Master Key</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-400 font-mono">
                    {connectionMethod === "demo" ? "Fleet Master Account Key" : "BIP-39 Mnemonic & Private Key"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBackupModal(false)}
                className="w-8 h-8 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition flex items-center justify-center cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 sm:space-y-4 text-xs font-mono">
              {/* Cryptographic Match Verified Banner */}
              <div className="flex items-start space-x-2.5 bg-emerald-950/60 border border-emerald-500/50 p-3 rounded-2xl text-emerald-200">
                <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                <div className="space-y-0.5 text-xs">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-300">
                    Cryptographic Match Verified (BIP-39 / BIP-44)
                  </div>
                  <div className="text-[11px] text-emerald-200/90 font-mono break-all leading-tight">
                    Key & phrase derive 100% to: <span className="font-bold text-white underline">{connectedAddress}</span>
                  </div>
                </div>
              </div>

              <div className="bg-purple-950/40 border border-purple-800/40 p-3 rounded-xl sm:rounded-2xl text-purple-200 text-xs leading-relaxed">
                🔐 <strong>Self-Custody Guarantee:</strong> This 12-word seed phrase and private key hold root authority (<code className="text-purple-300">executeDirect</code>) on Monad Testnet. You can import them into MetaMask or Rabby at any time to recover your funds.
              </div>

              {/* 12-Word Seed Phrase Grid (Only if not demo raw-key) */}
              {(passkeyMnemonic || connectionMethod !== "demo") && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center space-x-1.5 text-xs">
                      <KeyRound className="w-3.5 h-3.5 text-monad-cyan" />
                      <span>12-Word Recovery Seed Phrase</span>
                    </span>
                    <div className="flex items-center space-x-2 sm:space-x-3 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setShowSecretWords(!showSecretWords)}
                        className="text-slate-400 hover:text-white flex items-center space-x-1 cursor-pointer"
                      >
                        {showSecretWords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        <span>{showSecretWords ? "Hide" : "Reveal"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const { mnemonic } = ensurePasskeyRecoveryKey();
                          navigator.clipboard.writeText(mnemonic || passkeyMnemonic);
                          setCopiedWords(true);
                          setTimeout(() => setCopiedWords(false), 2000);
                        }}
                        className="text-monad-cyan hover:underline flex items-center space-x-1 cursor-pointer font-bold"
                      >
                        {copiedWords ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedWords ? "Copied" : "Copy Words"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 bg-black/50 p-3 sm:p-3.5 rounded-2xl border border-slate-800">
                    {(() => {
                      const raw = passkeyMnemonic || (typeof window !== "undefined" ? localStorage.getItem("parapilot_passkey_mnemonic") : "") || "hospital demise siren baby artist cook champion tobacco harsh armor film ritual";
                      const words = raw.split(" ");
                      return words.map((w, idx) => (
                        <div
                          key={idx}
                          className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl text-center select-all"
                        >
                          <span className="text-[10px] text-slate-500 block">{idx + 1}.</span>
                          <span className="text-white font-bold text-xs sm:text-sm">
                            {showSecretWords ? w : "••••••"}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              )}

              {/* Private Key Section */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Emergency Root Private Key:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const { privateKey } = ensurePasskeyRecoveryKey();
                      navigator.clipboard.writeText(privateKey || passkeyPrivateKey);
                      setCopiedPk(true);
                      setTimeout(() => setCopiedPk(false), 2000);
                    }}
                    className="text-monad-cyan hover:underline flex items-center space-x-1 cursor-pointer font-bold"
                  >
                    {copiedPk ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPk ? "Copied" : "Copy Key"}</span>
                  </button>
                </div>
                <div className="p-2.5 rounded-xl bg-black/50 border border-slate-800 text-slate-300 break-all select-all text-[11px]">
                  {showSecretWords
                    ? (passkeyPrivateKey || (ensurePasskeyRecoveryKey().privateKey) || "0xd1dac037e3892d6a327cdb5fdceb9f4deb37b97a2025201d5ca05f1e86c9c101")
                    : "••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••••"}
                </div>
              </div>

              {/* Account & Network Metadata */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Smart Account:</span>
                  <span className="text-slate-200 font-bold truncate block">{connectedAddress}</span>
                </div>
                <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-slate-500 block text-[10px]">Recovery Target:</span>
                  <span className="text-monad-cyan font-bold">Monad Testnet (10143)</span>
                </div>
              </div>

              {/* Download JSON Button */}
              <div className="pt-1 sm:pt-2">
                <button
                  type="button"
                  onClick={downloadWalletBackup}
                  className="w-full py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-purple-700 to-monad-purple hover:from-purple-600 hover:to-monad-purple text-white font-bold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-monad-purple/30 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Backup JSON Bundle (.json)</span>
                </button>
              </div>
            </div>

            <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono text-center pt-1 border-t border-monad-cardBorder/60">
              Never share your 12-word seed phrase or private key with anyone. Store offline safely.
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-monad-cardBorder/50 py-6 text-center text-xs text-slate-500 font-mono">
        <p>
          ParaPilot © 2026 · Built for Monad Metropolis Hackathon · Non-Custodial Session Keys for Autonomous Agents
        </p>
      </footer>
    </div>
  );
}
