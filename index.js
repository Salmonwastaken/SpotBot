#!/usr/bin/node

// Require the necessary discord.js classes
const { Client, Intents} = require( `discord.js` );
const { token, spotchannel, spotifyID, spotifySecret, steamedcatsID, oauthsecret } = require( `./vars.json` );
var SpotifyWebApi = require('spotify-web-api-node');

var scopes = ['playlist-modify-public'],
  redirectUri = 'https://example.com/callback',
  clientId = spotifyID,
  state = 'some-state-of-my-choice';

// Setting credentials can be done in the wrapper's constructor, or using the API object's setters.
var spotifyApi = new SpotifyWebApi({
  redirectUri: redirectUri,
  clientId: clientId
});

// Create the authorization URL
var authorizeURL = spotifyApi.createAuthorizeURL(scopes, state);
console.log(authorizeURL);

var credentials = {
    clientId: spotifyID,
    clientSecret: spotifySecret,
    redirectUri: 'https://example.com/callback'
  };
  
  var spotifyApi = new SpotifyWebApi(credentials);
  
  // The code that's returned as a query parameter to the redirect URI
  var code = oauthsecret;
  
  // Retrieve an access token and a refresh token
  spotifyApi.authorizationCodeGrant(code).then(
    function(data) {
      console.log('The token expires in ' + data.body['expires_in']);
      console.log('The access token is ' + data.body['access_token']);
      console.log('The refresh token is ' + data.body['refresh_token']);
  
      // Set the access token on the API object to use it in later calls
      spotifyApi.setAccessToken(data.body['access_token']);
      spotifyApi.setRefreshToken(data.body['refresh_token']);
    },
    function(err) {
      console.log('Something went wrong!', err);
    }
  );

// Create a new client instance
const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

// For troubleshooting. Really doesn't need to be async but it is.
client.once(`ready`,(async ()=>{
    console.log(`Ready`);
}));

//Fires on every message
client.on(`messageCreate`, async (msg) => {
    // Check if message was sent in specific channel
    if(msg.channelId == spotchannel ) {
        // Check if the message was sent by a Bot
        if(!msg.author.bot) {
            // Check if the message contains a Spotify link
            if(msg.content.includes('https://open.spotify.com/track/')){
                //Check if the bot is active or not. More of a troubleshooting thing than anything
                msg.react(`👀`)
                // Extract the Spotify URI/ID so we can use it.
                let URIID = useRegex(msg.content)
                // Remove all occurrence of a track to prevent duplicates. Pretty lazy, but it works.
                let tracks = [{ uri : `spotify:track:${URIID}` }];
                await spotifyApi.removeTracksFromPlaylist(steamedcatsID, tracks)
                  .then(function(data) {
                    console.log('Tracks removed from playlist!');
                  }, function(err) {
                    console.log('Deleting tracks failed', err);
                  });
                // Add the track 
                await spotifyApi.addTracksToPlaylist(steamedcatsID, [`spotify:track:${URIID}`])
                .then(function(data) {
                  console.log('Added tracks to playlist!');
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

// Function section

function useRegex(input) {
    let regex = /(?<=track\/).*(?=\?)/i;
    return input.match(regex)
}