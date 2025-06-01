import getRevenueMonthlyReport from './get-revenue-monthly-report.js';
import getRevenueAnnualReport from './get-revenue-annual-report.js';
import getRevenueByPlan from './get-revenue-by-plan.js';
import getInvoiceStatusBreakdown from './get-invoice-status-breakdown.js';
import { parseISO } from 'date-fns';

const STATUS_PAID = 'paid';
const STATUS_OPEN = 'open';
const STATUS_VOID = 'void';

export default (context) => {
  const Invoice = context.models.Invoice;
  return {
    getRevenueMonthlyReport: getRevenueMonthlyReport({ Invoice, parseISO, STATUS_PAID }),
    getRevenueAnnualReport: getRevenueAnnualReport({ Invoice, STATUS_PAID }),
    getRevenueByPlan: getRevenueByPlan({ Invoice, parseISO, STATUS_PAID }),
    getInvoiceStatusBreakdown: getInvoiceStatusBreakdown({ Invoice, parseISO, STATUS_PAID, STATUS_OPEN, STATUS_VOID })
  };
}; 