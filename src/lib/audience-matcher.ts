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

export interface EndpointData {
  country?: string;
  city?: string;
  region?: string;
  timezone?: string; // IANA timezone (e.g., "America/Denver")
}

/**
 * Get current metrics for audience matching.
 * @param timezone - Optional IANA timezone string (e.g., "America/Denver")
 */
function getCurrentMetrics(timezone?: string) {
  const now = new Date();

  // If timezone is provided, convert to that timezone
  if (timezone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: 'numeric',
        hour12: false,
        weekday: 'narrow',
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
      });

      const parts = formatter.formatToParts(now);
      const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const weekday = parts.find(p => p.type === 'weekday')?.value;
      const dayOfWeek = weekday ? ['S', 'M', 'T', 'W', 'T', 'F', 'S'].indexOf(weekday) : now.getDay();
      const date = parseInt(parts.find(p => p.type === 'day')?.value || '0', 10);
      const month = parseInt(parts.find(p => p.type === 'month')?.value || '0', 10) - 1; // 0-indexed
      const year = parseInt(parts.find(p => p.type === 'year')?.value || '0', 10);

      return {
        hour,
        day: dayOfWeek === -1 ? now.getDay() : dayOfWeek,
        date,
        month,
        year,
      };
    } catch (error) {
      // Fall back to server time if timezone conversion fails
      console.error('Invalid timezone, falling back to server time:', timezone, error);
    }
  }

  // Default: use server timezone
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
function evaluateRule(
  rule: AudienceRule,
  metrics: ReturnType<typeof getCurrentMetrics>,
  endpoints: EndpointData = {}
): boolean {
  const { field, operator, value } = rule;

  // Handle endpoint fields (geo-targeting)
  if (field.startsWith('endpoints.')) {
    const endpointField = field.replace('endpoints.', '');
    let endpointValue: string | undefined;

    if (endpointField === 'country') {
      endpointValue = endpoints.country;
    } else if (endpointField === 'city') {
      endpointValue = endpoints.city;
    } else if (endpointField === 'region') {
      endpointValue = endpoints.region;
    }

    // For string comparisons, only support '=' operator
    if (operator === '=' && endpointValue !== undefined) {
      return endpointValue === value;
    }

    return false;
  }

  // Handle legacy endpoint.Location fields
  if (field.startsWith('endpoint.Location.')) {
    // Not implemented - use endpoints.* instead
    return false;
  }

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
 * @param endpoints - Optional endpoint data for geo-targeting (country, city, region, timezone)
 * @returns Array of matching audience IDs
 */
export function matchAudiences(audiences: Audience[], endpoints: EndpointData = {}): number[] {
  const metrics = getCurrentMetrics(endpoints.timezone);
  const matched: number[] = [];

  for (const audience of audiences) {
    // All rules must match (AND logic)
    const allRulesMatch = audience.rules.every(rule => evaluateRule(rule, metrics, endpoints));

    if (allRulesMatch) {
      matched.push(audience.id);
    }
  }

  return matched;
}
