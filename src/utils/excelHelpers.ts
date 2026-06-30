import ExcelJS from 'exceljs';

export async function downloadExcelTemplate(rows: (string | number)[][], filename: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Template');
  for (const row of rows) ws.addRow(row);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8F5E9' } };
  ws.columns.forEach((col) => { col.width = 25; });
  const buffer = await wb.xlsx.writeBuffer();
  downloadBuffer(buffer, filename);
}

export async function importExcelFile(
  file: File,
  colMap: Record<string, number>,
  skipRows = 1
): Promise<Record<string, unknown>[]> {
  const buffer = await file.arrayBuffer();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  const result: Record<string, unknown>[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber <= skipRows) return;
    const obj: Record<string, unknown> = {};
    for (const [key, colIdx] of Object.entries(colMap)) {
      const cell = row.getCell(colIdx + 1);
      obj[key] = cell.value;
    }
    result.push(obj);
  });
  return result;
}

export function downloadBuffer(buffer: ExcelJS.Buffer | ArrayBuffer, filename: string) {
  const blob = new Blob([buffer as ArrayBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function borderAll(ws: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number, style: ExcelJS.BorderStyle = 'thin') {
  for (let r = startRow; r <= endRow; r++) {
    for (let c = startCol; c <= endCol; c++) {
      const cell = ws.getCell(r, c);
      cell.border = { top: { style }, left: { style }, bottom: { style }, right: { style } };
    }
  }
}

export function setAlignment(ws: ExcelJS.Worksheet, row: number, col: number, horizontal: ExcelJS.Alignment['horizontal'] = 'center', vertical: ExcelJS.Alignment['vertical'] = 'middle', wrapText = true) {
  ws.getCell(row, col).alignment = { horizontal, vertical, wrapText };
}
