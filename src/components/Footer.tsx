import React from "react";
import { Facebook, Twitter, Instagram, Mail, Store } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t shadow-inner mt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Top Section */}
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* Logo and Tagline */}
          <div className="flex items-center space-x-2">
            <Store className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              ShopNexus
            </span>
          </div>
          <p className="text-sm text-gray-600 text-center md:text-left">
            Your one-stop marketplace powered by AI.
          </p>

          {/* Social Icons */}
          <div className="flex space-x-4">
            <a
              href="#"
              aria-label="Facebook"
              className="text-gray-500 hover:text-blue-600"
            >
              <Facebook className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="Twitter"
              className="text-gray-500 hover:text-blue-400"
            >
              <Twitter className="h-5 w-5" />
            </a>
            <a
              href="#"
              aria-label="Instagram"
              className="text-gray-500 hover:text-pink-500"
            >
              <Instagram className="h-5 w-5" />
            </a>
            <a
              href="mailto:support@shopnexus.com"
              aria-label="Email"
              className="text-gray-500 hover:text-purple-600"
            >
              <Mail className="h-5 w-5" />
            </a>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-6 border-t pt-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ShopNexus. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
