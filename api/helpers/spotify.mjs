import * as dotenv from 'dotenv';
import * as axiosLib from 'axios';
import FormData from 'form-data';
const axios = axiosLib.default;
dotenv.config();

//-- Holds all of our helper functions for Spotify --//
const BASE_URI = 'https://api.spotify.com/v1';

const getAccessToken = async () => {
  try {
    const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } = process.env;
    const response = await axios({
      method: 'post',
      params: {
        grant_type: 'client_credentials',
      },
      url: 'https://accounts.spotify.com/api/token',
      headers: {
        Authorization: `Basic ${Buffer.from(
          `${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`
        ).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // TODO: maybe should care about refresh_token
    return response.data.access_token;
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[getAccessToken] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};

const getAllPlaylists = async (accessToken) => {
  try {
    const { SPOTIFY_USER_ID } = process.env;
    let playlistItems = [];
    let nextURI = `${BASE_URI}/users/${SPOTIFY_USER_ID}/playlists?limit=50`;

    do {
      const response = await axios({
        method: 'get',
        url: nextURI,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      // Check for next object, if here call again
      if (response.data) {
        const { next, items } = response.data;

        // Put items in array
        playlistItems = [...playlistItems, ...items];

        // Set next && path
        nextURI = next;
      }
    } while (nextURI);

    console.log(`Number of items in array: ${playlistItems.length}`);
    return playlistItems;
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[getAllPlaylists] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};

export const getLatestFeelsPlaylist = async () => {
  // Get access token from spotify
  const accessToken = await getAccessToken();

  if (accessToken) {
    // Grab every playlist on my account
    const allPlaylists = await getAllPlaylists(accessToken);

    // Filter all playlists by "Weekly Feels" naming + sort
    const weeklyFeelsPlaylists = allPlaylists.filter((playlist) => {
      const { name } = playlist;
      const playlistNameToLower = name.toLowerCase();
      const target = 'weekly feels';
      console.log(`Checking ${playlistNameToLower}`);
      return playlistNameToLower.includes(target);
    });

    console.log(`Number of weekly feels: ${weeklyFeelsPlaylists.length}`);

    // Sort and grab the latest off the top
    weeklyFeelsPlaylists.sort((p1, p2) => {
      const p1Name = p1.name;
      const p2Name = p2.name;
      return (
        parseInt(p1Name.split('#').pop()) - parseInt(p2Name.split('#').pop())
      );
    });

    // Grab the latest playlist from the arry
    return weeklyFeelsPlaylists.pop();
  } else {
    console.log('accessToken is borked loser');
    return;
  }
};
