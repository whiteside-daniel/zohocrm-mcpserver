import fs from "fs";
import path from "path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { z } from "zod";
import { getZohoAccessToken , listZohoModules, listZohoModuleFields, searchZohoRecords, countZohoRecords, getZohoRecordById } from "./zoho-helper.js";
import express from "express";
console.error(`[${new Date().toISOString()}] Starting MCP server...`);
console.error(`[${new Date().toISOString()}] Node.js version: ${process.version}`);
console.error(`[${new Date().toISOString()}] Process PID: ${process.pid}`);

//APP CONSTANTS
const authLink = `https://accounts.zoho.com/oauth/v2/auth?response_type=code&client_id=${process.env.ZOHO_CLIENT_ID}&scope=${process.env.SCOPES}&redirect_uri=http://localhost:3000/authRedirect&access_type=offline`;
let tokenFilePath = '';
if(process.env.NODE_ENV == 'development') {
  tokenFilePath = process.env.DEV_TOKEN_PATH;
  console.error(`development environment tokenFilePath: ${tokenFilePath}`);
}
else {
  tokenFilePath = path.join(process.cwd(), 'data', 'refreshToken.txt');
  console.error(`production environment tokenFilePath: ${tokenFilePath}`);
}
//CREATE MCP SERVER CONFIG
const server = new McpServer({
  name: "zohocrm-mcp-connector",
  version: "1.0.1"
});

//GET REFRESH TOKEN IF ONE DOESN'T EXIST
server.registerTool(
  "validate-zoho-oauth",
  {
    title: "Validate Zoho Authorization",
    description: "This will validate whether or not the user has a token already. If so you should be able to use the other endpoints."
  },
  () => {
    if (fs.existsSync(tokenFilePath)) {
      const returnText = "Refresh token found. You should be able to use the other tools and request data from Zoho CRM. Thanks for checking!";
      return {
        content: [{type: 'text' , text: returnText }]
      };
    } else {
      return {
        content: [{type: 'text' , text: authLink }]
      };
    }
  }
);

server.registerTool(
  "setup-zoho-oauth",
  {
    title: "Authorize or Reauthorize Zoho CRM Account",
    description: "Before you can use the other tools, you must authorize your Zoho Account with the proper scopes and permissions. The user must visit this link to authorize Zoho, then get redirected to this application. You can also use this to re-authorize and get a new token if something has gone wrong."
  },
  () => {
    return {
      content: [{type: 'text' , text: authLink }]
    };
  }
);

// Search Zoho Records Tool
server.registerTool(
  "zoho-modules-list-all",
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

//// List CRM Fields Tool
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

//COUNT CRM RECORDS IN A MODULE
const CountCriteria = z.literal(['cvid', 'criteria', 'email', 'phone', 'word']);
server.registerTool(
  "count-zoho-records",
  {
    title: "Count CRM Records in a Module",
    description: "Fetch the total number of records in the module, or fetch the number of records that match a criteria. Count filters can be custom view ID, criteria, email, phone number, or a word in the record. For a total count, set count_type='total' and search_value=''. Criteria pattern is (API_NAME:operator:value) The condition to obtain the number of records that match the criterion. You can filter the records based on the API name of the field. The supported operators are equals, starts_with, in, not_equal, greater_equal, greater_than, less_equal, less_than and between. The supported data types are picklist, id, owner_lookup, user_lookup, lookup, phone, email, date, datetime, integer, currency, decimal and double. You can also get the number of records from a custom view of a module.",
    inputSchema: { module_api_name: z.string() , count_filter: z.enum(['cvid', 'criteria', 'email', 'phone', 'word', 'total']) , search_value: z.string() }
  },
  async ({ module_api_name, count_filter, search_value }) => {
    const accessToken = await getZohoAccessToken();
    const searchResults = await countZohoRecords(accessToken, module_api_name , count_filter, search_value);
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

//DEBUGGING CODE
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

main();