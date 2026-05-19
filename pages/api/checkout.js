<script type="module">

async function startCheckout(plan, btn) {

  try {

    btn.disabled = true;
    const originalText = btn.innerText;
    btn.innerText = "Redirecting...";

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ plan })
    });

    const data = await res.json();

    if (!data.url) {
      throw new Error("Missing checkout URL");
    }

    window.location.href = data.url;

  } catch (err) {

    console.error(err);

    alert("Checkout failed. Try again.");

    btn.disabled = false;
    btn.innerText = "Start Getting Leads";
  }
}

window.startCheckout = startCheckout;

</script>