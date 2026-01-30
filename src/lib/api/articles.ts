// 文章API调用封装

interface Article {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

interface CreateArticleRequest {
  title: string;
  content: string;
}

interface UpdateArticleRequest {
  title: string;
  content: string;
}

interface ApiResponse<T> {
  code?: number;
  message?: string;
  data?: T;
  error?: string;
}

/**
 * 获取认证令牌
 */
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

/**
 * API响应统一格式接口
 */
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 基础API调用函数
 */
async function apiCall<T>(url: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });
  
  const data: ApiResponse<T> = await response.json();
  
  if (!response.ok || data.code !== 1000) {
    throw new Error(data.message || `API调用失败: ${response.status}`);
  }
  
  return data.data;
}

/**
 * 获取用户的所有文章
 */
export async function getArticles(): Promise<Article[]> {
  return apiCall<Article[]>('http://localhost:8080/api/articles/list');
}

/**
 * 获取单个文章
 */
export async function getArticle(id: number): Promise<Article> {
  return apiCall<Article>(`http://localhost:8080/api/articles/${id}`);
}

/**
 * 创建文章
 */
export async function createArticle(article: CreateArticleRequest): Promise<Article> {
  return apiCall<Article>('http://localhost:8080/api/articles', {
    method: 'POST',
    body: JSON.stringify(article),
  });
}

/**
 * 更新文章
 */
export async function updateArticle(id: number, article: UpdateArticleRequest): Promise<Article> {
  return apiCall<Article>(`http://localhost:8080/api/articles/update/${id}`, {
    method: 'PUT',
    body: JSON.stringify(article),
  });
}

/**
 * 删除文章
 */
export async function deleteArticle(id: number): Promise<{ message: string }> {
  return apiCall<{ message: string }>(`http://localhost:8080/api/articles/delete/${id}`, {
    method: 'DELETE',
  });
}
