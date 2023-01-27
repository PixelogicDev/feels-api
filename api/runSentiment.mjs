import { getAllFeelsPlaylists, getPlaylistItems } from './helpers/spotify.mjs';
import { getLyrics } from './helpers/lyrics.mjs';
import { runGPT3Analysis } from './helpers/openai.mjs';

const runAnalysisOnItem = async (item) => {
  // Grab track title and artist
  const {
    track: { name: trackName, artists },
  } = item;

  const mainArtist = artists.shift();

  // Get lyrics
  const lyrics = await getLyrics(trackName, mainArtist.name);

  if (!lyrics) {
    console.log(
      `lyrics could not be found for ${trackName} ${mainArtist.name}.`
    );

    return;
  }

  // Take lyrics and run through GPT-3
  const analysis = await runGPT3Analysis(lyrics);

  // return { [`${trackName}+${mainArtist.name}`]: analysis };
  return analysis;
};

const runSentiment = async (req, res) => {
  try {
    console.log('Calling runSentiment endpoint');

    // There is going to be tons of playlists here (100+), let's get all playlists here and then can loop through

    // Get latest playlist in list from Spotify
    const feelsPlaylists = await getAllFeelsPlaylists();

    if (feelsPlaylists.length === 0) {
      throw new Error('current playlist did not return.');
    }

    console.log('playlists received:', feelsPlaylists.length);

    // Used to test on 1 rn
    const one = feelsPlaylists.pop();

    console.log(`starting analysis on: ${one.name}`);

    // Get all songs per playlist
    const items = await getPlaylistItems(one.id);

    // go through song items and get sentiment analysis
    const analysisPromises = await items.map(async (item, index) => {
      if (index % 2 === 0) return;
      return await runAnalysisOnItem(item);
    });

    const fulfilledAnalysis = await Promise.all(analysisPromises);

    // filter out all the items that had no value
    const filteredAnalysis = fulfilledAnalysis.filter((item) => !!item);

    // request full sentiment from gpt3
    const groupSentiment = await runGPT3Analysis(filteredAnalysis, isFinal: true);

    // generate playlist description

    // generate SD prompt

    res.statusCode = 200;
    res.json({ groupSentiment });
  } catch (error) {
    // TODO: Return error!
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

export default runSentiment;
