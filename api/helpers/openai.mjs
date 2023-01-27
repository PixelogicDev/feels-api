import * as dotenv from 'dotenv';
import { Configuration, OpenAIApi } from 'openai';
dotenv.config();

export const runGPT3Analysis = async (input, isFinal) => {
  try {
    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const basePrompt = isFinal
      ? `what is the overall sentiment of these ${input.length} song sentiments in a few words:\n\n`
      : 'what is the sentiment analysis of these lyrics:\n\n';

    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${basePrompt}${input}`,
      temperature: 0.8,
      max_tokens: 256,
    });

    if (!response.data) {
      console.log('error in analysis');
    }

    const { choices } = response.data;
    const choice = choices.pop();

    console.log(choice);

    return choice.text.replace(/(\r\n|\n|\r)/gm, '');
  } catch (error) {
    if (error.response && error.response.data) {
      console.log(`[runGPT3Analysis] ${JSON.stringify(error.response.data)}`);
    } else {
      console.log(error);
    }
  }
};
