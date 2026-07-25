function checkForNewVideos_Last7Days() {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  checkForNewVideosWithOverrideDate(sevenDaysAgo);
}


function checkForNewVideosWithOverrideDate(overrideDate) {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Channels');

  const EMAIL_ROUTING = getEmailRoutingFromSheet();
  const channelData = sheet.getDataRange().getValues();
  const headers = channelData[0].map(h => h.toString().trim());

  const col = {};
  headers.forEach((h, i) => col[h] = i);

  const channels = channelData.slice(1).map(row => ({
    id: row[col.ID],
    channelName: row[col.ChannelName],
    channelId: row[col.ChannelID],
    uploadsPlaylistId: row[col.UploadsPlaylistId],
    lastVideoDate: overrideDate || row[col.LastVideoDate],
    person: (row[col.Person] || 'AAS').toString().trim().toUpperCase()
  }));

  const updatesByPerson = {};

  channels.forEach((channel, index) => {
    const videos = getNewVideosForChannel(channel);

    if (videos && videos.length > 0) {
      const rowIndex = index + 2;

      GASLibrary.setDateValue(
        sheet.getRange(rowIndex, col.LastVideoDate + 1),
        videos[0].published,
        { format: 'yyyy-MM-dd' }
      );

      if (!updatesByPerson[channel.person]) {
        updatesByPerson[channel.person] = [];
      }

      updatesByPerson[channel.person].push({ channel, videos });
    }
  });

  Object.entries(updatesByPerson).forEach(([person, updates]) => {
    const recipient = EMAIL_ROUTING[person];

    if (!recipient) return;

    const html = generateEmailContent(updates);
    sendNotificationEmail(html, recipient);
  });
}