# Zoho CRM MCP Server for Claude.ai

An integration that connects Claude.ai to Zoho CRM, enabling seamless interaction with your CRM data through natural language queries. Uses the Model Context Protocol (MCP). Uses Zoho Oauth for a secure connection. 

## Features

- **List Modules**: Get all available CRM modules and their API names
- **Field Information**: Retrieve field details for any CRM module
- **Search Records**: Search across CRM records using natural language
- **Get Records**: Fetch specific records
- **More in Development**: more features coming 2025

# Prerequisites

Before installing this MCP server, ensure you have the following installed on your system:

### Required Software

1. **node.js and npm**
   - **Windows/Mac**: Download offial installer at nodejs.org
   - **Linux**: `curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash` then `nvm install node`
   - Verify installation: `node --version`
   
1. **Docker or Docker Desktop**
   - **Windows/Mac**: Download and install [Docker Desktop](https://www.docker.com/products/docker-desktop/)
   - **Linux**: Install Docker Engine following the [official guide](https://docs.docker.com/engine/install/)
   - Verify installation: `docker --version`

### Zoho CRM Setup

1. **Admin Access for Zoho CRM Account**
   - Active Zoho CRM subscription
   - Administrator access to create OAuth applications

2. **Create Zoho OAuth ID and Secret**
   - Go to [Zoho Developer Console](https://api-console.zoho.com/)
   - Create a new "Self Client" application
   - Set redirect URI to: `http://localhost:3000/authRedirect`
   - Note down your `Client ID` and `Client Secret`

# Installation

### Step 1: Clone and Build Docker Image

1. **Clone the App Image**
   
   In your terminal window, in any folder: 
   
   AMD/Intel chips:
   ```
   docker pull whiteside1992daniel/zohocrm-mcpserver:amd64
   ```
   Apple Silicon/M-Series chips:
   ```
   docker pull whiteside1992daniel/zohocrm-mcpserver:m3
   ```
2. **Verify the Image (Optional)**
   ```bash
   docker images | grep whiteside1992daniel/zohocrm-mcpserver
   ```

### Step 2: Configure Claude Desktop

Now you need to make a modification to your Claude config file to tell Claude how to connect to the MCP Server.
1. **Locate Claude Desktop Config File**
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json` (show hidden files on Mac by doing Shift + Option + Period)
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. **Add MCP Server Configuration**
   
   Edit the `claude_desktop_config.json` file and add:
   ```json
   {
     "mcpServers": {
       "zohocrm-mcp-connector": {
          "command": "docker",
          "args": [
            "run", "--rm",
            "-i", "--name", "zoho-mcp-server",
            "-p", "3000:3000",
            "-e", "ZOHO_CLIENT_ID",
            "-e", "ZOHO_CLIENT_SECRET",
            "-e", "SCOPES",
            "whiteside1992daniel/zohocrm-mcpserver:YOURVERSION"
          ],
          "env": {
            "ZOHO_CLIENT_ID" : "YOURCLIENTID",
            "ZOHO_CLIENT_SECRET" : "YOURCLIENTSECRET",
            "SCOPES" : "ZohoCRM.settings.ALL,ZohoCRM.modules.ALL,ZohoSearch.securesearch.READ",
            "NODE_ENV": "production"
          }
        }
     }
   }
   ```

   **Replace the placeholder values:**
   - ZOHO_CLIENT_ID : `YOURCLIENTID` - Your actual Zoho Client ID
   - ZOHO_CLIENT_SECRET : `YOURCLIENTSECRET` - Your actual Zoho Client Secret
   - SCOPES : whiteside1992daniel/zohocrm-mcpserver:`YOURVERSION` - Your version depending on your silicon [amd64 || m3]

3. **Restart Claude Desktop**
   - Close Claude Desktop completely
   - Reopen Claude Desktop
   - The MCP server will be automatically started when needed


# Appendix - Available Tools

| Tool Name | Description | Parameters |
|-----------|-------------|------------|
| `authorize-zoho` | Generate OAuth authorization URL | None |
| `list-zoho-modules` | List all CRM modules | None |
| `zoho-module-list-fields` | Get fields for a module | `module_api_name` |
| `simple-search-zoho-records` | Search records | `searchModule`, `searchString` |
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
Get the contact record with ID 1234567890
```

# Appendix - Troubleshooting

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

---

**Note**: This MCP server requires active network connectivity to communicate with Zoho CRM APIs. Ensure your firewall and network settings allow outbound HTTPS connections to Zoho APIs.
