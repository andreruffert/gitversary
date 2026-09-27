import { Temporal } from '@js-temporal/polyfill';

export type GitHubAge = {
  years: number;
  nextAnniversary: Temporal.PlainDate;
};

function anniversaryForYear(created: Temporal.PlainDate, year: number): Temporal.PlainDate {
  if (
    created.month === 2 &&
    created.day === 29 &&
    !Temporal.PlainDate.from({ year, month: 2, day: 1 }).inLeapYear
  ) {
    return Temporal.PlainDate.from({ year, month: 2, day: 28 });
  }

  return created.with({ year });
}

export function getGitHubAge(createdAt: string, now: Temporal.PlainDate): GitHubAge {
  const created = Temporal.Instant.from(createdAt).toZonedDateTimeISO('UTC').toPlainDate();

  if (Temporal.PlainDate.compare(created, now) > 0) {
    throw new Error('GitHub creation date is in the future');
  }

  let years = now.year - created.year;

  const anniversaryThisYear = anniversaryForYear(created, now.year);

  if (Temporal.PlainDate.compare(now, anniversaryThisYear) < 0) {
    years--;
  }

  const nextAnniversary =
    Temporal.PlainDate.compare(now, anniversaryThisYear) >= 0
      ? anniversaryForYear(created, now.year + 1)
      : anniversaryThisYear;

  return {
    years,
    nextAnniversary,
  };
}
