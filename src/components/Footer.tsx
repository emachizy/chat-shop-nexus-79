import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Store } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card/40 border-t border-border/60 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <Store className="h-6 w-6 text-primary" />
              <span className="font-display text-lg font-bold text-gradient">ShopNexus</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              An AI-powered marketplace connecting independent sellers with buyers across Nigeria.
            </p>
            <div className="mt-4 flex space-x-4">
              <a href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Facebook className="h-5 w-5" /></a>
              <a href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><Twitter className="h-5 w-5" /></a>
              <a href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram className="h-5 w-5" /></a>
              <a href="mailto:support@shopnexus.com" aria-label="Email" className="text-muted-foreground hover:text-primary"><Mail className="h-5 w-5" /></a>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Legal</p>
            <ul className="space-y-2 text-sm">
              <li><Link to="/legal/terms" className="hover:text-primary">Terms of Service</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/legal/refund" className="hover:text-primary">Refunds & Returns</Link></li>
              <li><Link to="/legal/shipping" className="hover:text-primary">Shipping</Link></li>
            </ul>
          </div>

          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Support</p>
            <ul className="space-y-2 text-sm">
              <li><a href="mailto:support@shopnexus.com" className="hover:text-primary">support@shopnexus.com</a></li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} ShopNexus. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
