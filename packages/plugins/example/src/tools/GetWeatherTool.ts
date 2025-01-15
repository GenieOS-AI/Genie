import { z } from 'zod';
import { IAgent, Tool } from '@genie/core';
import { WeatherInput, WeatherOutput } from '../types';

const weatherInputSchema = z.object({
  city: z.string().describe('The city to get weather for'),
  country: z.string().optional().describe('Optional country code (e.g. UK, US)')
});

export class GetWeatherTool extends Tool<WeatherInput, WeatherOutput, any> {
  static readonly TOOL_NAME = 'get_weather';
  constructor(
    agent: IAgent, 
    callback?: (toolName: string, input: WeatherInput, output: WeatherOutput) => void
  ) {
    super(
      agent,
      {
        name: GetWeatherTool.TOOL_NAME,
        description: 'Get the current weather for a specific city',
        schema: weatherInputSchema as any,
        examples: [
          {
            user: 'What is the weather like in London?',
            tool: {
              params: {
                city: 'London',
                country: 'UK'
              }
            }
          }
        ]
      },
      callback
    );
  }

  validateInput(input: WeatherInput): { status: boolean; errors?: string[] } {
    if (!input.city) {
      return { 
        status: false, 
        errors: ['City is required'] 
      };
    }
    return { status: true };
  }

  protected async execute(input: WeatherInput): Promise<WeatherOutput> {
    // This is a mock implementation. In a real plugin, you would call a weather API
    const mockWeather = {
      temperature: Math.floor(Math.random() * 30) + 10, // Random temp between 10-40°C
      description: ['Sunny', 'Partly cloudy', 'Cloudy', 'Rainy'][Math.floor(Math.random() * 4)],
      humidity: Math.floor(Math.random() * 40) + 40, // Random humidity between 40-80%
      windSpeed: Math.floor(Math.random() * 20) + 5 // Random wind speed between 5-25 km/h
    };

    const output: WeatherOutput = {
      status: "success",
      data: {
        city: input.city,
        country: input.country,
        weather: mockWeather
      }
    };

    console.log('Executing GetWeatherTool with output:', output);

    return output;
  }
} 