export interface WeatherInput extends Record<string, unknown> {
  city: string;
  country?: string;
}

export interface WeatherPluginOptions {
  apiKey?: string;
  units?: 'metric' | 'imperial';
}

export interface WeatherResponse {
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
} 