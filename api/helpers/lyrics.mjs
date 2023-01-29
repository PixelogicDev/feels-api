import * as dotenv from 'dotenv';
import * as axiosLib from 'axios';
import puppeteer from 'puppeteer';
const axios = axiosLib.default;
dotenv.config();

const IS_ON_PLANE = false;

//-- Holds all of our helper functions for Genius --//
const BASE_URI = 'https://api.genius.com';

const scrape = async (path, page) => {
  console.time('[⏰] scraping');

  // go to path passed
  await page.goto(path, IS_ON_PLANE ? { waitUntil: 'load', timeout: 0 } : {});
  const element = await page.waitForSelector(
    '#lyrics-root > div.Lyrics__Container-sc-1ynbvzw-6.YYrds'
  );

  console.timeEnd('[⏰] scraping');

  if (!element) {
    console.log('cant find selector');
    return;
  }

  const text = await page.evaluate((element) => element.textContent, element);

  return text;
};

export const getLyrics = async (trackName, artists, page) => {
  try {
    console.log('getting lyrics for:', trackName, artists);

    const { GENIUS_ACCESS_TOKEN } = process.env;

    // Get song link from genius api
    const endpoint = `${BASE_URI}/search?q=${encodeURIComponent(
      `${trackName} ${artists}`
    )}`;

    console.log('endpoint:', endpoint);

    const result = await axios({
      method: 'get',
      url: endpoint,
      headers: {
        Authorization: `Bearer ${GENIUS_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!result.data.response || !result.data.response.hits) {
      console.log(`couldn't find lyrics for ${trackName} ${artists}`);
      return;
    }

    const topHit = result.data.response.hits.shift();

    if (!topHit || !topHit.result) {
      console.log('no top hit so no lyrics');
      return;
    }

    // scrape from puppeteer + return
    const lyrics = await scrape(topHit.result.url, page);

    return lyrics;
  } catch (error) {
    console.timeEnd('[⏰] scraping');
    if (error.response && error.response.data) {
      console.log(`[getLyrics] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};
