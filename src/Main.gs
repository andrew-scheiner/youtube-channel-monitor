function createMenu() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom')
    .addItem('Backup Spreadsheet', 'backupSpreadsheet')
    //.addItem('Reset Filter', 'resetFilter')
    .addItem('Sort Sheet','sortActiveSheet')
    //.addItem('Reset Due Date', 'updateTaskDueDateFromFrequency')
    /*
    .addSeparator()
    .addSubMenu(ui.createMenu('Actions')
      .addItem('Clear Notes', 'clearNotes')
      .addItem('Clear To Neutral', 'clearToNeutral')
      .addItem('Hide Done Actions', 'hideDoneActions')
      .addItem('Reset Status','resetStatus'))
    .addSeparator()
    .addSubMenu(ui.createMenu('Refresh Data Source(s)')
      .addItem('All', 'refreshDataSources')
      .addItem('Data Source 1', 'updateDataSource1'))
    */  
    .addToUi();
}






//Source: https://spreadsheet.dev/youtube-channel-notifications-google-apps-script

//@OnlyCurrentDoc

// ======================================================================
// EMAIL ROUTING 
// ======================================================================

function getEmailRoutingFromSheet() {
  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Routing');

  if (!sheet) {
    throw new Error('Routing sheet not found');
  }

  const values = sheet.getDataRange().getValues();

  // Skip header
  return values.slice(1).reduce((map, row) => {
    const personCode = (row[0] || '').toString().trim().toUpperCase();
    const email = (row[1] || '').toString().trim();

    if (personCode && email) {
      map[personCode] = email;
    }

    Logger.log(map);
    return map;
  }, {});
}



// ======================================================================
// MAIN FUNCTION
// ======================================================================

function checkForNewVideos() {

  const ss = SpreadsheetApp.getActive();
  const sheet = ss.getSheetByName('Channels');
  if (!sheet) {
    Logger.log('Error: Could not find sheet named "Channels"');
    return;
  }

  // 🔹 Load routing dynamically
  const EMAIL_ROUTING = getEmailRoutingFromSheet();
  const channelData = sheet.getDataRange().getValues();
  const headers = channelData[0].map(h => h.toString().trim());

  // Create a lookup of column indexes by header name
  const col = {};
  headers.forEach((h, i) => col[h] = i);

  const channels = channelData.slice(1)
    .map((row, index) => {
      const statusValue = col.Status !== undefined ? row[col.Status] : '';
      const normalizedStatus = String(statusValue ?? '').trim().toLowerCase();

      if (normalizedStatus === 'ignore' || normalizedStatus === 'stopped') {
        const channelName = row[col.ChannelName] || `Row ${index + 2}`;
        Logger.log(`Skipping ${channelName} (row ${index + 2}) — status: ${statusValue || 'blank'}`);
        return null;
      }

      return {
        id: row[col.ID],
        channelName: row[col.ChannelName],
        channelId: row[col.ChannelID],
        uploadsPlaylistId: row[col.UploadsPlaylistId],
        lastVideoDate: row[col.LastVideoDate] || '2000-01-01T00:00:00Z',
        person: (row[col.Person] || 'AAS').toString().trim().toUpperCase(),
        status: normalizedStatus || 'active'
      };
    })
    .filter(Boolean);

  // 🔍 DEBUG: check what ChannelIDs actually are
  channels.forEach(channel => {
    Logger.log(`Channel: ${channel.channelName} | ChannelID: ${channel.channelId} | PlaylistID: ${channel.uploadsPlaylistId}`);
  });

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

  // 🔹 Send emails
  Object.entries(updatesByPerson).forEach(([person, updates]) => {
    const recipient = EMAIL_ROUTING[person];

    if (!recipient) {
      Logger.log(`⚠️ No email configured for '${person}'`);
      return;
    }

    const html = generateEmailContent(updates);
    sendNotificationEmail(html, recipient);
  });
}




// ======================================================================
// FETCH NEW VIDEOS FOR ONE CHANNEL
// ======================================================================

