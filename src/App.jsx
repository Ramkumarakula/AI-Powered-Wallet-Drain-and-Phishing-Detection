import { useState, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { motion, AnimatePresence } from 'framer-motion'
import { analyzeTransaction } from './intelligence/securityEngine'
import { 
  ShieldAlert, ShieldCheck, Search, Activity, 
  Terminal, Shield, Lock as Padlock, Wallet, 
  AlertTriangle, X, ChevronRight, Cpu, LogOut, ShoppingCart, CheckCircle, ExternalLink
} from 'lucide-react'
import './App.css'

// 1. LIVE CONTRACT CONFIGURATION
const MARKETPLACE_ADDRESS = "0x5C58e5Ab8d0D94eacbB7265Fa0aE6D93eB4C9DD2";

const MARKETPLACE_ITEMS = [
  { id: 'safe', name: 'Verified Bitcoin', price: '0.001', hex: "0x7a65935a", target: MARKETPLACE_ADDRESS },
  { id: 'suspicious', name: 'Privacy Bitcoin', price: '0.1', hex: "0xa22cb465", target: MARKETPLACE_ADDRESS },
  { id: 'dangerous', name: 'Discount Bitcoin', price: '0.0001', hex: "0x789b14c3", target: MARKETPLACE_ADDRESS }
];

function App() {
  const [account, setAccount] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [txHash, setTxHash] = useState('')
  const [logs, setLogs] = useState([])
  const [processing, setProcessing] = useState(false)

  // 2. CRITICAL REFS FOR SYNCHRONOUS DATA ACCESS
  const bypassRef = useRef(false);
  const pendingDataRef = useRef("0x7a65935a"); 
  const pendingTargetRef = useRef(MARKETPLACE_ADDRESS);

  const addLog = (msg) => setLogs(prev => [...prev, `> ${msg}`])

  // 3. THE GUARDIAN INTERCEPTOR
  useEffect(() => {
    if (window.ethereum) {
      const originalRequest = window.ethereum.request;
      window.ethereum.request = async (args) => {
        if (args.method === 'eth_sendTransaction' && bypassRef.current === false) {
          const txParams = args.params[0];
          addLog("GATEWAY: Intercepting transaction for forensic audit...");
          
          pendingDataRef.current = txParams.data || "0x7a65935a";
          pendingTargetRef.current = txParams.to || MARKETPLACE_ADDRESS;

          handleSecurityAudit(txParams.to, txParams.data || "0x7a65935a");

          return new Promise((_, reject) => {
            reject({ code: 4001, message: "GuardianAI: Analysis in progress." });
          });
        }
        return originalRequest.apply(window.ethereum, [args]);
      };
    }
  }, [account]);

  const connectWallet = async () => {
    if (!window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const accounts = await provider.send("eth_requestAccounts", []);
      setAccount(accounts[0]);
      addLog(`ACCESS GRANTED: ${accounts[0].substring(0, 10)}...`);
    } catch (err) { addLog("DENIED: Connection rejected."); }
  }

  const handleSecurityAudit = async (targetAddr, data) => {
    setLoading(true);
    setResult(null);
    addLog("AI BRAIN: Initializing deep calldata inspection...");
    
    try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const report = await analyzeTransaction(data, targetAddr, provider, account);
        setResult(report);
        addLog(`SCAN COMPLETE: Verdict is ${report.verdict}`);
        if (!report.isSafe) setTimeout(() => setShowWarning(true), 600);
    } catch (error) { 
        addLog("CRITICAL: Forensic engine failure."); 
    } finally { 
        setLoading(false); 
    }
  }

  const signOnSepolia = async () => {
    if (!window.ethereum || !account) return;
    
    addLog("FIREWALL: Master Key Active. Bypassing Interceptor...");
    bypassRef.current = true; 
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      const val = ethers.parseEther("0.001"); 
      const finalHex = pendingDataRef.current;

      addLog(`TRANSMITTING: Executing payload ${finalHex.substring(0, 10)}...`);
      
      const tx = await signer.sendTransaction({
        to: pendingTargetRef.current,
        data: finalHex,
        value: val, 
        gasLimit: 300000 
      });
      
      addLog(`BROADCASTED: Hash ${tx.hash.substring(0, 12)}...`);
      setTxHash(tx.hash);
      setShowWarning(false);
      
      addLog("SEPOLIA: Waiting for block confirmation...");
      await tx.wait(); 
      
      setShowSuccess(true);
      addLog("SUCCESS: Assets secured on-chain.");
      
    } catch (err) {
      addLog("REVERTED: Signature or Gas error.");
      console.error("BLOCKCHAIN ERROR:", err);
    } finally {
      setProcessing(false);
      setLoading(false);
      setTimeout(() => {
        bypassRef.current = false;
        addLog("FIREWALL: Logic restored to active protection.");
      }, 2000);
    }
  }

  const initiatePurchase = async (item) => {
    if (!account) return addLog("Connect wallet first!");
    if (processing) return;

    setProcessing(true);
    setResult(null);
    addLog(`MARKETPLACE: Preparing order for ${item.name}...`);
    
    try {
      await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ 
          from: account, 
          to: item.target, 
          data: item.hex, 
          value: '0x38D7EA4C68000' 
        }]
      });
    } catch (e) {}
  }

  return (
    <div className="cyber-hub-container quantum-theme">
      <AnimatePresence>
        {showWarning && result && (
          <motion.div className="security-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card dangerous warning-modal" initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <AlertTriangle size={64} className="vibrating-icon" color="#ff0055" />
              <h2>THREAT INTERCEPTED</h2>
              <div className="warning-details-box">
                {result.detections.map((d, i) => <p key={i}>⚠️ {d}</p>)}
              </div>
              <div className="modal-actions">
                <button className="abort-btn" onClick={() => { setShowWarning(false); setProcessing(false); }}>ABORT</button>
                <button className="bypass-btn" onClick={signOnSepolia}>BYPASS & SIGN</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSuccess && (
          <motion.div className="security-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div className="glass-card success-modal" initial={{ y: 50 }} animate={{ y: 0 }}>
              <CheckCircle size={80} color="#00ff88" className="pulse-icon" />
              <h2>TRANSACTION SUCCESSFUL</h2>
              <p>Confirmed on Sepolia Testnet</p>
              <div className="success-actions">
                <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" rel="noreferrer" className="etherscan-link">
                  VIEW ON ETHERSCAN <ExternalLink size={16} />
                </a>
                <button className="close-success-btn" onClick={() => setShowSuccess(false)}>CLOSE</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="glass-header">
        <div className="logo-group">
          <ShieldAlert size={32} color="#0070f3" />
          <h1>GuardianWallet <span className="ai-badge">AI</span></h1>
        </div>
        <div className="profile-section">
          {account ? (
            <button className="profile-trigger" onClick={() => setAccount(null)}>
              <span className="account-tag">{account.substring(0, 6)}...</span>
              <LogOut size={16} />
            </button>
          ) : (
            <button onClick={connectWallet} className="connect-btn">CONNECT</button>
          )}
        </div>
      </header>

      <main className="scanner-layout">
        <section className="left-panel">
          <div className="glass-card">
            <h3><ShoppingCart size={20} color="#0070f3" /> Guardian Marketplace</h3>
            <div className="marketplace-grid">
              {MARKETPLACE_ITEMS.map((item) => (
                <div key={item.id} className="product-card">
                  <div className="product-header">
                    <img src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg" alt="BTC" width="24" />
                    <span className="price">{item.price} ETH</span>
                  </div>
                  <h4>{item.name}</h4>
                  <button onClick={() => initiatePurchase(item)} className="buy-btn" disabled={processing}>
                    {processing ? "SCANNING..." : "BUY BITCOIN"}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card terminal-card">
            <div className="terminal-screen">
              {logs.map((log, i) => <p key={i} className="terminal-line">{log}</p>)}
            </div>
          </div>
        </section>

        <section className="right-panel">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div className={`result-card glass-card ${result.verdict.toLowerCase()}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={result.riskScore}>
                <div className="result-header">
                  {result.isSafe ? <ShieldCheck size={40} color="#00ff88" /> : <ShieldAlert size={40} color="#ff0055" />}
                  <div><h2>VERDICT: {result.verdict}</h2><p>Risk Score: {result.riskScore}%</p></div>
                </div>

                <div className="translation-box">
                  <span className="label">AI Translation:</span>
                  <p>{result.translation}</p>
                </div>

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

                {result.isSafe && (
                  <button className="final-sign-btn" onClick={signOnSepolia}>EXECUTE ON SEPOLIA</button>
                )}
              </motion.div>
            ) : (
              <div className="empty-state glass-card">
                {loading || processing ? (
                  <div className="loader-box">
                    <motion.img 
                      src="https://cryptologos.cc/logos/bitcoin-btc-logo.svg" 
                      alt="BTC" 
                      className="rotating-bitcoin"
                      animate={{ rotateY: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    />
                    <h3>Forensic Audit Active</h3>
                    <p>Scanning calldata for malicious signatures...</p>
                  </div>
                ) : (
                  <>
                    <Search size={48} color="#64748b" />
                    <h3>Awaiting Checkout</h3>
                    <p>Select a product to start a secure transaction audit.</p>
                  </>
                )}
              </div>
            )}
          </AnimatePresence>
        </section>
      </main>
    </div>
  )
}

export default App;