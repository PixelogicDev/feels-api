import * as axiosLib from 'axios';
import * as fs from 'fs';
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

      if (!response.data) {
        console.log('⚠️ no sentiment returned');
        return;
      }

      const { playlistName, playlistId, playlistSentiment } = response.data;
      const data = `[${playlistId}] ${playlistName}: ${playlistSentiment}\n\n`;

      // read file
      const fileContent = fs.readFileSync('sentiments.txt', 'utf8');

      // write sentiment to file
      fs.writeFile('sentiments.txt', fileContent + data, (error) => {
        if (error) {
          console.log(error);
        } else {
          console.log('File written successfully\n');
          console.log('The written has the following contents:');
          console.log(fs.readFileSync('sentiments.txt', 'utf8'));
        }
      });
    }
  } catch (error) {
    console.log('error in local script');
    console.log(error);
  }
};

await main();
