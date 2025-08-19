interface IssueResponse {
  connectionString?: string;
  error?: string;
}

interface Template {
  name: string;
  description: string;
  branch: string;
}

interface TextToSqlResponse {
  sql?: string;
  error?: string;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options?: {
      method?: string;
      body?: any;
    }
  ): Promise<T> {
    const response = await fetch(endpoint, {
      method: options?.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async issueDatabase(params: { sourceBranch?: string } = {}): Promise<IssueResponse> {
    return this.request<IssueResponse>('/api/issue-database', {
      method: 'POST',
      body: params,
    });
  }

  async listTemplates(): Promise<Template[]> {
    return this.request<Template[]>('/api/templates');
  }

  async textToSql(params: { text: string }): Promise<string> {
    const response = await this.request<TextToSqlResponse>('/api/text-to-sql', {
      method: 'POST',
      body: params,
    });
    if (response.error) {
      throw new Error(response.error);
    }
    return response.sql || '';
  }
}

export const client = new ApiClient();
