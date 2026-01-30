import apiClient from './config';

// 文章类型定义
export interface Article {
  id: number;
  userId: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

// 创建文章请求类型
export interface CreateArticleRequest {
  title: string;
  content: string;
}

// 更新文章请求类型
export interface UpdateArticleRequest {
  title: string;
  content: string;
}

// 统一API响应类型
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

/**
 * 获取用户的所有文章
 */
export async function getArticles(): Promise<Article[]> {
  const response = await apiClient.get<ApiResponse<Article[]>>('/articles/list');
  if (response.data.code !== 1000) {
    throw new Error(response.data.message || 'API调用失败');
  }
  return response.data.data;
}

/**
 * 获取单个文章
 */
export async function getArticle(id: number): Promise<Article> {
  const response = await apiClient.get<ApiResponse<Article>>(`/articles/${id}`);
  if (response.data.code !== 1000) {
    throw new Error(response.data.message || 'API调用失败');
  }
  return response.data.data;
}

/**
 * 创建文章
 */
export async function createArticle(article: CreateArticleRequest): Promise<Article> {
  const response = await apiClient.post<ApiResponse<Article>>('/articles', article);
  if (response.data.code !== 1000) {
    throw new Error(response.data.message || 'API调用失败');
  }
  return response.data.data;
}

/**
 * 更新文章
 */
export async function updateArticle(id: number, article: UpdateArticleRequest): Promise<Article> {
  const response = await apiClient.put<ApiResponse<Article>>(`/articles/update/${id}`, article);
  if (response.data.code !== 1000) {
    throw new Error(response.data.message || 'API调用失败');
  }
  return response.data.data;
}

/**
 * 删除文章
 */
export async function deleteArticle(id: number): Promise<{ message: string }> {
  const response = await apiClient.delete<ApiResponse<{ message: string }>>(`/articles/delete/${id}`);
  if (response.data.code !== 1000) {
    throw new Error(response.data.message || 'API调用失败');
  }
  return response.data.data;
}