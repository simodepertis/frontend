"use client";

import { useEffect, useRef, useState } from 'react';

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
  const [sdkReady, setSdkReady] = useState(false);

  // Self-load SDK if not present
  async function ensureSdk(): Promise<void> {
    if (typeof window === 'undefined') throw new Error('SSR');
    if ((window as any).paypal) { setSdkReady(true); return; }
    // Fetch public clientId from server, so we don't depend on client env
    const conf = await fetch('/api/credits/paypal/client-config', { cache: 'no-store' });
    const cj = await conf.json().catch(()=>({}));
    if (!conf.ok || !cj?.clientId) {
      throw new Error(cj?.error || 'PayPal clientId non configurato');
    }
    const clientId = cj.clientId as string;
    // Avoid duplicate scripts
    const existing = document.querySelector('script[src^="https://www.paypal.com/sdk/js"]') as HTMLScriptElement | null;
    if (existing) {
      await new Promise<void>((resolve, reject) => {
        existing.addEventListener('load', () => resolve(), { once: true });
        existing.addEventListener('error', () => reject(new Error('Errore caricamento PayPal SDK')), { once: true });
      });
      setSdkReady(true);
      return;
    }
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script');
      s.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=EUR`;
      s.async = true;
      s.onload = () => { setSdkReady(true); resolve(); };
      s.onerror = () => reject(new Error('Errore caricamento PayPal SDK'));
      document.body.appendChild(s);
    });
  }

  useEffect(() => {
    let canceled = false;
    const init = async () => {
      try {
        await ensureSdk();
      } catch (e) {
        if (!canceled) onError(e);
        return;
      }

      // Cleanup previous buttons
      if (buttonsRef.current) {
        try { buttonsRef.current.close(); } catch {}
        buttonsRef.current = null;
      }
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }

      if (!(window as any).paypal) return;
      if (!credits || credits <= 0) return;

      const amount = (credits * 0.50).toFixed(2);

      buttonsRef.current = (window as any).paypal.Buttons({
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

      if (paypalRef.current && buttonsRef.current) {
        try { buttonsRef.current.render(paypalRef.current); } catch (e) { onError(e); }
      }
    };

    init();

    return () => {
      canceled = true;
      if (buttonsRef.current) {
        try { buttonsRef.current.close(); } catch {}
        buttonsRef.current = null;
      }
    };
  }, [credits, onSuccess, onError, onCancel]);

  return (
    <div className="paypal-button-container">
      {!sdkReady && (
        <div className="text-xs text-gray-400 mb-2">Caricamento PayPal…</div>
      )}
      <div ref={paypalRef} />
    </div>
  );
}
