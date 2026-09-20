(function () {
  const tabs = Array.from(document.querySelectorAll("[data-state]"));
  const notes = Array.from(document.querySelectorAll("[data-note]"));
  const panel = document.getElementById("panel");
  const trace = document.getElementById("trace");

  function select(tab) {
    if (!tab) return;
    tabs.forEach((item) => {
      const on = item === tab;
      item.setAttribute("aria-selected", on ? "true" : "false");
      item.tabIndex = on ? 0 : -1;
    });

    const id = tab.dataset.state;
    notes.forEach((note) => {
      note.hidden = note.dataset.note !== id;
    });

    if (trace) trace.classList.toggle("is-on", id === "extract");
    if (panel) panel.setAttribute("aria-labelledby", tab.id);
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", (event) => {
      const order = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
      if (!order.includes(event.key)) return;
      event.preventDefault();
      const index = tabs.indexOf(tab);
      let next = index;
      if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else if (event.key === "ArrowRight" || event.key === "ArrowDown") next = (index + 1) % tabs.length;
      else next = (index - 1 + tabs.length) % tabs.length;
      tabs[next].focus();
      select(tabs[next]);
    });
  });

  const hits = Array.from(document.querySelectorAll(".hit"));
  const rule = document.getElementById("rule");
  hits.forEach((hit) => {
    hit.addEventListener("click", () => {
      const on = hit.getAttribute("aria-pressed") === "true";
      hits.forEach((item) => item.setAttribute("aria-pressed", "false"));
      if (on) {
        if (rule) {
          rule.textContent = "Pick a marked phrase. The rule that caught it shows up here.";
          rule.classList.remove("is-set");
        }
        return;
      }
      hit.setAttribute("aria-pressed", "true");
      if (rule) {
        rule.textContent = hit.dataset.kind + ": " + hit.dataset.rule;
        rule.classList.add("is-set");
      }
    });
  });

  const bag = document.getElementById("bag");
  const unmute = document.getElementById("unmute");
  if (bag && unmute) {
    unmute.addEventListener("click", () => {
      bag.muted = !bag.muted;
      if (!bag.muted) bag.play();
      unmute.textContent = bag.muted ? "Sound off. Click for sound." : "Sound on. Click to mute.";
    });
  }

  const swapA = document.getElementById("swap-a");
  const swapB = document.getElementById("swap-b");
  if (swapA && swapB && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    let showA = true;
    window.setInterval(() => {
      showA = !showA;
      swapA.classList.toggle("is-on", showA);
      swapB.classList.toggle("is-on", !showA);
    }, 7000);
  }
})();
