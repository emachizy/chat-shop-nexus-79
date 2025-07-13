
import React from 'react';
import { Product } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Store, Package, Star } from 'lucide-react';

interface ProductDetailsProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const ProductDetails = ({ product, isOpen, onClose, onAddToCart }: ProductDetailsProps) => {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">{product.name}</DialogTitle>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
              {product.images[0] ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                  <span className="text-gray-400 text-lg">No Image</span>
                </div>
              )}
            </div>
          </div>

          {/* Product Information */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="secondary" className="capitalize">
                  {product.category}
                </Badge>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-gray-600">4.5 (128 reviews)</span>
                </div>
              </div>
              
              <div className="text-3xl font-bold text-primary mb-4">
                ₦{product.price.toLocaleString()}
              </div>
              
              <p className="text-gray-700 text-base leading-relaxed mb-4">
                {product.description}
              </p>
            </div>

            {/* Stock and Vendor Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-500" />
                <span className="text-sm">
                  <span className="font-medium">Stock:</span> {product.stock} available
                </span>
              </div>
              
              {product.vendor && (
                <div className="flex items-center gap-2">
                  <Store className="h-5 w-5 text-gray-500" />
                  <span className="text-sm">
                    <span className="font-medium">Sold by:</span> {product.vendor.storeName}
                  </span>
                </div>
              )}
            </div>

            {/* Product Specifications */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Specifications</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium text-gray-600">Category:</span>
                  <span className="ml-2 capitalize">{product.category}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Product ID:</span>
                  <span className="ml-2">{product.id}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Added:</span>
                  <span className="ml-2">{product.createdAt.toLocaleDateString()}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Availability:</span>
                  <span className="ml-2">
                    {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
                  </span>
                </div>
              </div>
            </div>

            {/* Add to Cart Button */}
            <div className="border-t pt-4">
              <Button
                onClick={() => {
                  onAddToCart(product);
                  onClose();
                }}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                disabled={product.stock === 0}
                size="lg"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetails;
