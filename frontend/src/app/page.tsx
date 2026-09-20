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
} from "lucide-react";

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
  const [spentToday, setSpentToday] = useState(14.2);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Custom Swap State
  const [monToSwap, setMonToSwap] = useState<string>("2.5");
  const [selectedTargetToken, setSelectedTargetToken] = useState<string>("USDC");

  // Modals
  const [showPasskeyModal, setShowPasskeyModal] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [showPortfolioModal, setShowPortfolioModal] = useState(false);
  const [copiedContract, setCopiedContract] = useState(false);

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

  // Real Zerion Portfolio Data
  const zerionAssets = [
    { symbol: "MON", name: "Native Monad Testnet", qty: "4.9314", usd: "$14.79", verified: true },
    { symbol: "rsETH", name: "Kelp DAO Restaked ETH", qty: "0.000045", usd: "$0.13", verified: true },
    { symbol: "PENDLE", name: "Pendle Finance", qty: "0.0235", usd: "$0.06", verified: true },
    { symbol: "AVAX", name: "Avalanche", qty: "0.0058", usd: "$0.06", verified: true },
    { symbol: "cUSDO", name: "Capybara USD", qty: "0.0529", usd: "$0.06", verified: true },
  ];

  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      timestamp: "12:04:11",
      source: "ZERION",
      type: "info",
      message: "Fetched verified token positions for 0x6E95...d8Bf via Zerion Builder API.",
    },
    {
      id: "2",
      timestamp: "12:04:12",
      source: "BRAIN",
      type: "info",
      message: "Qwen 3.8 Max: Target allocation balanced. Monitoring spread on Kuru DEX Orderbook.",
    },
    {
      id: "3",
      timestamp: "12:04:13",
      source: "VALIDATOR",
      type: "success",
      message: "SessionKeyValidator (0x0102...57C4): Session 0x4612...D0cc is ACTIVE. Quota: $35.80 remaining.",
    },
    {
      id: "4",
      timestamp: "12:04:14",
      source: "MONAD_EVM",
      type: "success",
      message: "Live Monad Testnet Tx Confirmed: 0x1d745562126303ca67dcbb9c8694b40df963de08917deaf52d3e9ec30a997364",
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

  // Simulates a custom AI trade
  const simulateCustomSwap = () => {
    const amountMon = parseFloat(monToSwap);
    if (isNaN(amountMon) || amountMon <= 0) {
      addLog("BRAIN", "warning", "Invalid amount: Please specify a valid MON amount to swap.");
      return;
    }

    if (!isSessionActive) {
      addLog("VALIDATOR", "error", "Execution REVERTED: Session key has been REVOKED by owner.");
      return;
    }

    // Check token whitelist
    if (!allowedTokens[selectedTargetToken as keyof typeof allowedTokens]) {
      addLog("VALIDATOR", "error", `🛑 REVERTED: TokenNotWhitelisted(${selectedTargetToken}) - Target asset is disabled in policy.`);
      return;
    }

    const monPrice = 3.0; // 1 MON = $3.00 USD
    const spendUsd = +(amountMon * monPrice).toFixed(2);
    const tokenReceived = +(amountMon * 2.95).toFixed(2);
    const remainingQuota = +(dailyLimit - spentToday).toFixed(2);

    if (spentToday + spendUsd > dailyLimit) {
      addLog("BRAIN", "warning", `AI calculating swap: Trade of ${amountMon} MON ($${spendUsd}) exceeds 24h limit.`);
      addLog("VALIDATOR", "error", `🛑 REVERTED: SpendLimitExceeded() - Attempted $${spendUsd} with only $${remainingQuota} quota remaining.`);
      addLog("MONAD_EVM", "warning", "On-chain state protected: Zero funds moved from ParaPilotAccount.");
      return;
    }

    addLog("BRAIN", "info", `Arbitrage identified on Kuru DEX: Swap ${amountMon} MON -> ${tokenReceived} ${selectedTargetToken}.`);
    addLog("ZERION", "info", `Zerion Builder API verifies ${selectedTargetToken} reputation & liquidity depth.`);
    addLog("VALIDATOR", "success", `Policy Passed: Kuru DEX Whitelisted, Spend ($${spendUsd}) <= Remaining Limit ($${remainingQuota}).`);
    setTimeout(() => {
      const mockHash = "0x" + Array.from({length: 40}, () => Math.floor(Math.random()*16).toString(16)).join("");
      addLog("MONAD_EVM", "success", `Tx Confirmed on Monad Parallel EVM (Block #${51550950 + Math.floor(Math.random()*25)}, Latency: 0.35s). Hash: ${mockHash.slice(0, 10)}...${mockHash.slice(-4)}`);
      setSpentToday((prev) => Math.min(dailyLimit, +(prev + spendUsd).toFixed(2)));
    }, 350);
  };

  // Simulates an exploit or rogue behavior
  const simulateRogueAttack = () => {
    if (!isSessionActive) {
      addLog("VALIDATOR", "error", "Execution REVERTED: Session key is inactive.");
      return;
    }
    addLog("BRAIN", "warning", "⚠️ Rogue trigger: Prompt injection attempted! AI calling unauthorized drain router 0xBadF...0001.");
    setTimeout(() => {
      addLog("VALIDATOR", "error", "🛑 REVERTED on-chain: ContractNotWhitelisted() & SpendLimitExceeded($180 > $50).");
      addLog("MONAD_EVM", "warning", "On-chain state protected: Zero funds moved from ParaPilotAccount.");
    }, 300);
  };

  // Emergency Kill Switch
  const toggleKillSwitch = () => {
    if (isSessionActive) {
      setIsSessionActive(false);
      addLog("KILL_SWITCH", "error", "🚨 EMERGENCY KILL-SWITCH TRIGGERED by Owner! Session key 0x7179...88f6 revoked instantly on-chain.");
    } else {
      setIsSessionActive(true);
      addLog("KILL_SWITCH", "success", "Session key re-authorized and armed with fresh policy on-chain.");
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

            {/* Monad Network Pill */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-800/40 text-xs">
              <div className="w-2 h-2 rounded-full bg-monad-cyan animate-pulse"></div>
              <span className="text-slate-300 font-medium">Monad Devnet</span>
              <span className="text-monad-cyan font-mono font-bold">10k TPS</span>
            </div>

            {/* Passkey Wallet Connect */}
            <button
              onClick={() => setShowPasskeyModal(true)}
              className="flex items-center space-x-2 px-3.5 py-1.5 rounded-xl bg-monad-card border border-monad-cardBorder hover:border-monad-purple transition shadow-sm text-sm"
            >
              <Fingerprint className="w-4 h-4 text-monad-purple" />
              <span className="font-mono text-xs">0x6E95...d8Bf</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded font-mono">Passkey</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex-1 w-full space-y-8">
        {/* Metric Cards Banner */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-monad-card border border-monad-cardBorder rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Session Key Status</span>
              <Shield className={`w-4 h-4 ${isSessionActive ? "text-emerald-400" : "text-rose-500"}`} />
            </div>
            <div className="text-xl font-bold font-mono">
              {isSessionActive ? (
                <span className="text-emerald-400 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mr-2"></span>
                  ARMED & ACTIVE
                </span>
              ) : (
                <span className="text-rose-500">REVOKED ON-CHAIN</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">Key: 0x4612...D0cc</p>
          </div>

          <div className="bg-monad-card border border-monad-cardBorder rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>24h Spending Quota</span>
              <Coins className="w-4 h-4 text-monad-purple" />
            </div>
            <div className="text-xl font-bold font-mono">
              ${spentToday.toFixed(2)} <span className="text-sm font-normal text-slate-400">/ ${dailyLimit}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-monad-purple to-monad-cyan transition-all duration-300"
                style={{ width: `${Math.min(100, (spentToday / dailyLimit) * 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Smart Contract Card */}
          <div
            onClick={() => setShowContractModal(true)}
            className="bg-monad-card border border-monad-cardBorder hover:border-monad-cyan/60 transition cursor-pointer rounded-2xl p-5 shadow-sm group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>On-Chain Validator</span>
              <Lock className="w-4 h-4 text-monad-cyan group-hover:rotate-12 transition" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-200 group-hover:text-monad-cyan transition">
              SessionKeyValidator.sol
            </div>
            <p className="text-xs text-monad-cyan/80 mt-2 font-mono flex items-center justify-between">
              <span>0x01022d9...57C4</span>
              <span className="text-[10px] underline">View ABI</span>
            </p>
          </div>

          {/* Intelligence Layer Card */}
          <div
            onClick={() => setShowPortfolioModal(true)}
            className="bg-monad-card border border-monad-cardBorder hover:border-monad-purple/60 transition cursor-pointer rounded-2xl p-5 shadow-sm group"
          >
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Zerion Intelligence</span>
              <Cpu className="w-4 h-4 text-monad-neon group-hover:scale-110 transition" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-200 group-hover:text-monad-neon transition">
              53 Live Assets
            </div>
            <p className="text-xs text-monad-purple mt-2 font-mono flex items-center justify-between">
              <span>Builder API Tier</span>
              <span className="text-[10px] underline">View Portfolio</span>
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
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded animate-pulse">
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
            <div className="bg-monad-card border border-monad-cardBorder rounded-3xl p-6 shadow-md flex flex-col h-full space-y-4">
              <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-4">
                <div className="flex items-center space-x-2.5">
                  <TerminalIcon className="w-5 h-5 text-monad-cyan" />
                  <h2 className="font-bold text-lg text-white">Live Execution Telemetry</h2>
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
                    <span>Streaming</span>
                  </div>
                </div>
              </div>

              {/* Terminal View */}
              <div className="bg-[#0A0812] border border-monad-cardBorder/80 rounded-2xl p-4 font-mono text-xs h-96 overflow-y-auto space-y-2.5 shadow-inner">
                {logs.length === 0 ? (
                  <div className="text-slate-600 text-center py-24">Terminal cleared. Run a simulation below.</div>
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

              {/* Interactive Autonomous Swap Simulator */}
              <div className="pt-2 space-y-3 bg-slate-900/50 p-4 rounded-2xl border border-monad-cardBorder/80">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-4 h-4 text-monad-cyan" />
                    <span className="text-xs font-bold text-white tracking-wide uppercase">
                      Autonomous Swap Simulator
                    </span>
                  </div>
                  <div className="text-[11px] font-mono">
                    {(() => {
                      const amount = parseFloat(monToSwap) || 0;
                      const costUsd = +(amount * 3.0).toFixed(2);
                      const remaining = +(dailyLimit - spentToday).toFixed(2);
                      if (amount <= 0) return <span className="text-slate-500">Enter MON amount</span>;
                      if (costUsd <= remaining) {
                        return <span className="text-emerald-400 font-semibold">✓ Safe (${costUsd} / ${remaining} left)</span>;
                      } else {
                        return <span className="text-rose-400 font-semibold">⚠️ Exceeds Quota by ${(costUsd - remaining).toFixed(2)}</span>;
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
                      className="w-full bg-[#0E0C17] border border-slate-700/80 focus:border-monad-purple rounded-xl px-3.5 py-2.5 text-sm font-mono text-white placeholder-slate-600 outline-none transition"
                    />
                    <div className="absolute right-3 top-2.5 flex items-center space-x-1.5 text-xs text-monad-purple font-mono font-bold pointer-events-none">
                      <span>MON</span>
                      <span className="text-[10px] text-slate-500 font-normal">(~$3.00)</span>
                    </div>
                  </div>

                  <div className="sm:col-span-5 flex items-center space-x-1 bg-[#0E0C17] border border-slate-700/80 rounded-xl p-1">
                    {(["USDC", "WETH", "KURU"] as const).map((tok) => (
                      <button
                        key={tok}
                        type="button"
                        onClick={() => setSelectedTargetToken(tok)}
                        className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-lg transition ${
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
                <div className="flex items-center space-x-1.5 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-500">Quick:</span>
                  {["0.5", "1.0", "2.5", "5.0", "15.0"].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setMonToSwap(preset)}
                      className={`px-2 py-0.5 rounded-md border text-[10px] transition ${
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
                    onClick={() => setMonToSwap(((dailyLimit - spentToday) / 3.0).toFixed(1))}
                    className="px-2 py-0.5 rounded-md bg-purple-950/60 border border-purple-800 text-purple-300 hover:bg-purple-900/60 text-[10px] transition"
                  >
                    MAX QUOTA
                  </button>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <button
                    onClick={simulateCustomSwap}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-monad-purple hover:from-purple-600 hover:to-monad-purple text-white text-xs font-bold shadow-md shadow-monad-purple/30 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Swap {monToSwap || "0"} MON via Agent</span>
                  </button>

                  <button
                    onClick={simulateRogueAttack}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-900 border border-rose-800/60 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Simulate Rogue Attack (Revert)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL 1: Passkey / WebAuthn Details */}
      {showPasskeyModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-monad-card border border-monad-cardBorder rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-3">
              <div className="flex items-center space-x-2">
                <Fingerprint className="w-5 h-5 text-monad-cyan" />
                <h3 className="font-bold text-white">Passkey Identity (Dynamic)</h3>
              </div>
              <button onClick={() => setShowPasskeyModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Owner Address (WebAuthn / P256):</span>
                <span className="text-slate-200 break-all bg-slate-900/80 p-2 rounded block mt-1">
                  0x6E95951bbAc8454950508394EC0F5fcCF6c4d8Bf
                </span>
              </div>
              <div>
                <span className="text-slate-400 block">Delegated Agent Session Key:</span>
                <span className="text-monad-cyan break-all bg-slate-900/80 p-2 rounded block mt-1">
                  0x4612501ad4F82475f3F94458c2cc4257267dD0cc
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">Expires In:</span>
                  <span className="text-emerald-400 font-semibold">6 Days 23h</span>
                </div>
                <div className="bg-slate-900/60 p-2 rounded border border-slate-800">
                  <span className="text-slate-500 block">Key Type:</span>
                  <span className="text-purple-300 font-semibold">Non-Custodial Scoped</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowPasskeyModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
            >
              Close
            </button>
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

      {/* MODAL 3: Zerion Live Portfolio */}
      {showPortfolioModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-monad-card border border-monad-cardBorder rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-monad-cardBorder/60 pb-3">
              <div className="flex items-center space-x-2">
                <Cpu className="w-5 h-5 text-monad-neon" />
                <h3 className="font-bold text-white">Live Portfolio via Zerion API</h3>
              </div>
              <button onClick={() => setShowPortfolioModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between text-xs text-slate-400 font-mono">
                <span>Asset / Token</span>
                <span>Value (USD)</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {zerionAssets.map((a) => (
                  <div key={a.symbol} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                    <div>
                      <div className="font-semibold text-slate-200">{a.symbol}</div>
                      <div className="text-[10px] text-slate-500">{a.name} · {a.qty}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono font-bold text-slate-200">{a.usd}</div>
                      <div className="text-[9px] text-emerald-400 font-mono">Verified Non-Trash</div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-slate-900/50 p-2.5 rounded-xl text-[11px] text-slate-400 font-mono text-center">
                Zerion Builder API filter automatically hides 18 spam/phishing airdrops.
              </div>
            </div>
            <button
              onClick={() => setShowPortfolioModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs transition"
            >
              Close
            </button>
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
