
const DRIVE_COPY_FOLDER_ID = '1xYfve3NSLGCUoO0SbGMtvU17MwZ7Zs0E' // _20nn KMS


function backupSpreadsheet() {
  GASLibrary.copySpreadsheetToDrive(DRIVE_COPY_FOLDER_ID, "Backup");
}




function sortActiveSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  GASLibrary.sortSheetByConfig(ss, SORT_CONFIGS);
}