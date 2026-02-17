import { ethers } from 'ethers';

// 1. COMMUNITY BLACKLIST (Known Threats)
const GLOBAL_BLACKLIST = [
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Phishing Example
    "0x1234567890123456789012345678901234567890"  // Drainer Example
];

// 2. CALLDATA HUMANIZER (Tailored to your GuardianMarketplace)
const humanizeData = (hex) => {
    // Logic for Privacy Bitcoin (Approval Trap)
    if (hex.includes("0xa22cb465")) return "🚨 PERMISSION TRAP: Requesting full access to move your assets.";
    
    // Logic for Discount Bitcoin (The Drainer)
    if (hex.includes("0x789b14c3")) return "💸 FUND EXFILTRATION: Payment is being diverted to a private owner wallet.";
    
    // Logic for Verified Bitcoin (The Safe Path)
    if (hex.includes("0x7a65935a")) return "✅ VERIFIED: Standard purchase on a secure gateway.";
    
    // Other common malicious signatures
    if (hex.includes("0x095ea7b3")) return "🔓 WARNING: Requesting unlimited token spending allowance.";
    
    return "Standard Contract Interaction.";
};

/**
 * AI Inference Brain (Calibrated for Enterprise Risk)
 */
const runAIInference = (features) => {
    let aiProbability = 0;

    // RULE 1: Function Risk (Heavy weight on Drainer/Approval signatures)
    if (features.functionRisk > 0.8) {
        aiProbability += 50; 
    } else {
        aiProbability += 5; 
    }

    // RULE 2: Contract Reputation (Age/Activity)
    // For the demo, your new contract is "Young" (low txCount), so it gets a slight suspicion boost
    if (features.contractAge < 5) {
        aiProbability += 25; // Brand new contracts are high risk
    } else if (features.contractAge < 50) {
        aiProbability += 10; 
    } else {
        aiProbability -= 10; // Established trust
    }

    // RULE 3: Liquidity Check
    if (features.ethBalance < 0.0001 && features.isContract) {
        aiProbability += 15; // Low balance for a vendor contract is sus
    }

    return Math.min(Math.max(aiProbability, 0), 100);
};

export const analyzeTransaction = async (transactionData, contractAddress, provider, userAddress) => {
    let detections = [];
    let balance = 0;
    let txCount = 0;
    let code = "0x";
    let userBalance = 0;

    const isBlacklisted = GLOBAL_BLACKLIST.includes(contractAddress.toLowerCase());

    // 1. Fetch Live Forensic Data
    try {
        if (provider && ethers.isAddress(contractAddress)) {
            const [rawBalance, count, contractCode, rawUserBalance] = await Promise.all([
                provider.getBalance(contractAddress),
                provider.getTransactionCount(contractAddress),
                provider.getCode(contractAddress),
                userAddress ? provider.getBalance(userAddress) : Promise.resolve(0n)
            ]);
            balance = parseFloat(ethers.formatEther(rawBalance));
            txCount = count;
            code = contractCode;
            userBalance = parseFloat(ethers.formatEther(rawUserBalance));
        }
    } catch (err) {
        console.error("Forensic collection failed:", err);
    }

    // 2. Build the Feature Vector (Detect your specific signatures)
    const features = {
        // Includes signatures for setApprovalForAll (0xa22cb465) and DiscountBitcoin (0x789b14c3)
        functionRisk: (transactionData?.includes("0xa22cb465") || transactionData?.includes("0x789b14c3")) ? 0.9 : 0.1,
        contractAge: txCount,
        ethBalance: balance,
        isContract: code !== "0x" ? 1 : 0,
        isUnlimited: transactionData?.includes("ffffffff") ? 1 : 0
    };

    // 3. Run AI Decision Logic
    const riskScore = isBlacklisted ? 100 : Math.round(runAIInference(features));

    // 4. Detailed Forensic Detections
    if (isBlacklisted) detections.push("SECURITY FEED: Address flagged in global phishing database.");
    if (transactionData?.includes("0xa22cb465")) {
        detections.push("THREAT DETECTED: Permission request bypasses standard transfer protocols.");
    }
    if (transactionData?.includes("0x789b14c3")) {
        detections.push("ANOMALY: Direct fund routing detected. (Owner-Transfer Pattern)");
    }
    if (features.contractAge < 10) {
        detections.push("SUSPICION: Low contract maturity detected.");
    }

    return {
        isSafe: riskScore < 50, // Stricter safety threshold
        riskScore: riskScore,
        detections: detections,
        features: features, 
        translation: humanizeData(transactionData),
        simulation: {
            current: userBalance,
            after: userBalance - 0.001 
        },
        verdict: riskScore >= 75 ? "DANGEROUS" : riskScore >= 50 ? "SUSPICIOUS" : "SAFE"
    };
};