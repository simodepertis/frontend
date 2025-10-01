"use client";

import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    paypal?: any;
  }
}

interface PayPalButtonProps {
  credits: number;
  onSuccess: (details: any) => void;
  onError: (error: any) => void;
  onCancel?: () => void;
}

export default function PayPalButton({ credits, onSuccess, onError, onCancel }: PayPalButtonProps) {
  const paypalRef = useRef<HTMLDivElement>(null);
  const buttonsRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup previous buttons
    if (buttonsRef.current) {
      buttonsRef.current.close();
      buttonsRef.current = null;
    }

    if (paypalRef.current) {
      paypalRef.current.innerHTML = '';
    }

    if (!window.paypal) {
      console.error('PayPal SDK not loaded');
      return;
    }

    if (!credits || credits <= 0) {
      return;
    }

    const amount = (credits * 0.50).toFixed(2);

    buttonsRef.current = window.paypal.Buttons({
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal',
        height: 40,
      },
      
      createOrder: async () => {
        try {
          const token = localStorage.getItem('auth-token') || '';
          const response = await fetch('/api/credits/paypal/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ credits }),
          });

          const data = await response.json();
          
          if (!response.ok) {
            throw new Error(data.error || 'Errore creazione ordine');
          }

          return data.orderId;
        } catch (error) {
          console.error('Error creating PayPal order:', error);
          onError(error);
          throw error;
        }
      },

      onApprove: async (data: any) => {
        try {
          const token = localStorage.getItem('auth-token') || '';
          const response = await fetch('/api/credits/paypal/capture-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ orderId: data.orderID }),
          });

          const result = await response.json();
          
          if (!response.ok) {
            throw new Error(result.error || 'Errore completamento pagamento');
          }

          onSuccess(result);
        } catch (error) {
          console.error('Error capturing PayPal order:', error);
          onError(error);
        }
      },

      onCancel: () => {
        console.log('PayPal payment cancelled');
        onCancel?.();
      },

      onError: (err: any) => {
        console.error('PayPal error:', err);
        onError(err);
      },
    });

    if (paypalRef.current) {
      buttonsRef.current.render(paypalRef.current);
    }

    return () => {
      if (buttonsRef.current) {
        buttonsRef.current.close();
        buttonsRef.current = null;
      }
    };
  }, [credits, onSuccess, onError, onCancel]);

  return (
    <div className="paypal-button-container">
      <div ref={paypalRef} />
    </div>
  );
}
