import { log } from './helpers/utils.mjs';
import {
  createPlaylistFromGPT3,
  createPlaylistInfoFromGPT3,
} from './helpers/openai.mjs';
import { searchForItem } from './helpers/spotify.mjs';

/**
 * Given a description, generate a playlist of 15 songs (about 1hr of listen time)
 */
const createPlaylist = async (req, res) => {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');

    log('createPlaylist', 'starting');

    const body = JSON.parse(req.body);

    // get description from payload
    if (!body.description) {
      log('createPlaylist', 'description not passed');
      res.statusCode = 500;
      res.json({ error: 'description not passed' });
    }

    // call openai
    // generate playlist description + name
    const playlistInfo = await createPlaylistInfoFromGPT3(body.description);
    // const playlistInfo =
    //   'Singles Soiree_A happy and exciting playlist for celebrating Valentines Day with your single friends!';
    const playlistInfoSplit = playlistInfo.split('_');
    const playlistTitle = playlistInfoSplit[0];
    const playlistDescription = playlistInfoSplit[1];
    log('createPlaylist', playlistTitle, playlistDescription);

    const playlistItems = await createPlaylistFromGPT3(body.description);
    // const playlistItems = [
    //   "1. Can't Stop the Feeling_Justin Timberlake",
    //   '2. I Wanna Dance With Somebody_Whitney Houston',
    //   '3. Dynamite_Taio Cruz',
    //   '4. Love Myself_Hailee Steinfeld',
    //   '5. Single Ladies (Put a Ring On It)_Beyoncé',
    // ];
    log('createPlaylist', playlistItems);

    // search for items on spotify
    const tracks = [];
    for await (const item of playlistItems) {
      // clean up
      const query = item.slice(3);

      // call spotify
      const spotifyTrack = await searchForItem(query);

      if (!spotifyTrack) {
        console.log('no track found, continuing');
        continue;
      }

      const {
        id: spotifyTrackId,
        uri,
        external_urls: { spotify: trackLink },
        name,
        preview_url: previewUrl,
        artists,
        album: { name: albumName, images: albumImages },
      } = spotifyTrack;
      const artistsData = artists.map((artist) => artist.name);

      tracks.push({
        spotifyTrackId,
        uri,
        trackLink,
        name,
        previewUrl,
        artistsData,
        albumName,
        albumImages,
      });
    }

    // return array of spotify tracks
    res.status(200);
    res.json({ playlist: { playlistTitle, playlistDescription, tracks } });
  } catch (error) {
    if (error.response && error.response.data) {
      log('createPlaylist', `${JSON.stringify(error.response.data)}`);
      res.status(500);
      res.json({ error: JSON.stringify(error.response.data) });
    } else {
      log('createPlaylist', error);
    }
  }
};

export default createPlaylist;
