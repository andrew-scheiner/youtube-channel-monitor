function setPriorityAndStatusDropdownLists() {
  GASLibrary.setGlobalLookupDropdownList("Channel", "Status", "channels__status", 1, { invalidHandling: "reject" });
}