# Tasks - Envoy Route Map

- [x] **Project Initialization**
    - [x] Initialize Git repository (if not already).
    - [x] Create `backend/` directory and `requirements.txt`.
    - [x] Create `frontend/` directory using Vite (React + TypeScript).
    - [x] Create `docker-compose.yml` for local orchestration.

- [x] **Backend Development (Python/FastAPI)**
    - [x] **Setup**: Create `main.py` with FastAPI app and CORS.
    - [x] **Models**: Define Pydantic models in `models.py` (`InputConfig`, `GraphResult`, `Node`, `Edge`).
    - [x] **Parsing**: Implement `parser.py` to handle JSON/YAML and detect Envoy config types.
    - [x] **Extraction**: Implement `extractor.py` to pull Listeners, Routes, Clusters from the config.
    - [x] **Graph Logic**: Implement `graph_builder.py` to convert extracted resources into Nodes and Edges.
    - [x] **API**: Connect `/visualize` endpoint in `api.py` to the logic.
    - [x] **Testing**: Add unit tests for parsing and graph generation.

- [ ] **Frontend Development (React)**
    - [x] **Setup**: Install dependencies (`react-flow-renderer` or `reactflow`, `axios`, UI components).
    - [x] **Layout**: Create `App.tsx` with a split-pane layout (Config vs Graph).
    - [x] **Config Panel**: Build `ConfigPanel.tsx` (Textarea, Format Select, Submit).
    - [x] **API Client**: Implement `api/client.ts` to POST to backend.
    - [x] **Graph Visualization**: Build `GraphPanel.tsx` using React Flow to render the nodes/edges.
    - [x] **Node Details**: Implement `NodeDetails.tsx` drawer to show metadata on click.
    - [x] **Filtering/Search**: Add client-side filtering and search in the toolbar.

- [x] **Integration & Polish**
    - [x] **Error Handling**: Ensure backend errors (400/413) are displayed gracefully in UI.
    - [x] **Styling**: Apply a clean, dev-friendly theme (dark mode preferred).
    - [x] **Docker**: Verify `Dockerfile` builds and runs correctly.
    - [x] **Manual Verification**: Test with a real `config_dump.json`.

- [ ] **Enhancements**
    - [x] **Backend Port**: Change default backend port to 8080.
    - [ ] **Multi-file Support**:
        - [x] **Backend**: Update `VisualizeRequest` to accept multiple config strings.
        - [x] **Backend**: Update `parser.py` to merge resources from multiple inputs.
        - [x] **Frontend**: Add File Upload support to handle multiple files.
        - [x] **Frontend**: Update API client to send list of configs.
