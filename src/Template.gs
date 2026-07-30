
const DRIVE_COPY_FOLDER_ID = '1xYfve3NSLGCUoO0SbGMtvU17MwZ7Zs0E' // _20nn KMS


function backupSpreadsheet() {
  GASLibrary.copySpreadsheetToDrive(DRIVE_COPY_FOLDER_ID, "Backup");
}

function setPriorityAndStatusDropdownLists() {
  GASLibrary.setGlobalLookupDropdownList("ConfigChange", "Priority", "cpi__priority", 1, { invalidHandling: "reject" });
  GASLibrary.setGlobalLookupDropdownList("ConfigChange", "Status", "cpi__status", 1, { invalidHandling: "reject" });
//  GASLibrary.setGlobalLookupDropdownList('WorkItem', 'Priority', 'workItems__priority',1, { invalidHandling: "reject" });
//  GASLibrary.setGlobalLookupDropdownList('WorkItem', 'Status', 'workItems__status',1, { invalidHandling: "reject" });
}
