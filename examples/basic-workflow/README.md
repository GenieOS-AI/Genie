# Genie Basic Workflow Example

This example demonstrates a simple multi-agent workflow using Genie's core features. It shows how to:
- Set up multiple agents
- Use plugins (Weather plugin in this case)
- Create a basic workflow between agents

## Setup

1. Set up environment variables:
```bash
cp .env.example .env
```
Then edit `.env` and add your API keys:
- `OPENAI_API_KEY`: Your OpenAI API key
- `WEATHER_API_KEY`: Your Weather API key
- `OPENAI_MODEL`: (Optional) The OpenAI model to use

2. Install dependencies:
```bash
pnpm install
```

3. Build the project:
```bash
pnpm build
```

4. Run the example:
```bash
pnpm start
```

## What's happening?

The example creates two agents:
1. A primary agent with the Weather plugin that can fetch weather data
2. An assistant agent that provides recommendations based on the weather

The workflow demonstrates:
- Plugin integration through the Weather plugin
- Inter-agent communication
- Basic task execution

## Project Structure

```
basic-workflow/
├── src/
│   └── index.ts      # Main example code
├── .env.example      # Example environment variables
├── .env             # Your local environment variables (git-ignored)
├── package.json      # Project dependencies
├── tsconfig.json     # TypeScript configuration
└── README.md        # This file
```

## Expected Output

The example will:
1. Fetch weather data for San Francisco
2. Generate activity recommendations based on the weather
3. Display both the weather data and recommendations 