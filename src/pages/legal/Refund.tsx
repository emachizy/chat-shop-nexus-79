import LegalLayout from './LegalLayout';

export default function Refund() {
  return (
    <LegalLayout title="Refund & Returns Policy">
      <p>ShopNexus is a marketplace of independent sellers. Each seller sets the specific terms for their items, but every order on the platform is covered by the minimum guarantees below.</p>

      <h2 className="font-display font-semibold text-xl mt-8">When you're entitled to a refund</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>The item never arrived.</li>
        <li>The item arrived damaged, defective, or materially different from the listing.</li>
        <li>The order was charged in error (e.g. duplicate charge).</li>
      </ul>

      <h2 className="font-display font-semibold text-xl mt-8">How to request one</h2>
      <ol className="list-decimal pl-6 space-y-1">
        <li>Contact the seller within 7 days of delivery through your order history.</li>
        <li>If unresolved after 3 business days, email <a className="text-primary underline" href="mailto:support@shopnexus.com">support@shopnexus.com</a> with your order number and photos where relevant.</li>
        <li>Approved refunds are returned to the original payment method within 5–10 business days, or as store credit if you prefer.</li>
      </ol>

      <h2 className="font-display font-semibold text-xl mt-8">Non-refundable</h2>
      <p>Perishables, personalised items, and digital goods that have been delivered are non-refundable unless faulty.</p>
    </LegalLayout>
  );
}
