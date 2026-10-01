export type Category = { id: string; name: string; slug: string; sort_order: number };

export type MenuItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category_id: string | null;
  image_url: string | null;
  is_available: boolean;
  is_featured: boolean;
};
