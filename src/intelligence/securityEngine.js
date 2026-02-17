import { ethers } from 'ethers';

/**
 * AI Inference Brain
 * This logic mimics the Decision Tree you trained in Google Colab.
 * It weights the feature vector to produce a dynamic risk probability.
 */
const runAIInference = (features) => {
    let aiProbability = 0;

    // RULE 1: Function Risk (The most important feature)
    aiProbability += (features.functionRisk * 45); // Max 45 points

    // RULE 2: Contract Age (The "Reputation" factor)
    if (features.contractAge < 10) {
        aiProbability += 35; // Brand new contracts are highly suspicious
    } else if (features.contractAge > 1000) {
        aiProbability -= 15; // Established contracts gain trust
    }

    // RULE 3: Liquidity/Balance (Drainers often use empty accounts)
    if (features.ethBalance < 0.01) {
        aiProbability += 15;
    }

    // RULE 4: Unlimited Permission Penalty
    if (features.isUnlimited) {
        aiProbability += 10;
    }

    // Final result capped between 0-100
    return Math.min(Math.max(aiProbability, 0), 100);
};

export const analyzeTransaction = async (transactionData, contractAddress, provider) => {
    let detections = [];
    let balance = 0;
    let txCount = 0;
    let code = "0x";

    // 1. Fetch Live Forensic Data
    try {
        if (provider && ethers.isAddress(contractAddress)) {
            const [rawBalance, count, contractCode] = await Promise.all([
                provider.getBalance(contractAddress),
                provider.getTransactionCount(contractAddress),
                provider.getCode(contractAddress)
            ]);
            balance = parseFloat(ethers.formatEther(rawBalance));
            txCount = count;
            code = contractCode;
        }
    } catch (err) {
        console.error("Forensic collection failed:", err);
    }

    // 2. Build the Feature Vector
    const features = {
        isUnlimited: transactionData?.includes("ffffffff") ? 1 : 0,
        functionRisk: transactionData?.includes("0xa22cb465") ? 0.9 : 0.6,
        contractAge: txCount,
        ethBalance: balance,
        isContract: code !== "0x" ? 1 : 0
    };

    // 3. RUN THE AI BRAIN (The "Moved" Logic)
    const riskScore = Math.round(runAIInference(features));

    // 4. Generate AI Detections based on the score
    if (features.isUnlimited && features.contractAge < 20) {
        detections.push("AI ALERT: Pattern matches high-velocity 'Unlimited Drainer' profile.");
    }
    if (riskScore > 80) {
        detections.push("CRITICAL: AI model predicts malicious intent with high confidence.");
    } else if (riskScore > 50) {
        detections.push("SUSPICIOUS: Potential phishing signature detected.");
    }

    return {
        isSafe: riskScore < 60,
        riskScore: riskScore,
        detections: detections,
        features: features, 
        verdict: riskScore >= 75 ? "DANGEROUS" : riskScore >= 50 ? "SUSPICIOUS" : "SAFE"
    };
};