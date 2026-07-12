import LegalLayout from './LegalLayout';

export default function Privacy() {
  return (
    <LegalLayout title="Privacy Policy">
      <p>This policy describes what we collect and how we use it. It applies to visitors and account holders on ShopNexus.</p>

      <h2 className="font-display font-semibold text-xl mt-8">What we collect</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li><b>Account data</b> – name, email, and (optionally) phone.</li>
        <li><b>Order data</b> – items ordered, shipping address, and payment reference (we do not store card numbers).</li>
        <li><b>Usage data</b> – standard server logs (IP, browser, timestamps) for security and diagnostics.</li>
      </ul>

      <h2 className="font-display font-semibold text-xl mt-8">How we use it</h2>
      <ul className="list-disc pl-6 space-y-1">
        <li>To fulfil orders and share required details with the relevant seller (name, phone, delivery address).</li>
        <li>To send order and account emails.</li>
        <li>To detect and prevent fraud or abuse.</li>
      </ul>

      <h2 className="font-display font-semibold text-xl mt-8">Third parties</h2>
      <p>We use Paystack to process card payments and Lovable Cloud for hosting and email delivery. These processors handle data solely on our behalf, under their own terms.</p>

      <h2 className="font-display font-semibold text-xl mt-8">Your rights</h2>
      <p>You can request a copy of your data or ask us to delete it by emailing <a className="text-primary underline" href="mailto:support@shopnexus.com">support@shopnexus.com</a>. Some records must be retained for tax and legal reasons.</p>

      <h2 className="font-display font-semibold text-xl mt-8">Cookies</h2>
      <p>We use a minimum set of cookies to keep you signed in and remember your cart. No advertising cookies are set by us.</p>
    </LegalLayout>
  );
}
