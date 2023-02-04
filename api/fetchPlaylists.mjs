import { getAllFeelsPlaylists } from './helpers/spotify.mjs';

const fetchPlaylists = async (req, res) => {
  try {
    console.log('Fetching all feels playlists...');

    const feelsPlaylists = await getAllFeelsPlaylists();

    if (feelsPlaylists.length === 0) {
      throw new Error('⚠️ no feels playlists were returned');
    }

    res.statusCode = 200;
    res.json({ playlists: feelsPlaylists });
  } catch (error) {
    console.log('Ah shit.');
    if (error.response && error.response.data) {
      console.log(error.response.data);
      res.statusCode = 500;
      res.json({ error: error.response.data });
    } else {
      console.log(error);
    }
  }
};

export default fetchPlaylists;
