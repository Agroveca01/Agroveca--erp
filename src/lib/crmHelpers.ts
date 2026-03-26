export interface CRMCustomerLike {
  id: string;
  name: string;
  email: string;
  total_spent: number;
  loyalty_tier: number;
}

export interface TierDistribution {
  brote: number;
  crecimiento: number;
  bosque: number;
}

export interface CRMSummary<T extends CRMCustomerLike> {
  filteredCustomers: T[];
  topCustomers: T[];
  totalLTV: number;
  avgLTV: number;
  tierDistribution: TierDistribution;
  maxTierCount: number;
}

export const filterCRMCustomers = <T extends Pick<CRMCustomerLike, 'name' | 'email'>>(
  customers: T[],
  searchTerm: string,
): T[] => {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return customers;
  }

  return customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(normalizedSearch) ||
      customer.email.toLowerCase().includes(normalizedSearch),
  );
};

export const getCRMSummary = <T extends CRMCustomerLike>(
  customers: T[],
  searchTerm: string,
): CRMSummary<T> => {
  const filteredCustomers = filterCRMCustomers(customers, searchTerm);
  const topCustomers = customers.slice(0, 5);
  const totalLTV = customers.reduce((sum, customer) => sum + Number(customer.total_spent), 0);
  const avgLTV = customers.length > 0 ? totalLTV / customers.length : 0;
  const tierDistribution = {
    brote: customers.filter((customer) => customer.loyalty_tier === 1).length,
    crecimiento: customers.filter((customer) => customer.loyalty_tier === 2).length,
    bosque: customers.filter((customer) => customer.loyalty_tier === 3).length,
  };
  const maxTierCount = Math.max(
    tierDistribution.brote,
    tierDistribution.crecimiento,
    tierDistribution.bosque,
    1,
  );

  return {
    filteredCustomers,
    topCustomers,
    totalLTV,
    avgLTV,
    tierDistribution,
    maxTierCount,
  };
};
