// Vanilla template configuration file.
// Add shared constants and configuration values here.

const SS = SpreadsheetApp.getActiveSpreadsheet();

const TEMPLATE_NOTE = 'This is a vanilla GAS template. Replace with your project config.';

const SORT_CONFIGS = {
  Cpi: {
    sortColumns: [
      { column: 3, ascending: true },
      { column: 4, ascending: true },
      { column: 5, ascending: true },
      { column: 2, ascending: true }
    ],
    headerRows: 1
  },
  
  Channels: {
    sortColumns: [
      { column: 6, ascending: true },
      { column: 7, ascending: true },
      { column: 2, ascending: true }
    ],
    headerRows: 1
  },
  
  Sheet1: {
    sortColumns: [{ column: 3, ascending: true }]
  }
};
