function populateUploadsPlaylistIds() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet(); // or specify your sheet name

  const API_KEY = PropertiesService
    .getScriptProperties()
    .getProperty('YOUTUBE_API_KEY');

  if (!API_KEY) {
    throw new Error('Missing YOUTUBE_API_KEY in Script Properties');
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const colIndex = {
    channelName: headers.indexOf('ChannelName'),
    channelId: headers.indexOf('ChannelID'),
    uploadsPlaylistId: headers.indexOf('UploadsPlaylistId')
  };

  if (colIndex.channelId === -1 || colIndex.uploadsPlaylistId === -1) {
    throw new Error('Required columns not found');
  }

  const updates = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];

    const channelName = row[colIndex.channelName];
    const channelId = row[colIndex.channelId];
    const uploadsPlaylistId = row[colIndex.uploadsPlaylistId];

    // Skip if already populated
    if (uploadsPlaylistId) {
      updates.push([uploadsPlaylistId]);
      continue;
    }

    if (!channelId) {
      updates.push(['']);
      continue;
    }

    try {
      const url =
        `https://www.googleapis.com/youtube/v3/channels?` +
        `part=contentDetails` +
        `&id=${channelId}` +
        `&key=${API_KEY}`;

      const response = UrlFetchApp.fetch(url);
      const data = JSON.parse(response.getContentText());

      const uploadsId =
        data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads || '';

      if (!uploadsId) {
        Logger.log(`⚠️ No uploads playlist for ${channelName} (${channelId})`);
      } else {
        Logger.log(`✅ ${channelName} → ${uploadsId}`);
      }

      updates.push([uploadsId]);

      // small delay to be polite to API
      Utilities.sleep(100);

    } catch (error) {
      Logger.log(`❌ Failed for ${channelName} (${channelId}): ${error}`);
      updates.push(['']);
    }
  }

  // Write back ONLY the UploadsPlaylistId column
  sheet
    .getRange(2, colIndex.uploadsPlaylistId + 1, updates.length, 1)
    .setValues(updates);

  Logger.log('🎉 UploadsPlaylistId population complete');
}

