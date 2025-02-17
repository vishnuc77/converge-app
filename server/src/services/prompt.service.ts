import { OpenAI } from "openai";
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });

export class PromptService {
  private static systemPrompt = "You are an AI agent on Starknet network capable of identifying sequences of transactions involving Transfer and Swap operations. Transfer means transferring tokens from one address to another. Swap means swapping one token for another token. IMPORTANT RESPONSE FORMAT: You must ONLY respond with function calls in the correct sequence. DO NOT MAKE UP OR ASSUME ANY VALUES. If any required fields are missing (like destination address for Transfer), DO NOT RESPOND AT ALL. If no clear match or if information is incomplete, do not respond.";
  private static apiUrl = "https://api.openai.com/v1/chat/completions";

  static async processPrompt(prompt: string) {
    const tools = [
        {
          type: 'function',
          function: {
            name: 'Transfer',
            description: 'Send or Transfer tokens to another address.',
            parameters: {
              type: 'object',
              properties: {
                destination: { type: 'string', description: 'The address to send tokens to.' },
                amount: { type: 'number', description: 'The amount of tokens to send.' },
                symbol: { type: 'string', description: 'The symbol of the token to send.' },
              },
              required: ['destination', 'amount', 'symbol'],
            },
          },
        },
        {
          type: 'function',
          function: {
            name: 'Swap',
            description: 'Swap tokens from one type to another.',
            parameters: {
              type: 'object',
              properties: {
                fromSymbol: { type: 'string', description: 'The token symbol to swap from.' },
                toSymbol: { type: 'string', description: 'The token symbol to swap to.' },
                amount: { type: 'number', description: 'The amount of tokens to swap.' },
              },
              required: ['fromSymbol', 'toSymbol', 'amount'],
            },
          },
        },
    ];

    const payload = {
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: this.systemPrompt,
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        tools,
        temperature: 2
      };

    try {
        const response: any = await axios.post(this.apiUrl, payload, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            },
          });

        if (!response.data?.choices?.[0]?.message?.tool_calls) {
            throw new Error('Invalid response structure from OpenAI API');
        }
        
        return response.data.choices[0].message.tool_calls.map((toolCall: any) => toolCall.function);
    } catch (error: any) {
        if (axios.isAxiosError(error)) {
            if (error.response?.status === 401) {
                throw new Error('Authentication failed with OpenAI API');
            }
            if (error.response?.status === 429) {
                throw new Error('Rate limit exceeded with OpenAI API');
            }
            throw new Error(`OpenAI API error: ${error.response?.data?.error?.message || error.message}`);
        }
        
        console.error('Error processing prompt:', error);
        throw error;
    }
  }
} 