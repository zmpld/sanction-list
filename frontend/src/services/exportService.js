import Papa from 'papaparse';

import * as XLSX from 'xlsx';

import { saveAs } from 'file-saver';

export function exportCSV(data) {
  const csv = Papa.unparse(data);

  const blob = new Blob([csv], {
    type: 'text/csv;charset=utf-8;',
  });

  saveAs(blob, 'sanctions_data.csv');
}

export function exportExcel(data) {
  const worksheet =
    XLSX.utils.json_to_sheet(data);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    'Sanctions'
  );

  const excelBuffer = XLSX.write(
    workbook,
    {
      bookType: 'xlsx',
      type: 'array',
    }
  );

  const blob = new Blob(
    [excelBuffer],
    {
      type:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8',
    }
  );

  saveAs(blob, 'sanctions_data.xlsx');
}