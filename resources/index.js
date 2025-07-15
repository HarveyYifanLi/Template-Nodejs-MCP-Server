import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';

import dotenv from 'dotenv';
dotenv.config();

export function createAppConfigResource() {
  // Static resource example with no parameters
  return {
    name: 'config',
    resourceUri: 'config://app',
    title: 'Application Config',
    description: 'Application configuration data',
    mimeType: 'text/plain',
    async execute(uri) {
      return {
        contents: [
          {
            uri: uri.href,
            text: 'App configuration here!!',
          },
        ],
      };
    },
  };
}

export function createUserProfileResource() {
  // Dynamic resource example with parameters
  return {
    name: 'user-profile',
    resourceUri: new ResourceTemplate('users://{userId}/profile', {
      list: undefined,
    }),
    title: 'User Profile',
    description: 'User profile information',
    async execute(uri, { userId }) {
      return {
        contents: [
          {
            uri: uri.href,
            text: `Profile data for user ${userId}!!`,
          },
        ],
      };
    },
  };
}
