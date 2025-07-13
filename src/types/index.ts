
export interface Vendor {
  id: string;
  name: string;
  email: string;
  storeName: string;
  description: string;
  avatar?: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  price: number;
  category: string;
  images: string[];
  stock: number;
  vendor?: Vendor;
  createdAt: Date;
}

export interface CartItem {
  id: string;
  product: Product;
  quantity: number;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Product[];
}
