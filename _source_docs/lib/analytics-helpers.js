/**
 * Helper functions for analytics calculations
 */

/**
 * Calculates new average rating incorporating the latest rating
 * Uses weighted average based on attendee count
 */
export const calculateNewAverageRating = async (HostAnalytics, hostId, newRating) => {
  const analytics = await HostAnalytics.findOne({ hostId });
  if (!analytics) return newRating;

  const { daily } = analytics.performance;
  if (!daily || daily.length === 0) return newRating;

  const totalAttendees = daily.reduce((sum, day) => sum + day.attendeeCount, 0);
  const weightedSum = daily.reduce((sum, day) => 
    sum + (day.avgRating * day.attendeeCount), 0
  );

  return (weightedSum + newRating) / (totalAttendees + 1);
};

/**
 * Calculates revenue metrics for a given time period
 */
export const calculateRevenueMetrics = (daily, startDate, endDate) => {
  const periodData = daily.filter(day => 
    day.date >= startDate && day.date <= endDate
  );

  return {
    totalRevenue: periodData.reduce((sum, day) => sum + day.revenue, 0),
    avgRevenuePerDay: periodData.length ? 
      periodData.reduce((sum, day) => sum + day.revenue, 0) / periodData.length : 0,
    peakRevenueDay: periodData.reduce((max, day) => 
      day.revenue > max.revenue ? day : max, 
      periodData[0] || { revenue: 0 }
    ).date
  };
};

/**
 * Calculates audience growth metrics
 */
export const calculateAudienceGrowth = (current, previous) => {
  if (!previous) return {
    growth: 0,
    retentionRate: 0
  };

  const growth = ((current.totalAttendees - previous.totalAttendees) / previous.totalAttendees) * 100;
  const retentionRate = (current.returningAttendees / previous.totalAttendees) * 100;

  return {
    growth,
    retentionRate
  };
};

/**
 * Calculates marketing effectiveness metrics
 */
export const calculateMarketingEffectiveness = (channels) => {
  return channels.reduce((metrics, channel) => {
    const roi = ((channel.conversions * channel.revenue) - channel.cost) / channel.cost * 100;
    const cpa = channel.cost / channel.conversions;
    
    metrics[channel.name] = {
      roi,
      cpa,
      conversionRate: (channel.conversions / channel.clicks) * 100
    };
    
    return metrics;
  }, {});
};

/**
 * Predicts future attendance based on historical data
 * Uses simple moving average with seasonality
 */
export const predictAttendance = (historicalData, weeksAhead = 1) => {
  if (!historicalData || historicalData.length < 4) {
    return null;
  }

  // Calculate weekly averages
  const weeklyAverages = [];
  for (let i = 0; i < historicalData.length; i += 7) {
    const weekData = historicalData.slice(i, i + 7);
    const avg = weekData.reduce((sum, day) => sum + day.attendeeCount, 0) / weekData.length;
    weeklyAverages.push(avg);
  }

  // Calculate trend
  const trend = (weeklyAverages[weeklyAverages.length - 1] - weeklyAverages[0]) / weeklyAverages.length;

  // Calculate seasonality (if we have enough data)
  let seasonality = 1;
  if (weeklyAverages.length >= 4) {
    const sameWeekLastMonth = weeklyAverages[weeklyAverages.length - 4];
    seasonality = weeklyAverages[weeklyAverages.length - 1] / sameWeekLastMonth;
  }

  // Predict next week's attendance
  const baselinePrediction = weeklyAverages[weeklyAverages.length - 1] + (trend * weeksAhead);
  return Math.round(baselinePrediction * seasonality);
};

/**
 * Calculates optimal pricing based on demand and competition
 */
export const calculateOptimalPricing = (demandData, competitionPrices) => {
  const avgCompetitionPrice = competitionPrices.reduce((sum, price) => sum + price, 0) / competitionPrices.length;
  const demandElasticity = calculatePriceElasticity(demandData);
  
  // Base price on competition average
  let optimalPrice = avgCompetitionPrice;

  // Adjust based on demand elasticity
  if (demandElasticity < -1) {
    // Highly elastic - lower price to increase demand
    optimalPrice *= 0.9;
  } else if (demandElasticity > -0.5) {
    // Inelastic - can increase price
    optimalPrice *= 1.1;
  }

  // Ensure price stays within reasonable bounds
  const minPrice = Math.min(...competitionPrices) * 0.8;
  const maxPrice = Math.max(...competitionPrices) * 1.2;
  
  return Math.min(Math.max(optimalPrice, minPrice), maxPrice);
};

/**
 * Calculate price elasticity of demand
 */
function calculatePriceElasticity(demandData) {
  if (demandData.length < 2) return -1; // Default elastic

  const oldPrice = demandData[0].price;
  const newPrice = demandData[demandData.length - 1].price;
  const oldDemand = demandData[0].demand;
  const newDemand = demandData[demandData.length - 1].demand;

  const percentPriceChange = (newPrice - oldPrice) / oldPrice;
  const percentDemandChange = (newDemand - oldDemand) / oldDemand;

  return percentDemandChange / percentPriceChange;
} 