function escapeCsv(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export function toCsv(rows) {
  const columns = [
    'createdAt', 'answer', 'dateType', 'restaurant', 'cafe', 'movie',
    'sunsetSpot', 'surprise', 'dateDate', 'dateTime', 'location', 'message', 'noReason'
  ];
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(','))
  ].join('\n');
}
