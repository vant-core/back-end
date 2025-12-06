export interface CostEstimateInput {
  // tokens que seriam usados sem RAG (ex.: full doc)
  hypotheticalTokensWithoutRag: number;
  // tokens reais medidos pela API (total_tokens)
  actualTokensWithRag: number;
  // preço por 1000 tokens em USD (input + output juntos, simplificado)
  pricePerThousandTokensUsd: number;
}

export interface CostEstimateResult {
  hypotheticalCostUsd: number;
  actualCostUsd: number;
  savingsUsd: number;
  savingsPercent: number;
}

export class CostUtil {
  static estimateRagSavings(input: CostEstimateInput): CostEstimateResult {
    const { hypotheticalTokensWithoutRag, actualTokensWithRag, pricePerThousandTokensUsd } = input;

    const hypotheticalCostUsd = (hypotheticalTokensWithoutRag / 1000) * pricePerThousandTokensUsd;
    const actualCostUsd = (actualTokensWithRag / 1000) * pricePerThousandTokensUsd;

    const savingsUsd = Math.max(hypotheticalCostUsd - actualCostUsd, 0);
    const savingsPercent =
      hypotheticalCostUsd > 0 ? (savingsUsd / hypotheticalCostUsd) * 100 : 0;

    return {
      hypotheticalCostUsd,
      actualCostUsd,
      savingsUsd,
      savingsPercent
    };
  }
}
