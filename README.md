# YouTube Channel Monitor

A Google Apps Script project for monitoring a YouTube channel and its uploads.

## Project files

- src/ contains the Apps Script source files
- ppsscript.json defines the Apps Script project manifest

## Channels Sheet columns and workflow

The sheet currently uses two related columns for each channel:

- ChannelID: this is entered manually when a new channel is added. It is used by the Apps Script to look up the channel in the YouTube API and resolve its uploads playlist.
- UploadsPlaylistId: this is populated automatically once a ChannelID is available. It is the value used by the monitoring workflow to fetch the channel’s latest playlist items and detect new uploads.

### Current workflow

1. Add a new row for a channel.
2. Enter the channel’s ChannelID in the ChannelID column.
3. The Apps Script resolves the channel’s uploads playlist and fills the UploadsPlaylistId column.
4. When the monitoring function runs, it uses UploadsPlaylistId to check for new videos and send notifications.

### Possible enhancement

For a more user-friendly experience, the sheet could store only the channel URL or channel handle instead of requiring both ChannelID and UploadsPlaylistId. The Apps Script could then use the YouTube API to derive both values automatically. This would simplify data entry and reduce the amount of manual information users need to provide.