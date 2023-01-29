import puppeteer from 'puppeteer';
import { getPlaylistItems } from './helpers/spotify.mjs';
import { getLyrics } from './helpers/lyrics.mjs';
import { runGPT3Analysis } from './helpers/openai.mjs';

const runItemAnalysis = async (item, page) => {
  // Grab track title and artist
  const {
    track: { name: trackName, artists },
  } = item;

  const mainArtist = artists.shift();

  // Get lyrics
  const lyrics = await getLyrics(trackName, mainArtist.name, page);

  if (!lyrics) {
    console.log(
      `lyrics could not be found for ${trackName} ${mainArtist.name}.`
    );

    return undefined;
  }

  // Take lyrics and run through GPT-3
  console.time('[⏰] gpt3Analysis');
  const analysis = await runGPT3Analysis(lyrics);
  console.timeEnd('[⏰] gpt3Analysis');

  // return { [`${trackName}+${mainArtist.name}`]: analysis };
  return analysis;
};

const getBrowserPage = async (browser) => {
  const page = await browser.newPage();

  // setup listeners
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (
      req.resourceType() == 'stylesheet' ||
      req.resourceType() == 'font' ||
      req.resourceType() == 'image'
    ) {
      req.abort();
    } else {
      req.continue();
    }
  });

  return page;
};

// pay wall here can be max 25 songs
// will need to run a much larger token value on gpt3 + make a lot more requests to genius api
const runSentiment = async (req, res) => {
  try {
    console.log('Calling runSentiment endpoint');

    // Get playlist object
    const { playlist } = req.body;

    console.log(`starting analysis on: ${playlist.name}`);

    // Get all songs per playlist
    const items = await getPlaylistItems(playlist.id);

    // go through song items and get sentiment analysis
    const songSentiments = [];

    // lets init a browser page here and then we can pass it
    console.time('[⏰] startBrowser');

    // set page size
    const browser = await puppeteer.launch({
      headless: true,
    });

    const page = await getBrowserPage(browser);

    console.timeEnd('[⏰] startBrowser');

    // eslint-disable-next-line no-restricted-syntax
    for await (const item of items) {
      const sentiment = await runItemAnalysis(item, page);

      console.log(`finished sentiment`);

      songSentiments.push(sentiment);
    }

    // clean up browser
    browser.close();

    // request full sentiment from gpt3
    const groupSentiment = await runGPT3Analysis(songSentiments, true);

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
