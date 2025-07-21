import express from 'express';
import cors from 'cors';
import { randomUUID } from 'node:crypto';
import NodeCache from 'node-cache';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
dotenv.config();

import mcpServer from './server/index.js';

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: 'http://localhost:3000', // Adjust this to your mcp client app's origin
    exposedHeaders: ['mcp-session-id'],
    allowedHeaders: ['Content-Type', 'mcp-session-id', 'mcp-protocol-version'],
    // MUST include 'mcp-protocol-version' otherwise preflight check will error out!!
  })
);

// Store transports by session ID
const transportCache = new NodeCache({
  stdTTL: 3600, // 1-hour expiry
  checkperiod: 0,
  useClones: false, // MUST MUST include this config to store references instead of cloning objects
  // otherwise the StreamableHTTPServerTransport object will be broken!!!!!(It took me freaking hours to debug and fix this bummer!!!)
});

// Handle POST requests for client-to-server communication
app.post('/mcp', async (req, res) => {
  // Check for existing session ID
  const sessionId = req.headers['mcp-session-id']; // string | undefined;

  let transport; // StreamableHTTPServerTransport object
  // Check if the session ID exists in the transport cache; if so reuse the transport; otherwise, create a new one
  if (sessionId) {
    transport = transportCache.get(sessionId);
  }

  if (!transport && isInitializeRequest(req.body)) {
    // Create a new transport only for new initialization request
    transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        // Store the transport by session ID
        transportCache.set(sessionId, transport);
      },
      // DNS rebinding protection is disabled by default for backwards compatibility.
      // When running this server locally, make sure to set it to true!!!
      enableDnsRebindingProtection: true,
      allowedHosts: ['127.0.0.1'],
    });

    // Clean up transport when closed
    transport.onclose = () => {
      if (sessionId) transportCache.del(sessionId);
    };
    // finally connect the transport to the imported MCP server singleton
    await mcpServer.connect(transport);
  } else if (!transport) {
    // Invalid request
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: No valid session ID provided',
      },
      id: null,
    });
    return;
  }

  // Handle the request
  await transport.handleRequest(req, res, req.body);
});

// Reusable handler for GET and DELETE requests
const handleSessionRequest = async (req, res) => {
  const sessionId = req.headers['mcp-session-id']; // string | undefined;

  let transport;
  // Check if the session ID exists in the transport cache; if so reuse the transport; otherwise, return an error
  if (sessionId) transport = transportCache.get(sessionId);

  if (!sessionId || !transport) {
    res.status(400).send('Invalid or missing session ID');
    return;
  }
  // Handle the request
  await transport.handleRequest(req, res);
};

// Handle GET requests for server-to-client notifications via SSE
app.get('/mcp', handleSessionRequest);

// Handle DELETE requests for session termination
app.delete('/mcp', handleSessionRequest);

app.listen(3001);
