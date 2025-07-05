# Zoho CRM Integration for Claude.ai

An integration that connects Claude.ai to Zoho CRM, enabling seamless interaction with your CRM data through natural language queries. Uses the Model Context Protocol (MCP). Uses Zoho Oauth for a secure connection. 

This package is meant to be simple and easy to install. If you can install Docker Desktop, then this is a very simple integration to use!

## Features
- **Ready-Only**: To keep your data clean, Claude will be Read-Only with respect to Zoho and cannot modify CRM records
- **List Modules**: Get all available CRM modules and their API names
- **Field Information**: Retrieve field details for any CRM module
- **Search Records**: Search across CRM records using natural language
- **Get Records**: Fetch a specific record from any module
- **Count Records**: Get a count of records in a module with a variety of filter options
- **More in Development**: more features coming 2025

# Prerequisites

Before installing this MCP server, ensure you have the following installed on your system:

### Required Software
   
1. **Docker or Docker Desktop**
   - **Windows/Mac**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/). This automatically installs the Docker Engine under the hood, and makes the Engine easy to use and monitor. 
   - **Linux**: Install Docker Engine following the [official guide](https://docs.docker.com/engine/install/)
   - Verify installation: `docker --version`

And that's it! The list of prerequisite software was kept as short as possible. The rest of the application will run inside of a Docker container. Now, you'll just need to setup Zoho Oauth credentials and configure Claude to connect to the MCP server.
### Zoho CRM Setup

1. **Admin Access for Zoho CRM Account**
   - Active Zoho CRM subscription
   - Administrator access to create OAuth applications

2. **Create Zoho OAuth ID and Secret**
   - Go to [Zoho Developer Console](https://api-console.zoho.com/)
   - Create a new "Server Application"
   - Set redirect URI to: `http://localhost:3000/authRedirect`
   - Note down your `Client ID` and `Client Secret`

# Quick Installation

### Step 1: Clone and Build Docker Image

1. **Clone the App Image**
   
   For this step you'll need to briefly open your terminal window and type in a command to pull the application from Docker Hub. In your terminal window: 
   
   AMD/Intel chips:
   ```
   docker pull whiteside1992daniel/zohocrm-mcpserver:amd64
   ```
   Apple Silicon/M-Series chips:
   ```
   docker pull whiteside1992daniel/zohocrm-mcpserver:m3
   ```
2. **Verify the Image (Optional)**
   
   You can verify the application was downloaded if you're not sure it was successful.
   ```bash
   docker images | grep whiteside1992daniel/zohocrm-mcpserver
   ```

### Step 2: Configure Claude Desktop

Now you need to make a modification to your Claude config file to tell Claude how to connect to the MCP Server. This is relatively simple once you find the file. 
1. **Locate Claude Desktop Config File**
You can open Claude Desktop and go to Preferences -> Developer -> Edit Config. This should open the file `claude_desktop_config.js`.

2. **Add MCP Server Configuration**
   
   Edit the `claude_desktop_config.json` file in a code or text editor and add the following configurations to enable the MCP server connection:
   ```json
   {
     "mcpServers": {
       "zohocrm-mcp-connector": {
          "command": "sh",
          "args": [
            "-c",
            "docker run --rm -i --name zoho-mcp-server -p 3000:3000 -v zoho-mcp-data:/app/data -e ZOHO_CLIENT_ID -e ZOHO_CLIENT_SECRET -e SCOPES whiteside1992daniel/zohocrm-mcpserver:VERSION"
          ],
          "env": {
            "ZOHO_CLIENT_ID" : "YOURCLIENTID",
            "ZOHO_CLIENT_SECRET" : "YOURCLIENTSECRET",
            "SCOPES" : "ZohoCRM.settings.READ,ZohoCRM.modules.READ,ZohoSearch.securesearch.READ,ZohoCRM.settings.layouts.READ",
            "NODE_ENV": "production"
          }
        }
     }
   }
   ```
   This configuration is telling Claude to launch a docker container hosting the MCP server whenever the application starts. 
   
   **Replace the placeholder values:**
   - ZOHO_CLIENT_ID : `YOURCLIENTID` - Your actual Zoho Client ID
   - ZOHO_CLIENT_SECRET : `YOURCLIENTSECRET` - Your actual Zoho Client Secret
   - SCOPES : whiteside1992daniel/zohocrm-mcpserver:`VERSION` - Your version depending on your silicon [amd64 || m3]

3. **Restart Claude Desktop**
   - Close Claude Desktop completely
   - Reopen Claude Desktop
   - The MCP server will be automatically started when needed
   - Try asking claude "is Zoho MCP is working?" or "help me authorize Zoho MCP Server"


# Appendix - Available Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `validate-zoho-oauth` | Check if Oauth Refresh Token exists | None |
| `setup-zoho-oauth` | Get Refresh Token | None |
| `list-zoho-modules` | List all CRM modules | None |
| `zoho-module-list-fields` | Get fields for a module | `module_api_name` |
| `simple-search-zoho-records` | Search records | `module_api_name`, `search_string` |
| `count-zoho-records` | Count Records with filters | 'module_api_name`, `filter_type`, `search_string` |
| `get-zoho-record` | Get record by ID | `id`, `moduleApiName` |

## Usage Examples

### In Claude Desktop

```
Show me all the modules in my Zoho CRM
```

```
What fields are available in the Contacts module?
```

```
Search for accounts containing "Microsoft"
```

```
Get the most recent Prospect located in Omaha, Nebraska
```

# Appendix - Troubleshooting

### Error Logging
Application logs can be found by going to Claude -> Preferences -> Developer. When there is an error there will be an option to open the error logs. Check the logs to see if the servers started and if Claude is able to communicate with them. 
### Common Issues

1. **MCP Server Not Starting**
   ```bash
   # Check if Docker image exists
   docker images | grep zoho-mcp-server
   
   # Test the Docker image manually
   docker run --rm -it -p 3000:3000 \
     -e ZOHO_CLIENT_ID=your_client_id \
     -e ZOHO_CLIENT_SECRET=your_client_secret \
     -e SCOPES=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL \
     zoho-mcp-server
   ```

2. **Authentication Fails**
   - Verify Client ID and Client Secret in the config file
   - Ensure redirect URI matches: `http://localhost:3000/authRedirect`
   - Check Zoho Developer Console settings

3. **Port Already in Use**
   ```bash
   # Check what's using port 3000
   lsof -i :3000
   
   # Kill processes using the port if needed
   sudo kill -9 $(lsof -t -i:3000)
   ```

4. **Config File Issues**
   - Ensure the JSON syntax is valid
   - Check that file path exists
   - Verify environment variables are properly quoted

### Debug Mode

1. **Test Docker Image Manually**
   ```bash
   docker run --rm -it -p 3000:3000 \
     -e ZOHO_CLIENT_ID=your_client_id \
     -e ZOHO_CLIENT_SECRET=your_client_secret \
     -e SCOPES=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL \
     zoho-mcp-server
   ```

2. **View Container Logs**
   ```bash
   # Find running container
   docker ps
   
   # View logs
   docker logs <container_id>
   ```

# Appendix - Testing the Installation

1. **Verify Docker Image**
   ```bash
   docker run --rm zoho-mcp-server node --version
   ```

2. **Test MCP Connection**
   - Open Claude Desktop
   - Try the command: "List all Zoho CRM modules"
   - If successful, you'll see module information

3. **Test OAuth Flow**
   - Use the "authorize-zoho" tool
   - Complete the authorization in your browser
   - Try searching for records
   
# Appendix - Commands

## Manual Testing Node
Config for Claude.ai in manual dev mode
```
"zohocrm-mcp-connector": {
      "command": "sh",
      "args": [
        "-c",
        "node /Users/whiteside/Documents/GitHub/zohocrm-mcpserver/express.js & node /Users/whiteside/Documents/GitHub/zohocrm-mcpserver/index.js"
      ],
      "env": {
        "ZOHO_CLIENT_ID" : "1000.6ZAM3J05ETG46V9ZD1TNSJT7BTZ77A",
        "ZOHO_CLIENT_SECRET" : "d09b76a006701550137cfa72240e804c21f2a69d96",
        "SCOPES" : "ZohoCRM.settings.ALL,ZohoCRM.modules.ALL,ZohoSearch.securesearch.READ,ZohoCRM.settings.layouts.READ",
        "NODE_ENV": "development"
      }
    }
```

# License

This project is licensed under the ISC License.

# Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Support

For issues and questions:
- Check the troubleshooting section above
- Review Zoho CRM API documentation
- Open an issue in the repository
- Email Daniel Whiteside

---

**Note**: This MCP server requires active network connectivity to communicate with Zoho CRM APIs. Ensure your firewall and network settings allow outbound HTTPS connections to Zoho APIs.
