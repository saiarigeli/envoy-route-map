import axios from 'axios';
import type { VisualizeRequest, GraphResult } from '../types';

const API_URL = 'http://localhost:8080';

export const api = {
    visualize: async (request: VisualizeRequest): Promise<GraphResult> => {
        // Ensure we send configs array
        const payload = {
            configs: request.configs,
            format: request.format
        };
        const response = await axios.post<GraphResult>(`${API_URL}/visualize`, payload);
        return response.data;
    },
    healthz: async (): Promise<{ status: string }> => {
        const response = await axios.get(`${API_URL}/healthz`);
        return response.data;
    }
};
