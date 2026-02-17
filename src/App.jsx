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

  // --- Auto-scroll Terminal ---
  useEffect(() => {
    const terminal = document.querySelector('.terminal-screen');
    if (terminal) terminal.scrollTop = terminal.scrollHeight;
  }, [logs]);

  const connectWallet = async () => {
    if (!window.ethereum) {
      addLog("Security: No Ethereum provider detected.");
      const install = window.confirm("MetaMask not detected. Install it now?");
      if (install) window.open('https://metamask.io/download/', '_blank');
      return;
    }
    try {
      await window.ethereum.request({
        method: 'wallet_requestPermissions',
        params: [{ eth_accounts: {} }],
      });
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      setAccount(accounts[0]);
      setIsDropdownOpen(false);
      addLog(`Session Started: ${accounts[0].substring(0, 10)}...`);
    } catch (err) {
      addLog("Security: Connection failed.");
    }
  }

  useEffect(() => {
    if (window.ethereum) {
      const handleAccountChange = (accs) => {
        setAccount(accs.length > 0 ? accs[0] : null);
        addLog(accs.length > 0 ? "System: Account changed." : "System: Disconnected.");
      };
      window.ethereum.on('accountsChanged', handleAccountChange);
      return () => window.ethereum.removeListener('accountsChanged', handleAccountChange);
    }
  }, []);

  const disconnectWallet = () => {
    setAccount(null);
    setResult(null);
    setLogs([]);
    setIsDropdownOpen(false);
    addLog("Session Terminated.");
  };

  const loadDemo = (payload) => {
    setContractAddress(payload.target);
    setTxData(payload.hex);
    setResult(null);
    setLogs([]);
    addLog(`Payload Injected: ${payload.name}`);
  }

  const handleSecurityAudit = async () => {
    if (!txData || !contractAddress) return;
    setLoading(true);
    setResult(null);
    setLogs([]);
    
    addLog("Initializing GuardianAI Heuristic Engine...");
    setTimeout(() => addLog("Analyzing Transaction Calldata Signature..."), 400);
    setTimeout(() => addLog("Scanning for Malicious Approval Patterns..."), 800);
    setTimeout(() => addLog("Verifying Registry Reputation..."), 1200);

    setTimeout(async () => {
      const report = await analyzeTransaction(txData, contractAddress);
      setResult(report);
      setLoading(false);
      addLog(`Scan Complete. Result: ${report.verdict}`);
      if (!report.isSafe) {
        addLog("FIREWALL TRIGGERED: Blocking sign request.");
        setTimeout(() => setShowWarning(true), 500);
      } else {
        addLog("Integrity Check Passed. Safe to proceed.");
      }
    }, 1800);
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
        value: ethers.parseEther("0") 
      });
      addLog(`Success! Hash: ${tx.hash.substring(0, 15)}...`);
      setShowWarning(false);
    } catch (err) {
      addLog("Transaction Interrupted.");
    }
  }

  return (
    <div className="cyber-hub-container">
      <AnimatePresence>
        {showWarning && (
          <motion.div className="security-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card dangerous warning-modal" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <AlertTriangle size={64} className="vibrating-icon" />
              <h2>THREAT INTERCEPTED</h2>
              <p>GuardianAI has halted a malicious transaction attempt.</p>
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
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${account}`} alt="Avatar" />
                </div>
                <span className="account-tag">{account.substring(0, 6)}...</span>
              </button>
              {isDropdownOpen && (
                <div className="profile-dropdown glass-card">
                  <p className="label">ACTIVE WALLET</p>
                  <p className="addr">{account}</p>
                  <hr className="divider" />
                  <button className="logout-btn" onClick={disconnectWallet}><LogOut size={16} /> DISCONNECT</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={connectWallet} className="connect-btn"><Wallet size={18} /> CONNECT WALLET</button>
          )}
        </div>
      </header>

      <main className="scanner-layout">
        <section className="left-panel">
          <motion.div className="glass-card" variants={fadeIn} initial="hidden" animate="visible">
            <h3><Terminal size={20} /> Demo Scenarios</h3>
            <div className="demo-grid">
              {DEMO_PAYLOADS.map((item) => (
                <button key={item.id} onClick={() => loadDemo(item)} className="demo-btn">{item.name} <ChevronRight size={14} /></button>
              ))}
            </div>
          </motion.div>
          <motion.div className="glass-card terminal-card" variants={fadeIn} initial="hidden" animate="visible">
            <h3><Cpu size={18} /> Analysis Log</h3>
            <div className="terminal-screen">
              {logs.length === 0 && <p className="faint-text">System Idle...</p>}
              {logs.map((log, i) => (
                <motion.p key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="terminal-line">{log}</motion.p>
              ))}
            </div>
          </motion.div>
        </section>

        <section className="right-panel">
          <motion.div className="glass-card" variants={fadeIn} initial="hidden" animate="visible">
            <h3><Search size={20} /> Transaction Inspection</h3>
            <div className="input-group">
              <input type="text" placeholder="Recipient Address" value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
              <textarea placeholder="Data Payload (Hex)" value={txData} rows={4} onChange={(e) => setTxData(e.target.value)} />
              <button onClick={handleSecurityAudit} disabled={loading} className="scan-btn">{loading ? "SCANNING..." : "START SECURITY AUDIT"}</button>
            </div>
          </motion.div>
          {result && (
            <motion.div className={`result-card glass-card ${result.verdict.toLowerCase()}`} initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
              <div className="result-header">
                {result.isSafe ? <ShieldCheck size={40} color="#00c853" /> : <ShieldAlert size={40} color="#ff3d00" />}
                <div><h2>VERDICT: {result.verdict}</h2><p>Risk Score: {result.riskScore}%</p></div>
              </div>
              <div className="risk-meter"><div className="meter-fill" style={{ width: `${result.riskScore}%` }}></div></div>
              <ul className="detections-list">{result.detections.map((note, i) => <li key={i}>• {note}</li>)}</ul>
              {result.isSafe && <button className="final-sign-btn" onClick={signOnSepolia}>EXECUTE TRANSACTION</button>}
            </motion.div>
          )}
        </section>
      </main>

      <footer className="status-bar">
        <div className="status-item"><div className="pulse-dot"></div> ENGINE: ACTIVE</div>
        <div className="status-item"><Padlock size={14} /> NETWORK: SEPOLIA</div>
      </footer>
    </div>
  )
}
export default App;