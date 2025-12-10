
import * as XLSX from 'xlsx';
import * as fs from 'fs';

const filePath = 'attached_assets/Service_Delivery_Management_Platform_(SDMP)_-_Estimation_Shee_1765409708854.xlsx';

try {
  const buf = fs.readFileSync(filePath);
  const wb = XLSX.read(buf, { type: 'buffer' });
  
  console.log('Sheet Names:', wb.SheetNames);
  
  wb.SheetNames.forEach(sheetName => {
    console.log(`\n--- Sheet: ${sheetName} ---`);
    const ws = wb.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }); // Array of arrays
    // Print first 5 rows to understand structure
    data.slice(0, 5).forEach((row, i) => {
        console.log(`Row ${i}:`, JSON.stringify(row));
    });
  });

} catch (e) {
  console.error('Error reading file:', e);
}
