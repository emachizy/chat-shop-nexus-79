// Server-side Paystack payment verification.
// Only marks an order paid if Paystack's API confirms the transaction.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!PAYSTACK_SECRET_KEY) {
      return json({ error: 'PAYSTACK_SECRET_KEY not configured' }, 500);
    }

    const { reference, order_id } = await req.json();
    if (!reference || typeof reference !== 'string' || !order_id || typeof order_id !== 'string') {
      return json({ error: 'reference and order_id are required' }, 400);
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Load the order first
    const { data: order, error: orderErr } = await admin
      .from('orders')
      .select('id, total_amount, payment_status, paystack_reference')
      .eq('id', order_id)
      .maybeSingle();
    if (orderErr) return json({ error: orderErr.message }, 500);
    if (!order) return json({ error: 'order not found' }, 404);
    if (order.payment_status === 'paid') {
      return json({ verified: true, alreadyPaid: true });
    }

    // Verify with Paystack
    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    });
    if (!psRes.ok) {
      const body = await psRes.text();
      console.error('Paystack verify failed', psRes.status, body);
      return json({ error: 'Paystack verify failed', status: psRes.status, details: body }, psRes.status);
    }
    const psJson = await psRes.json();
    const tx = psJson?.data;
    if (!tx || tx.status !== 'success') {
      return json({ error: 'transaction not successful', details: tx?.gateway_response }, 400);
    }

    // Amount check (Paystack returns kobo)
    const expectedKobo = Math.round(Number(order.total_amount) * 100);
    if (Number(tx.amount) !== expectedKobo) {
      return json({ error: 'amount mismatch', expected: expectedKobo, got: tx.amount }, 400);
    }
    if (tx.currency && tx.currency !== 'NGN') {
      return json({ error: 'currency mismatch', got: tx.currency }, 400);
    }

    // Reference reuse check
    const { data: dup } = await admin
      .from('orders')
      .select('id')
      .eq('paystack_reference', reference)
      .neq('id', order_id)
      .maybeSingle();
    if (dup) return json({ error: 'reference already used' }, 400);

    const { error: upErr } = await admin
      .from('orders')
      .update({
        payment_status: 'paid',
        paystack_reference: reference,
        payment_verified_at: new Date().toISOString(),
      })
      .eq('id', order_id);
    if (upErr) return json({ error: upErr.message }, 500);

    return json({ verified: true });
  } catch (e: any) {
    console.error('verify-paystack-payment error', e);
    return json({ error: e?.message || 'unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
