import getCohortRetentionCohorts from './get-cohort-retention-cohorts.js';
import getCohortRetentionRates from './get-cohort-retention-rates.js';
import getCohortMonthlyChurnAndGrowth from './get-cohort-monthly-churn-and-growth.js';
import getCohortDashboard from './get-cohort-dashboard.js';
import { parseISO } from 'date-fns';

export default (context) => {
  const Subscription = context.models.Subscription;
  const retentionCohorts = getCohortRetentionCohorts({ Subscription });
  return {
    getCohortRetentionCohorts: retentionCohorts,
    getCohortRetentionRates: getCohortRetentionRates({ getCohortRetentionCohorts: retentionCohorts }),
    getCohortMonthlyChurnAndGrowth: getCohortMonthlyChurnAndGrowth({ Subscription, parseISO }),
    getCohortDashboard: getCohortDashboard({ Subscription, parseISO })
  };
}; 