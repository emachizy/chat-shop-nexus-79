import LegalLayout from './LegalLayout';

export default function Shipping() {
  return (
    <LegalLayout title="Shipping & Delivery">
      <p>Delivery is arranged by the seller of each item. Below is what to expect in most cases.</p>

      <h2 className="font-display font-semibold text-xl mt-8">Timelines</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>Lagos & major cities: 1–3 business days.</li>
        <li>Other locations within Nigeria: 3–7 business days.</li>
        <li>You'll get an email when your order status changes to shipped or delivered.</li>
      </ul>

      <h2 className="font-display font-semibold text-xl mt-8">Fees</h2>
      <p>Shipping fees, when applicable, are displayed at checkout before you pay.</p>

      <h2 className="font-display font-semibold text-xl mt-8">Pay on Delivery</h2>
      <p>Pay-on-Delivery orders are collected in cash by the courier. Please have the exact amount ready and inspect your parcel before paying.</p>

      <h2 className="font-display font-semibold text-xl mt-8">Missing / delayed orders</h2>
      <p>If your order is more than 3 business days past its estimated arrival, contact the seller through your order page, then email <a className="text-primary underline" href="mailto:support@shopnexus.com">support@shopnexus.com</a> if unresolved.</p>
    </LegalLayout>
  );
}
