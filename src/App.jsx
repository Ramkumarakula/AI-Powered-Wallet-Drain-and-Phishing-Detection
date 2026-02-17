import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeTransaction } from './intelligence/securityEngine'
import { DEMO_PAYLOADS } from './utils/testCases'
import { 
  ShieldAlert, ShieldCheck, Search, Activity, 
  Terminal, Shield, Lock as Padlock, Wallet, 
  AlertTriangle, X, ChevronRight, Cpu, LogOut
} from 'lucide-react'
import './App.css'

function App() {
  const [contractAddress, setContractAddress] = useState('')
  const [txData, setTxData] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState(null)
  const [showWarning, setShowWarning] = useState(false)
  const [logs, setLogs] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  // Master Key to bypass the interceptor when the user explicitly clicks "Bypass"
  const bypassRef = useRef(false);

  const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`])

  // --- PROVIDER PROXY INTERCEPTOR ---
  useEffect(() => {
    if (window.ethereum) {
      const originalRequest = window.ethereum.request;

      window.ethereum.request = async (args) => {
        // If it's a transaction and we ARE NOT in bypass mode, intercept it
        if (args.method === 'eth_sendTransaction' && !bypassRef.current) {
          const txParams = args.params[0];
          
          addLog("SYSTEM HOOK: Inbound transaction intercepted!");
          
          // Auto-fill UI
          setContractAddress(txParams.to);
          setTxData(txParams.data || "0x");

          // Trigger AI Audit
          handleSecurityAudit();

          return new Promise((_, reject) => {
            addLog("FIREWALL: Intercepted. Scan in progress.");
            reject({ code: 4001, message: "GuardianAI: Transaction blocked for analysis." });
          });
        }
        
        // Let the request pass through if it's not a transaction or if we are bypassing
        return originalRequest.apply(window.ethereum, [args]);
      };
    }
  }, [account]); // Re-hook if account changes

  const connectWallet = async () => {
    if (!window.ethereum) {
      addLog("Security: No Ethereum provider detected.");
      return;
    }
    try {
      addLog("Requesting wallet authorization...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      addLog(`Session Started: ${accounts[0].substring(0, 10)}...`);
    } catch (err) {
      addLog("Security: Connection rejected.");
    }
  }

  const handleSecurityAudit = async () => {
    if (!contractAddress || !txData) {
        addLog("Error: Missing address or calldata.");
        return;
    }

    setLoading(true);
    setResult(null);
    setLogs([]);
    addLog("Initializing GuardianAI Engine...");
    
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        addLog("Fetching On-Chain Evidence (Sepolia)...");
        
        // Pass account for user-specific simulation
        const report = await analyzeTransaction(txData, contractAddress, provider, account);
        
        setResult(report);
        addLog(`Scan Complete. Verdict: ${report.verdict}`);
        
        if (!report.isSafe) {
          addLog("FIREWALL TRIGGERED: High-risk pattern.");
          setTimeout(() => setShowWarning(true), 500);
        } else {
          addLog("Integrity Check Passed. Proceed with caution.");
        }
    } catch (error) {
        addLog("Audit Error: Check connection.");
        console.error(error);
    } finally {
        setLoading(false);
    }
  }

  const signOnSepolia = async () => {
    if (!window.ethereum || !account) return;
    
    // Enable Master Key
    bypassRef.current = true;
    
    try {
      addLog("FIREWALL BYPASS: Transmitting to Sepolia...");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const tx = await signer.sendTransaction({
        to: contractAddress,
        data: txData,
        value: 0n 
      });
      
      addLog(`Success! Hash: ${tx.hash.substring(0, 15)}...`);
      setShowWarning(false);
    } catch (err) {
      addLog("Transaction Interrupted: Signer rejected.");
    } finally {
      // Disable Master Key to reactivate firewall
      bypassRef.current = false;
    }
  }

  const disconnectWallet = () => { setAccount(null); setResult(null); setLogs([]); setIsDropdownOpen(false); addLog("Session Terminated."); };
  
  const loadDemo = (payload) => { 
    addLog(`SIGNAL DETECTED: Inbound request for ${payload.name}`);
    setContractAddress(payload.target); 
    setTxData(payload.hex); 
    setResult(null); 
    setLogs([]); 
    setTimeout(() => handleSecurityAudit(), 800);
  }

  return (
    <div className="cyber-hub-container">
      {/* 1. SECURITY MODAL */}
      <AnimatePresence>
        {showWarning && (
          <motion.div className="security-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card dangerous warning-modal" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <AlertTriangle size={64} className="vibrating-icon" />
              <h2>THREAT INTERCEPTED</h2>
              <div className="warning-details-box">
                {result.detections.map((d, i) => <p key={i}>⚠️ {d}</p>)}
              </div>
              <div className="modal-actions">
                <button className="abort-btn" onClick={() => setShowWarning(false)}>ABORT SESSION</button>
                <button className="bypass-btn" onClick={signOnSepolia}>BYPASS & SIGN</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. HEADER */}
      <header className="glass-header">
        <div className="logo-group">
          <ShieldAlert size={32} color="#0070f3" className="floating" />
          <h1>GuardianWallet <span className="ai-badge">AI</span></h1>
        </div>
        <div className="profile-section">
          {account ? (
            <div className="profile-wrapper">
              <button className="profile-trigger" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <span className="account-tag">{account.substring(0, 6)}...</span>
                <LogOut size={16} onClick={disconnectWallet} />
              </button>
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-btn">CONNECT SYSTEM</button>
          )}
        </div>
      </header>

      {/* 3. MAIN LAYOUT */}
      <main className="scanner-layout">
        <section className="left-panel">
          <div className="glass-card">
            <h3><Activity size={20} color="#0070f3" /> Live Interceptor</h3>
            <div className="demo-grid">
              {DEMO_PAYLOADS.map((item) => (
                <button key={item.id} onClick={() => loadDemo(item)} className="demo-btn">
                  <div style={{ textAlign: 'left' }}>
                    <span style={{ display: 'block', fontWeight: 'bold' }}>{item.name}</span>
                    <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>Action: External Trigger</span>
                  </div>
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card terminal-card">
            <div className="terminal-screen">
              {logs.length === 0 && <p className="faint-text">System Idle...</p>}
              {logs.map((log, i) => (
                <p key={i} className="terminal-line">{log}</p>
              ))}
            </div>
          </div>
        </section>

        <section className="right-panel">
          <div className="glass-card">
            <h3><Search size={20} /> Inspection Hub</h3>
            <div className="input-group">
              <input type="text" placeholder="Recipient Address" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
              <textarea placeholder="Data Payload (Hex)" value={txData} rows={4} onChange={(e) => setTxData(e.target.value)} />
              <button onClick={handleSecurityAudit} disabled={loading} className="scan-btn">
                {loading ? "ANALYZING..." : "START SECURITY AUDIT"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div className={`result-card glass-card ${result.verdict.toLowerCase()}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="result-header">
                  {result.isSafe ? <ShieldCheck size={40} color="#00ff88" /> : <ShieldAlert size={40} color="#ff0055" />}
                  <div><h2>VERDICT: {result.verdict}</h2><p>AI Risk Score: {result.riskScore}%</p></div>
                </div>

                <div className="translation-box">
                  <span className="label">AI Translation:</span>
                  <p>{result.translation}</p>
                </div>

                {/* SIMULATION LAYER */}
                <div className="simulation-container">
                    <div className="sim-pill before"><span>BEFORE</span><p>{result.simulation.current.toFixed(4)} ETH</p></div>
                    <ChevronRight size={16} />
                    <div className={`sim-pill after ${result.isSafe ? 'safe' : 'danger'}`}>
                        <span>AFTER</span><p>{result.simulation.after.toFixed(4)} ETH</p>
                    </div>
                </div>

                <div className="forensic-grid">
                  <div className="evidence-item"><span className="label">Age</span><span className="value">{result.features.contractAge} Blk</span></div>
                  <div className="evidence-item"><span className="label">Liquidity</span><span className="value">{result.features.ethBalance.toFixed(2)} ETH</span></div>
                  <div className="evidence-item"><span className="label">Type</span><span className="value">{result.features.isContract ? "Cont" : "Wall"}</span></div>
                </div>

                <ul className="detections-list">
                  {result.detections.map((note, i) => <li key={i}>• {note}</li>)}
                </ul>
                {result.isSafe && (
                  <button className="final-sign-btn" onClick={signOnSepolia}>EXECUTE ON SEPOLIA</button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </main>

      <footer className="status-bar">
        <div className="status-item"><div className="pulse-dot"></div><span>ENGINE: ACTIVE</span></div>
        <div className="status-item"><Padlock size={14} /> <span>CHAIN: SEPOLIA</span></div>
      </footer>
    </div>
  )
}

export default App;