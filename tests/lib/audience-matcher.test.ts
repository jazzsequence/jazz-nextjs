import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { matchAudiences, type AudienceRule } from '@/lib/audience-matcher';

describe('matchAudiences', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('time-based audiences', () => {
    const morningRules: AudienceRule[] = [
      { field: 'metrics.hour', operator: 'lt', value: '11', type: 'string' }
    ];

    const afternoonRules: AudienceRule[] = [
      { field: 'metrics.hour', operator: 'gt', value: '11', type: 'string' },
      { field: 'metrics.hour', operator: 'lt', value: '17', type: 'string' }
    ];

    const eveningRules: AudienceRule[] = [
      { field: 'metrics.hour', operator: 'gte', value: '17', type: 'string' }
    ];

    it('should match morning audience (hour < 11)', () => {
      // 9:00 AM
      vi.setSystemTime(new Date('2024-01-01T09:00:00'));
      expect(matchAudiences([{ id: 16719, rules: morningRules }])).toContain(16719);
    });

    it('should match afternoon audience (hour > 11 AND hour < 17)', () => {
      // 3:00 PM
      vi.setSystemTime(new Date('2024-01-01T15:00:00'));
      expect(matchAudiences([{ id: 16720, rules: afternoonRules }])).toContain(16720);
    });

    it('should match evening audience (hour >= 17)', () => {
      // 8:00 PM
      vi.setSystemTime(new Date('2024-01-01T20:00:00'));
      expect(matchAudiences([{ id: 16722, rules: eveningRules }])).toContain(16722);
    });

    it('should handle edge case: exactly noon (12:00 PM)', () => {
      vi.setSystemTime(new Date('2024-01-01T12:00:00'));
      expect(matchAudiences([{ id: 16720, rules: afternoonRules }])).toContain(16720);
    });

    it('should handle edge case: exactly 5:00 PM', () => {
      vi.setSystemTime(new Date('2024-01-01T17:00:00'));
      expect(matchAudiences([{ id: 16722, rules: eveningRules }])).toContain(16722);
    });
  });

  describe('day-based audiences', () => {
    const ddRules: AudienceRule[] = [
      { field: 'metrics.day', operator: '=', value: '4', type: 'string' }, // Thursday
      { field: 'metrics.hour', operator: 'gt', value: '17', type: 'string' },
      { field: 'metrics.hour', operator: 'lte', value: '21', type: 'string' }
    ];

    it('should match D&D time (Thursday 5-9pm)', () => {
      // Thursday 7:00 PM
      vi.setSystemTime(new Date('2024-01-04T19:00:00')); // Jan 4, 2024 is Thursday
      expect(matchAudiences([{ id: 16726, rules: ddRules }])).toContain(16726);
    });

    it('should NOT match D&D time on wrong day (Friday)', () => {
      // Friday 7:00 PM
      vi.setSystemTime(new Date('2024-01-05T19:00:00')); // Jan 5, 2024 is Friday
      expect(matchAudiences([{ id: 16726, rules: ddRules }])).not.toContain(16726);
    });

    it('should NOT match D&D time outside time window (Thursday 10pm)', () => {
      // Thursday 10:00 PM (after 9pm cutoff)
      vi.setSystemTime(new Date('2024-01-04T22:00:00'));
      expect(matchAudiences([{ id: 16726, rules: ddRules }])).not.toContain(16726);
    });
  });

  describe('priority and fallback', () => {
    it('should return multiple matching audiences in order', () => {
      // Thursday 7:00 PM - matches both Evening AND D&D time
      vi.setSystemTime(new Date('2024-01-04T19:00:00'));

      const audiences = [
        { id: 16722, rules: [{ field: 'metrics.hour', operator: 'gte', value: '17', type: 'string' }] }, // Evening
        { id: 16726, rules: [
          { field: 'metrics.day', operator: '=', value: '4', type: 'string' },
          { field: 'metrics.hour', operator: 'gt', value: '17', type: 'string' },
          { field: 'metrics.hour', operator: 'lte', value: '21', type: 'string' }
        ]} // D&D
      ];

      const matched = matchAudiences(audiences);
      expect(matched).toContain(16722);
      expect(matched).toContain(16726);
    });

    it('should return empty array when no audiences match', () => {
      vi.setSystemTime(new Date('2024-01-01T09:00:00')); // Monday 9am

      const audiences = [
        { id: 16726, rules: [
          { field: 'metrics.day', operator: '=', value: '4', type: 'string' }, // Thursday only
          { field: 'metrics.hour', operator: 'gt', value: '17', type: 'string' }
        ]}
      ];

      expect(matchAudiences(audiences)).toEqual([]);
    });
  });

  describe('operator handling', () => {
    it('should handle "=" operator', () => {
      vi.setSystemTime(new Date('2024-01-04T12:00:00')); // Thursday
      const rules: AudienceRule[] = [
        { field: 'metrics.day', operator: '=', value: '4', type: 'string' }
      ];
      expect(matchAudiences([{ id: 1, rules }])).toContain(1);
    });

    it('should handle "lt" operator', () => {
      vi.setSystemTime(new Date('2024-01-01T10:00:00')); // 10am
      const rules: AudienceRule[] = [
        { field: 'metrics.hour', operator: 'lt', value: '11', type: 'string' }
      ];
      expect(matchAudiences([{ id: 1, rules }])).toContain(1);
    });

    it('should handle "gt" operator', () => {
      vi.setSystemTime(new Date('2024-01-01T15:00:00')); // 3pm
      const rules: AudienceRule[] = [
        { field: 'metrics.hour', operator: 'gt', value: '11', type: 'string' }
      ];
      expect(matchAudiences([{ id: 1, rules }])).toContain(1);
    });

    it('should handle "lte" operator', () => {
      vi.setSystemTime(new Date('2024-01-01T21:00:00')); // 9pm
      const rules: AudienceRule[] = [
        { field: 'metrics.hour', operator: 'lte', value: '21', type: 'string' }
      ];
      expect(matchAudiences([{ id: 1, rules }])).toContain(1);
    });

    it('should handle "gte" operator', () => {
      vi.setSystemTime(new Date('2024-01-01T17:00:00')); // 5pm
      const rules: AudienceRule[] = [
        { field: 'metrics.hour', operator: 'gte', value: '17', type: 'string' }
      ];
      expect(matchAudiences([{ id: 1, rules }])).toContain(1);
    });
  });

  describe('ALL rules must match (AND logic)', () => {
    it('should NOT match if any rule fails', () => {
      vi.setSystemTime(new Date('2024-01-04T10:00:00')); // Thursday 10am

      const rules: AudienceRule[] = [
        { field: 'metrics.day', operator: '=', value: '4', type: 'string' }, // ✓ Thursday
        { field: 'metrics.hour', operator: 'gt', value: '17', type: 'string' } // ✗ Not after 5pm
      ];

      expect(matchAudiences([{ id: 1, rules }])).not.toContain(1);
    });

    it('should match only if ALL rules pass', () => {
      vi.setSystemTime(new Date('2024-01-04T19:00:00')); // Thursday 7pm

      const rules: AudienceRule[] = [
        { field: 'metrics.day', operator: '=', value: '4', type: 'string' }, // ✓ Thursday
        { field: 'metrics.hour', operator: 'gt', value: '17', type: 'string' }, // ✓ After 5pm
        { field: 'metrics.hour', operator: 'lte', value: '21', type: 'string' } // ✓ Before 9pm
      ];

      expect(matchAudiences([{ id: 1, rules }])).toContain(1);
    });
  });
});
