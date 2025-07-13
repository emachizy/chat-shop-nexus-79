
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, Package, Truck } from 'lucide-react';

interface OrderSuccessProps {
  isOpen: boolean;
  onClose: () => void;
  orderData: {
    orderId: string;
    total: number;
    items: Array<{product: any, quantity: number}>;
    address: any;
  };
}

const OrderSuccess = ({ isOpen, onClose, orderData }: OrderSuccessProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Check className="h-6 w-6" />
            <CardTitle>Order Confirmed!</CardTitle>
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Thank You for Your Order!</h2>
            <p className="text-gray-600">Your order has been successfully placed and is being processed.</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center mb-4">
              <span className="font-semibold">Order ID:</span>
              <span className="font-mono text-blue-600">{orderData.orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Amount:</span>
              <span className="text-xl font-bold">₦{orderData.total.toLocaleString()}</span>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Order Items:</h3>
            <div className="space-y-2">
              {orderData.items.map((item, index) => (
                <div key={index} className="flex justify-between py-2 border-b border-gray-100">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span>₦{(item.product.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <h3 className="font-semibold mb-3">Delivery Address:</h3>
            <div className="bg-gray-50 rounded p-3 text-sm">
              <p className="font-medium">{orderData.address.fullName}</p>
              <p>{orderData.address.address}</p>
              <p>{orderData.address.city}, {orderData.address.state}</p>
              <p>{orderData.address.country}</p>
              <p className="mt-2 text-blue-600">{orderData.address.phone}</p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-6 mb-6 py-4 bg-blue-50 rounded-lg">
            <div className="flex flex-col items-center">
              <Package className="h-8 w-8 text-blue-600 mb-2" />
              <span className="text-sm text-gray-600">Processing</span>
            </div>
            <div className="h-px bg-blue-200 flex-1"></div>
            <div className="flex flex-col items-center">
              <Truck className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Shipping</span>
            </div>
            <div className="h-px bg-gray-200 flex-1"></div>
            <div className="flex flex-col items-center">
              <Check className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-400">Delivered</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-gray-600 mb-4">
              You will receive a confirmation email shortly with tracking information.
            </p>
            <Button
              onClick={onClose}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Continue Shopping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderSuccess;
