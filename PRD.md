# Envoy Route Map - Product Requirements Document (PRD)

## 1. Purpose & Background

Envoy configurations, especially in xDS setups, are hard to reason about as text. Understanding how traffic flows from Listeners → RouteConfigs → VirtualHosts → Routes → Clusters → Endpoints usually requires digging through large JSON/YAML or `config_dump` output.

Envoy Route Map is a one-shot, web-based visualization tool. A user pastes an Envoy config snapshot (`config_dump` preferred, static config supported), clicks Visualize, and gets an interactive routing map, plus basic stats and warnings.

This is a dev tool for understanding what is currently configured, not a live debugger, traffic simulator, or linting engine.

## 2. Goals, Non-Goals, Success Criteria

### 2.1 Goals

*   **G1 – Global Routing Structure View**: Provide a clear, interactive graph of Envoy routing relationships from Listeners to Endpoints.
*   **G2 – xDS Aware**: Primarily support Envoy admin `config_dump` v3, targeting Envoy v1.19 and newer.
*   **G3 – One-Shot, Stateless Tool**: No accounts, no persistence. Each visualization is driven by a single request with the config snapshot.
*   **G4 – Dev-Friendly UX**: Graph-centric UI with:
    *   Node type filters
    *   Search
    *   Node details on click
    *   Basic stats and warnings

### 2.2 Non-Goals (v1)

*   No authentication, user accounts, or saved projects.
*   No direct integration to running Envoy instances (no calling admin `/config_dump`).
*   No active validation against a control plane or cluster state.
*   No traffic simulation (v1 does not answer “given host/path, which route?”).
*   No opinionated linting or advanced diagnostics.
*   No NGINX or other proxies.
*   No explicit support for Envoy < v1.19: earlier versions may or may not work, but are not tested or guaranteed.

### 2.3 Success Criteria (v1)

*   A user with a valid Envoy `config_dump` (Envoy ≥ 1.19) can:
    *   Paste config, click Visualize, and see a graph within 5 seconds for configs up to 5 MB.
    *   Click from a Listener down to an Endpoint and understand the routing chain without reading raw JSON.
*   Basic parsing resilience:
    *   Handles at least 80% of “normal” config_dump structures without crashing.
    *   On malformed or weird configs, returns a clear error or partial graph + warnings, not a 500 with stack trace.
*   Usability:
    *   New user can understand the core UI (paste → visualize → inspect nodes) within 1 minute without documentation.

## 3. Target Users & Use Cases

### 3.1 Personas

1.  **Infra / Platform Engineer** – owns Envoy, mesh, gateways.
2.  **Backend / Service Developer** – wants to verify how traffic reaches their service.
3.  **SRE / On-call** – debugging misrouting or missing routes.

### 3.2 Primary Use Cases

*   **UC1 – Understand Global Routing Layout**
*   **UC2 – Inspect Specific Listener or Route**
*   **UC3 – Debug Missing or Misconfigured References**
*   **UC4 – Static Config Inspection**

## 4. Scope for v1

### 4.1 In Scope

*   **Single-page web UI**:
    *   Paste or upload Envoy config (`config_dump` JSON preferred, static YAML/JSON supported).
    *   Format selector: Auto / JSON / YAML.
    *   Visualize button.
*   **Backend**:
    *   POST /visualize (Python + FastAPI).
    *   GET /healthz.
*   **Graph output**:
    *   Node types: Listener, RouteConfig, VirtualHost, Route, Cluster, Endpoint.
    *   Edges: Listener→RouteConfig, RouteConfig→VirtualHost, VirtualHost→Route, Route→Cluster, Cluster→Endpoint.
*   **Stats and warnings**.

### 4.2 Out of Scope (v1)

*   Auth, user accounts, project saving/sharing.
*   External integrations / control-plane awareness.
*   Traffic simulation.
*   Envoy < v1.19 explicit support.

## 5. User Experience & Flows

### 5.1 Global Layout

Single page, two-column layout:

**Left (Config Panel, ~30–35%)**
*   Textarea for config.
*   Format selector: Auto | JSON | YAML (Auto default).
*   Visualize button.
*   Stats summary.
*   Warnings list (scrollable).

**Right (Graph Panel, ~65–70%)**
*   Toolbar:
    *   Node-type filter: All, Listener, RouteConfig, VirtualHost, Route, Cluster, Endpoint
    *   Text search box.
    *   Zoom controls.
*   Graph canvas:
    *   Nodes layered: Listeners → RouteConfigs → VirtualHosts → Routes → Clusters → Endpoints.
    *   Basic pan/zoom interaction.
*   Node details drawer on node click.

### 5.2 Interaction Requirements (v1)

*   **Basic Pan/Zoom Only**:
    *   Pan: click-drag on empty space to move the viewport.
    *   Zoom: mouse wheel OR zoom-in/zoom-out buttons.
    *   Optional Reset view / Fit to graph button is allowed, but no advanced interactions required (no lasso selection, multi-select, drag-to-relink, etc.).

### 5.3 Errors & Empty States

