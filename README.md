# Envoy Route Map

A web-based visualization tool for Envoy Proxy configurations. Upload your Envoy `config_dump` JSON or static YAML/JSON configurations and instantly see an interactive graph of your routing topology.

![Envoy Route Map](https://img.shields.io/badge/envoy-visualization-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- 📊 **Interactive Graph Visualization** - See your Envoy configuration as a hierarchical flow diagram
- 🔍 **Filter & Search** - Quickly find specific listeners, routes, clusters, and endpoints
- 📁 **Multi-File Support** - Upload multiple configuration files simultaneously
- 🐳 **Dockerized** - Run the entire stack with a single command
- 🎨 **Modern UI** - Clean, dark-themed interface with real-time interaction
- ⚡ **Fast** - Built with React 19, Vite, and FastAPI

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/envoy-configv.git
cd envoy-configv

# Start the application
docker-compose up --build

# Access the app at http://localhost:5173
```

### Manual Setup

#### Prerequisites
- Python 3.9+
- Node.js 20+
- npm

#### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8080
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Usage

1. **Upload Configuration**: Click the upload area or drag-and-drop your Envoy config files (JSON or YAML)
2. **Visualize**: Click "Visualize Configuration" to generate the graph
3. **Explore**: 
   - Pan and zoom the graph
   - Click nodes to see detailed information
   - Use filters to focus on specific resource types
   - Search for resources by name

## Supported Configuration Formats

- Envoy `config_dump` JSON (from admin interface)
- Static YAML configurations
- Static JSON configurations
- xDS API response formats

## Architecture

### Backend (Python/FastAPI)
- **Parser**: Handles JSON/YAML parsing and format detection
- **Extractor**: Extracts listeners, routes, clusters, and endpoints
- **Graph Builder**: Constructs the node-edge graph representation

### Frontend (React/TypeScript)
- **React 19** with Vite for fast development
- **@xyflow/react** for interactive graph visualization
- **Dagre** for automatic hierarchical layout
- **TailwindCSS v4** for styling

## Development

### Project Structure

```
envoy-configv/
├── backend/
│   ├── src/
│   │   ├── main.py          # FastAPI application
│   │   ├── models.py        # Pydantic models
│   │   ├── parser.py        # Config parsing logic
│   │   ├── extractor.py     # Resource extraction
│   │   ├── graph_builder.py # Graph construction
│   │   └── api.py           # API endpoints
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api/             # API client
│   │   └── types.ts         # TypeScript types
│   ├── Dockerfile
│   └── package.json
├── samples/                 # Example configurations
└── docker-compose.yml
```

### Running Tests

```bash
# Backend tests (if implemented)
cd backend
pytest

# Frontend tests (if implemented)
cd frontend
npm test
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built for the Envoy Proxy community
- Uses the excellent [@xyflow/react](https://github.com/xyflow/xyflow) library for graph rendering
- Inspired by the need for better Envoy configuration visualization tools
