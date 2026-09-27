import { Temporal } from '@js-temporal/polyfill';
import { describe, expect, it } from 'vitest';
import { getGitHubAge } from '../../src/lib/github-age';

describe('getGitHubAge', () => {
  it('calculates the age before the anniversary', () => {
    const result = getGitHubAge('2018-04-12T10:00:00Z', Temporal.PlainDate.from('2026-04-11'));

    expect(result.years).toBe(7);
    expect(result.nextAnniversary.toString()).toBe('2026-04-12');
  });

  it('calculates the age on the anniversary', () => {
    const result = getGitHubAge('2018-04-12T10:00:00Z', Temporal.PlainDate.from('2026-04-12'));

    expect(result.years).toBe(8);
    expect(result.nextAnniversary.toString()).toBe('2027-04-12');
  });

  it('calculates the age after the anniversary', () => {
    const result = getGitHubAge('2018-04-12T10:00:00Z', Temporal.PlainDate.from('2026-08-26'));

    expect(result.years).toBe(8);
    expect(result.nextAnniversary.toString()).toBe('2027-04-12');
  });

  it('handles a profile created this year', () => {
    const result = getGitHubAge('2026-06-01T10:00:00Z', Temporal.PlainDate.from('2026-08-26'));

    expect(result.years).toBe(0);
    expect(result.nextAnniversary.toString()).toBe('2027-06-01');
  });

  it('handles a profile created exactly today', () => {
    const result = getGitHubAge('2026-08-26T10:00:00Z', Temporal.PlainDate.from('2026-08-26'));

    expect(result.years).toBe(0);
    expect(result.nextAnniversary.toString()).toBe('2027-08-26');
  });

  it('handles February 29 profiles in a non-leap year', () => {
    const result = getGitHubAge('2016-02-29T10:00:00Z', Temporal.PlainDate.from('2026-02-28'));

    expect(result.years).toBe(10);
    expect(result.nextAnniversary.toString()).toBe('2027-02-28');
  });

  it('lands exactly on February 29 in a leap year', () => {
    const result = getGitHubAge('2016-02-29T10:00:00Z', Temporal.PlainDate.from('2028-02-29'));

    expect(result.years).toBe(12);
    expect(result.nextAnniversary.toString()).toBe('2029-02-28');
  });

  it('rejects future creation dates', () => {
    expect(() =>
      getGitHubAge('2030-01-01T00:00:00Z', Temporal.PlainDate.from('2026-08-26')),
    ).toThrow('GitHub creation date is in the future');
  });
});
