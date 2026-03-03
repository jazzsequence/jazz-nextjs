/**
 * Altis Audience Matcher
 *
 * Matches users to Altis audience segments based on targeting rules.
 * Ported from jazzsequence.com Altis Accelerate plugin.
 */

export interface AudienceRule {
  field: string;
  operator: '=' | 'lt' | 'gt' | 'lte' | 'gte';
  value: string;
  type: string;
}

export interface Audience {
  id: number;
  rules: AudienceRule[];
}

/**
 * Get current metrics for audience matching.
 */
function getCurrentMetrics() {
  const now = new Date();
  return {
    hour: now.getHours(),
    day: now.getDay(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    date: now.getDate(),
    month: now.getMonth(),
    year: now.getFullYear(),
  };
}

/**
 * Evaluate a single audience rule.
 */
function evaluateRule(rule: AudienceRule, metrics: ReturnType<typeof getCurrentMetrics>): boolean {
  const { field, operator, value } = rule;

  // Extract the field value from metrics
  let actualValue: number | undefined;

  if (field === 'metrics.hour') {
    actualValue = metrics.hour;
  } else if (field === 'metrics.day') {
    actualValue = metrics.day;
  } else if (field === 'metrics.date') {
    actualValue = metrics.date;
  } else if (field === 'metrics.month') {
    actualValue = metrics.month;
  } else if (field === 'metrics.year') {
    actualValue = metrics.year;
  } else if (field.startsWith('endpoint.Location.')) {
    // Geo-targeting not implemented client-side (requires server-side or geo API)
    return false;
  } else {
    // Unknown field
    return false;
  }

  // Compare using the specified operator
  const compareValue = parseInt(value, 10);

  switch (operator) {
    case '=':
      return actualValue === compareValue;
    case 'lt':
      return actualValue < compareValue;
    case 'gt':
      return actualValue > compareValue;
    case 'lte':
      return actualValue <= compareValue;
    case 'gte':
      return actualValue >= compareValue;
    default:
      return false;
  }
}

/**
 * Match audiences against current user context.
 *
 * Returns array of matching audience IDs in priority order.
 * Uses AND logic within each audience (all rules must match).
 *
 * @param audiences - Array of audience definitions with rules
 * @returns Array of matching audience IDs
 */
export function matchAudiences(audiences: Audience[]): number[] {
  const metrics = getCurrentMetrics();
  const matched: number[] = [];

  for (const audience of audiences) {
    // All rules must match (AND logic)
    const allRulesMatch = audience.rules.every(rule => evaluateRule(rule, metrics));

    if (allRulesMatch) {
      matched.push(audience.id);
    }
  }

  return matched;
}
