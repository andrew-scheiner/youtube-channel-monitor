function onEdit(e) {
  const range = e.range;
  const value = e.value;
  const row = e.range.getRow();
  const column = e.range.getColumn();
  const sheet = range.getSheet();
  const sheetName = sheet.getName(); 

  if (row != 1) {
    GASLibrary.addTimestampToUpdatedColumn(sheet,column,row);
  }

  if (value === "X Delete") {
    sheet.deleteRow(row);
  }
}

function onEditPopulateUploadsPlaylistId(e) {
  try {
    const range = e.range;
    const sheet = range.getSheet();

    // Optional: lock to a specific sheet
    // if (sheet.getName() !== 'Channels') return;

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    const colIndex = {
      channelId: headers.indexOf('ChannelID'),
      uploadsPlaylistId: headers.indexOf('UploadsPlaylistId'),
      channelName: headers.indexOf('ChannelName')
    };

    if (colIndex.channelId === -1 || colIndex.uploadsPlaylistId === -1) return;

    // Only react when ChannelID column is edited
    if (range.getColumn() !== colIndex.channelId + 1) return;

    const row = range.getRow();
    if (row === 1) return; // skip header

    const channelId = range.getValue();
    if (!channelId) return;

    const uploadsCell = sheet.getRange(row, colIndex.uploadsPlaylistId + 1);

    // Skip if already populated
    if (uploadsCell.getValue()) return;

    const API_KEY = PropertiesService
      .getScriptProperties()
      .getProperty('YOUTUBE_API_KEY');

    if (!API_KEY) {
      throw new Error('Missing YOUTUBE_API_KEY');
    }

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
      Logger.log(`⚠️ No uploads playlist for ChannelID: ${channelId}`);
      return;
    }

    uploadsCell.setValue(uploadsId);

    Logger.log(`✅ Row ${row} → UploadsPlaylistId set: ${uploadsId}`);

  } catch (error) {
    Logger.log(`❌ onEdit error: ${error}`);
  }
}

function installOnEditTrigger() {
  const triggers = ScriptApp.getProjectTriggers();

  const exists = triggers.some(t =>
    t.getHandlerFunction() === 'onEditPopulateUploadsPlaylistId'
  );

  if (!exists) {
    ScriptApp.newTrigger('onEditPopulateUploadsPlaylistId')
      .forSpreadsheet(SpreadsheetApp.getActive())
      .onEdit()
      .create();

    Logger.log('✅ onEdit trigger installed');
  } else {
    Logger.log('ℹ️ Trigger already exists');
  }
}