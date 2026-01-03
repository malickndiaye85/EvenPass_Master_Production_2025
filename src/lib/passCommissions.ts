export interface CommissionBreakdown {
  baseAmount: number;
  commission: number;
  mobileMoney: number;
  netAmount: number;
  totalAmount: number;
}

export const calculateCommissions = (baseAmount: number): CommissionBreakdown => {
  const commission = baseAmount * 0.05;
  const amountAfterCommission = baseAmount + commission;
  const mobileMoney = amountAfterCommission * 0.015;
  const totalAmount = amountAfterCommission + mobileMoney;

  return {
    baseAmount,
    commission,
    mobileMoney,
    netAmount: amountAfterCommission,
    totalAmount: Math.round(totalAmount)
  };
};

export const formatAmount = (amount: number): string => {
  return amount.toLocaleString('fr-FR');
};
