declare module 'date-fns-tz' {
  export function format(date: Date, formatStr: string, options?: { timeZone?: string }): string;
  export function toZonedTime(date: Date, timeZone: string): Date;
} 