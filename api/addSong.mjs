import { getLatestFeelsPlaylist } from './helpers/spotify.mjs';

const addSong = async (req, res) => {
  // "try catch deez nuts" - rushkiB [09.24.22]
  try {
    console.log('Calling addSong endpoint');
    // Get latest playlist in list from Spotify
    const currentPlaylist = await getLatestFeelsPlaylist();

    if (!currentPlaylist) {
      throw new Error('current playlist did not return.');
    }

    console.log(currentPlaylist);

    const data = {
      playlist: {
        name: currentPlaylist.name,
        uri: currentPlaylist.uri,
      },
    };

    /**
     * PlaylistItem
     * -> name
     * -> uri (store this on apple watch)
     */

    // What data do we want to return on applewatch?

    // Grab the current song being listened to on Spotify

    // On successful find, add song to playlist

    // Return number of songs in the playlist

    res.statusCode = 200;
    res.json({ data });
  } catch (error) {
    console.log('Ah shit.');
    if (error.response && error.response.data) {
      console.log(error.response.data);
    } else {
      console.log(error);
    }
  }
};

export default addSong;
