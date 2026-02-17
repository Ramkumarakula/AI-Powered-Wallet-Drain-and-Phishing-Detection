# 🛡️ GuardianWallet AI: Pre-Sign Phishing Defense

**GuardianWallet AI** is a proactive security middleware designed to bridge the "Clarity Gap" in Web3. Instead of relying on static blacklists, it uses a client-side **Heuristic Engine** to perform Deep Calldata Inspection, blocking wallet-draining signatures before they ever reach your private key.

---

## 🚀 The Problem
Most Web3 users lose assets because they "blindly sign" transactions. Standard wallets often show obscure hexadecimal data, hiding malicious functions like `setApprovalForAll`. 

**GuardianWallet AI** solves this by acting as a **Pre-Sign Firewall**.

## ✨ Key Features
* **Real-Time Interception:** Captures transaction payloads before the wallet signature request.
* **Heuristic-Based Logic:** Decodes Function Selectors (e.g., `0xa22cb465`) to identify "Unlimited Approval" patterns.
* **Deterministic Risk Scoring:** Assigns a risk level (Safe, Suspicious, Dangerous) based on weighted behavior analysis.
* **Guardian Modal:** An urgent security overlay that freezes the transaction flow when high-risk patterns are detected.
* **Live Audit Logs:** A terminal-style UI that reveals the AI’s decision-making process in real-time.

## 🛠️ Tech Stack
| Category | Technology |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS |
| **Animation** | Framer Motion (for high-fidelity security alerts) |
| **Blockchain** | Ethers.js v6, MetaMask Provider API |
| **Network** | Ethereum Sepolia Testnet |
| **Logic** | Custom Heuristic Expert System |

## 🏗️ Methodology
1.  **Interception:** `Ethers.js` captures the raw transaction object.
2.  **Decoding:** The Heuristic Engine extracts the first 4 bytes (Function Selector) and parameters.
3.  **Analysis:** The engine checks for high-risk behaviors (e.g., infinite approvals to unverified addresses).
4.  **Verdict:** If the risk score exceeds 70%, the **Firewall** triggers, blocking the `eth_sendTransaction` request.

## 🏁 Getting Started

### Prerequisites
* Node.js (v18+)
* MetaMask Extension (Connected to Sepolia Testnet)

### Installation
1.  **Clone the repo:**
    ```bash
    git clone [https://github.com/Ramkumarakula/AI-Powered-Wallet-Drain-and-Phishing-Detection.git](https://github.com/Ramkumarakula/AI-Powered-Wallet-Drain-and-Phishing-Detection.git)
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Run the development server:**
    ```bash
    npm run dev
    ```

## 📜 Research & References
* **Pre-Sign Security Gap:** Inspired by research into user behavior and "blind signing" vulnerabilities.
* **EIP-20 & EIP-721 Standards:** Built upon the technical specifications of Ethereum token approvals.
* **Heuristic Defense:** Grounded in cybersecurity studies showing rule-based engines outperforming static blacklists for Zero-Day threat detection.

---
Created by **Ramkumar Akula** | Powered by Ethereum Sepolia
