/**
 * Domain type for a product. Deliberately decoupled from any upstream API shape
 * so we can swap the data source (Fake Store today, our own DB tomorrow)
 * without touching routes or the frontend contract.
 */
export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
}

/**
 * Port that the HTTP layer talks to. Any adapter (Fake Store, in-memory for tests,
 * a future Postgres-backed one) just needs to implement this interface.
 */
export interface ProductRepository {
  listAll(): Promise<Product[]>;
  getById(id: number): Promise<Product | null>;
  listCategories(): Promise<string[]>;
  listByCategory(category: string): Promise<Product[]>;
  search(term: string): Promise<Product[]>;
  listFeatured(ids: number[]): Promise<Product[]>;
  listFeaturedInCategory(category: string, ids: number[]): Promise<Product[]>;
}
