import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getZohoAccessToken , listZohoModules, listZohoModuleFields, searchZohoRecords, getZohoRecordById } from "./zoho-helper.js";
import express from "express";
import { exec } from "child_process";
console.error(`[${new Date().toISOString()}] Starting MCP server...`);
console.error(`[${new Date().toISOString()}] Node.js version: ${process.version}`);
console.error(`[${new Date().toISOString()}] Process PID: ${process.pid}`);
//APP CONSTANTS
const PORT = 80;
//CREATE EXPRESS LISTENER
//const app = express();
//app.use(express.json());
//app.post('/mcp', async (req, res) => {
//  // In stateless mode, create a new instance of transport and server for each request
//  // to ensure complete isolation. A single instance would cause request ID collisions
//  // when multiple clients connect concurrently.
//  
//  try {
//    const server = getServer(); 
//    const transport = new StreamableHTTPServerTransport({
//      sessionIdGenerator: undefined,
//    });
//    res.on('close', () => {
//      //console.log('Request closed');
//      transport.close();
//      server.close();
//    });
//    await server.connect(transport);
//    await transport.handleRequest(req, res, req.body);
//  } catch (error) {
//    console.error('Error handling MCP request:', error);
//    if (!res.headersSent) {
//      res.status(500).json({
//        jsonrpc: '2.0',
//        error: {
//          code: -32603,
//          message: 'Internal server error',
//        },
//        id: null,
//      });
//    }
//  }
//});
//
//// SSE notifications not supported in stateless mode
//app.get('/mcp', async (req, res) => {
//  //console.log('Received GET MCP request');
//  res.writeHead(405).end(JSON.stringify({
//    jsonrpc: "2.0",
//    error: {
//      code: -32000,
//      message: "Method not allowed."
//    },
//    id: null
//  }));
//});
//
//// Session termination not needed in stateless mode
//app.delete('/mcp', async (req, res) => {
//  //console.log('Received DELETE MCP request');
//  res.writeHead(405).end(JSON.stringify({
//    jsonrpc: "2.0",
//    error: {
//      code: -32000,
//      message: "Method not allowed."
//    },
//    id: null
//  }));
//});
////START EXPRESS SERVER LISTENER
//app.listen(PORT, (error) => {
//  if (error) {
//    console.error('Failed to start server:', error);
//    process.exit(1);
//  }
//  console.error(`MCP Stateless Streamable HTTP Server listening on port ${PORT}`);
//});

//CREATE MCP SERVER CONFIG
const server = new McpServer({
  name: "zohocrm-mcp-connector",
  version: "1.0.1"
});

//GET REFRESH TOKEN IF ONE DOESN'T EXIST
server.registerTool(
  "authorize-zoho",
  {
    title: "Authorize Zoho CRM Account",
    description: "Before you can use the other tools, you must authorize your Zoho Account with the proper scopes and permissions. The user must visit this link to authorize Zoho, then get redirected to this application"
  },
  async () => {
    return {
      content: [{type: 'text' , text: `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${process.env.ZOHO_CLIENT_ID}&scope=${process.env.SCOPES}&redirect_uri=http://localhost:3000/authRedirect&access_type=offline`}]
    };
  }
);

// Search Zoho Records Tool
server.registerTool(
  "list-zoho-modules",
  {
    title: "List All Modules",
    description: "Get a list of all the modules and their API names from CRM"
  },
  async () => {
    const accessToken = await getZohoAccessToken();
    const modules = await listZohoModules(accessToken);
    return {
      content: [{ type: "text", text: JSON.stringify(modules) }]
    };
  }
);

//// Search Zoho Records Tool
server.registerTool(
  "zoho-module-list-fields",
  {
    title: "List All Fields in a Modules",
    description: "Get a list of all the fields and their API names for a module. Search by Module API Name",
    inputSchema: { module_api_name: z.string() }
  },
  async ({module_api_name}) => {
    const accessToken = await getZohoAccessToken();
    const fields = await listZohoModuleFields(accessToken, module_api_name);
    return {
      content: [{ type: "text", text: JSON.stringify(fields) }]
    };
  }
);

// Search Zoho Records Tool
server.registerTool(
  "simple-search-zoho-records",
  {
    title: "Search CRM Records",
    description: "Search Zoho CRM Records using the API. Search using the Module API Name and a Search String",
    inputSchema: { searchString: z.string() , searchModule: z.string() }
  },
  async ({ searchModule , searchString }) => {
    const accessToken = await getZohoAccessToken();
    const searchResults = await searchZohoRecords(accessToken, searchModule , searchString );
    const data = searchResults;
    return {
      content: [{ type: "text", text: JSON.stringify(data) }]
    };
  }
);

// Get Zoho Record By Id
server.registerTool(
  "get-zoho-record",
  {
    title: "Get Zoho Record by ID",
    description: "Get a record from any Zoho CRM Module by the record id.",
    inputSchema: { id: z.number() , moduleApiName: z.string() }
  },
  async ({ searchString }) => {
    const accessToken = await getZohoAccessToken();
    const recordData = await searchZohoRecords(accessToken, moduleApiName , id );
    const data = recordData.data;
    return {
      content: [{ type: "text", text: data }]
    };
  }
);

// Add a dynamic greeting resource
server.registerResource(
  "greeting",
  new ResourceTemplate("greeting://{name}", { list: undefined }),
  { 
    title: "Greeting Resource",      // Display name for UI
    description: "Dynamic greeting generator"
  },
  async (uri, { name }) => ({
    contents: [{
      uri: uri.href,
      text: `Hello, ${name}!`
    }]
  })
);


//// Add an addition tool
//server.registerTool("add",
//  {
//    title: "Addition Tool",
//    description: "Add two numbers",
//    inputSchema: { a: z.number(), b: z.number() }
//  },
//  async ({ a, b }) => ({
//    content: [{ type: "text", text: String(a + b) }]
//  })
//);
//
//
//const token = await getZohoAccessToken();
//const fieldData = await searchZohoRecords(token, "Accounts", "WFHF");
//console.log(fieldData);
// Replace your current event listeners and main code with this:
// Add server event handlers for debugging
server.onrequest = (request) => {
  console.error(`[${new Date().toISOString()}] Server received request:`, JSON.stringify(request));
};

server.onnotification = (notification) => {
  console.error(`[${new Date().toISOString()}] Server received notification:`, JSON.stringify(notification));
};
async function main() {
  try {
    console.error(`[${new Date().toISOString()}] Creating transport...`);
    
    // REMOVE THESE LINES - they cause the buffer issue:
    // process.stdin.setEncoding('utf8');
    // process.stdin.resume();
    
    // Add raw stdin debugging
    process.stdin.on('data', (data) => {
      console.error(`[${new Date().toISOString()}] Raw stdin data (${data.length} bytes):`, data.toString());
    });
    
    const transport = new StdioServerTransport();
    
    console.error(`[${new Date().toISOString()}] Connecting server to transport...`);
    await server.connect(transport);
    
    console.error(`[${new Date().toISOString()}] MCP server connected and ready!`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in main: ${error.message}`);
    console.error(`[${new Date().toISOString()}] Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Remove the stdin event listeners that might be interfering
// Comment out or remove these:
/*
process.stdin.on('end', () => {
  console.error(`[${new Date().toISOString()}] stdin ended`);
});

process.stdin.on('close', () => {
  console.error(`[${new Date().toISOString()}] stdin closed`);
});
*/

main();