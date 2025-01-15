import { PluginOptions, ToolInput, ToolOutput } from "@genie/core";

export interface WeatherInput extends ToolInput {
  city: string;
  country?: string;
}


export interface WeatherOutput extends ToolOutput {
  status: "success" | "error";
  data?: {
    city: string;
    country?: string;
    weather: {
      temperature: number;
      description: string;
      humidity: number;
      windSpeed: number;
    }
  }
}

export interface WeatherPluginOptions extends PluginOptions {
  apiKey?: string;
  units?: 'metric' | 'imperial';
}

export interface WeatherResponse {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
} 