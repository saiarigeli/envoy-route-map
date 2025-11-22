# Envoy Route Map - Walkthrough

## Overview
Envoy Route Map is a web-based tool to visualize Envoy configurations. It parses `config_dump` JSON or static YAML/JSON and displays an interactive graph of the routing topology.

## Running with Docker (Recommended)

The easiest way to run the application is using Docker. This ensures a consistent environment.

1.  **Prerequisites:** Ensure Docker and Docker Compose are installed.
2.  **Run:**
    ```bash
    docker-compose up --build
    ```
3.  **Access:**
    *   Frontend: [http://localhost:5173](http://localhost:5173)
    *   Backend API: [http://localhost:8080](http://localhost:8080)

## Manual Setup (Development)

### Prerequisites
- Python 3.9+
- Node.js 18+

### Backend
The backend is a FastAPI application.

1.  **Install Dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```
2.  **Run Server**:
    ```bash
    cd backend
    uvicorn src.main:app --reload --port 8080
    ```
    The API will be available at `http://localhost:8080`.
    Health check: `http://localhost:8080/healthz`

### Frontend
The frontend is a React + Vite application.

1.  **Install Dependencies**:
    ```bash
    cd frontend
    npm install
    ```
2.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The UI will be available at `http://localhost:5173`.

## Usage Guide

1.  Open `http://localhost:5173` in your browser.
2.  **Paste Config**: Copy your Envoy `config_dump` (JSON) or static config (YAML/JSON) into the text area on the left.
3.  **Visualize**: Click the "Visualize" button.
4.  **Explore**:
    *   **Graph**: See the flow from Listeners -> RouteConfigs -> VirtualHosts -> Routes -> Clusters -> Endpoints.
    *   **Filter**: Use the dropdown in the top-left of the graph to show only specific node types.
    *   **Search**: Type in the search box to highlight nodes by name.
    *   **Details**: Click on any node to see detailed JSON properties in a sidebar.

## Features
- **Format Detection**: Automatically detects JSON or YAML.
- **Validation**: Shows errors for invalid syntax.
- **Stats**: Displays counts of listeners, routes, clusters, etc.
- **Warnings**: Highlights missing references (e.g., a Route pointing to a non-existent Cluster).
