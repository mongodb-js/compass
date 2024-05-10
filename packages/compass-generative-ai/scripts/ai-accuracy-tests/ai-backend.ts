/* eslint-disable no-console */

import OpenAI from 'openai';
import DigestClient from 'digest-fetch';
import nodeFetch from 'node-fetch';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import Anthropic from '@anthropic-ai/sdk';

import { extractDelimitedText } from './ai-response';

let anthropic: Anthropic;
if (process.env['ANTHROPIC_API_KEY']) {
  anthropic = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
  });
}

function getAnthropicClient() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env['ANTHROPIC_API_KEY'],
    });
  }

  return anthropic;
}

let openai: OpenAI;
if (process.env['OPENAI_API_KEY']) {
  openai = new OpenAI({
    apiKey: process.env['OPENAI_API_KEY'],
  });
}

function getOpenAIClient() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env['OPENAI_API_KEY'],
    });
  }

  return openai;
}

// Only used when the backend is Atlas (not openai/anthropic/etc).
const ATLAS_BACKEND = process.env.AI_TESTS_BACKEND || 'atlas-dev';

if (!['atlas-dev', 'atlas-local', 'compass'].includes(ATLAS_BACKEND)) {
  throw new Error('Unknown backend');
}

const fetch = (() => {
  if (ATLAS_BACKEND === 'atlas-dev' || ATLAS_BACKEND === 'atlas-local') {
    const ATLAS_PUBLIC_KEY = process.env.ATLAS_PUBLIC_KEY;
    const ATLAS_PRIVATE_KEY = process.env.ATLAS_PRIVATE_KEY;

    if (!(ATLAS_PUBLIC_KEY || ATLAS_PRIVATE_KEY)) {
      throw new Error('ATLAS_PUBLIC_KEY and ATLAS_PRIVATE_KEY are required.');
    }

    const client = new DigestClient(ATLAS_PUBLIC_KEY, ATLAS_PRIVATE_KEY, {
      algorithm: 'MD5',
    });

    return client.fetch.bind(client);
  }

  return nodeFetch;
})() as typeof nodeFetch;

const backendBaseUrl =
  process.env.AI_TESTS_BACKEND_URL ||
  (ATLAS_BACKEND === 'atlas-dev'
    ? 'https://cloud-dev.mongodb.com/api/private'
    : ATLAS_BACKEND === 'atlas-local'
    ? 'http://localhost:8080/api/private'
    : 'http://localhost:8080');

type AITestError = Error & {
  errorCode?: string;
  status?: number;
  query?: string;
  prompt?: string;
  causedBy?: Error;
};

export class AtlasAPI {
  httpErrors = 0;

  async fetchAtlasPrivateApi(
    urlPath: string,
    init: Partial<Parameters<typeof fetch>[1]> = {}
  ) {
    const url = `${backendBaseUrl}${
      urlPath.startsWith('/') ? urlPath : `/${urlPath}`
    }`;

    const res = await fetch(url, {
      ...init,
      headers: {
        ...init.headers,
        'Content-Type': 'application/json',
        'User-Agent': 'Compass AI Accuracy tests',
      },
    });
    const data = await res.json();
    if (res.ok && data) {
      console.info(data);
      return data;
    }

    const errorCode = data?.errorCode || '-';

    const error: AITestError = new Error(
      `Request failed: ${res.status} - ${res.statusText}: ${errorCode}`
    );

    error.status = res.status;
    error.errorCode = errorCode;

    this.httpErrors++;

    throw error;
  }
}

export type AIBackend = 'Atlas' | 'openai' | 'anthropic';

type ChatCompletion = {
  content: string;
  usageStats: {
    promptTokens: number;
    completionTokens: number;
  };
};

