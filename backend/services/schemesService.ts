import { Scheme, SchemeMatchInput, SchemeMatchResult } from '../../src/types/health';

export const STATIC_SCHEMES: Scheme[] = [
  {
    id: 'pmjay',
    name: 'Ayushman Bharat Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    shortName: 'PM-JAY',
    description: 'World\'s largest government-funded healthcare scheme providing cashless secondary & tertiary hospital care.',
    benefits: '₹5 Lakhs per family per year for secondary and tertiary care hospitalization across impaneled hospitals.',
    eligibilitySummary: 'Deprived rural households based on SECC 2011, BPL families, or annual household income < ₹1,20,000.',
    category: 'Health Insurance'
  },
  {
    id: 'jsy',
    name: 'Janani Suraksha Yojana (JSY)',
    shortName: 'JSY',
    description: 'Safe motherhood intervention under National Health Mission promoting institutional delivery among poor pregnant women.',
    benefits: 'Direct cash assistance of ₹1,400 for institutional delivery in rural areas plus free transport & ASHA incentive.',
    eligibilitySummary: 'Pregnant women aged 19+ belonging to BPL/SC/ST households delivering in government health centers.',
    category: 'Maternal Health'
  },
  {
    id: 'rsby',
    name: 'Rashtriya Swasthya Bima Yojana / State Health Protection Card',
    shortName: 'RSBY',
    description: 'Health insurance scheme for unorganized sector workers and BPL families.',
    benefits: 'Cashless health insurance coverage up to ₹30,000 per family per year for most hospitalization-related illnesses.',
    eligibilitySummary: 'Unorganized sector workers, BPL ration card holders, and low-income families.',
    category: 'Health Protection'
  },
  {
    id: 'pmmvy',
    name: 'Pradhan Mantri Matru Vandana Yojana (PMMVY)',
    shortName: 'PMMVY',
    description: 'Maternity benefit program offering cash incentives for pregnant and lactating mothers.',
    benefits: 'Direct Cash Benefit of ₹5,000 in three installments upon early pregnancy registration and child vaccination.',
    eligibilitySummary: 'Pregnant women and lactating mothers for the first living child of the family.',
    category: 'Maternity Benefit'
  },
  {
    id: 'nhm_drugs',
    name: 'NHM Free Drugs and Free Diagnostics Service Initiative',
    shortName: 'NHM Free Care',
    description: 'Government initiative ensuring zero out-of-pocket expenditure for essential medicines and diagnostic tests at public health centers.',
    benefits: 'Free essential medicines, lab diagnostic tests, blood transfusion services, and free transport at PHC/CHCs.',
    eligibilitySummary: 'All citizens visiting Primary Health Centres, Community Health Centres, and Sub-District Hospitals.',
    category: 'Universal Care'
  }
];

export function matchSchemes(input: SchemeMatchInput): SchemeMatchResult[] {
  const age = input.age ?? 30;
  const income = input.income ?? 100000;
  const isBPL = input.is_bpl ?? (income <= 120000);
  const isPregnant = input.is_pregnant ?? false;

  const results: SchemeMatchResult[] = [];

  for (const scheme of STATIC_SCHEMES) {
    let matched = false;
    let score = 0;
    const criteria: string[] = [];

    if (scheme.id === 'pmjay') {
      if (isBPL) {
        matched = true;
        score += 50;
        criteria.push('BPL Ration Card status verified');
      }
      if (income <= 120000) {
        matched = true;
        score += 40;
        criteria.push(`Annual household income (₹${income.toLocaleString('en-IN')}) is below the ₹1.2 Lakh threshold`);
      }
      if (!matched) {
        score = 20;
        criteria.push('Universal rural eligibility assessment available at local PHC helpdesk');
      }
    } else if (scheme.id === 'jsy') {
      if (isPregnant) {
        matched = true;
        score += 60;
        criteria.push('Currently pregnant woman seeking institutional delivery care');
      }
      if (age >= 19) {
        if (isPregnant) score += 30;
        criteria.push(`Age (${age} years) satisfies the 19+ age requirement`);
      }
      if (isBPL && isPregnant) {
        score += 10;
        criteria.push('BPL maternal cash assistance multiplier applied');
      }
    } else if (scheme.id === 'rsby') {
      if (isBPL || income <= 200000) {
        matched = true;
        score += 70;
        criteria.push(`Income level (₹${income.toLocaleString('en-IN')}/yr) qualifies for unorganized sector state card`);
      } else {
        score = 30;
        criteria.push('Subject to localized district labor department enrollment verification');
      }
    } else if (scheme.id === 'pmmvy') {
      if (isPregnant) {
        matched = true;
        score += 80;
        criteria.push('Pregnant mother eligible for ₹5,000 nutritional cash transfer installments');
      } else {
        score = 15;
        criteria.push('Applicable upon pregnancy registration at local Anganwadi/PHC');
      }
    } else if (scheme.id === 'nhm_drugs') {
      matched = true;
      score = 95;
      criteria.push('All rural citizens qualify for 100% free essential medicines and lab tests at PHC/CHCs');
      if (isBPL) {
        criteria.push('Priority access for free diagnostic lab panels and emergency ambulance (108)');
      }
    }

    let qualificationReason = '';
    if (matched) {
      qualificationReason = `You qualify because: ${criteria.join('; ')}.`;
    } else {
      qualificationReason = `Partial match. Prerequisites: ${scheme.eligibilitySummary}`;
    }

    results.push({
      scheme,
      matched,
      score,
      qualificationReason,
      matchedCriteria: criteria
    });
  }

  return results.sort((a, b) => (b.matched ? 1 : 0) - (a.matched ? 1 : 0) || b.score - a.score);
}