function getNewVideosForChannel(channel) {
  try {
    const API_KEY = PropertiesService
      .getScriptProperties()
      .getProperty('YOUTUBE_API_KEY');

    if (!API_KEY) {
      throw new Error('Missing YOUTUBE_API_KEY in Script Properties');
    }

    if (!channel.uploadsPlaylistId) {
      Logger.log(`⚠️ Missing UploadsPlaylistId for ${channel.channelName}`);
      return [];
    }

    const url =
      `https://www.googleapis.com/youtube/v3/playlistItems?` +
      `key=${API_KEY}` +
      `&playlistId=${channel.uploadsPlaylistId}` +
      `&part=snippet` +
      `&maxResults=5`;

    const response = UrlFetchApp.fetch(url, {
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();

    if (responseCode !== 200) {
      Logger.log(`⚠️ API failed for ${channel.channelName} (${channel.uploadsPlaylistId}) - HTTP ${responseCode}`);
      Logger.log(response.getContentText());
      return [];
    }

    const data = JSON.parse(response.getContentText());

    const lastNotificationDate = new Date(channel.lastVideoDate);

    const validLastDate = isNaN(lastNotificationDate.getTime())
      ? new Date('2000-01-01T00:00:00Z')
      : lastNotificationDate;

    return (data.items || [])
      .map(item => {
        const snippet = item.snippet;

        return {
          title: snippet.title || '',
          link: `https://www.youtube.com/watch?v=${snippet.resourceId.videoId}`,
          published: snippet.publishedAt || '',
          thumbnail: snippet.thumbnails?.medium?.url || ''
        };
      })
      .filter(video =>
        video.title &&
        video.published &&
        new Date(video.published) > validLastDate
      )
      .slice(0, 3);

  } catch (error) {
    Logger.log(
      `❌ Error fetching videos for ${channel.channelName} (UploadsPlaylistId: ${channel.uploadsPlaylistId}): ${error}`
    );
    return [];
  }
}

// ======================================================================
// EMAIL HTML GENERATOR
// ======================================================================

function generateEmailContent(newVideosByChannel) {
  const styles = {
    container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;',
    mainTitle: 'color: #333; margin-bottom: 20px;',
    channelSection: 'margin-bottom: 30px;',
    channelTitle: 'color: #333; margin-bottom: 15px;',
    videoCard: 'margin-bottom: 20px; border: 1px solid #ddd; padding: 15px; border-radius: 5px;',
    videoContainer: 'display: flex; align-items: start;',
    thumbnail: 'width: 120px; height: 90px; margin-right: 15px; border-radius: 3px;',
    videoTitle: 'color: #167ac6; text-decoration: none; font-weight: bold; font-size: 16px;',
    publishDate: 'color: #666; margin: 5px 0; font-size: 14px;',
    footer: 'margin-top: 30px; font-size: 14px; color: #555; text-align: center;'
  };

  const spreadsheetUrl = SpreadsheetApp.getActiveSpreadsheet().getUrl();

  let html = `
    <div style="${styles.container}">
      <h1 style="${styles.mainTitle}">New YouTube Videos</h1>
  `;

  newVideosByChannel.forEach(({ channel, videos }) => {
    html += `
      <div style="${styles.channelSection}">
        <h2 style="${styles.channelTitle}">${channel.channelName}</h2>
    `;

    videos.forEach(video => {
      html += `
        <div style="${styles.videoCard}">
          <div style="${styles.videoContainer}">
            ${video.thumbnail ? `
              <img src="${video.thumbnail}"
                alt="Video thumbnail"
                style="${styles.thumbnail}"
              />
            ` : ''}
            <div>
              <a href="${video.link}"
                style="${styles.videoTitle}">
                ${video.title}
              </a>
              <p style="${styles.publishDate}">
                Published: ${GASLibrary.formatDate_ddMMyyyy(new Date(video.published))}
              </p>
            </div>
          </div>
        </div>
      `;
    });

    html += `</div>`;
  });

  html += `
      <div style="${styles.footer}">
        <p>View or update your YouTube Channels list here:<br>
        <a href="${spreadsheetUrl}" style="color: #167ac6;">Open Spreadsheet</a></p>
      </div>
    </div>
  `;

  return html;
}




// ======================================================================
// SEND EMAIL
// ======================================================================


function sendNotificationEmail(htmlContent, recipient) {
  const subject = 'New Videos From Your Favorite YouTube Channels 📺';

  MailApp.sendEmail({
    to: recipient,
    subject: subject,
    htmlBody: htmlContent
  });
}
