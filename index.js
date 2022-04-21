#!/usr/bin/node

// Require the necessary discord.js classes
const {Client, Intents} = require( `discord.js` );
const {token,
  spotchannel,
  spotifyID,
  spotifySecret,
  spotifyRefresh,
  steamedcatsID} = require( `/etc/Projects/SpotBot/vars.json` );
const SpotifyWebApi = require('spotify-web-api-node');

const spotifyApi = new SpotifyWebApi({
  clientId: spotifyID,
  clientSecret: spotifySecret,
  refreshToken: spotifyRefresh
});

// Create a new Discord client instance
const client = new Client({intents: [Intents.FLAGS.GUILDS,
  Intents.FLAGS.GUILD_MESSAGES]});

// For troubleshooting. Really doesn't need to be async but it is.
client.once(`ready`, (async ()=>{
  console.log(`Ready`);
  /* So apparently Spotify tokens get revoked after 3600 seconds aka an hour.
  To work around this we retrieve a new token every 3500 seconds,
  using our current (and still valid) Access and Refresh token. */
  setInterval(async () => {
    spotifyApi.refreshAccessToken().then(
        function(data) {
          console.log('The access token has been refreshed!');
          // Save the access token so that it's used in future calls
          spotifyApi.setAccessToken(data.body['access_token']);
        },
        function(err) {
          console.log('Could not refresh access token', err);
        },
    );
  }, 3500000);
}));

// Fires on every message
client.on(`messageCreate`, async (msg) => {
  // Check if message was sent in specific channel
  if (msg.channelId == spotchannel ) {
    // Check if the message was sent by a Bot
    if (!msg.author.bot) {
      // Check if the message contains a Spotify link
      if (msg.content.includes('https://open.spotify.com/track/')) {
        // Extract the Spotify URI/ID so we can use it.
        const URIID = useRegex(msg.content);
        /* Remove all occurrence of a track to prevent duplicates.
        Pretty lazy, but it works. */
        const tracks = [{uri: `spotify:track:${URIID}`}];
        await spotifyApi.removeTracksFromPlaylist(steamedcatsID, tracks)
            .then(function(data) {
              console.log('Tracks removed from playlist!');
            }, function(err) {
              console.log('Deleting tracks failed', err);
            });
        // Add the track
        await spotifyApi.addTracksToPlaylist(steamedcatsID,
            [`spotify:track:${URIID}`])
            .then(function(data) {
              console.log('Added tracks to playlist!');
              /* Just to let the people know that we managed
              to add the spotify track */
              msg.react(`👀`);
            }, function(err) {
              console.log('Adding tracks failed!', err);
            });
      }
    }
  }
});


// Everything past this point is simply used for troubleshooting.
client.once(`reconnecting`, () => {
  console.log(`Reconnecting!`);
});

client.once(`disconnect`, () => {
  console.log(`Disconnect!`);
});

client.on(`warn`, async (info) => {
  console.error(new Date() + `: Discord client encountered a warning`);
  console.log(info);
});
client.on(`error`, async (error) => {
  console.error(new Date() + `: Discord client encountered an error`);
  console.log(error);
});
client.on(`unhandledReject`, console.log);

client.login(token);

/**
 * Grabs the song ID from Spotify URLs
 * @param {string} input The Spotify Track URL
 * @param {const} regex The regex used to extract the Spotify Track ID
 * @return {string} the Spotify track ID
 */
function useRegex(input) {
  const regex = /(?<=track\/)[^?\n]+/i;
  return input.match(regex);
}
