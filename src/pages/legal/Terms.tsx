import LegalLayout from './LegalLayout';

export default function Terms() {
  return (
    <LegalLayout title="Terms of Service">
      <p>Welcome to ShopNexus, a marketplace that connects independent sellers with buyers. By using this site, you agree to the terms below. If you don't agree, please don't use the service.</p>

      <h2 className="font-display font-semibold text-xl mt-8">1. Your account</h2>
      <p>You are responsible for keeping your login credentials safe and for anything that happens under your account. You must be at least 18 or the age of majority in your country to place orders.</p>

      <h2 className="font-display font-semibold text-xl mt-8">2. Marketplace model</h2>
      <p>Products listed on ShopNexus are sold by third-party sellers. ShopNexus provides the platform and payment infrastructure; the seller is the merchant of record for their items and is responsible for product accuracy, fulfilment, and after-sales support.</p>

      <h2 className="font-display font-semibold text-xl mt-8">3. Orders and payment</h2>
      <p>Prices are shown in Nigerian Naira (₦). Payment is processed via Paystack for card payments, or collected by the seller on delivery for Pay-on-Delivery orders. A confirmed order is a binding contract between you and the seller.</p>

      <h2 className="font-display font-semibold text-xl mt-8">4. Prohibited activity</h2>
      <p>You agree not to use the service to sell illegal, counterfeit, or restricted goods; harass other users; scrape the site; or attempt to bypass security controls. We may suspend accounts that break these rules.</p>

      <h2 className="font-display font-semibold text-xl mt-8">5. Limitation of liability</h2>
      <p>The service is provided "as is". To the maximum extent permitted by law, ShopNexus is not liable for indirect, incidental, or consequential damages arising from your use of the platform.</p>

      <h2 className="font-display font-semibold text-xl mt-8">6. Changes</h2>
      <p>We may update these terms. Material changes will be posted here with a new "last updated" date.</p>
    </LegalLayout>
  );
}
