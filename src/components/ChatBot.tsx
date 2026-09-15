import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Send,
  ShoppingCart,
  MessageCircle,
  CreditCard,
  Check,
} from "lucide-react";
import { ChatMessage, Product } from "@/types";
import ProductCard from "./ProductCard";
import { supabase } from "@/integrations/supabase/client";

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onAddToCart: (product: Product) => void;
  onCheckout?: () => void;
}

interface ConversationMemory {
  role: "system" | "user" | "assistant";
  content: string;
}

const ChatBot = ({ isOpen, onClose, products, onAddToCart, onCheckout }: ChatBotProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "1",
      type: "assistant",
      content:
        "Hi! I'm your AI shopping assistant. You can ask me to find products, add items to cart, checkout, and even process payments - all through our conversation! Try: 'show me phones', 'specs of iPhone', 'add iPhone to cart', 'checkout', or 'pay now'.",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState<
    Array<{ product: Product; quantity: number }>
  >([]);
  const [conversationMemory, setConversationMemory] = useState<
    ConversationMemory[]
  >([
    {
      role: "system",
      content: `You are a friendly and helpful AI shopping assistant on an e-commerce platform in Nigeria. Your job is to help users:
- Find products
- Explain product specifications clearly
- Add items to the shopping cart
- Summarize the user's cart
- Guide users through checkout and payment

Always respond in a concise, helpful, and conversational tone. Use emojis to improve readability (e.g., 🛒, 💳, 📱). If you're recommending or listing products, keep it under 5 items. Use markdown for formatting bold text (**like this**) and newlines for separation. 

Currency: Nigerian Naira (₦). You have access to basic product info such as name, category, description, price, and stock.

You must remember the user’s context, like past queries or added items, to respond intelligently.`,
    },
  ]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Words to ignore when scoring so they don't dilute relevance
  const SEARCH_STOPWORDS = new Set([
    "the", "a", "an", "and", "for", "with", "that", "this", "from", "your",
    "are", "you", "want", "looking", "need", "find", "show", "me", "of",
    "to", "in", "on", "get", "buy", "search", "please", "some", "any",
  ]);

  // Maps a query term to the category value(s) it should match
  const CATEGORY_SYNONYMS: Record<string, string[]> = {
    phone: ["phones"], phones: ["phones"], smartphone: ["phones"],
    laptop: ["laptops"], laptops: ["laptops"], notebook: ["laptops"],
    tablet: ["tablets"], tablets: ["tablets"], ipad: ["tablets"],
    headphone: ["headphones"], headphones: ["headphones"], earbuds: ["headphones"], earphones: ["headphones"],
    watch: ["wearables"], wearable: ["wearables"], wearables: ["wearables"],
    shoe: ["fashion"], shoes: ["fashion"], sneaker: ["fashion"], sneakers: ["fashion"],
    game: ["gaming"], gaming: ["gaming"], console: ["gaming"],
  };

  const scoreProduct = (product: Product, query: string): number => {
    const tokens = query
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[^a-z0-9."]/g, ""))
      .filter((t) => t.length > 1 && !SEARCH_STOPWORDS.has(t));

    if (tokens.length === 0) return 0;

    const name = product.name.toLowerCase();
    const description = product.description.toLowerCase();
    const category = product.category.toLowerCase();
    const brand = (product.brand || "").toLowerCase();
    const model = (product.model || "").toLowerCase();
    const color = (product.color || "").toLowerCase();
    const size = (product.size || "").toLowerCase();
    const dimensions = (product.dimensions || "").toLowerCase();

    let score = 0;
    let matchedTokens = 0;

    for (const token of tokens) {
      let tokenMatched = false;

      if (name.includes(token)) {
        score += 5;
        tokenMatched = true;
      }
      if (brand && brand.includes(token)) {
        score += 4;
        tokenMatched = true;
      }
      if (model && model.includes(token)) {
        score += 4;
        tokenMatched = true;
      }
      if (color && color.includes(token)) {
        score += 3;
        tokenMatched = true;
      }
      if ((size && size.includes(token)) || (dimensions && dimensions.includes(token))) {
        score += 3;
        tokenMatched = true;
      }
      if (CATEGORY_SYNONYMS[token]?.includes(category)) {
        score += 3;
        tokenMatched = true;
      } else if (category.includes(token)) {
        score += 2;
        tokenMatched = true;
      }
      if (description.includes(token)) {
        score += 1;
        tokenMatched = true;
      }

      if (tokenMatched) matchedTokens++;
    }

    // Reward covering more of the distinct terms the user gave, not just raw hits,
    // so a product matching "black" AND "13 inch" AND "laptop" outranks one matching only "laptop".
    if (matchedTokens > 0) {
      score += matchedTokens * 2;
    }

    return score;
  };

  const searchProducts = (query: string): Product[] => {
    return products
      .map((product) => ({ product, score: scoreProduct(product, query) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score)
      .map(({ product }) => product);
  };

  const getProductSpecs = (productName: string): Product | null => {
    return (
      products.find(
        (product) =>
          product.name.toLowerCase().includes(productName.toLowerCase()) ||
          productName.toLowerCase().includes(product.name.toLowerCase())
      ) || null
    );
  };

  const formatProductSpecs = (product: Product): string => {
    let specs = `📱 **${product.name}**\n\n`;
    specs += `💰 **Price:** ₦${product.price.toLocaleString()}\n`;
    specs += `📦 **Stock:** ${product.stock} available\n`;
    specs += `🏪 **Vendor:** ${product.vendor?.storeName || "N/A"}\n`;
    specs += `📂 **Category:** ${product.category}\n\n`;
    specs += `📝 **Description:**\n${product.description}\n\n`;

    // Add category-specific specs
    switch (product.category) {
      case "phones":
        specs += `📱 **Phone Specifications:**\n`;
        specs += `• Advanced camera system\n`;
        specs += `• High-performance processor\n`;
        specs += `• Premium build quality\n`;
        specs += `• Latest OS support\n`;
        break;
      case "laptops":
        specs += `💻 **Laptop Specifications:**\n`;
        specs += `• High-performance processor\n`;
        specs += `• Premium display quality\n`;
        specs += `• Long battery life\n`;
        specs += `• Lightweight design\n`;
        break;
      case "tablets":
        specs += `📱 **Tablet Specifications:**\n`;
        specs += `• Large high-resolution display\n`;
        specs += `• Powerful performance chip\n`;
        specs += `• All-day battery life\n`;
        specs += `• Professional-grade features\n`;
        break;
      case "headphones":
        specs += `🎧 **Headphone Specifications:**\n`;
        specs += `• Premium noise cancellation\n`;
        specs += `• High-quality audio drivers\n`;
        specs += `• Comfortable fit\n`;
        specs += `• Long battery life\n`;
        break;
      default:
        specs += `✨ **Product Features:**\n`;
        specs += `• High-quality materials\n`;
        specs += `• Excellent performance\n`;
        specs += `• Reliable build quality\n`;
    }

    specs += `\nSay "add ${product.name} to cart" to purchase this item!`;
    return specs;
  };

  const parseCommand = (input: string) => {
    const lowercaseInput = input.toLowerCase();

    // Check for greetings
    if (
      lowercaseInput.includes("hi") ||
      lowercaseInput.includes("hello") ||
      lowercaseInput.includes("hey") ||
      lowercaseInput.includes("how are you") ||
      lowercaseInput.includes("good morning") ||
      lowercaseInput.includes("good afternoon") ||
      lowercaseInput.includes("good evening") ||
      lowercaseInput === "hi" ||
      lowercaseInput === "hello" ||
      lowercaseInput === "hey"
    ) {
      return { type: "greeting" };
    }

    // Check for specification requests
    if (
      lowercaseInput.includes("spec") ||
      lowercaseInput.includes("detail") ||
      lowercaseInput.includes("about") ||
      lowercaseInput.includes("tell me more")
    ) {
      // Extract product name from the query
      const words = input.split(" ");
      const productKeywords = words.filter(
        (word) =>
          ![
            "spec",
            "specs",
            "specification",
            "specifications",
            "detail",
            "details",
            "about",
            "tell",
            "me",
            "more",
            "show",
            "what",
            "is",
            "the",
            "of",
          ].includes(word.toLowerCase())
      );
      const productQuery = productKeywords.join(" ");
      return { type: "specifications", query: productQuery };
    }

    // Check for add to cart commands
    if (lowercaseInput.includes("add") && lowercaseInput.includes("cart")) {
      const productName = input
        .toLowerCase()
        .replace(/add|to|cart/g, "")
        .trim();
      const matchedProduct = products.find(
        (p) =>
          p.name.toLowerCase().includes(productName) ||
          productName.includes(p.name.toLowerCase())
      );
      return { type: "add_to_cart", product: matchedProduct };
    }

    // Check for remove from cart commands
    if (
      (lowercaseInput.includes("remove") && lowercaseInput.includes("cart")) ||
      (lowercaseInput.includes("delete") && lowercaseInput.includes("cart")) ||
      lowercaseInput.includes("remove from cart")
    ) {
      const productName = input
        .toLowerCase()
        .replace(/remove|delete|from|cart/g, "")
        .trim();
      const matchedProduct = products.find(
        (p) =>
          p.name.toLowerCase().includes(productName) ||
          productName.includes(p.name.toLowerCase())
      );
      return { type: "remove_from_cart", product: matchedProduct };
    }

    // Check for checkout commands
    if (
      lowercaseInput.includes("checkout") ||
      lowercaseInput.includes("check out")
    ) {
      return { type: "checkout" };
    }

    // Check for payment commands
    if (lowercaseInput.includes("pay") || lowercaseInput.includes("payment")) {
      return { type: "payment" };
    }

    // Check for cart view commands
    if (
      lowercaseInput.includes("cart") ||
      lowercaseInput.includes("show cart")
    ) {
      return { type: "view_cart" };
    }

    // Default to product search
    return { type: "search", query: input };
  };

  const addToCartInChat = (product: Product) => {
    const existingItem = cartItems.find(
      (item) => item.product.id === product.id
    );
    if (existingItem) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCartItems((prev) => [...prev, { product, quantity: 1 }]);
    }
    onAddToCart(product);

    const confirmMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content: `✅ Added ${product.name} to your cart! You now have ${
        existingItem ? existingItem.quantity + 1 : 1
      } item(s). Say "checkout" when you're ready to proceed.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, confirmMessage]);
  };

  const removeFromCartInChat = (product: Product) => {
    const existingItem = cartItems.find(
      (item) => item.product.id === product.id
    );
    
    if (!existingItem) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: `❌ ${product.name} is not in your cart. Say "show cart" to see your current items.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    if (existingItem.quantity > 1) {
      setCartItems((prev) =>
        prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
      );
      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: `⬇️ Removed 1 ${product.name} from your cart. You now have ${existingItem.quantity - 1} of this item.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    } else {
      setCartItems((prev) => prev.filter((item) => item.product.id !== product.id));
      const confirmMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: `🗑️ Removed ${product.name} from your cart completely.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, confirmMessage]);
    }
  };

  const showCart = () => {
    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const cartContent =
      cartItems.length === 0
        ? "Your cart is empty. Browse products and say 'add [product name] to cart' to get started!"
        : `🛒 Your Cart:\n${cartItems
            .map(
              (item) =>
                `• ${item.product.name} x${item.quantity} - ₦${(
                  item.product.price * item.quantity
                ).toLocaleString()}`
            )
            .join(
              "\n"
            )}\n\nTotal: ₦${total.toLocaleString()}\n\n💡 To remove items, say "remove [product name] from cart"\nSay "checkout" to proceed with your order.`;

    const cartMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content: cartContent,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, cartMessage]);
  };

  const processCheckout = () => {
    if (cartItems.length === 0) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: "Your cart is empty! Please add some products first.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const checkoutMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content: `🧾 Ready for Checkout:\n${cartItems
        .map(
          (item) =>
            `• ${item.product.name} x${item.quantity} - ₦${(
              item.product.price * item.quantity
            ).toLocaleString()}`
        )
        .join(
          "\n"
        )}\n\nTotal: ₦${total.toLocaleString()}\n\nOpening the checkout form now — fill in your delivery details to place the order. 🚀`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, checkoutMessage]);
    if (onCheckout) {
      setTimeout(() => onCheckout(), 400);
    }
  };

  const processPayment = () => {
    if (cartItems.length === 0) {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "assistant",
        content: "No items to pay for! Please add products to your cart first.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const total = cartItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const paymentMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "assistant",
      content: `💳 To complete payment of ₦${total.toLocaleString()}, please close this chat and proceed through the cart checkout process. You'll be able to review your order, enter your delivery address, and complete the payment.\n\nIs there anything else I can help you with?`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, paymentMessage]);
  };

  const callOpenAIWithMemory = async (
    userInput: string,
    foundProducts: Product[] = []
  ) => {
    // Add user message to memory
    const newMemory = [
      ...conversationMemory,
      { role: "user" as const, content: userInput },
    ];

    // Add context about found products if any
    const contextMessage =
      foundProducts.length > 0
        ? `Found ${
            foundProducts.length
          } products matching the user's query. Products: ${foundProducts
            .map((p) => p.name)
            .join(", ")}`
        : "";

    const systemContext = contextMessage
      ? `${newMemory[0].content} ${contextMessage}`
      : newMemory[0].content;

    try {
      const { data, error } = await supabase.functions.invoke("chat-assistant", {
        body: {
          messages: [
            { role: "system", content: systemContext },
            ...newMemory.slice(1), // Skip the original system message since we modified it
          ],
        },
      });

      if (error) throw error;

      const assistantResponse =
        data?.content ||
        `I found ${foundProducts.length} products for you! Take a look below. Say "add [product name] to cart" to add any item, or ask for "specs of [product name]" to get detailed specifications.`;

      // Add assistant response to memory
      const updatedMemory = [
        ...newMemory,
        { role: "assistant" as const, content: assistantResponse },
      ];
      setConversationMemory(updatedMemory);

      return assistantResponse;
    } catch (error) {
      console.error("Error calling chat assistant:", error);
      return `I found ${foundProducts.length} products matching "${userInput}". Check them out below! Say "add [product name] to cart" to add any item, or ask for "specs of [product name]" for detailed specifications.`;
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setIsLoading(true);

    try {
      const command = parseCommand(currentInput);

      switch (command.type) {
        case "greeting":
          const greetingResponses = [
            "Hello! 👋 I'm doing great and ready to help you shop! What are you looking for today?",
            "Hi there! 😊 I'm here to help you find amazing products. What can I show you?",
            "Hey! 🛍️ Nice to see you! I'm your personal shopping assistant. How can I help?",
            "Hello! 🌟 I'm fantastic and excited to help you discover great products. What interests you?",
            "Hi! 👋 Hope you're having a great day! I'm here to make your shopping experience awesome. What would you like to explore?",
          ];
          const randomGreeting =
            greetingResponses[
              Math.floor(Math.random() * greetingResponses.length)
            ];

          const greetingMessage: ChatMessage = {
            id: Date.now().toString(),
            type: "assistant",
            content: randomGreeting,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, greetingMessage]);
          break;

        case "specifications":
          const specProduct = getProductSpecs(command.query);
          if (specProduct) {
            const specsMessage: ChatMessage = {
              id: Date.now().toString(),
              type: "assistant",
              content: formatProductSpecs(specProduct),
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, specsMessage]);
          } else {
            const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              type: "assistant",
              content:
                "I couldn't find specifications for that product. Try asking about a specific product name or browse our available products first.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
          break;

        case "add_to_cart":
          if (command.product) {
            addToCartInChat(command.product);
          } else {
            const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              type: "assistant",
              content:
                "I couldn't find that product. Try being more specific or browse available products first.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
          break;

        case "remove_from_cart":
          if (command.product) {
            removeFromCartInChat(command.product);
          } else {
            const errorMessage: ChatMessage = {
              id: Date.now().toString(),
              type: "assistant",
              content:
                "I couldn't find that product to remove. Try being more specific or say 'show cart' to see your current items.",
              timestamp: new Date(),
            };
            setMessages((prev) => [...prev, errorMessage]);
          }
          break;

        case "view_cart":
          showCart();
          break;

        case "checkout":
          processCheckout();
          break;

        case "payment":
          processPayment();
          break;

        case "search":
        default:
          // Search for products and call OpenAI with memory
          const foundProducts = searchProducts(currentInput);

          const assistantResponse = await callOpenAIWithMemory(
            currentInput,
            foundProducts
          );

          const assistantMessage: ChatMessage = {
            id: (Date.now() + 1).toString(),
            type: "assistant",
            content: assistantResponse,
            timestamp: new Date(),
            products:
              foundProducts.length > 0 ? foundProducts.slice(0, 6) : undefined,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          break;
      }
    } catch (error) {
      console.error("Error processing command:", error);
      const foundProducts = searchProducts(currentInput);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: "assistant",
        content: `I found ${foundProducts.length} products matching "${currentInput}". Check them out below! Say "add [product name] to cart" to add any item, or ask for "specs of [product name]" for detailed specifications.`,
        timestamp: new Date(),
        products:
          foundProducts.length > 0 ? foundProducts.slice(0, 6) : undefined,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden ${
          isOpen ? "block" : "hidden"
        }`}
        onClick={onClose}
      />

      {/* Chat container - sidebar on desktop, modal on mobile */}
      <div
        className={`fixed top-0 left-0 h-full z-50 transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        w-80 md:w-96 bg-white shadow-xl border-r border-border
        md:shadow-2xl
      `}
      >
        <Card className="h-full flex flex-col border-0 rounded-none">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 sm:px-6 sm:py-4 border-b-0">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center space-x-2">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                <span className="text-sm sm:text-base">
                  AI Shopping Assistant
                </span>
                {cartItems.length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {cartItems.reduce((sum, item) => sum + item.quantity, 0)}{" "}
                    items
                  </span>
                )}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollAreaRef}>
              <div className="space-y-3 sm:space-y-4 pr-2 sm:pr-4">
                {messages.map((message) => (
                  <div key={message.id} className="space-y-3">
                    <div
                      className={`flex ${
                        message.type === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg whitespace-pre-line text-sm sm:text-base ${
                          message.type === "user"
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-900"
                        }`}
                      >
                        {message.content}
                      </div>
                    </div>

                    {message.products && message.products.length > 0 && (
                      <div className="grid grid-cols-1 gap-2 mt-3 pr-1 max-h-96 overflow-y-auto">
                        {message.products.map((product) => (
                          <div key={product.id} className="relative">
                            <ProductCard
                              product={product}
                              onAddToCart={() => addToCartInChat(product)}
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 px-4 py-2 rounded-lg">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.1s" }}
                        ></div>
                        <div
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <div className="p-3 sm:p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything..."
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  disabled={isLoading}
                  className="text-sm sm:text-base"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputValue.trim()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 px-3 sm:px-4"
                  size="sm"
                >
                  <Send className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ChatBot;
