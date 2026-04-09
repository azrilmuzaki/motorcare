export interface Article {
  id: string;
  title: string;
  summary: string;
  content: string;
  imageUrl: string | null;
  category: string;
  createdAt: string;
}