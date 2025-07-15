import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

import { createListMongoTool, createFetchPokemonTool } from '../tools/index.js';
import {
  createAppConfigResource,
  createUserProfileResource,
} from '../resources/index.js';

// Create a new McpServer instance
const server = new McpServer({
  name: 'Yifan-test-server',
  version: '1.0.0',
});

// set up server resources, tools, prompts etc
// -> Register the tools
server.registerTool(
  createListMongoTool().name,
  {
    ...createListMongoTool(),
  },
  createListMongoTool().execute
);

server.registerTool(
  createFetchPokemonTool().name,
  {
    ...createFetchPokemonTool(),
  },
  createFetchPokemonTool().execute
);

// -> Register the resources
server.registerResource(
  createAppConfigResource().name,
  createAppConfigResource().resourceUri,
  {
    title: createAppConfigResource().title,
    description: createAppConfigResource().description,
    mimeType: createAppConfigResource().mimeType,
  },
  createAppConfigResource().execute
);

server.registerResource(
  createUserProfileResource().name,
  createUserProfileResource().resourceUri,
  {
    title: createUserProfileResource().name,
    description: createUserProfileResource().description,
  },
  createUserProfileResource().execute
);

export default server;
