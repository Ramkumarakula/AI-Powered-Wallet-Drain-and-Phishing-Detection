// src/intelligence/securityEngine.js

import { ethers } from 'ethers';

export const analyzeTransaction = async (transactionData, contractAddress) => {
    let riskScore = 0;
    let detections = [];

    // Pattern 1: setApprovalForAll
    if (transactionData && transactionData.includes("0xa22cb465")) {
        riskScore += 85;
        detections.push("CRITICAL: Requesting full control over your NFT collection.");
    }

    // Pattern 2: Unlimited Approval
    if (transactionData && transactionData.includes("0x095ea7b3") && transactionData.includes("ffffffff")) {
        riskScore += 65;
        detections.push("HIGH: Requesting unlimited token spending allowance.");
    }

    return {
        isSafe: riskScore < 50,
        riskScore: riskScore,
        detections: detections,
        verdict: riskScore >= 75 ? "DANGEROUS" : riskScore >= 50 ? "SUSPICIOUS" : "SAFE"
    };
};