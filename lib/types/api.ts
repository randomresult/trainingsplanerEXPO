export interface StrapiResponse<T> {
  data: T;
  meta?: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiEntity<T> {
  id: number;
  documentId: string;
  attributes?: T;
  createdAt?: string;
  updatedAt?: string;
  publishedAt?: string;
}

export interface StrapiCollection<T> {
  data: StrapiEntity<T>[];
}

export interface StrapiRelation<T> {
  data: StrapiEntity<T> | StrapiEntity<T>[] | null;
}
