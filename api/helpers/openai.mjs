import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
dotenv.config();

export const runGPT3Analysis = async (lyrics) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const basePrompt = 'what is the sentiment analysis of these lyrics:\n';

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${basePrompt}${lyrics}`,
      temperature: 0,
      max_tokens: 256,
    });

    if (!response.data) {
      console.log('error in analysis');
    }

    const { choices } = response.data;
    const choice = choices.pop();

    return choice.text.replace(/(\r\n|\n|\r)/gm, '');
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[runGPT3Analysis] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};
