import Papa from 'papaparse';

export function exportCSV(data) {
  const csv = Papa.unparse(data);

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');

  link.href = url;
  link.download = 'sanctions_results.csv';

  link.click();
}