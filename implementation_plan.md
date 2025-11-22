# Implementation Plan - Envoy Route Map (v2)

## Goal Description
Enhance the tool to support multiple configuration files (e.g., bootstrap, LDS, CDS) and change the default backend port to 8080 to avoid conflicts.

## Proposed Changes

### Backend
#### [MODIFY] [backend/src/main.py](file:///Users/saiharisharigeli/Documents/envoy-configv/backend/src/main.py)
- Change default port in comments/docs if any.
- (Runtime) Run uvicorn on 8080.

#### [MODIFY] [backend/src/models.py](file:///Users/saiharisharigeli/Documents/envoy-configv/backend/src/models.py)
- Update `VisualizeRequest` to accept `configs: List[str]` instead of single `config`.
- Keep `config` for backward compatibility or deprecate it? -> Replace with `configs`.

#### [MODIFY] [backend/src/parser.py](file:///Users/saiharisharigeli/Documents/envoy-configv/backend/src/parser.py)
- Update `parse_config` to handle a list of strings.
- Implement merging logic:
    - If inputs are JSON/YAML, parse each.
    - Merge `static_resources`, `dynamic_resources`, `configs` (from config_dump).
    - Combine listeners, clusters, routes into a single "extracted" state.

#### [MODIFY] [backend/src/api.py](file:///Users/saiharisharigeli/Documents/envoy-configv/backend/src/api.py)
- Update `visualize` endpoint to iterate over `request.configs`.

### Frontend
#### [MODIFY] [frontend/src/api/client.ts](file:///Users/saiharisharigeli/Documents/envoy-configv/frontend/src/api/client.ts)
- Update `API_URL` to port 8080.
- Update `visualize` to send `{ configs: [...] }`.

#### [MODIFY] [frontend/src/components/ConfigPanel.tsx](file:///Users/saiharisharigeli/Documents/envoy-configv/frontend/src/components/ConfigPanel.tsx)
- Add "Upload Files" button.
- Maintain a list of loaded files/content.
- Allow pasting as "Manual Input".
- Send all valid inputs to backend.

## Verification Plan
1.  **Port Check**: Verify backend runs on 8080.
2.  **Multi-file**: Upload `lds.yaml` and `cds.yaml` separately. Verify graph shows both listeners and clusters linked correctly.
