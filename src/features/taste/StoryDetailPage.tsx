import { Link, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Shell } from "../../components";
export function StoryDetail() {
  const navigate = useNavigate();

  return (
    <Shell>
      <section className="page">
        <button
          type="button"
          className="back"
          onClick={() => navigate(-1)}
          aria-label="Back to taste"
        >
          <ChevronLeft aria-hidden="true" size={18} /> Back
        </button>

        <p className="eyebrow">Culinary Heritage</p>
        <h1>Why we seal the clay oven when the Troodos rain arrives</h1>

        <article className="prose space-y-4 text-[#2b2118]">
          <p className="lead">
            In the hillside stone villages above Limassol, winter cooking is measured in hours of
            radiant embers rather than instant flames.
          </p>
          <p>
            Traditional earthenware ovens (*fournoi*) are preheated with dried olive branches and wild
            thyme. Once the stone reaches temperature, parchment-wrapped kleftiko and earthenware
            crocks of potatoes are placed inside, and the iron door is sealed with damp clay mortar.
          </p>
          <p>
            Over eight unhurried hours, the meat absorbs gentle smoke and natural juices, resulting
            in meat so tender it falls from the bone at the touch of a fork. Served alongside crusty
            village sourdough and a glass of aged Commandaria, it represents the heart of Cypriot
            winter hospitality (*kali hora*).
          </p>
        </article>

        <div className="mt-8">
          <Link to="/taste" className="primary inline-block text-center" style={{ textDecoration: 'none' }}>
            Explore winter dishes
          </Link>
        </div>
      </section>
    </Shell>
  );
}

/* Root App with React Router */
