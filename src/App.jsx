import { useState, useEffect } from 'react'
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

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

function App() {
  const [contractAddress, setContractAddress] = useState('')
  const [txData, setTxData] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState(null)
  const [showWarning, setShowWarning] = useState(false)
  const [logs, setLogs] = useState([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`])

  // --- NEW: PROVIDER PROXY HOOK ---
  useEffect(() => {
    if (window.ethereum) {
      const originalRequest = window.ethereum.request;

      // Overwrite the request method to simulate an interceptor
      window.ethereum.request = async (args) => {
        if (args.method === 'eth_sendTransaction') {
          const txParams = args.params[0];
          
          addLog("SYSTEM HOOK: Inbound transaction intercepted!");
          
          // 1. Auto-fill the UI with the intercepted data
          setContractAddress(txParams.to);
          setTxData(txParams.data || "0x");

          // 2. Trigger the AI Audit
          handleSecurityAudit();

          // 3. Block the request from reaching MetaMask for now
          return new Promise((resolve, reject) => {
            addLog("FIREWALL: Request paused. Awaiting AI Clearance...");
            reject({ code: 4001, message: "GuardianAI: Transaction blocked for analysis." });
          });
        }
        return originalRequest.apply(window.ethereum, [args]);
      };
    }
  }, []);

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
        addLog("Error: Destination address and Calldata are required.");
        return;
    }

    if (!window.ethereum) {
        addLog("Error: Connect wallet to fetch live data.");
        return;
    }

    setLoading(true);
    setResult(null);
    setLogs([]);
    
    addLog("Initializing GuardianAI Forensic Engine...");
    
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        addLog("Fetching On-Chain Evidence (Sepolia)...");
        
        const report = await analyzeTransaction(txData, contractAddress, provider);
        
        setResult(report);
        addLog(`Scan Complete. Verdict: ${report.verdict}`);
        
        if (!report.isSafe) {
          addLog("FIREWALL TRIGGERED: Malicious pattern detected.");
          setTimeout(() => setShowWarning(true), 500);
        } else {
          addLog("Integrity Check Passed. Safe to proceed.");
        }
    } catch (error) {
        addLog("Audit Error: Check your connection or address.");
        console.error(error);
    } finally {
        setLoading(false);
    }
  }

  const signOnSepolia = async () => {
    if (!window.ethereum || !account) return;
    try {
      addLog("Transmitting to Sepolia via MetaMask...");
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
              <p>GuardianAI Forensic Engine detected a high-risk signature.</p>
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
                <div className="avatar-box">
                  <img src={`https://api.dicebear.com/7.x/bottts/svg?seed=${account}`} alt="Avatar" />
                </div>
                <span className="account-tag">{account.substring(0, 6)}...</span>
              </button>
              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div className="profile-dropdown glass-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}>
                    <p className="addr">{account}</p>
                    <button className="logout-btn" onClick={disconnectWallet}><LogOut size={16} /> DISCONNECT</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-btn"><Wallet size={16} /> CONNECT SYSTEM</button>
          )}
        </div>
      </header>

      {/* 3. MAIN SCANNER */}
      <main className="scanner-layout">
        <section className="left-panel">
          <div className="glass-card">
            <h3><Activity size={20} color="#0070f3" /> Live Interceptor</h3>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>
              Simulate an external DApp attempting to trigger a transaction.
            </p>
            <div className="demo-grid">
              {DEMO_PAYLOADS.map((item) => (
                <button key={item.id} onClick={() => loadDemo(item)} className="demo-btn" style={{ borderLeft: '3px solid #0070f3' }}>
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
            <h3><Cpu size={18} /> Analysis Log</h3>
            <div className="terminal-screen">
              {logs.length === 0 && <p className="faint-text">System Idle...</p>}
              {logs.map((log, i) => (
                <motion.p initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} key={i} className="terminal-line">
                  {log}
                </motion.p>
              ))}
              {loading && <span className="terminal-cursor">_</span>}
            </div>
          </div>
        </section>

        <section className="right-panel">
          <div className="glass-card">
            <h3><Search size={20} /> Transaction Inspection</h3>
            <div className="input-group">
              <input type="text" placeholder="Recipient Address" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
              <textarea placeholder="Data Payload (Hex)" value={txData} rows={4} onChange={(e) => setTxData(e.target.value)} />
              <button onClick={handleSecurityAudit} disabled={loading} className="scan-btn">
                {loading ? "FETCHING ON-CHAIN DATA..." : "START SECURITY AUDIT"}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div className={`result-card glass-card ${result.verdict.toLowerCase()}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="result-header">
                  {result.isSafe ? <ShieldCheck size={40} color="#00ff88" /> : <ShieldAlert size={40} color="#ff0055" />}
                  <div><h2>VERDICT: {result.verdict}</h2><p>AI Confidence Score: {result.riskScore}%</p></div>
                </div>

                {/* --- AI TRANSLATION BOX --- */}
                <div className="translation-box" style={{ background: 'rgba(0, 112, 243, 0.05)', padding: '10px', borderRadius: '8px', marginBottom: '10px', border: '1px dashed var(--accent-blue)' }}>
                  <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--accent-blue)', fontWeight: 'bold' }}>AI Translation:</span>
                  <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', fontSize: '0.9rem' }}>{result.translation}</p>
                </div>

                <div className="risk-meter">
                  <motion.div className="meter-fill" initial={{ width: 0 }} animate={{ width: `${result.riskScore}%` }}></motion.div>
                </div>

                {/* --- FORENSIC DATA GRID --- */}
                <div className="forensic-grid">
                  <div className="evidence-item">
                    <span className="label">Contract Age</span>
                    <span className="value">{result.features.contractAge} Blocks</span>
                  </div>
                  <div className="evidence-item">
                    <span className="label">Liquidity</span>
                    <span className="value">{result.features.ethBalance.toFixed(4)} ETH</span>
                  </div>
                  <div className="evidence-item">
                    <span className="label">Type</span>
                    <span className="value">{result.features.isContract ? "Contract" : "Wallet"}</span>
                  </div>
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