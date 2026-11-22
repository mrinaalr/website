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

  const molecule = document.getElementById("molecule");
  const fieldGloss = document.getElementById("field-gloss");
  if (molecule && fieldGloss) {
    fetch("fields.ttl")
      .then((response) => response.text())
      .then((doc) => mountMolecule(molecule, fieldGloss, moleculeFromTurtle(doc)))
      .catch(() => {
        fieldGloss.textContent = "The map file did not load.";
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

function termId(token) {
  const bare = token.trim().replace(/[<>]/g, "");
  const hash = bare.lastIndexOf("#");
  if (hash >= 0) return bare.slice(hash + 1);
  const colon = bare.lastIndexOf(":");
  return colon >= 0 ? bare.slice(colon + 1) : bare;
}

function splitTurtleBlocks(doc) {
  const blocks = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < doc.length; i += 1) {
    const ch = doc[i];
    if (ch === "\"" && doc[i - 1] !== "\\") quoted = !quoted;
    current += ch;
    const end = !quoted && (doc[i - 1] === " " || doc[i - 1] === "\n") && ch === "." && (doc[i + 1] === "\n" || doc[i + 1] === "\r" || doc[i + 1] === undefined);
    if (end) {
      blocks.push(current.trim());
      current = "";
    }
  }
  if (current.trim()) blocks.push(current.trim());
  return blocks;
}

function splitTurtleParts(block) {
  const parts = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < block.length; i += 1) {
    const ch = block[i];
    if (ch === "\"" && block[i - 1] !== "\\") quoted = !quoted;
    if (ch === ";" && !quoted) {
      parts.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
function turtleValue(raw) {
  const text = raw.trim().replace(/\s+\.$/, "");
  if (text.startsWith("\"")) return text.slice(1, text.lastIndexOf("\""));
  if (text.startsWith("<")) return { id: termId(text) };
  if (/^-?\d+$/.test(text)) return Number(text);
  return text;
}

function moleculeFromTurtle(doc) {
  const relations = ["appliedTo", "studies", "evidencedBy", "represents", "builtFrom", "includes", "types", "aimsAt", "informs", "analyzes"];
  const dashed = new Set(["analyzes"]);
  const hidden = new Set(["represents"]);
  const blocks = splitTurtleBlocks(doc).map((block) => block.trim()).filter((block) => block && !block.startsWith("@"));
  const records = blocks.map((block) => {
    const parts = splitTurtleParts(block);
    const head = parts[0].trim().split(/\s+/);
    const props = { id: termId(head[0]) };
    if (head[1] === "a" && head[2]) props.type = termId(head[2]);
    parts.slice(1).forEach((part) => {
      const match = part.trim().match(/^(\S+)\s+([\s\S]+)$/);
      if (!match) return;
      const key = termId(match[1]);
      const value = turtleValue(match[2]);
      if (props[key] == null) props[key] = value;
      else if (Array.isArray(props[key])) props[key].push(value);
      else props[key] = [props[key], value];
    });
    return props;
  });
  const mapNode = records.find((node) => node.type === "Map");
  const instances = records.filter((node) => node.x != null);
  const nodes = instances.map((node) => ({
    id: node.id,
    label: node.label,
    x: node.x,
    y: node.y,
    labelDx: node.labelDx || 0,
    labelDy: node.labelDy,
    gloss: node.comment
  }));
  const bonds = [];
  instances.forEach((node) => {
    relations.forEach((relation) => {
      const raw = node[relation];
      if (raw == null) return;
      const targets = Array.isArray(raw) ? raw : [raw];
      targets.forEach((target) => {
        if (!target || target.id == null) return;
        bonds.push({
          a: node.id,
          b: target.id,
          relation,
          kind: hidden.has(relation) ? "hidden" : dashed.has(relation) ? "neighbor" : "bond"
        });
      });
    });
  });
  return { view: String(mapNode.viewBox).split(/[\s,]+/).map(Number), nodes, bonds };
}

function mountMolecule(stage, gloss, map) {
  const ns = "http://www.w3.org/2000/svg";
  const [x, y, width, height] = map.view;
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("viewBox", map.view.join(" "));
  svg.setAttribute("role", "group");
  svg.setAttribute("aria-label", "Perspectives on the work. Click a perspective to read it.");
  stage.replaceChildren(svg);

  const byId = new Map(map.nodes.map((node) => [node.id, node]));
  const neighbors = new Map(map.nodes.map((node) => [node.id, new Set()]));
  const outs = new Map(map.nodes.map((node) => [node.id, []]));
  const incoming = new Map(map.nodes.map((node) => [node.id, []]));
  map.bonds.forEach((bond) => {
    neighbors.get(bond.a).add(bond.b);
    neighbors.get(bond.b).add(bond.a);
    outs.get(bond.a).push({ id: bond.b, relation: bond.relation, hidden: bond.kind === "hidden" });
    incoming.get(bond.b).push(bond.a);
  });

  function unique(list) {
    const seenIds = new Set();
    return list.filter((id) => {
      if (seenIds.has(id)) return false;
      seenIds.add(id);
      return true;
    });
  }

  const forwardOrder = ["includes", "types", "aimsAt", "informs", "studies", "evidencedBy", "appliedTo", "analyzes", "builtFrom", "represents"];
  const outgoing = new Map(map.nodes.map((node) => {
    const ordered = outs.get(node.id).slice().sort((a, b) => forwardOrder.indexOf(a.relation) - forwardOrder.indexOf(b.relation));
    return [node.id, unique(ordered.map((edge) => edge.id))];
  }));

  function spur(from, to) {
    return (outgoing.get(to) || []).every((id) => id === from);
  }

  const ring = new Map(map.nodes.map((node) => {
    const inc = incoming.get(node.id);
    const spurs = inc.filter((id) => spur(node.id, id));
    const hubs = inc.filter((id) => !spur(node.id, id));
    const outs = outgoing.get(node.id) || [];
    const neighbors = node.id === "rec" ? [...outs, ...hubs, ...spurs] : [...outs, ...spurs, ...hubs];
    return [node.id, unique(neighbors)];
  }));

  const lines = map.bonds.filter((bond) => bond.kind !== "hidden").map((bond) => {
    const line = document.createElementNS(ns, "line");
    line.classList.add("bond");
    if (bond.kind === "neighbor") line.classList.add("bond", "is-neighbor");
    svg.appendChild(line);
    return { bond, line };
  });

  map.nodes.forEach((node) => {
    const atom = document.createElementNS(ns, "g");
    atom.classList.add("atom");
    atom.setAttribute("role", "button");
    atom.setAttribute("tabindex", "0");
    atom.setAttribute("aria-pressed", "false");
    atom.setAttribute("aria-label", node.label);
    const ring = document.createElementNS(ns, "circle");
    ring.classList.add("ring");
    ring.setAttribute("r", "16");
    const hit = document.createElementNS(ns, "circle");
    hit.classList.add("atom-hit");
    hit.setAttribute("r", "26");
    const nucleus = document.createElementNS(ns, "circle");
    nucleus.classList.add("nucleus");
    nucleus.setAttribute("r", "5.5");
    const name = document.createElementNS(ns, "text");
    name.classList.add("atom-name");
    name.textContent = node.label;
    atom.append(ring, hit, nucleus, name);
    svg.appendChild(atom);
    node.atom = atom;
    node.name = name;
    place(node);
  });

  let selected = null;
  let drag = null;
  let stack = [];
  let seen = new Set();
  const taken = new Map();

  function place(node) {
    node.atom.querySelectorAll("circle").forEach((circle) => {
      circle.setAttribute("cx", node.x);
      circle.setAttribute("cy", node.y);
    });
    node.name.setAttribute("x", node.x + (node.labelDx || 0));
    node.name.setAttribute("y", node.y + node.labelDy);
  }

  function drawBonds() {
    lines.forEach(({ bond, line }) => {
      const from = byId.get(bond.a);
      const to = byId.get(bond.b);
      line.setAttribute("x1", from.x);
      line.setAttribute("y1", from.y);
      line.setAttribute("x2", to.x);
      line.setAttribute("y2", to.y);
    });
  }

  function paint() {
    const lit = new Set();
    if (selected) {
      lit.add(selected);
      neighbors.get(selected).forEach((id) => lit.add(id));
    }
    map.nodes.forEach((node) => {
      const on = node.id === selected;
      const dim = selected && !lit.has(node.id);
      node.atom.classList.toggle("is-on", on);
      node.atom.classList.toggle("is-dim", dim);
      node.atom.setAttribute("aria-pressed", on ? "true" : "false");
    });
    lines.forEach(({ bond, line }) => {
      const hot = selected && lit.has(bond.a) && lit.has(bond.b);
      const dim = selected && !hot;
      line.classList.toggle("is-hot", hot);
      line.classList.toggle("is-dim", dim);
    });
    const node = byId.get(selected);
    gloss.textContent = node ? node.gloss : "Click a perspective.";
  }

  function resetWalk(id) {
    stack = id ? [id] : [];
    seen = new Set(stack);
    taken.clear();
  }

  function ensure() {
    if (!stack.length || stack[stack.length - 1] !== selected) stack = [selected];
  }

  function usedFrom(id) {
    let used = taken.get(id);
    if (!used) {
      used = new Set();
      taken.set(id, used);
    }
    return used;
  }

  function defaultBack(id) {
    const inc = incoming.get(id) || [];
    if (inc.length) return inc[0];
    const built = (outs.get(id) || []).find((edge) => edge.relation === "builtFrom");
    if (built) return built.id;
    return null;
  }

  function hasFreshExit(id, except) {
    const used = usedFrom(id);
    return (ring.get(id) || []).some((next) => next !== except && !used.has(next) && !seen.has(next));
  }

  function choose(here, parent) {
    const used = usedFrom(here);
    const waiting = (ring.get(here) || []).filter((next) => !used.has(next) && next !== parent);
    const fresh = waiting.filter((next) => !seen.has(next));
    if (fresh.length) return fresh[0];
    const fruitful = waiting.filter((next) => hasFreshExit(next, here));
    if (fruitful.length) return fruitful[0];
    const others = (ring.get(here) || []).filter((next) => next !== parent);
    if (parent && !used.has(parent) && others.every((next) => used.has(next))) return parent;
    return null;
  }

  function take(here, next) {
    usedFrom(here).add(next);
    seen.add(next);
    stack.push(next);
    arrive(next);
  }

  function forward() {
    ensure();
    const parent = stack.length > 1 ? stack[stack.length - 2] : null;
    const here = stack[stack.length - 1];
    const next = choose(here, parent);
    if (next) take(here, next);
  }

  function back() {
    ensure();
    if (stack.length > 1) {
      const left = stack.pop();
      const here = stack[stack.length - 1];
      const used = taken.get(here);
      if (used) used.delete(left);
      seen.delete(left);
      arrive(here);
      return;
    }
    const pick = defaultBack(selected);
    if (!pick || pick === selected) return;
    resetWalk(pick);
    arrive(pick);
  }

  function arrive(id) {
    selected = id;
    const node = byId.get(id);
    if (node) node.atom.focus({ preventScroll: true });
    paint();
  }

  function select(id) {
    selected = selected === id ? null : id;
    resetWalk(selected);
    paint();
  }

  function point(event) {
    const box = svg.getBoundingClientRect();
    return {
      x: ((event.clientX - box.left) / box.width) * width + x,
      y: ((event.clientY - box.top) / box.height) * height + y
    };
  }

  map.nodes.forEach((node) => {
    node.atom.addEventListener("pointerdown", (event) => {
      node.atom.focus({ preventScroll: true });
      node.atom.setPointerCapture(event.pointerId);
      const start = point(event);
      drag = { node, dx: start.x - node.x, dy: start.y - node.y, moved: false, sx: start.x, sy: start.y };
    });
    node.atom.addEventListener("pointermove", (event) => {
      if (!drag || drag.node !== node) return;
      const at = point(event);
      if (Math.hypot(at.x - drag.sx, at.y - drag.sy) > 4) drag.moved = true;
      node.x = Math.min(width - 36, Math.max(36, at.x - drag.dx));
      node.y = Math.min(height - 28, Math.max(28, at.y - drag.dy));
      place(node);
      drawBonds();
    });
    node.atom.addEventListener("pointerup", () => {
      if (!drag || drag.node !== node) return;
      if (!drag.moved) select(node.id);
      drag = null;
    });
    node.atom.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      event.preventDefault();
      select(node.id);
    });
  });

  window.addEventListener("keydown", (event) => {
    if (!selected) return;
    const active = document.activeElement;
    if (!active || !stage.contains(active)) return;
    if (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || active.isContentEditable) return;
    const dirs = { ArrowRight: 1, ArrowUp: 1, " ": 1, ArrowLeft: -1, ArrowDown: -1 };
    const dir = dirs[event.key];
    if (!dir) return;
    event.preventDefault();
    if (dir > 0) forward();
    else back();
  });

  svg.addEventListener("pointerdown", (event) => {
    if (event.target !== svg) return;
    selected = null;
    resetWalk(null);
    paint();
  });

  drawBonds();
  paint();
}
