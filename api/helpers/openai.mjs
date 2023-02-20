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
