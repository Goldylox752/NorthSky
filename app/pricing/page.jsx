"use client";

const plans = [
  {
    name: "Starter",
    price: "$499 / month",
    priceId: "price_starter_here",
    description: "5–10 qualified requests",
  },
  {
    name: "Growth",
    price: "$999 / month",
    priceId: "price_growth_here",
    description: "15–30 booked opportunities",
  },
  {
    name: "Domination",
    price: "$1,999 / month",
    priceId: "price_domination_here",
    description: "Exclusive territory control",
  },
];

export default function Pricing() {

  const handleCheckout = async (priceId, btn) => {
    try {
      if (btn) btn.disabled = true;

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });

      if (!res.ok) throw new Error("Checkout failed");

      const data = await res.json();

      if (!data.url) throw new Error("Missing checkout URL");

      window.location.href = data.url;

    } catch (err) {
      console.error(err);
      alert("Unable to start checkout. Try again.");
    } finally {
      if (btn) btn.disabled = false;
    }
  };

  return (
    <main className="bg-black text-white">
      <section className="max-w-5xl mx-auto px-6 py-20 text-center">
        <h1 className="text-4xl font-bold">
          NorthSky Pricing
        </h1>
        <p className="text-gray-400 mt-3">
          Enterprise roofing demand pipeline — territory protected.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24 grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.name} className="border border-white/10 rounded-2xl p-6 bg-white/5">
            <h2 className="text-xl font-bold">{plan.name}</h2>

            <p className="text-2xl font-semibold mt-2">{plan.price}</p>

            <p className="text-sm text-gray-400 mt-2 mb-6">
              {plan.description}
            </p>

            <button
              onClick={(e) => handleCheckout(plan.priceId, e.currentTarget)}
              className="w-full bg-cyan-500 hover:bg-cyan-400 text-black py-3 rounded-xl font-bold transition"
            >
              Start {plan.name}
            </button>
          </div>
        ))}
      </section>
    </main>
  );
}