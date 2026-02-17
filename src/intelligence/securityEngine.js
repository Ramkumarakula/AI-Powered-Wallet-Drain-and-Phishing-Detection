import { ethers } from 'ethers';

// 1. COMMUNITY BLACKLIST (Known Threats)
const GLOBAL_BLACKLIST = [
    "0x742d35Cc6634C0532925a3b844Bc454e4438f44e", // Phishing Example
    "0x1234567890123456789012345678901234567890"  // Drainer Example
];

// 2. CALLDATA HUMANIZER (Translator)
const humanizeData = (hex) => {
    if (hex.includes("0xa22cb465")) return "⚠️ CRITICAL: Full permission to manage your NFTs.";
    if (hex.includes("0x095ea7b3")) return "💸 WARNING: Requesting unlimited token spending.";
    if (hex.includes("0x23b872dd")) return "📤 EXFILTRATION: Direct fund transfer request.";
    return "Standard Contract Interaction.";
};

/**
 * AI Inference Brain (Calibrated)
 */
const runAIInference = (features) => {
    let aiProbability = 0;

    // RULE 1: Function Risk (Heavy weight only on known dangerous selectors)
    if (features.functionRisk > 0.8) {
        aiProbability += 45; 
    } else {
        aiProbability += 5; // Very low base for unknown functions
    }

    // RULE 2: Contract Reputation (Age)
    if (features.contractAge === 0) {
        aiProbability += 30; // Brand new accounts are high risk
    } else if (features.contractAge < 20) {
        aiProbability += 15; // Low history is suspicious
    } else if (features.contractAge > 500) {
        aiProbability -= 15; // Established accounts gain trust
    }

    // RULE 3: Liquidity
    if (features.ethBalance < 0.001 && features.isContract) {
        aiProbability += 15; // Suspect if contract has zero balance
    }

    // RULE 4: Unlimited Permission
    if (features.isUnlimited) {
        aiProbability += 10;
    }

    return Math.min(Math.max(aiProbability, 0), 100);
};

export const analyzeTransaction = async (transactionData, contractAddress, provider, userAddress) => {
    let detections = [];
    let balance = 0;
    let txCount = 0;
    let code = "0x";
    let userBalance = 0;

    // 1. Check Community Blacklist FIRST
    const isBlacklisted = GLOBAL_BLACKLIST.includes(contractAddress.toLowerCase());

    // 2. Fetch Live Forensic Data
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

    // 3. Build the Feature Vector (Strict mapping)
    const features = {
        isUnlimited: transactionData?.includes("ffffffff") ? 1 : 0,
        functionRisk: (transactionData?.includes("0xa22cb465") || transactionData?.includes("0x095ea7b3")) ? 0.9 : 0.1,
        contractAge: txCount,
        ethBalance: balance,
        isContract: code !== "0x" ? 1 : 0
    };

    // 4. Run Inference (Blacklist always gives 100%)
    const riskScore = isBlacklisted ? 100 : Math.round(runAIInference(features));

    // 5. Generate Detections
    if (isBlacklisted) detections.push("COMMUNITY BLACKLIST: This address is a confirmed security threat.");
    if (features.isUnlimited && features.contractAge < 20) {
        detections.push("AI ALERT: Pattern matches 'Unlimited Drainer' profile.");
    }
    if (riskScore > 80) {
        detections.push("CRITICAL: AI model predicts malicious intent.");
    }

    return {
        isSafe: riskScore < 60,
        riskScore: riskScore,
        detections: detections,
        features: features, 
        translation: humanizeData(transactionData),
        simulation: {
            current: userBalance,
            after: userBalance - 0.001 // Simulated outcome (Balance - estimated gas/value)
        },
        verdict: riskScore >= 75 ? "DANGEROUS" : riskScore >= 50 ? "SUSPICIOUS" : "SAFE"
    };
};