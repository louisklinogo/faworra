Nia Context MCP
Context augmentation for agents.

​
📦 Installation
1
Prerequisites

Python 3.8+
pipx (recommended) or uvx or pip
Your Nia API key from app.trynia.ai
2
Install the Package


Option A: Using pipx (Recommended)

Option B: Using uvx

Option C: Using pip (If needed)

Copy

Ask AI
# Install globally for use across all projects
pipx install nia-mcp-server
3
Configure Your MCP Client

Choose your coding agent below for specific configuration steps
4
Replace Your API Key

Get your API key from app.trynia.ai and replace YOUR_API_KEY in the configuration
5
Restart Your Client

Restart your coding assistant to load the new MCP server
​
⚙️ Configuration for Your Coding Assistant
Cursor
Windsurf
Claude Desktop
VS Code
Continue.dev
Claude Code
Codex
Add Nia MCP server to Cursor

1
Open MCP Configuration

Open your Cursor MCP configuration file:
macOS: ~/.cursor/mcp.json
Windows: %APPDATA%\Cursor\mcp.json
Linux: ~/.config/cursor/mcp.json
2
Add NIA Configuration


Option A: Using pipx (Recommended)

Option B: Using uvx

Copy

Ask AI
{
  "mcpServers": {
    "nia": {
      "command": "pipx",
      "args": ["run", "--no-cache", "nia-mcp-server"],
      "env": {
        "NIA_API_KEY": "YOUR_API_KEY",
        "NIA_API_URL": "https://apigcp.trynia.ai/"
      }
    }
  }
}
​
🚀 Try It Out!
After restarting your coding agent, you’re good to go:
1
Search Package Source Code (No indexing required!)

Ask your coding agent: “Use package search to find how error handling is implemented in the requests Python library” or “Search the numpy package for array manipulation examples”
2
Index Documentation or a Repository

Try indexing public documentation or a repository:
“Index https://docs.trynia.ai/”
“Index https://github.com/browser-use/browser-use”
“Use nia deep research to compare the best GraphRAG frameworks and then index the one with least latency.”
3
Monitor Progress & Explore

Check your indexed resources:
“List my resources” or “Check the status of my indexing jobs”
Visit app.trynia.ai to see all your indexed content
​
🛠️ Available Tools
Package Search (No indexing!)
nia_package_search_grep - Regex-based code search in 3,000+ packages
nia_package_search_hybrid - AI-powered semantic package search
nia_package_search_read_file - Read specific file sections
Supports: PyPI, NPM, Crates.io, Go modules
Repository Management
index_repository - Index GitHub repositories for intelligent search
search_codebase - Search code with natural language queries
visualize_codebase - Open interactive graph visualization
Documentation Management
index_documentation - Index websites and documentation
search_documentation - Search docs with natural language
Unified Resource Management
list_resources - List all indexed repositories and documentation
check_resource_status - Monitor indexing progress
rename_resource - Rename resources for better organization
delete_resource - Remove indexed resources
Web Search & Research
nia_web_search - AI-powered search for repos, docs, and content
nia_deep_research_agent - Deep multi-step research and analysis
Project & Development Tools
initialize_project - Set up NIA-enabled projects with IDE configs
read_source_content - Read full content of specific sources
nia_bug_report - Submit feedback directly to the development team
​
📋 Complete Tool Reference
🔍 Package Search Tools (Instant Access to 3,000+ Packages)

📦 Repository Management Tools

📚 Documentation Management Tools

🗂️ Unified Resource Management

🌐 Web Search & Research Tools

🛠️ Development Tools

Need Help? Join our community or reach out through app.trynia.ai for support and updates.
Quick Setup for Cursor
Ask a question...

x
github
linkedin