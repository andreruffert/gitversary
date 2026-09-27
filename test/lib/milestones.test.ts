import { describe, expect, it } from 'vitest';
import { getMilestoneData } from '../../src/lib/milestones';

describe('getMilestoneData', () => {
  it('returns null when there is no matching milestone yet', () => {
    expect(getMilestoneData({ username: 'octocat', years: 0 })).toBeNull();
  });

  it('picks the rookie tier at the first milestone', () => {
    const result = getMilestoneData({ username: 'octocat', years: 1 });

    expect(result).toMatchObject({
      tier: 'rookie',
      title: 'Fresh Committer',
      badge: 'README Rookie',
      status: 'LGTM',
    });
  });

  it('deterministically selects the same saying for the same username and tier', () => {
    // "octocat" sums to 749 across its char codes; 749 % 4 (rookie has 4
    // sayings) === 1, so this pins down the exact saying deterministically.
    const first = getMilestoneData({ username: 'octocat', years: 1 });
    const second = getMilestoneData({ username: 'octocat', years: 1 });

    expect(first?.saying).toBe('1 year. 47,392 tabs.');
    expect(second?.saying).toBe(first?.saying);
  });

  it('stays on the lower tier just below a threshold', () => {
    const result = getMilestoneData({ username: 'octocat', years: 4 });

    expect(result?.tier).toBe('seasoned');
    expect(result?.title).toBe('Branch Wrangler');
  });

  it('crosses into the next tier exactly at the threshold', () => {
    const result = getMilestoneData({ username: 'octocat', years: 5 });

    expect(result?.tier).toBe('experienced');
    expect(result?.title).toBe('Senior Googler');
  });

  it('resolves {YearsWords} templates with a capitalized number word', () => {
    const result = getMilestoneData({ username: 'octocat', years: 25 });

    expect(result?.summary.startsWith('Twenty-five years of software history')).toBe(true);
  });

  it('resolves {YearsWords} templates for two-digit compound numbers', () => {
    const result = getMilestoneData({ username: 'octocat', years: 31 });

    expect(result?.summary.startsWith('Thirty-one years of building software')).toBe(true);
  });

  it('falls back to the raw digits once the number word list runs out', () => {
    const result = getMilestoneData({ username: 'octocat', years: 100 });

    expect(result?.summary.startsWith('100 years of software')).toBe(true);
  });

  it('never leaves an unresolved template placeholder in the output', () => {
    for (const years of [1, 2, 3, 5, 7, 10, 12, 15, 18, 20, 25, 30, 35, 40, 60]) {
      const result = getMilestoneData({ username: 'monalisa', years });

      expect(result?.summary).not.toMatch(/\{.*\}/);
      expect(result?.saying).not.toMatch(/\{.*\}/);
    }
  });

  it('reaches the top tier for very high year counts', () => {
    const result = getMilestoneData({ username: 'octocat', years: 45 });

    expect(result?.tier).toBe('immortal');
    expect(result?.title).toBe('The Maintainer');
  });
});
