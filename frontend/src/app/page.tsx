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
} from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  source: "ZERION" | "BRAIN" | "VALIDATOR" | "MONAD_EVM" | "KILL_SWITCH";
  type: "info" | "success" | "warning" | "error";
  message: string;
}

export default function Home() {
  // State
  const [dailyLimit, setDailyLimit] = useState(50);
  const [spentToday, setSpentToday] = useState(14.2);
  const [isSessionActive, setIsSessionActive] = useState(true);
  const [allowedTokens, setAllowedTokens] = useState({
    MON: true,
    USDC: true,
    WETH: true,
    KURU: true,
  });
  const [whitelistedContracts, setWhitelistedContracts] = useState({
    "Kuru DEX Orderbook": true,
    "MonadSwap Router": true,
  });

  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: "1",
      timestamp: "12:04:11",
      source: "ZERION",
      type: "info",
      message: "Fetched 53 non-trash token positions for 0xb1ca...2c41 via Zerion Builder API.",
    },
    {
      id: "2",
      timestamp: "12:04:12",
      source: "BRAIN",
      type: "info",
      message: "Qwen 3.8 Max: Target allocation balanced. Monitoring spread on Kuru DEX.",
    },
    {
      id: "3",
      timestamp: "12:04:13",
      source: "VALIDATOR",
      type: "success",
      message: "SessionKeyValidator: Session 0x7179...88f6 is ACTIVE. Quota: $35.80 remaining.",
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

  // Simulates a legitimate AI trade
  const simulateValidTrade = () => {
    if (!isSessionActive) {
      addLog("VALIDATOR", "error", "Execution REVERTED: Session key has been REVOKED by owner.");
      return;
    }
    addLog("BRAIN", "info", "Identified 0.5% arb spread on Kuru DEX: Swap 5 MON -> 18.25 USDC.");
    addLog("ZERION", "info", "Zerion API verifies pool liquidity and non-spam token contract.");
    addLog("VALIDATOR", "success", "Policy Check Passed: Kuru DEX is Whitelisted, Spend ($8.50) < Limit.");
    setTimeout(() => {
      addLog("MONAD_EVM", "success", "Tx Confirmed on Monad Parallel EVM (Block #51550930, Latency: 0.38s). Hash: 0x9f1a...c7e2");
      setSpentToday((prev) => Math.min(dailyLimit, +(prev + 8.5).toFixed(2)));
    }, 400);
  };

  // Simulates an exploit or rogue behavior
  const simulateRogueAttack = () => {
    if (!isSessionActive) {
      addLog("VALIDATOR", "error", "Execution REVERTED: Session key is inactive.");
      return;
    }
    addLog("BRAIN", "warning", "⚠️ Rogue trigger: AI attempting unauthorized $180 drain to untrusted router 0xBadF...0001.");
    setTimeout(() => {
      addLog("VALIDATOR", "error", "🛑 REVERTED: ContractNotWhitelisted() & SpendLimitExceeded($180 > $50).");
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
      addLog("KILL_SWITCH", "success", "Session key re-authorized and armed with fresh policy.");
    }
  };

  return (
    <div className="min-h-screen bg-monad-bg text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-monad-cardBorder/60 bg-monad-card/50 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
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
                <span className="text-xs px-2 py-0.5 rounded-full bg-monad-purple/20 text-monad-purple border border-monad-purple/40 font-mono font-semibold">
                  STUDIO
                </span>
              </div>
              <p className="text-xs text-slate-400">Autonomous Agent Policy Engine on Monad</p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Monad Network Pill */}
            <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-purple-950/40 border border-purple-800/40 text-xs">
              <div className="w-2 h-2 rounded-full bg-monad-cyan animate-pulse"></div>
              <span className="text-slate-300 font-medium">Monad Devnet (10,143)</span>
              <span className="text-monad-cyan font-mono font-bold">10k TPS</span>
            </div>

            {/* Passkey Wallet Connect */}
            <button className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-monad-card border border-monad-cardBorder hover:border-monad-purple transition shadow-sm text-sm">
              <Key className="w-4 h-4 text-monad-purple" />
              <span className="font-mono text-xs">0xb1ca...2c41</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.5 rounded">Passkey</span>
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
            <div className="text-2xl font-bold font-mono">
              {isSessionActive ? (
                <span className="text-emerald-400 flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping mr-2"></span>
                  ARMED & ACTIVE
                </span>
              ) : (
                <span className="text-rose-500">REVOKED</span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-2 font-mono">Key: 0x7179...88f6</p>
          </div>

          <div className="bg-monad-card border border-monad-cardBorder rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>24h Spending Quota</span>
              <Coins className="w-4 h-4 text-monad-purple" />
            </div>
            <div className="text-2xl font-bold font-mono">
              ${spentToday.toFixed(2)} <span className="text-sm font-normal text-slate-400">/ ${dailyLimit}</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-monad-purple to-monad-cyan transition-all duration-300"
                style={{ width: `${Math.min(100, (spentToday / dailyLimit) * 100)}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-monad-card border border-monad-cardBorder rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Smart Contract Validator</span>
              <Lock className="w-4 h-4 text-monad-cyan" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-200">
              SessionKeyValidator
            </div>
            <p className="text-xs text-monad-cyan/80 mt-2 font-mono truncate">
              0x5FbDB2315678...aa3
            </p>
          </div>

          <div className="bg-monad-card border border-monad-cardBorder rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
              <span>Intelligence Layer</span>
              <Cpu className="w-4 h-4 text-monad-neon" />
            </div>
            <div className="text-lg font-bold font-mono text-slate-200">
              Zerion + Qwen 3.8
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Live non-trash filter & strategy loop
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
                <span className="text-xs text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-lg font-mono">
                  Owner Rulebook
                </span>
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
                  onChange={(e) => setDailyLimit(Number(e.target.value))}
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
                      onClick={() =>
                        setAllowedTokens((prev) => ({
                          ...prev,
                          [token as keyof typeof allowedTokens]: !isChecked,
                        }))
                      }
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
                  {Object.entries(whitelistedContracts).map(([name, isChecked]) => (
                    <div
                      key={name}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                    >
                      <div className="flex items-center space-x-2">
                        <ArrowRightLeft className="w-3.5 h-3.5 text-monad-purple" />
                        <span className="font-medium text-slate-200">{name}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/50 text-[10px] font-mono">
                        Whitelisted
                      </span>
                    </div>
                  ))}
                </div>
              </div>

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
                <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
                  <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                  <span>Streaming Monad RPC</span>
                </div>
              </div>

              {/* Terminal View */}
              <div className="bg-[#0A0812] border border-monad-cardBorder/80 rounded-2xl p-4 font-mono text-xs h-96 overflow-y-auto space-y-2.5 shadow-inner">
                {logs.map((l) => (
                  <div key={l.id} className="flex items-start space-x-2 leading-relaxed">
                    <span className="text-slate-600 select-none">[{l.timestamp}]</span>
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
                ))}
                <div ref={terminalEndRef} />
              </div>

              {/* Interactive Demo Action Triggers */}
              <div className="pt-2">
                <p className="text-xs text-slate-400 mb-3 font-medium">
                  Test Agent Interactions Live (For Hackathon Judges):
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    onClick={simulateValidTrade}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 to-monad-purple hover:from-purple-600 hover:to-monad-purple text-white text-xs font-semibold shadow-md shadow-monad-purple/20 transition"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Trigger Legitimate Trade (Within Quota)</span>
                  </button>

                  <button
                    onClick={simulateRogueAttack}
                    className="flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-slate-900 border border-rose-800/60 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold transition"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Simulate Rogue Drain Attack (Revert)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-monad-cardBorder/50 py-6 text-center text-xs text-slate-500 font-mono">
        <p>
          ParaPilot © 2026 · Built for Monad Metropolis Hackathon · Non-Custodial Session Keys for Autonomous Agents
        </p>
      </footer>
    </div>
  );
}
