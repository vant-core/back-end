"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CostUtil = void 0;
class CostUtil {
    static estimateRagSavings(input) {
        const { hypotheticalTokensWithoutRag, actualTokensWithRag, pricePerThousandTokensUsd } = input;
        const hypotheticalCostUsd = (hypotheticalTokensWithoutRag / 1000) * pricePerThousandTokensUsd;
        const actualCostUsd = (actualTokensWithRag / 1000) * pricePerThousandTokensUsd;
        const savingsUsd = Math.max(hypotheticalCostUsd - actualCostUsd, 0);
        const savingsPercent = hypotheticalCostUsd > 0 ? (savingsUsd / hypotheticalCostUsd) * 100 : 0;
        return {
            hypotheticalCostUsd,
            actualCostUsd,
            savingsUsd,
            savingsPercent
        };
    }
}
exports.CostUtil = CostUtil;
