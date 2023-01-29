import * as axiosLib from 'axios';
const axios = axiosLib.default;

const fetchAllPlaylists = async () => {
  const response = await axios.get('http://localhost:3000/api/fetchPlaylists');
  return response.data.playlists;
};

const main = async () => {
  try {
    // Get all playlists and then make API call 1 by 1
    const playlists = await fetchAllPlaylists();

    if (!playlists) {
      console.log('playlists does not exist');
      return;
    }

    console.log(`number of playlists to go through ${playlists.length}`);

    for await (const playlist of playlists) {
      console.log('getting sentiment');

      const response = await axios.post(
        'http://localhost:3000/api/runSentiment',
        { playlist }
      );

      console.log(response.data);
    }
  } catch (error) {
    console.log('error in local script');
    console.log(error);
  }
};

await main();
