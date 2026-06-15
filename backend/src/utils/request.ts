import { ParsedQs } from 'qs';

type QueryValue = string | ParsedQs | (string | ParsedQs)[] | undefined;

export const paramString = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value;

export const queryString = (value: QueryValue): string | undefined => {
  if (value === undefined) return undefined;
  if (Array.isArray(value)) return queryString(value[0]);
  if (typeof value === 'string') return value;
  return undefined;
};

export const queryDate = (value: QueryValue): Date | undefined => {
  const str = queryString(value);
  return str ? new Date(str) : undefined;
};

export const queryInt = (value: QueryValue): number | undefined => {
  const str = queryString(value);
  if (!str) return undefined;
  const parsed = parseInt(str, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};
