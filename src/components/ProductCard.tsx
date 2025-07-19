import React from "react";
import { Product } from "@/types";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

const ProductCard = ({
  product,
  onAddToCart,
  onProductClick,
}: ProductCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger product details if clicking the add to cart button
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    onProductClick?.(product);
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="aspect-square overflow-hidden rounded-t-lg bg-gray-100">
          {product.images[0] ? (
            <img
              src={product.images[0]}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
              <span className="text-gray-400 text-lg">No Image</span>
            </div>
          )}
        </div>
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg mb-2 line-clamp-2">
            {product.name}
          </h3>
          <p className="text-gray-600 text-xs sm:text-sm mb-2 line-clamp-2">
            {product.description}
          </p>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
            <span className="text-lg sm:text-2xl font-bold text-primary">
              ₦{product.price.toLocaleString()}
            </span>
            <span className="text-xs sm:text-sm text-gray-500">
              Stock: {product.stock}
            </span>
          </div>
          {product.vendor && (
            <p className="text-xs text-gray-500 mt-2">
              by {product.vendor.storeName}
            </p>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-3 sm:p-4 pt-0">
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 text-sm sm:text-base py-2 sm:py-3"
          disabled={product.stock === 0}
        >
          <ShoppingCart className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
          {product.stock > 0 ? "Add to Cart" : "Out of Stock"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
