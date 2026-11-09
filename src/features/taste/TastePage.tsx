import { useState } from "react";
import { Link } from "react-router-dom";
import { euro } from "../../lib/money";
import { BookingSheet, DevMockBanner, Shell, Toast } from "../../components";
export function Taste() {
  const [bookDish, setBookDish] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const dishes = [
    {
      name: 'Clay pot kleftiko',
      venue: 'To Patriko Taverna',
      price: 18,
      src: '/images/patriko.svg',
      alt: 'Slow-cooked lamb kleftiko in clay pot with roasted potatoes'
    },
    {
      name: 'Halloumi and sourdough',
      venue: 'Troodos Foothill Kitchen',
      price: 14,
      src: '/images/troodos.svg',
      alt: 'Grilled sheep halloumi with honey and warm sourdough bread'
    },
    {
      name: 'Winter meze spread',
      venue: 'To Patriko Taverna',
      price: 22,
      src: '/images/kafeneio.svg',
      alt: 'Traditional winter meze spread with seasonal dips and wild greens'
    }
  ];

  return (
    <Shell>
      <section className="page">
        <DevMockBanner />
        <p className="eyebrow">Taste & Heritage</p>
        <h1>Winter culinary heritage</h1>
        <p className="lead">
          Rediscover authentic winter culinary traditions, slow earthenware baking, and indigenous
          vintages.
        </p>

        {/* Editorial Story Card */}
        <article className="story">
          <p className="eyebrow">Editorial guide</p>
          <h2>Winter tables in Cyprus</h2>
          <p>
            When the Troodos rain arrives, village clay ovens are sealed for eight hours of slow
            heat. Explore the flavors that define an unhurried season.
          </p>
          <Link className="text-link mt-2" to="/taste/story">
            Read the story
          </Link>
        </article>

        <h2 className="section-title">Reserve a seasonal dish</h2>
        <div className="cards">
          {dishes.map(dish => (
            <article className="card dish" key={dish.name}>
              <img src={dish.src} alt={dish.alt} />
              <div>
                <h2>{dish.name}</h2>
                <p className="lead" style={{ margin: '2px 0 8px' }}>
                  {dish.venue}
                </p>
                <strong>{euro(dish.price)}</strong>
                <button
                  className="secondary mt-3"
                  onClick={() => setBookDish(dish.name)}
                >
                  Reserve
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      {bookDish && (
        <BookingSheet
          title={`Dish reservation: ${bookDish}`}
          priceCents={1200}
          onClose={() => setBookDish(null)}
          onSuccess={() => {
            setToast(`Reserved ${bookDish}!`);
            setTimeout(() => setToast(null), 2500);
          }}
        />
      )}
      <Toast text={toast} />
    </Shell>
  );
}

/* Kouzina Food Delivery Destination (Per Product Owner Decision 3) */
