import { describe, expect, it } from 'vitest';
import { formatJoinedDate, formatNumber } from '../../src/lib/utils';

describe('formatJoinedDate', () => {
  it('formats an ISO date as an abbreviated month and year', () => {
    expect(formatJoinedDate('2011-01-25T00:00:00.000Z')).toBe('Jan 2011');
  });

  it('formats consistently in UTC regardless of the time component', () => {
    // Just after midnight UTC on Jan 1 should stay "Jan 2021" even though a
    // local-timezone formatter could roll this back to Dec 2020.
    expect(formatJoinedDate('2021-01-01T00:30:00.000Z')).toBe('Jan 2021');
  });

  it('returns the original value when the date cannot be parsed', () => {
    expect(formatJoinedDate('not-a-date')).toBe('not-a-date');
    expect(formatJoinedDate('')).toBe('');
  });
});

describe('formatNumber', () => {
  it('rounds small numbers to the nearest integer', () => {
    expect(formatNumber(42.6)).toBe('43');
    expect(formatNumber(0)).toBe('0');
    expect(formatNumber(999)).toBe('999');
  });

  it('uses compact notation with one decimal place below 10,000', () => {
    expect(formatNumber(1234)).toBe('1.2K');
    expect(formatNumber(9500)).toBe('9.5K');
  });

  it('uses compact notation with no decimal places at or above 10,000', () => {
    expect(formatNumber(12345)).toBe('12K');
    expect(formatNumber(15000)).toBe('15K');
    expect(formatNumber(25000000)).toBe('25M');
  });

  it('clamps negative numbers to zero', () => {
    expect(formatNumber(-50)).toBe('0');
  });

  it('returns zero for non-finite input', () => {
    expect(formatNumber(Number.NaN)).toBe('0');
    expect(formatNumber(Number.POSITIVE_INFINITY)).toBe('0');
    expect(formatNumber(Number.NEGATIVE_INFINITY)).toBe('0');
  });
});
