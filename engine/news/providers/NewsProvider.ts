import { NewsArticle } from "../models/NewsArticle";

export interface NewsProvider {

    fetchNews(ticker: string): Promise<NewsArticle[]>;

}
