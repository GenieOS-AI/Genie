import { z } from 'zod';
import { BaseTool } from '@genie/core';
import { WeatherInput } from '../types';
import { ToolConfig, Agent } from '@genie/core';

const weatherInputSchema = z.object({
  city: z.string().describe('The city to get weather for'),
  country: z.string().optional().describe('Optional country code (e.g. UK, US)')
});

export class GetWeatherTool extends BaseTool<WeatherInput> {
  static schema = weatherInputSchema;

  constructor(agent: Agent, callback?: (toolName: string, input: WeatherInput, output: string) => void) {
    super(
      agent,
      {
        name: 'get_weather',
        description: 'Get the current weather for a specific city',
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

  protected async execute(input: WeatherInput): Promise<string> {
    // This is a mock implementation. In a real plugin, you would call a weather API
    const mockWeather = {
      temperature: 22,
      description: 'Partly cloudy',
      humidity: 65,
      windSpeed: 12
    };

    return JSON.stringify({
      city: input.city,
      country: input.country,
      weather: mockWeather
    });
  }
} 