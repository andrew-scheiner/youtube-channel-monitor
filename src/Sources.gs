function setPriorityAndStatusDropdownLists() {
  GASLibrary.setGlobalLookupDropdownList("ConfigChange", "Priority", "cpi__priority", 1, { invalidHandling: "reject" });
  GASLibrary.setGlobalLookupDropdownList("ConfigChange", "Status", "cpi__status", 1, { invalidHandling: "reject" });
  //GASLibrary.setGlobalLookupDropdownList('WorkItem', 'Priority', 'workItems__priority',1, { invalidHandling: "reject" });
  //GASLibrary.setGlobalLookupDropdownList('WorkItem', 'Status', 'workItems__status',1, { invalidHandling: "reject" });
}

function importConfigItems() {
  GASLibrary.importConfigItems();
}