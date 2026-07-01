import React from "react";
import { Product } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowUpRight } from "lucide-react";

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  onProductClick?: (product: Product) => void;
}

const ProductCard = ({ product, onAddToCart, onProductClick }: ProductCardProps) => {
  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) return;
    onProductClick?.(product);
  };

  return (
    <Card
      onClick={handleCardClick}
      className="group relative overflow-hidden bg-card/60 backdrop-blur border-border/60 hover:border-primary/50 transition-all duration-500 cursor-pointer rounded-2xl shadow-card hover:shadow-glow hover:-translate-y-1"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-surface">
            <span className="text-muted-foreground text-sm">No Image</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="absolute top-3 left-3 flex gap-1.5">
          {product.stock === 0 ? (
            <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full bg-destructive/90 text-destructive-foreground backdrop-blur">
              Sold out
            </span>
          ) : product.stock < 10 ? (
            <span className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider rounded-full bg-primary/90 text-primary-foreground backdrop-blur">
              Low stock
            </span>
          ) : null}
        </div>
        <div className="absolute top-3 right-3 h-8 w-8 rounded-full bg-background/70 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <ArrowUpRight className="h-4 w-4 text-foreground" />
        </div>
      </div>

      <div className="p-4 space-y-3">
        <div>
          {product.vendor && (
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">
              {product.vendor.storeName}
            </p>
          )}
          <h3 className="font-display font-semibold text-base leading-tight line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {product.description}
          </p>
        </div>

        <div className="flex items-end justify-between pt-1">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Price</p>
            <span className="text-xl font-display font-bold text-foreground">
              ₦{product.price.toLocaleString()}
            </span>
          </div>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product);
            }}
            disabled={product.stock === 0}
            className="rounded-full bg-gradient-primary text-primary-foreground hover:opacity-90 hover:shadow-glow transition-all border-0"
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
