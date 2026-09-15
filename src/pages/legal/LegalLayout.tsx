import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props { title: string; updated?: string; children: React.ReactNode }

export default function LegalLayout({ title, updated = 'July 2026', children }: Props) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Button variant="ghost" size="sm" asChild className="mb-6">
          <Link to="/"><ArrowLeft className="h-4 w-4 mr-1" />Back to store</Link>
        </Button>
        <h1 className="font-display font-bold text-3xl sm:text-4xl mb-2">{title}</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: {updated}</p>
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-5 text-[15px] leading-relaxed">
          {children}
        </div>
        <div className="mt-12 pt-6 border-t border-border/40 text-sm text-muted-foreground">
          <p>Questions? Reach us at <a className="text-primary underline" href="mailto:support@shopnexus.com">support@shopnexus.com</a>.</p>
          <p className="mt-3 flex flex-wrap gap-3">
            <Link className="hover:text-primary" to="/legal/terms">Terms</Link>
            <Link className="hover:text-primary" to="/legal/privacy">Privacy</Link>
            <Link className="hover:text-primary" to="/legal/refund">Refunds</Link>
            <Link className="hover:text-primary" to="/legal/shipping">Shipping</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
