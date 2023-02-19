import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
import { log } from './utils.mjs';
dotenv.config();

// 4097 tokens ~4 characters in english === 1 token
export const runGPT3Analysis = async (input, isFinal) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const prompt = isFinal
      ? `what is the overall sentiment of these ${input.length} song sentiments:\n${input}\n`
      : `what is the sentiment analysis of these lyrics in a few words:\n${input}\n`;

    console.log(`prompt: ${prompt}`);

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.8,
      max_tokens: 256,
      top_p: 1,
    });

    if (!response.data) {
      console.log('error in analysis');
    }

    const { choices } = response.data;
    const choice = choices.pop();
    return choice.text.split('\n').pop();
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[runGPT3Analysis] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};

export const createPlaylistFromGPT3 = async (description) => {
  // TODO: Change to 15
  const PLAYLIST_LENGTH = 12;

  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `Create a ${PLAYLIST_LENGTH} song playlist from the following description and in the following format:\n\ndescription: "${description}"\n\nformat: SONGTITLE_ARTIST\n`;

    log('createPlaylistfromGPT3', `prompt: ${prompt}`);

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.9,
      max_tokens: 256,
      top_p: 1,
    });

    if (!response.data) {
      log('runGPT3Analysis', 'error in analysis');
    }

    const { choices } = response.data;
    const choice = choices.pop();

    return choice.text.split('\n').filter((item) => !!item || item !== '');
  } catch (error) {
    if (error.response && error.response.data) {
      log('runGPT3Analysis', `${JSON.stringify(error.response.data)}`);
    } else {
      log('runGPT3Analysis', error);
    }
  }
};

export const createPlaylistInfoFromGPT3 = async (description) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `Generate a playlist name and playlist description for the following sentence in the following format:\n\nsentence: ${description}\nformat:PLAYLISTNAME_PLAYLISTDESCRIPTION\n`;

    log('createPlaylistInfoFromGPT3', `prompt: ${prompt}`);

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt,
      temperature: 0.9,
      max_tokens: 256,
      top_p: 1,
    });

    if (!response.data) {
      log('createPlaylistInfoFromGPT3', 'error in analysis');
    }

    const { choices } = response.data;
    const choice = choices.pop();

    return choice.text;
  } catch (error) {
    if (error.response && error.response.data) {
      log(
        'createPlaylistInfoFromGPT3',
        `${JSON.stringify(error.response.data)}`
      );
    } else {
      log('createPlaylistInfoFromGPT3', error);
    }
  }
};
