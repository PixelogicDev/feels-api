import * as dotenv from 'dotenv';
import * as axiosLib from 'axios';
import FormData from 'form-data';
import { log } from './utils.mjs';
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

export const getPlaylist = async (playlistLink) => {
  try {
    console.log('fetching playlist:', playlistLink);

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return;
    }

    if (!playlistLink) {
      console.log('playlist link not supplied');
      return;
    }

    // get playlistId (https://open.spotify.com/playlist/2YEIhsgebIevCZLAQc4dLi?si=c4794e4fcc924e4a)
    const playlistLinkSplit = playlistLink.split('/');

    console.log(playlistLinkSplit);

    // get index of playlist
    const playlistIndex = playlistLinkSplit.indexOf('playlist');

    if (playlistIndex === -1) {
      console.log('could not find index of playlist keyworld');
      return;
    }

    const playlistIdString = playlistLinkSplit[playlistIndex + 1];
    console.log(playlistIdString);

    const finalPlaylistId = playlistIdString.split('?').shift();
    console.log(finalPlaylistId);

    // call api lol
    const response = await axios({
      method: 'get',
      url: `https://api.spotify.com/v1/playlists/${finalPlaylistId}`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Check for next object, if here call again
    if (!response.data) {
      console.log('no data provided');
      return;
    }

    return response.data;
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[getAllPlaylists] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};

export const getAllFeelsPlaylists = async () => {
  try {
    const { SPOTIFY_USER_ID } = process.env;
    let playlistItems = [];
    let nextURI = `${BASE_URI}/users/${SPOTIFY_USER_ID}/playlists?limit=50`;

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return [];
    }

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

    // Filter out feels playlists
    if (playlistItems.length === 0) {
      console.log('problem getting playlists');
      return [];
    }

    // Filter all playlists by "Weekly Feels" naming + sort
    const weeklyFeelsPlaylists = playlistItems.filter((playlist) => {
      const { name } = playlist;
      const playlistNameToLower = name.toLowerCase();
      const target = 'weekly feels';
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

    return weeklyFeelsPlaylists;
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[getAllPlaylists] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};

export const getPlaylistItems = async (playlistID) => {
  try {
    const endpoint = `${BASE_URI}/playlists/${playlistID}/tracks?limit=50`;
    const accessToken = await getAccessToken();
    if (!accessToken) {
      console.log('access token bad');
      return [];
    }

    const response = await axios({
      method: 'get',
      url: endpoint,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.items === 0) {
      return [];
    }

    const { items } = response.data;

    return items;
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[getPlaylistItems] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};

export const searchForItem = async (query) => {
  try {
    // lets break song title and artist
    log('searchForItem', query);

    if (!query) {
      log('searchForItem', 'query not supplied');
      return;
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      throw new Error('access token not created');
      return;
    }

    const querySplit = query.split('_');
    const trackName = querySplit[0];
    const artistName = querySplit[1];
    console.log(trackName, artistName);
    const finalQuery = encodeURIComponent(
      `track:${trackName} artist:${artistName}`
    );

    console.log(finalQuery);

    // call api lol
    const response = await axios({
      method: 'get',
      url: `https://api.spotify.com/v1/search?q=${finalQuery}&type=track&limit=5`,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    // Check for next object, if here call again
    if (!response.data) {
      log('searchForItem', 'no data received');
      return;
    }

    console.log(response.data.tracks);

    const { items } = response.data.tracks;

    return items.pop();
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[getAllPlaylists] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};

// -- OLD CODE -- //

const getAllPlaylists = async () => {
  try {
    const { SPOTIFY_USER_ID } = process.env;
    let playlistItems = [];
    let nextURI = `${BASE_URI}/users/${SPOTIFY_USER_ID}/playlists?limit=50`;

    const accessToken = await getAccessToken();

    if (!accessToken) {
      return [];
    }

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
  // Grab every playlist on my account
  const allPlaylists = await getAllPlaylists();

  if (allPlaylists.length === 0) {
    console.log('problem getting playlists');
    return [];
  }

  // Filter all playlists by "Weekly Feels" naming + sort
  const weeklyFeelsPlaylists = allPlaylists.filter((playlist) => {
    const { name } = playlist;
    const playlistNameToLower = name.toLowerCase();
    const target = 'weekly feels';
    return playlistNameToLower.includes(target);
  });

  // Sort and grab the latest off the top
  weeklyFeelsPlaylists.sort((p1, p2) => {
    const p1Name = p1.name;
    const p2Name = p2.name;
    return (
      parseInt(p1Name.split('#').pop()) - parseInt(p2Name.split('#').pop())
    );
  });

  // Grab the latest playlist from the array
  return weeklyFeelsPlaylists.pop();
};