async function createAnthropicChatCompletion({
  system,
  user,
  model = 'claude-3-opus-20240229',
}: {
  system?: string;
  user: string;
  model?: ChatCompletionCreateParamsBase['model'];
}): Promise<ChatCompletion> {
  const anthropic = getAnthropicClient();
  let completion: Anthropic.Messages.Message;
  if (!system) {
    completion = await anthropic.messages.create({
      messages: [
        {
          role: 'user',
          content: user,
        },
      ],
      model,
      max_tokens: 1000,
      temperature: 0,
    });
  } else {
    completion = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 1000,
      temperature: 0,
      system,
      messages: [
        {
          role: 'user',
          content: user,
        },
      ],
    });
  }

  return {
    content: completion.content[0].text,
    usageStats: {
      promptTokens: completion.usage.input_tokens,
      completionTokens: completion.usage.output_tokens,
    },
  };
}

async function createOpenAIChatCompletion({
  system,
  user,
  model = 'gpt-4-turbo',
}: {
  system?: string;
  user: string;
  model?: ChatCompletionCreateParamsBase['model'];
}): Promise<ChatCompletion> {
  const openai = getOpenAIClient();

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  if (!system) {
    completion = await openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: user,
        },
      ],
      model,
    });
  } else {
    completion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: user,
        },
      ],
      model,
    });
  }

  return {
    content: completion.choices[0].message.content || '',
    usageStats: {
      promptTokens: completion.usage?.prompt_tokens ?? NaN,
      completionTokens: completion.usage?.completion_tokens ?? NaN,
    },
  };
}

export type UsageStats = { promptTokens: number; completionTokens: number };

export type GenerationResponse = {
  content: string;
  query?: {
    filter?: string;
    project?: string;
    sort?: string;
    limit?: string;
    skip?: string;
  };
  aggregation?: string;
  usageStats?: UsageStats;
};

function getFieldsFromCompletionResponse({
  completion,
}: {
  completion: ChatCompletion;
}): GenerationResponse {
  const content = completion.content;

  return {
    content,
    query: Object.fromEntries(
      ['filter', 'project', 'skip', 'limit', 'sort'].map((delimiter) => [
        delimiter,
        extractDelimitedText(content ?? '', delimiter),
      ])
    ),
    aggregation: extractDelimitedText(content ?? '', 'aggregation'),
    usageStats: completion.usageStats,
  };
}

export function createAIChatCompletion({
  system,
  user,
  backend,
}: {
  system?: string;
  user: string;
  backend: AIBackend;
}): Promise<ChatCompletion> {
  if (backend === 'openai') {
    return createOpenAIChatCompletion({ system, user });
  }

  // Defaults to Anthropic for now.
  return createAnthropicChatCompletion({ system, user });
}

export async function runAIChatCompletionGeneration({
  system,
  user,
  backend,
}: {
  system?: string;
  user: string;
  backend: AIBackend;
}): Promise<GenerationResponse> {
  const completion = await createAIChatCompletion({ system, user, backend });
  return getFieldsFromCompletionResponse({ completion });
}

// Hack, singleton export so that we can get the httpErrors elsewhere.
export const atlasBackend = new AtlasAPI();

export async function runAtlasFindQueryGeneration(
  messageBody: string
): Promise<GenerationResponse> {
  const response = await atlasBackend.fetchAtlasPrivateApi(
    '/ai/api/v1/mql-query?request_id=generative_ai_accuracy_test',
    {
      method: 'POST',
      body: messageBody,
    }
  );
  return {
    content: response.content,
    query: response?.content?.query,
    aggregation: response?.content?.aggregation?.pipeline,
  };
}

export async function runAtlasAggregationGeneration(
  messageBody: string
): Promise<GenerationResponse> {
  const response = await atlasBackend.fetchAtlasPrivateApi(
    '/ai/api/v1/mql-aggregation?request_id=generative_ai_accuracy_test',
    {
      method: 'POST',
      body: messageBody,
    }
  );
  return {
    content: response.content,
    query: response?.content?.query,
    aggregation: response?.content?.aggregation?.pipeline,
  };
}
