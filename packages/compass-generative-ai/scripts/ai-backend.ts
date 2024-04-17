/* eslint-disable no-console */

import OpenAI from 'openai';
import DigestClient from 'digest-fetch';
import nodeFetch from 'node-fetch';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'],
});

const BACKEND = process.env.AI_TESTS_BACKEND || 'atlas-dev';

if (!['atlas-dev', 'atlas-local', 'compass'].includes(BACKEND)) {
  throw new Error('Unknown backend');
}

const fetch = (() => {
  if (BACKEND === 'atlas-dev' || BACKEND === 'atlas-local') {
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
  (BACKEND === 'atlas-dev'
    ? 'https://cloud-dev.mongodb.com/api/private'
    : BACKEND === 'atlas-local'
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

export function createAIChatCompletion({
  system,
  user,
  model = 'gpt-3.5-turbo', // 'gpt-4-turbo', //
}: {
  system?: string;
  user: string;
  model?: ChatCompletionCreateParamsBase['model'];
}): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  if (!system) {
    return openai.chat.completions.create({
      messages: [
        {
          role: 'user',
          content: user,
        },
      ],
      model,
    });
  }

  return openai.chat.completions.create({
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
