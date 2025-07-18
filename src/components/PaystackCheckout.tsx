import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { getPaystackService, initializePaystack } from '../services/paystackService';
import { Loader2 } from 'lucide-react';

interface PaystackCheckoutProps {
  amount: number; // in Naira
  onSuccess: (reference: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

// Add Paystack script to document head
const loadPaystackScript = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.PaystackPop) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Paystack script'));
    document.head.appendChild(script);
  });
};

export const PaystackCheckout: React.FC<PaystackCheckoutProps> = ({
  amount,
  onSuccess,
  onError,
  disabled = false,
  className = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  // Paystack public key - in production, this should come from environment variables
  const PAYSTACK_PUBLIC_KEY = 'pk_test_your_paystack_public_key_here';

  useEffect(() => {
    loadPaystackScript()
      .then(() => {
        setScriptLoaded(true);
        initializePaystack(PAYSTACK_PUBLIC_KEY);
      })
      .catch((error) => {
        console.error('Failed to load Paystack:', error);
        toast({
          title: "Error",
          description: "Failed to load payment system",
          variant: "destructive",
        });
      });
  }, [toast]);

  const handlePayment = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "Please sign in to continue with payment",
        variant: "destructive",
      });
      return;
    }

    if (!scriptLoaded) {
      toast({
        title: "Error",
        description: "Payment system is still loading. Please try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const paystackService = getPaystackService();
      
      const response = await paystackService.initializePayment({
        email: user.email,
        amount: amount * 100, // Convert to kobo
        currency: 'NGN',
        metadata: {
          user_id: user.id,
          user_email: user.email,
          custom_fields: [
            {
              display_name: "User ID",
              variable_name: "user_id",
              value: user.id
            }
          ]
        }
      });

      if (response.status && response.data) {
        toast({
          title: "Success",
          description: "Payment completed successfully!",
        });
        onSuccess(response.data.reference);
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      const errorMessage = error.message || 'Payment failed. Please try again.';
      toast({
        title: "Payment Failed",
        description: errorMessage,
        variant: "destructive",
      });
      onError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={disabled || loading || !scriptLoaded}
      className={className}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
    </Button>
  );
};

// Declare global Paystack interface
declare global {
  interface Window {
    PaystackPop: any;
  }
}