// API Configuration and Endpoints

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Helper function for API calls
async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Stack API
export const stacksApi = {
  // Get all stacks
  getAll: () => apiCall('/stacks'),

  // Get single stack
  get: (id) => apiCall(`/stacks/${id}`),

  // Create new stack
  create: (data) => apiCall('/stacks', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Update stack
  update: (id, data) => apiCall(`/stacks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Delete stack
  delete: (id) => apiCall(`/stacks/${id}`, {
    method: 'DELETE',
  }),
};

// Documents API
export const documentsApi = {
  // Upload document
  upload: async (stackId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('stack_id', stackId);

    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Upload failed' }));
      throw new Error(error.detail);
    }

    return response.json();
  },

  // Get documents for a stack
  getByStack: (stackId) => apiCall(`/documents/${stackId}`),

  // Delete document
  delete: (id) => apiCall(`/documents/${id}`, {
    method: 'DELETE',
  }),
};

// Execution API
export const executeApi = {
  // Build/validate workflow
  build: (data) => apiCall('/execute/build', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Execute chat query through workflow
  chat: async (data, onChunk) => {
    const response = await fetch(`${API_BASE_URL}/execute/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Execution failed' }));
      throw new Error(error.detail);
    }

    // Handle streaming response if callback provided
    if (onChunk && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        const lines = buffer.split('\n');
        // Keep the last line in the buffer as it might be incomplete
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);

            if (data.chunk) {
              fullContent += data.chunk;
              onChunk(data); // Pass full data object so we can check for metadata/errors
            } else if (data.metadata) {
              onChunk(data);
            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch (e) {
            console.error('Error parsing stream chunk:', e);
          }
        }
      }

      return { content: fullContent };
    }

    return response.json();
  },
};

export default {
  stacks: stacksApi,
  documents: documentsApi,
  execute: executeApi,
};
