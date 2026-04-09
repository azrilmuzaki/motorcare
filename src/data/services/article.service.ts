import { supabase } from '@data/supabase/client';
import { Article } from '@domain/types/article.types';
import { SEEDED_ARTICLES } from '@data/seeds/article.seed';

function mapRowToArticle(row: Record<string, unknown>): Article {
  return {
    id: row.id as string,
    title: row.title as string,
    summary: row.summary as string,
    content: row.content as string,
    imageUrl: row.image_url as string | null,
    category: row.category as string,
    createdAt: row.created_at as string,
  };
}

export const ArticleService = {
  async getArticles(): Promise<Article[]> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return SEEDED_ARTICLES;
    }

    const articles = (data ?? []).map(mapRowToArticle);
    return articles.length > 0 ? articles : SEEDED_ARTICLES;
  },

  async getArticleById(id: string): Promise<Article> {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      const fallback = SEEDED_ARTICLES.find(article => article.id === id);
      if (fallback) {
        return fallback;
      }

      throw new Error(error.message);
    }

    return mapRowToArticle(data);
  },
};
