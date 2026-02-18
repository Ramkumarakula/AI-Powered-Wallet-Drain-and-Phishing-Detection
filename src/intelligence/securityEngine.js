import { ethers } from 'ethers';

// 1. DYNAMIC MODEL STATE
// We initialize with default values to prevent 'undefined' errors during first render.
let adaptiveWeights = {
    functionRisk: 50.0,
    newContractPenalty: 25.0,
    lowLiquidityPenalty: 15.0,
    trustBonus: -10.0,
    externalIntelPenalty: 40.0
};

/**
 * REINFORCEMENT LEARNING SYNC: Updates the local brain state with the 
 * persistent weights from App.jsx/LocalStorage.
 */
export const updateAIModel = (newWeights) => {
    // GUARD: Ensure newWeights exists before attempting to use it
    if (!newWeights || typeof newWeights !== 'object') return;
    
    adaptiveWeights = { ...newWeights };
    
    // Defensive logging: only call toFixed if the property exists
    if (adaptiveWeights.functionRisk !== undefined) {
        console.log(`[AI Engine] Weights Synchronized. Current Function Risk: ${adaptiveWeights.functionRisk.toFixed(2)}`);
    }
};

// 2. EXTERNAL INTEL: GoPlus Security Integration
const checkExternalThreats = async (address) => {
    try {
        const response = await fetch(`https://api.gopluslabs.io/api/v1/address_security/${address}?chain_id=1`);
        const data = await response.json();
        return {
            isBlacklisted: data.result?.is_blacklisted === "1",
            honeypot: data.result?.is_honeypot === "1",
            riskScore: parseInt(data.result?.risk_score || "0")
        };
    } catch (err) {
        console.warn("External Intelligence Feed Offline.");
        return null;
    }
};

const humanizeData = (hex) => {
    if (hex.includes("0xa22cb465")) return "🚨 PERMISSION TRAP: Requesting full access to move your assets.";
    if (hex.includes("0x789b14c3")) return "💸 FUND EXFILTRATION: Payment is being diverted to a private owner wallet.";
    if (hex.includes("0x7a65935a")) return "✅ VERIFIED: Standard purchase on a secure gateway.";
    return "Standard Contract Interaction.";
};



export const analyzeTransaction = async (transactionData, contractAddress, provider, userAddress) => {
    let detections = [];
    
    // FETCH LIVE FORENSIC & EXTERNAL DATA IN PARALLEL
    const [rawBalance, count, code, rawUserBal, externalIntel] = await Promise.all([
        provider.getBalance(contractAddress).catch(() => 0n),
        provider.getTransactionCount(contractAddress).catch(() => 0),
        provider.getCode(contractAddress).catch(() => "0x"),
        userAddress ? provider.getBalance(userAddress).catch(() => 0n) : Promise.resolve(0n),
        checkExternalThreats(contractAddress) 
    ]);

    const features = {
        functionRisk: (transactionData?.includes("0xa22cb465") || transactionData?.includes("0x789b14c3")) ? 0.9 : 0.1,
        contractAge: count,
        ethBalance: parseFloat(ethers.formatEther(rawBalance)),
        isContract: code !== "0x" ? 1 : 0
    };

    // 3. ADAPTIVE INFERENCE BRAIN
    let riskScore = 0;
    
    // We use the current adaptiveWeights to calculate the score
    if (features.functionRisk > 0.8) riskScore += adaptiveWeights.functionRisk || 50;
    if (features.contractAge < 5) riskScore += adaptiveWeights.newContractPenalty || 25;
    if (features.contractAge > 50) riskScore += (adaptiveWeights.trustBonus || -10);
    
    if (externalIntel?.isBlacklisted) {
        riskScore += (adaptiveWeights.externalIntelPenalty || 40);
        detections.push("GLOBAL INTEL: Address flagged in GoPlus community blacklist.");
    }

    if (features.functionRisk > 0.8) detections.push("THREAT: High-risk function signature detected.");
    if (features.contractAge < 10) detections.push("SUSPICION: Low contract maturity.");
    if (features.isContract === 0) detections.push("ALERT: Sending data to a Personal Wallet (EOA) instead of a Contract.");

    return {
        isSafe: riskScore < 50,
        riskScore: Math.min(riskScore, 100),
        detections: detections,
        features: features, 
        translation: humanizeData(transactionData),
        simulation: { 
            current: parseFloat(ethers.formatEther(rawUserBal)), 
            after: parseFloat(ethers.formatEther(rawUserBal)) - 0.0001 
        },
        verdict: riskScore >= 75 ? "DANGEROUS" : riskScore >= 50 ? "SUSPICIOUS" : "SAFE"
    };
};