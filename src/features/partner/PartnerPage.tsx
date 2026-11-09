import { useState } from "react";
import { Sparkles } from "lucide-react";
import { api } from "../../api";
import { DevMockBanner, Shell } from "../../components";
export function Partner() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <p className="eyebrow">Partner with Troo</p>
        <h1>Bring your tables to discerning diners</h1>
        <p className="lead">
          Join the Cyprus Winter Dining Network. The partner shift dashboard (with live covers and
          hearth status) is coming soon. Register below to receive partner onboarding.
        </p>

        {submitted ? (
          <div className="card card-padded text-center">
            <Sparkles size={36} className="text-[#9a4a3a] mx-auto mb-3" aria-hidden="true" />
            <h2>Thank you for your inquiry</h2>
            <p className="lead">
              Your enquiry has been saved locally. It has not been sent yet. Full partner dashboard is planned for Phase 2.
            </p>
            <button className="secondary" onClick={() => setSubmitted(false)}>
              Submit another request
            </button>
          </div>
        ) : (
          <form
            className="partner card card-padded"
            onSubmit={e => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const lead = api.createPartnerLead({
                venueName: String(form.get('venueName') ?? ''),
                region: String(form.get('region') ?? ''),
                email: String(form.get('email') ?? ''),
                notes: String(form.get('notes') ?? '')
              });
              const existing: unknown = JSON.parse(localStorage.getItem('troo_partner_leads') ?? '[]');
              localStorage.setItem('troo_partner_leads', JSON.stringify([...(Array.isArray(existing) ? existing : []), lead]));
              setSubmitted(true);
            }}
          >
            <label>
              Venue name
              <input required name="venueName" placeholder="e.g. To Patriko Taverna" />
            </label>
            <label>
              Location & region
              <input required name="region" placeholder="e.g. Old Town, Limassol" />
            </label>
            <label>
              Contact email
              <input type="email" required name="email" placeholder="host@taverna.com" />
            </label>
            <label>
              Tell us about your winter hearth or menu
              <textarea
                name="notes"
                rows={3}
                placeholder="Wood-fired oven, fireplace seating, village meze..."
              />
            </label>
            <p className="text-xs text-[#7a6a5a] mb-2">
              We use your details only to respond to this enquiry.{' '}
              [PLACEHOLDER: privacy policy link]
            </p>
            <button type="submit" className="primary mt-2">
              Request partner invitation
            </button>
            <a className="secondary" href="mailto:partners@troo.example">
              Contact partner relations
            </a>
          </form>
        )}
      </section>
    </Shell>
  );
}

/* Story Detail Subpage */