*   **Parsing error (400)**:
    *   Show a banner/toast with message; keep user input intact.
*   **Valid config but no recognizable resources**:
    *   Show a message in graph panel; stats all zeros.
*   **Partial success**:
    *   Render what was parsed; show warnings for failed resources.

## 6. Functional Requirements

### 6.1 Input & API

*   **Frontend sends**:
    ```json
    {
      "config": "<raw envoy config or config_dump>",
      "format": "auto" | "json" | "yaml"
    }
    ```
*   **Backend**:
    *   Requires config.
    *   format optional, default auto.
    *   Enforces max request body size of 5 MB. Requests over 5 MB are rejected with HTTP 413 (Payload Too Large).
*   **Successful response (200) is a GraphResult JSON**:
    ```json
    {
      "nodes": [...],
      "edges": [...],
      "stats": {...},
      "warnings": [...]
    }
    ```
*   Invalid input/parsing error → 400 with concise message.
*   GET /healthz → { "status": "ok" }.

### 6.2 Format Detection & Parsing

*   **format=auto**:
    *   First non-whitespace char { or [ → JSON; else → YAML.
*   **format=json / yaml**: parse using corresponding parser.
*   Parse failures → 400 with message (no stack trace).

### 6.3 Envoy Version & Config Type Detection

*   Tool targets Envoy v1.19+ with admin v3 config URLs:
    *   `envoy.config.listener.v3.Listener`
    *   `envoy.config.route.v3.RouteConfiguration`
    *   `envoy.config.cluster.v3.Cluster`
    *   `envoy.config.endpoint.v3.ClusterLoadAssignment`
*   **Detect**:
    *   `config_dump` if top-level has configs or nested `type_url`/`@type` with Envoy resources.
    *   Otherwise treat as static config using `static_resources.listeners` and `static_resources.clusters`.

### 6.4 Resource Extraction (config_dump)

*   Extract Listeners, RouteConfigurations, Clusters, ClusterLoadAssignments.
*   **Listener**:
    *   name, address (ip:port), HCM filters, inline route_config or rds.route_config_name.
*   **RouteConfiguration**:
    *   name, virtual hosts, domains, routes, match conditions, cluster references (single and weighted).
*   **Cluster**:
    *   name, type.
*   **ClusterLoadAssignment**:
    *   cluster_name, host:port endpoints.

### 6.5 Resource Extraction (Static Config)

*   Use `static_resources.listeners` and `static_resources.clusters`.
*   Extract HTTP Connection Manager filters as above.
*   Parse inline route_config from listeners.

### 6.6 Graph Construction

*   **Node IDs and kinds**:
    *   `listener:<name>`, `route_config:<name>`, `virtual_host:<rc>:<vh>`, `route:<rc>:<vh>:<route>`, `cluster:<name>`, `endpoint:<cluster>:<addr>`.
*   **Edge kinds**:
    *   listener-route_config, route_config-virtual_host, virtual_host-route, route-cluster, cluster-endpoint.
*   Stats derived from node kinds.

### 6.7 Warnings

*   Warnings for:
    *   Missing route_config references.
    *   EDS cluster with no matching ClusterLoadAssignment.
    *   Failed resource parsing (with resource type/name).
*   Returned as `GraphResult.warnings`: `string[]`.

### 6.8 Frontend Graph Behaviour

*   Render graph with layering by kind.
*   Node-type filter hides nodes of other kinds and edges with only hidden endpoints.
*   Search highlights nodes by label and selected metadata fields.
*   Node click opens details drawer with relevant meta information.
*   Graph interaction limited to:
    *   Pan via click-drag.
    *   Zoom via scroll wheel and/or zoom buttons.
    *   Optional Reset view / Fit to graph.

## 7. Non-Functional Requirements

### 7.1 Technology Constraints

*   **Backend**: Python + FastAPI in Docker (Uvicorn/Gunicorn).
*   **Frontend**: Modern JS (React/Vite or equivalent) as a simple SPA.

### 7.2 Performance

*   For configs up to 5 MB:
    *   Visualize (click → graph rendered) within 5 seconds under normal conditions.
*   Backend must not OOM on typical small–medium configs.

### 7.3 Security & Privacy

*   No persistence of raw configs (no DB).
*   Do not log raw request bodies.
*   CORS:
    *   Development: *.
    *   Production: configurable via environment variable.

### 7.4 Availability & Reliability

*   GET /healthz is lightweight and suitable for health checks.
*   Invalid or partial configs result in 4xx or partial graphs, not 500s.

## 8. Testing & QA

*   Unit tests for parsing, detection, extraction, graph construction.
*   Integration tests for /visualize with various samples and error cases.
*   Golden tests for known configs and expected GraphResult structures.

## 9. Open Questions / TBD

*   Node details schema: exact subset of meta fields for each node type (e.g., route timeouts, retry policies, TLS settings).
*   Mobile/touch UX refinements beyond basic pan/zoom.
*   Future graph layout modes (e.g., multiple layouts) beyond the initial layered layout.
