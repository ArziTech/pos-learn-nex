export function excelTimeToDate(excelSerial: number): Date {
  const msPerDay = 86400000;
  const baseDateUTC = Date.UTC(1899, 11, 30);

  return new Date(baseDateUTC + excelSerial * msPerDay);
}
