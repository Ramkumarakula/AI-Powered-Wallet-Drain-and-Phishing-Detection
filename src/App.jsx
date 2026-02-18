import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeTransaction, updateAIModel } from './intelligence/securityEngine'
import { 
  ShieldAlert, ShieldCheck, ShoppingCart, 
  CheckCircle, Activity, Terminal, Code, AlertTriangle,
  User, LogOut, ChevronDown 
} from 'lucide-react'
import './App.css'

const MARKETPLACE_ADDRESS = "0x5C58e5Ab8d0D94eacbB7265Fa0aE6D93eB4C9DD2";

const MARKETPLACE_ITEMS = [
  { id: 'safe', name: 'Verified Bitcoin', price: '0.001', hex: "0x7a65935a" },
  { id: 'suspicious', name: 'Privacy Bitcoin', price: '0.1', hex: "0xa22cb465" },
  { id: 'dangerous', name: 'Discount Bitcoin', price: '0.0001', hex: "0x789b14c3" }
];

function App() {
  const [account, setAccount] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [logs, setLogs] = useState([])
  const [processing, setProcessing] = useState(false)
  const [manualTarget, setManualTarget] = useState('')
  const [manualHex, setManualHex] = useState('')
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  // Modal Control Ref: Prevents infinite popup loop
  const hasWarnedRef = useRef(false);

  // 1. BRAIN INITIALIZATION
  const [adaptiveWeights, setAdaptiveWeights] = useState(() => {
    const saved = localStorage.getItem('guardian_ai_brain');
    try {
      return saved ? JSON.parse(saved) : {
        functionRisk: 50.0,
        newContractPenalty: 25.0,
        lowLiquidityPenalty: 15.0,
        trustBonus: 10.0
      };
    } catch (e) {
      return { functionRisk: 50.0, newContractPenalty: 25.0, lowLiquidityPenalty: 15.0, trustBonus: 10.0 };
    }
  });

  // 2. SYNC EFFECT
  useEffect(() => {
    if (adaptiveWeights) {
      localStorage.setItem('guardian_ai_brain', JSON.stringify(adaptiveWeights));
      updateAIModel(adaptiveWeights);
    }
  }, [adaptiveWeights]);

  const bypassRef = useRef(false);
  const pendingDataRef = useRef(""); 
  const pendingTargetRef = useRef("");

  const addLog = (msg) => setLogs(prev => [`> ${msg}`, ...prev.slice(0, 10)])

  const connectWallet = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      addLog(`ACCESS GRANTED: ${accounts[0].substring(0, 8)}...`);
    } catch (err) { addLog("DENIED: Connection rejected."); }
  }

  const disconnectWallet = () => {
    setAccount(null);
    setShowProfileMenu(false);
    setResult(null);
    addLog("SESSION ENDED: Wallet disconnected.");
  };

  const handleSecurityAudit = async (targetAddr, data) => {
    if (!targetAddr || !ethers.isAddress(targetAddr)) return addLog("ERROR: Invalid target.");
    setLoading(true);
    setResult(null);
    hasWarnedRef.current = false; // Reset for new scan
    addLog("AI BRAIN: Synchronizing Global Threat Feeds...");
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const report = await analyzeTransaction(data, targetAddr, provider, account);
        setResult(report);
        addLog(`SCAN COMPLETE: Verdict is ${report.verdict}`);
        
        if (!report.isSafe && !hasWarnedRef.current) {
            setTimeout(() => {
                setShowWarning(true);
                hasWarnedRef.current = true;
            }, 600);
        }
    } catch (error) { addLog("CRITICAL: Engine offline."); } 
    finally { setLoading(false); setProcessing(false); }
  }

  const handleAIFeedback = async (action) => {
    const learningRate = 0.15;
    const isSignatureThreat = result?.features?.functionRisk > 0.8;
    const targetFeature = isSignatureThreat ? 'functionRisk' : 'newContractPenalty';

    setAdaptiveWeights(prev => ({
        ...prev,
        [targetFeature]: action === 'ABORT' ? prev[targetFeature] * (1 + learningRate) : prev[targetFeature] * (1 - learningRate)
    }));

    setShowWarning(false);

    if (action === 'ABORT') {
        addLog(`LEARNING: Increased ${targetFeature} sensitivity.`);
        const provider = new ethers.BrowserProvider(window.ethereum);
        const report = await analyzeTransaction(
            pendingDataRef.current || manualHex, 
            pendingTargetRef.current || manualTarget, 
            provider, 
            account
        );
        setResult(report);
    } else {
        addLog(`LEARNING: Relaxed ${targetFeature} threshold.`);
        signOnSepolia();
    }
  }

  const signOnSepolia = async () => {
    if (!window.ethereum || !account) return addLog("Connect wallet first!");
    
    const finalTarget = pendingTargetRef.current || manualTarget;
    const finalData = pendingDataRef.current || manualHex;

    if (!finalTarget) return addLog("ERROR: No target defined.");

    bypassRef.current = true;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      addLog("FIREWALL: Bypassing for authorized execution...");
      const tx = await signer.sendTransaction({
        to: finalTarget,
        data: finalData || "0x",
        value: ethers.parseEther("0.0001")
      });
      setShowSuccess(true);
      addLog("SUCCESS: Transaction verified.");
    } catch (err) { addLog("REVERTED: Signature rejected."); } 
    finally { setTimeout(() => { bypassRef.current = false; }, 2000); }
  }

  const initiatePurchase = (item) => {
    if (!account) return addLog("Connect wallet first!");
    setProcessing(true);
    pendingDataRef.current = item.hex;
    pendingTargetRef.current = MARKETPLACE_ADDRESS;
    addLog(`MARKETPLACE: Ordering ${item.name}...`);
    handleSecurityAudit(MARKETPLACE_ADDRESS, item.hex);
  }

  return (
    <div className="cyber-hub-container">
      <AnimatePresence>
        {showWarning && result && (
          <div className="security-modal-overlay">
            <motion.div className="glass-card dangerous warning-modal" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <AlertTriangle size={64} color="#ff3d00" />
              <h2>THREAT DETECTED</h2>
              <div className="warning-details-box">
                {result.detections.map((d, i) => <p key={i}>⚠️ {d}</p>)}
              </div>
              <div className="modal-actions">
                <button className="abort-btn" onClick={() => handleAIFeedback('ABORT')}>ABORT & REINFORCE</button>
                <button className="bypass-btn" onClick={() => handleAIFeedback('BYPASS')}>BYPASS & PROCEED</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <header className="glass-header">
        <div className="logo-group">
          <ShieldAlert size={32} color="#0070f3" />
          <h1>GuardianWallet <span className="ai-badge">AI</span></h1>
        </div>
        
        <div className="wallet-section">
          {!account ? (
            <button onClick={connectWallet} className="connect-btn">CONNECT WALLET</button>
          ) : (
            <div className="profile-container">
              <button className="profile-trigger" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="avatar-circle"><User size={16} /></div>
                <span className="addr-text">{account.substring(0, 6)}...{account.substring(38)}</span>
                <ChevronDown size={14} className={showProfileMenu ? 'rotate' : ''} />
              </button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    className="profile-dropdown"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="dropdown-info">
                      <p className="label">Account</p>
                      <p className="full-addr">{account}</p>
                    </div>
                    <div className="divider"></div>
                    <button className="logout-btn" onClick={disconnectWallet}>
                      <LogOut size={16} /> Disconnect
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </header>

      <main className="scanner-layout">
        <section className="left-panel">
          <section className="health-dashboard glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3><Activity size={18} color="#00ff88" /> Engine Health</h3>
                <button className="reset-btn" onClick={() => {localStorage.clear(); window.location.reload();}}>RESET</button>
            </div>
            <div className="weights-grid">
              {Object.entries(adaptiveWeights).map(([key, value]) => (
                <div key={key} className="weight-stat">
                  <span className="label">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="stat-bar">
                    <motion.div className="stat-fill" animate={{ width: `${Math.min((value / 60) * 100, 100)}%` }} 
                      style={{ backgroundColor: value > 35 ? '#ff3d00' : '#00ff88' }} />
                  </div>
                  <span className="value">{value.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </section>

          <div className="glass-card">
            <h3><ShoppingCart size={18} color="#0070f3" /> Marketplace</h3>
            <div className="marketplace-grid">
              {MARKETPLACE_ITEMS.map((item) => (
                <div key={item.id} className="product-card">
                  <div className="product-header">
                    <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg" width="20" alt="btc" />
                    <span className="price-tag">{item.price} ETH</span>
                  </div>
                  <div className="product-body"><h4>{item.name}</h4></div>
                  <button onClick={() => initiatePurchase(item)} className="buy-btn" disabled={processing}>
                    {processing ? "SCANNING..." : "BUY"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card sandbox-card">
            <h3><Code size={18} color="#0070f3" /> Forensic Sandbox</h3>
            <div className="input-group">
              <input placeholder="Contract Address (0x...)" value={manualTarget} onChange={(e) => setManualTarget(e.target.value)} />
              <textarea placeholder="Hex Data" rows="2" value={manualHex} onChange={(e) => setManualHex(e.target.value)} />
              <button className="scan-btn" onClick={() => { pendingTargetRef.current=""; handleSecurityAudit(manualTarget, manualHex); }}>
                MANUAL SCAN
              </button>
            </div>
          </div>
        </section>

        <section className="right-panel">
          <div className="glass-card terminal-card">
            <div className="terminal-screen">
              {logs.map((log, i) => <p key={i} className="terminal-line">{log}</p>)}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {result ? (
              <motion.div className={`result-card glass-card ${result.verdict.toLowerCase()}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={result.riskScore}>
                <div className="result-header">
                  {result.isSafe ? <ShieldCheck size={40} color="#00ff88" /> : <ShieldAlert size={40} color="#ff3d00" />}
                  <div><h2>{result.verdict}</h2><p>Risk Score: {result.riskScore}%</p></div>
                </div>
                <div className="translation-box">
                  <span className="label">Translation:</span>
                  <p>{result.translation}</p>
                </div>
                <div className="forensic-grid">
                  <div className="evidence-item"><span className="label">Age</span><span className="value">{result.features.contractAge}</span></div>
                  <div className="evidence-item"><span className="label">ETH</span><span className="value">{result.features.ethBalance.toFixed(2)}</span></div>
                  <div className="evidence-item"><span className="label">Type</span><span className="value">{result.features.isContract ? "Cont" : "Wall"}</span></div>
                </div>

                {(pendingTargetRef.current || (manualTarget && ethers.isAddress(manualTarget))) && (
                    <button 
                      className={`final-sign-btn ${result.isSafe ? 'safe-sign' : 'danger-sign'}`} 
                      onClick={signOnSepolia}
                    >
                      {result.isSafe ? "EXECUTE AUTHORIZED PAYMENT" : `FORCE AUTHORIZE (${result.verdict})`}
                    </button>
                )}
              </motion.div>
            ) : (
              <div className="empty-state glass-card">
                {loading ? "SCANNING..." : "Awaiting Input Data..."}
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  )
}

export default App;