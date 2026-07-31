// Membership plans — basePrice is CSI fee; platformFee is transaction/gateway fee
export const membershipPlans = [
  {
    id: 'one-year',
    name: '1-Year Executive Membership',
    basePrice: 350,
    platformFee: 8,
    duration: '1 Year',
    popular: true,
    features: [
      'Access to all workshops and events',
      'Exclusive learning resources',
      'Certificate of membership',
      'Networking opportunities',
      'Project collaboration',
      'Career guidance',
      'Competition participation',
      'CSI India membership benefits'
    ]
  },
  {
    id: 'two-year',
    name: '2-Year Executive Membership',
    basePrice: 650,
    platformFee: 14,
    duration: '2 Years',
    popular: false,
    features: [
      'All 1-year benefits included',
      'Extended access to resources',
      'Certificate of membership',
      'Priority event access',
      'Project collaboration',
      'Mentorship opportunities',
      'Competition participation',
      'CSI India membership benefits',
      'Special discounts on events'
    ]
  },
  {
    id: 'three-year',
    name: '3-Year Executive Membership',
    basePrice: 900,
    platformFee: 19,
    duration: '3 Years',
    popular: false,
    features: [
      'All 2-year benefits included',
      'Long-term membership access',
      'Certificate of membership',
      'VIP event access',
      'Extended project collaboration',
      'Advanced mentorship program',
      'Exclusive competition access',
      'CSI India membership benefits',
      'Best value for long-term members',
      'Alumni network access'
    ]
  }
] as const

export type MembershipPlanId = (typeof membershipPlans)[number]['id']
export type MembershipPlan = (typeof membershipPlans)[number]

export function getPlanById(planId: string): MembershipPlan | undefined {
  return membershipPlans.find((p) => p.id === planId)
}

/** Short human label for plan id (e.g. one-year → "1 Year") */
export function getPlanDisplayLabel(planId: string | null | undefined): string {
  if (!planId) return 'CSI Member'
  const plan = getPlanById(planId)
  if (plan) return plan.duration
  return planId.replace(/-/g, ' ')
}

export function isMembershipActive(membership?: {
  status?: string | null
  expiresAt?: Date | string | null
} | null): boolean {
  if (!membership || membership.status !== 'active') return false
  if (!membership.expiresAt) return true
  return new Date(membership.expiresAt) > new Date()
}

/** Total charged to member (membership + transaction fee), in rupees */
export function getPlanTotal(plan: Pick<MembershipPlan, 'basePrice' | 'platformFee'>): number {
  return plan.basePrice + plan.platformFee
}

/** Razorpay / UI line-item breakdown (amounts in rupees) */
export function getPlanPriceBreakdown(plan: MembershipPlan) {
  return {
    membership: plan.basePrice,
    transactionFee: plan.platformFee,
    total: getPlanTotal(plan),
    lines: [
      { name: plan.name, amount: plan.basePrice },
      { name: 'Transaction fee', amount: plan.platformFee },
    ] as const,
  }
}

// Benefits of joining CSI
export const membershipBenefits = [
  { 
    icon: 'Users', 
    title: 'Community', 
    desc: 'Connect with 500+ tech enthusiasts' 
  },
  { 
    icon: 'Calendar', 
    title: 'Events', 
    desc: '50+ workshops and seminars yearly' 
  },
  { 
    icon: 'Award', 
    title: 'Recognition', 
    desc: 'Certificates and achievements' 
  },
  { 
    icon: 'Zap', 
    title: 'Skills', 
    desc: 'Learn cutting-edge technologies' 
  }
]
