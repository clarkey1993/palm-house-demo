import { BUILD } from "./build-config.js";
import { BrowserSaveStore } from "./save-store.js";
import { PlaytestLog } from "./playtest.js";
import {
  OPENING_STEPS,
  openingComplete,
  nextOpeningStep,
  applyOpeningPolicy,
  fitsOpening,
} from "./opening.js";
import {
  createGame,
  update,
  serialize,
  PADS,
  ROOMS,
  CLEAN_SPOTS,
  roomCount,
  roomForPad,
  unlocked,
  workRate,
  moveRate,
  benefit,
  wageRate,
  onDuty,
  staffCount,
  price,
  complete,
  label,
  RECEPTION,
  RESTAURANT_SERVICE,
  roomRate,
  distance,
} from "./model.js";
import {
  createHotel,
  serializeHotel,
  updateHotel,
  transferStaff,
  releaseStaff,
  totalWages,
  toggleBookings,
  floorMetrics,
  LIFT,
  travel,
} from "./hotel.js";
import { HotelView } from "./view.js";
import { RooftopView } from "./rooftop-view.js";
import { roofValue } from "./rooftop.js";
import { CHAPTERS, nextChapter, claimChapter } from "./journey.js";
import { parseSave, SaveConflictError } from "./saves.js";
const $ = (s) => document.querySelector(s),
  canvas = $("#game");
const storage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value),
  removeItem: (key) => localStorage.removeItem(key),
};
const saveStore = new BrowserSaveStore(storage, BUILD.namespace);
const playtest = new PlaytestLog(
  storage,
  (BUILD.namespace || "prototype") + ":playtest",
  BUILD.version,
);
let lastSavedRaw = null,
  saveConflict = false;
let saved,
  recoveredSave = false;
try {
  if (document.body.dataset.hotelPreview !== "true") {
    const loaded = saveStore.load();
    lastSavedRaw = saveStore.raw();
    saved = loaded.value;
    recoveredSave = loaded.recovered;
  }
} catch {}
const preview = document.body.dataset.hotelPreview === "true";
if (preview)
  saved = {
    version: 5,
    cash: 31000,
    expanded: true,
    elevator: true,
    levels: [2, 2, 2, 2, 2, 2],
    staff: { receptionist: 1, cleaner: 1, runner: 1 },
    pool: true,
    cafe: true,
    upper: {
      version: 5,
      floor: 1,
      levels: [1, 0, 0, 0, 0, 0],
      staff: { receptionist: 1, cleaner: 1, runner: 1 },
    },
  };
if (preview && document.body.dataset.expansionPreview === "true") {
  Object.assign(saved, {
    wing: true,
    restaurantPlot: true,
    restaurant: true,
    diningExpansion: true,
    gym: true,
    gymUpgrade: true,
    kitchen: 2,
    servers: 2,
    extraDesk: true,
    levels: [2, 2, 2, 2, 2, 2, 2, 2],
    staff: { receptionist: 2, cleaner: 2, runner: 2 },
  });
}
if (preview && document.body.dataset.freshPreview === "true") saved = null;
if (preview && document.body.dataset.roofPreview === "true") {
  saved.upper.levels = [2, 2, 1, 1];
  saved.upper.roofUnlocked = true;
  saved.rooftop = {
    version: 5,
    floor: 2,
    cash: 31000,
    levels: [0, 0, 0, 0],
    poolLevel: 1,
    roofJuice: 1,
    roofSpa: 1,
    attendants: 1,
  };
}
let hotel = applyOpeningPolicy(createHotel(saved), BUILD.openingDemo);
if (preview && document.body.dataset.roofPreview === "true") {
  hotel.active = 2;
  hotel.floors[2].guests = Array.from({ length: 3 }, (_, i) => ({
    id: 100 + i,
    x: 3.2,
    z: 9 + i,
    phase: "roofArrive",
    room: -1,
    color: i + 1,
    satisfaction: 90,
  }));
}
if (preview && document.body.dataset.freshPreview !== "true")
  Object.assign(hotel.floors[0].player, LIFT);
let game = hotel.floors[hotel.active];
let view,
  paused = false,
  keys = {},
  drag = null,
  last = 0,
  saveTime = 0,
  toastTime = 0,
  muted = true,
  audio,
  lastSound = 0,
  lastCash = -1;
let soundSaved;
try {
  soundSaved = localStorage.getItem("palm-house-sound");
} catch {}
muted = soundSaved !== "on";
function save() {
  if (preview || saveConflict) return;
  try {
    lastSavedRaw = saveStore.write(serializeHotel(hotel), lastSavedRaw);
    $("#save-status").textContent = "Progress saves on this device";
  } catch (error) {
    if (error instanceof SaveConflictError) {
      showSaveConflict();
      return;
    }
    $("#save-status").textContent =
      "Saving unavailable · export a backup in Settings";
  }
}
function showSaveConflict() {
  if (saveConflict) return;
  saveConflict = true;
  paused = true;
  keys = {};
  release();
  const panel = document.createElement("div");
  panel.className = "save-conflict";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Hotel updated in another tab");
  const card = document.createElement("section"),
    title = document.createElement("h2"),
    detail = document.createElement("p"),
    reload = document.createElement("button");
  title.textContent = "Your hotel is open elsewhere";
  detail.textContent =
    "Another tab saved newer progress. This tab is paused to keep it safe. Close the other tab, then load the latest hotel here.";
  reload.textContent = "Load latest hotel";
  reload.onclick = () => location.reload();
  card.append(title, detail, reload);
  panel.append(card);
  document.body.append(panel);
  reload.focus();
}
window.addEventListener("storage", (event) => {
  if (
    !preview &&
    event.key === saveStore.key &&
    event.newValue !== lastSavedRaw
  )
    showSaveConflict();
});
function downloadJSON(value, filename) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(value, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
$("#playtest-settings").hidden = !BUILD.logging;
if (BUILD.openingDemo) {
  $(".wing-plans").hidden = true;
  $(".next-chapter").hidden = true;
}
$("#playtest-consent").checked = playtest.enabled;
$("#build-label").textContent =
  BUILD.channel === "prototype"
    ? "Original hotel · progress preserved"
    : "Opening demo · " + BUILD.channel + " · " + BUILD.version;
$("#playtest-consent").onchange = () => {
  playtest.consent($("#playtest-consent").checked);
  $("#playtest-feedback").textContent = playtest.failed
    ? "Browser storage is unavailable. You can still export this session's notes."
    : playtest.enabled
      ? "Notes stay on this device until you choose to share them."
      : "Local playtest notes deleted.";
};
$("#export-playtest").onclick = () => {
  if (!playtest.enabled) {
    $("#playtest-feedback").textContent =
      "Recording is off. No notes to share.";
    return;
  }
  downloadJSON(playtest.data(), "palm-house-playtest.json");
  $("#playtest-feedback").textContent =
    "Downloaded. Inspect the file and share it with your host only if you wish.";
};
window.addEventListener("error", () => playtest.record("error", "runtime"));
window.addEventListener("unhandledrejection", () =>
  playtest.record("error", "promise"),
);
let welcomeVisible = false;
function showWelcome() {
  welcomeVisible = true;
  paused = true;
  release();
  keys = {};
  $("#demo-title").innerHTML = "A little hotel.<br>A new beginning.";
  $("#demo-description").textContent =
    "You have $500 and your first room. Welcome guests, collect their payments and make this seaside escape your own.";
  $("#demo-milestones").textContent = matchMedia("(pointer: coarse)").matches
    ? "Drag anywhere to walk · Pinch to zoom"
    : "Arrow keys or WASD to walk · Scroll to zoom";
  $("#welcome-consent-row").hidden = !BUILD.logging;
  $("#demo-dialog").hidden = false;
  $("#demo-continue").focus();
}
function showDemoEnd(done) {
  welcomeVisible = false;
  paused = true;
  release();
  keys = {};
  $("#demo-eyebrow").textContent = done
    ? "YOUR FIRST CHAPTER / COMPLETE"
    : "A GLIMPSE OF WHAT COMES NEXT";
  $("#demo-title").textContent = done
    ? "You've made a little escape."
    : "Room for a bigger dream.";
  $("#demo-description").textContent = done
    ? "Four rooms, a little bar and a team of your own. Thank you for helping shape Palm House. Your hotel stays open, so settle in for as long as you like."
    : "Beyond this opening demo: more rooms, a restaurant, a gym, sky suites and a rooftop pool. No purchase is available in this test, and no construction money has been taken.";
  const list = $("#demo-milestones");
  list.replaceChildren();
  for (const step of OPENING_STEPS) {
    const row = document.createElement("p");
    row.textContent =
      (step.value(hotel) >= step.goal ? "✓ " : "○ ") +
      step.title +
      " · " +
      Math.min(step.goal, step.value(hotel)) +
      "/" +
      step.goal;
    list.append(row);
  }
  $("#welcome-consent-row").hidden = true;
  $("#demo-continue").textContent = "Back to my hotel →";
  $("#demo-feedback").hidden = !BUILD.logging;
  $("#demo-footnote").textContent =
    "Tell your host: what felt satisfying, and what would you change?";
  $("#demo-dialog").hidden = false;
  $("#demo-continue").focus();
  if (done) sound("build");
}
$("#demo-continue").onclick = () => {
  if (welcomeVisible && BUILD.logging && $("#welcome-consent").checked) {
    playtest.consent(true);
    $("#playtest-consent").checked = true;
  }
  welcomeVisible = false;
  $("#demo-dialog").hidden = true;
  paused = false;
  canvas.focus();
  save();
};
$("#demo-feedback").onclick = () => {
  $("#demo-dialog").hidden = true;
  management();
  bookSection("settings");
};
// Keep keyboard focus inside the foreground demo dialog.
$("#demo-dialog").addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    e.stopPropagation();
    $("#demo-continue").click();
  }
  if (e.key !== "Tab") return;
  const controls = [
    ...$("#demo-dialog").querySelectorAll("button,input"),
  ].filter((el) => el.getClientRects().length);
  const first = controls[0],
    end = controls.at(-1);
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    end.focus();
  } else if (!e.shiftKey && document.activeElement === end) {
    e.preventDefault();
    first.focus();
  }
});
function notify(t) {
  $("#toast").textContent = t;
  $("#toast").classList.add("show");
  toastTime = 3.5;
}
function sound(kind) {
  if (muted) return;
  try {
    audio ??= new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    if (audio.currentTime - lastSound < 0.045) return;
    lastSound = audio.currentTime;
    const notes =
      kind === "build"
        ? [523, 659, 784, 1047]
        : kind === "collect"
          ? [880, 1175]
          : kind === "checkin"
            ? [523, 659]
            : [400];
    notes.forEach((n, i) => {
      let osc = audio.createOscillator(),
        gain = audio.createGain(),
        t = audio.currentTime + i * 0.085;
      osc.type = "sine";
      osc.frequency.value = n;
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.06, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.17);
      osc.connect(gain);
      gain.connect(audio.destination);
      osc.start(t);
      osc.stop(t + 0.18);
    });
  } catch {}
}
function soundButton() {
  $("#sound").setAttribute("aria-label", muted ? "Enable sound" : "Mute sound");
  $("#sound .slash").style.display = muted ? "block" : "none";
  $("#sound").setAttribute("aria-pressed", String(!muted));
}
soundButton();
$("#sound").onclick = () => {
  muted = !muted;
  try {
    localStorage.setItem("palm-house-sound", muted ? "off" : "on");
  } catch {}
  soundButton();
  sound("checkin");
};
function pause(v) {
  paused = v;
  keys = {};
  release();
  $("#overlay").hidden = !v;
  $("#stat-guests").textContent = game.state.welcomed;
  $("#stat-earned").textContent = "$" + game.state.earned.toLocaleString();
  save();
  if (!v) canvas.focus();
}
$("#pause").onclick = () => pause(true);
$("#resume").onclick = () => pause(false);
$("#zoom").onclick = () => {
  view.manual = false;
  view.tracking = false;
  view.zoomFactor = 1;
  view.overview = !view.overview;
  view.setFrustum();
  $("#zoom").setAttribute("aria-pressed", String(view.overview));
  $("#zoom").setAttribute(
    "aria-label",
    view.overview ? "Follow my character" : "Show whole hotel",
  );
};
function arriveOnFloor() {
  release();
  keys = {};
  game = hotel.floors[hotel.active];
  view.dispose();
  view =
    hotel.active === 2
      ? new RooftopView(canvas, game)
      : new HotelView(canvas, game);
  view.followPlayer();
  notify(
    hotel.active === 2
      ? "The Sky Club · pool, sunshine and a little time to unwind."
      : hotel.active
        ? "Floor 2 · guests check in downstairs and take the elevator up."
        : "Welcome back to the garden lobby.",
  );
  canvas.classList.remove("floor-arrival");
  void canvas.offsetWidth;
  canvas.classList.add("floor-arrival");
  hud();
  save();
}
$("#travel").onclick = () => {
  if (!hotel.floors[0].state.expanded) {
    notify("Welcome guests in the mint circle behind reception.");
    view.manual = true;
    view.target.set(RECEPTION.x, 0, RECEPTION.z - 2);
    return;
  }
  notify(
    hotel.floors[1]
      ? "Walk into the elevator to change floors. Step out before returning."
      : "Build the $10,000 elevator on the gold square beside the entrance.",
  );
  view.manual = true;
  view.target.set(LIFT.x, 0, LIFT.z - 2);
};
function management() {
  $("#management").hidden = false;
  paused = true;
  keys = {};
  release();
  $("#finance-summary").textContent =
    "Last 60 seconds: $" +
    hotel.income +
    " earned − $" +
    hotel.wages +
    " wages = $" +
    (hotel.income - hotel.wages) +
    " operating profit.";
  $("#review-summary").textContent =
    Math.round(hotel.reputation) +
    "% satisfaction · " +
    hotel.reviews +
    " reviews · " +
    hotel.lost +
    " guests lost to long waits. Fast check-in and a comfortable stay improve your reputation.";
  $("#wage-summary").textContent =
    "Current team: $" +
    totalWages(hotel) +
    " per active minute. Your hotel pauses while this panel is open.";
  const body = $("#team-rows");
  body.replaceChildren();
  hotel.floors.forEach((g, floor) => {
    const heading = document.createElement("h3");
    heading.textContent = [
      "01 / Garden lobby",
      "02 / Sky suites",
      "03 / The Sky Club",
    ][floor];
    if (floor === 2) {
      body.append(heading);
      const info = document.createElement("p");
      info.textContent =
        "Pool visits earn $" +
        roofValue(g.state) +
        " · " +
        g.state.attendants +
        " pool hosts · wages $" +
        wageRate(g.state) +
        "/min";
      body.append(info);
      const release = document.createElement("button");
      release.textContent = "Release a pool host";
      release.disabled = !g.state.attendants;
      release.onclick = () => {
        g.state.attendants--;
        save();
        view.rebuild();
        management();
      };
      body.append(release);
      return;
    }
    body.append(heading);
    const metrics = floorMetrics(hotel, floor);
    const summary = document.createElement("p");
    summary.className = "floor-metrics";
    summary.textContent =
      metrics.occupied +
      " / " +
      metrics.built +
      " occupied · average booking wait " +
      (metrics.wait === null ? "—" : Math.round(metrics.wait) + "s") +
      " · last 60s profit $" +
      metrics.profit +
      " ($" +
      metrics.income +
      " income − $" +
      metrics.wages +
      " wages)";
    body.append(summary);
    const bookingList = document.createElement("div");
    bookingList.className = "booking-list";
    g.state.levels.forEach((level, room) => {
      if (!level) return;
      const button = document.createElement("button");
      button.textContent =
        "Room " +
        (floor ? "2" : "0") +
        (room + 1) +
        " · " +
        (g.state.bookingsPaused[room]
          ? "Bookings paused"
          : g.state.dirty[room]
            ? "Needs cleaning"
            : g.guests.some(
                  (v) => v.room === room && !["exit", "gone"].includes(v.phase),
                )
              ? "Occupied"
              : "Ready") +
        " · $" +
        roomRate(g.state, room) +
        "/night";
      button.dataset.roomState = g.state.bookingsPaused[room]
        ? "paused"
        : g.state.dirty[room]
          ? "dirty"
          : g.guests.some(
                (v) => v.room === room && !["exit", "gone"].includes(v.phase),
              )
            ? "occupied"
            : "ready";
      button.setAttribute("aria-pressed", String(g.state.bookingsPaused[room]));
      button.onclick = () => {
        toggleBookings(hotel, floor, room);
        save();
        management();
      };
      bookingList.append(button);
    });
    body.append(bookingList);
    for (const [role, name] of [
      ["receptionist", "Reception"],
      ["cleaner", "Cleaning"],
      ["runner", "Cash runners"],
    ]) {
      if (floor === 1 && role === "receptionist") continue;
      const row = document.createElement("div");
      row.className = "team-row";
      const text = document.createElement("span");
      text.textContent = name + " · " + staffCount(g.state, role) + " / 3";
      row.append(text);
      if (hotel.floors.length > 1 && role !== "receptionist") {
        const button = document.createElement("button");
        button.textContent = "Move " + (floor ? "↓" : "↑");
        button.disabled =
          !staffCount(g.state, role) ||
          staffCount(hotel.floors[1 - floor].state, role) >= 3;
        button.onclick = () => {
          if (transferStaff(hotel, role, floor, 1 - floor)) {
            view.rebuild();
            save();
            management();
          } else
            $("#staff-feedback").textContent =
              "That worker is finishing a job. Try again once they return to the lobby.";
        };
        row.append(button);
      }
      const remove = document.createElement("button");
      remove.textContent = "Release";
      remove.disabled = !staffCount(g.state, role);
      remove.onclick = () => {
        if (releaseStaff(hotel, role, floor)) {
          view.rebuild();
          save();
          management();
        } else
          $("#staff-feedback").textContent =
            "That worker is finishing a job. Let them return to the lobby first.";
      };
      row.append(remove);
      body.append(row);
    }
    if (!floor && g.state.restaurant) {
      const row = document.createElement("div");
      row.className = "team-row";
      const title = document.createElement("span");
      title.textContent = "Restaurant servers · " + g.state.servers + " / 3";
      const release = document.createElement("button");
      release.textContent = "Release server";
      release.disabled = !g.state.servers;
      release.onclick = () => {
        g.state.servers--;
        view.rebuild();
        save();
        management();
      };
      row.append(title, release);
      body.append(row);
    }
  });
  renderJourney();
  $("#easygoing").checked = hotel.easygoing;
}
$("#manage").onclick = management;
$("#close-management").onclick = () => {
  $("#management").hidden = true;
  paused = false;
  canvas.focus();
  hud();
};
function bookSection(name) {
  document
    .querySelectorAll(".book-panel")
    .forEach((el) => (el.hidden = el.id !== "book-" + name));
  document
    .querySelectorAll("[data-book]")
    .forEach((el) =>
      el.setAttribute("aria-pressed", String(el.dataset.book === name)),
    );
}
document
  .querySelectorAll("[data-book]")
  .forEach(
    (button) => (button.onclick = () => bookSection(button.dataset.book)),
  );
$("#chapter-line").onclick = () => {
  management();
  bookSection("journey");
};
function renderJourney() {
  const list = $("#journey-cards");
  list.replaceChildren();
  if (BUILD.openingDemo) {
    $(".book-intro").textContent =
      "A little welcome, a helpful team, a few lovely rooms. Rewards arrive automatically as you grow.";
    for (const [index, step] of OPENING_STEPS.entries()) {
      const card = document.createElement("article");
      const done = step.value(hotel) >= step.goal;
      card.className = "chapter-card" + (done ? " claimed" : "");
      const number = document.createElement("span"),
        body = document.createElement("div"),
        title = document.createElement("strong"),
        detail = document.createElement("small");
      number.className = "chapter-number";
      number.textContent = done ? "✓" : String(index + 1).padStart(2, "0");
      title.textContent = step.title;
      detail.textContent =
        step.detail +
        " · " +
        Math.min(step.goal, step.value(hotel)) +
        "/" +
        step.goal;
      body.append(title, detail);
      card.append(number, body);
      list.append(card);
    }
    return;
  }
  for (const [index, c] of CHAPTERS.filter(
    (c) =>
      !BUILD.openingDemo ||
      ["welcome", "rooms", "team", "flavour"].includes(c.id),
  ).entries()) {
    const claimed = hotel.claimed.includes(c.id),
      value = Math.min(c.goal, c.value(hotel)),
      ready = value >= c.goal;
    const card = document.createElement("article");
    card.className = "chapter-card" + (claimed ? " claimed" : "");
    const number = document.createElement("span");
    number.className = "chapter-number";
    number.textContent = claimed ? "✓" : String(index + 1).padStart(2, "0");
    const body = document.createElement("div"),
      title = document.createElement("strong"),
      detail = document.createElement("small");
    title.textContent = c.title;
    detail.textContent = c.detail + " · " + value + "/" + c.goal;
    body.append(title, detail);
    const reward = document.createElement("button");
    reward.textContent = claimed
      ? "Collected"
      : ready
        ? "Claim $" + c.reward
        : "$" + c.reward;
    reward.disabled = claimed || !ready;
    reward.onclick = () => {
      if (claimChapter(hotel, c.id)) {
        playtest.record("chapter", c.id);
        save();
        sound("build");
        notify(c.title + " · $" + c.reward + " reward");
        renderJourney();
        hud();
      }
    };
    card.append(number, body, reward);
    list.append(card);
  }
}
$("#easygoing").onchange = () => {
  hotel.easygoing = $("#easygoing").checked;
  save();
};
$("#export-save").onclick = () => {
  const blob = new Blob([JSON.stringify(serializeHotel(hotel), null, 2)], {
      type: "application/json",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = "palm-house-backup.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("#backup-feedback").textContent =
    "Backup downloaded. Keep it somewhere safe.";
};
let pendingRestore = null;
$("#import-save").onclick = () => $("#save-file").click();
$("#save-file").onchange = async () => {
  pendingRestore = null;
  $("#confirm-restore").hidden = true;
  const file = $("#save-file").files[0];
  if (!file) return;
  if (file.size > 2000000) {
    $("#backup-feedback").textContent =
      "That file is too large to be a Palm House save.";
    return;
  }
  pendingRestore = parseSave(await file.text());
  if (pendingRestore && BUILD.openingDemo && !fitsOpening(pendingRestore)) {
    pendingRestore = null;
    $("#backup-feedback").textContent =
      "This hotel extends beyond the opening demo. Keep this backup for the full prototype; your current demo is unchanged.";
    return;
  }
  $("#backup-feedback").textContent = pendingRestore
    ? "Backup found: $" +
      pendingRestore.cash.toLocaleString() +
      " and " +
      pendingRestore.levels.filter(Boolean).length +
      " downstairs rooms. Restoring replaces the current hotel; a local copy will be kept."
    : "This file is not a supported Palm House backup. Your hotel has not changed.";
  $("#confirm-restore").hidden = !pendingRestore;
};
$("#confirm-restore").onclick = () => {
  if (!pendingRestore) return;
  try {
    if (!preview) saveStore.preserve(serializeHotel(hotel));
    const restored = applyOpeningPolicy(
      createHotel(pendingRestore),
      BUILD.openingDemo,
    );
    if (!preview)
      lastSavedRaw = saveStore.write(serializeHotel(restored), lastSavedRaw);
    hotel = restored;
    pendingRestore = null;
    arriveOnFloor();
    management();
    bookSection("settings");
    $("#confirm-restore").hidden = true;
    $("#backup-feedback").textContent = "Your hotel is restored.";
  } catch {
    $("#backup-feedback").textContent =
      "Could not restore safely. Please keep your backup file.";
  }
};
function openLift() {
  if (!$("#lift-dialog").hidden) return;
  paused = true;
  keys = {};
  release();
  const options = $("#lift-options");
  options.replaceChildren();
  ["Garden lobby", "Sky suites", "The Sky Club"].forEach((name, floor) => {
    if (!hotel.floors[floor]) return;
    const button = document.createElement("button");
    button.textContent =
      String(floor + 1).padStart(2, "0") +
      " · " +
      name +
      (hotel.active === floor ? " · You are here" : "");
    button.disabled = hotel.active === floor;
    button.onclick = () => {
      if (travel(hotel, floor)) {
        closeLift();
        arriveOnFloor();
      }
    };
    options.append(button);
  });
  $("#lift-dialog").hidden = false;
}
function closeLift() {
  hotel.liftChoice = false;
  hotel.liftReady = false;
  $("#lift-dialog").hidden = true;
  paused = false;
  canvas.focus();
}
$("#close-lift").onclick = closeLift;
function hud() {
  const s = game.state;
  if (s.cash !== lastCash) {
    $("#cash").textContent = s.cash.toLocaleString();
    if (s.cash > lastCash && lastCash >= 0) {
      $(".money").classList.remove("bump");
      void $(".money").offsetWidth;
      $(".money").classList.add("bump");
    }
    lastCash = s.cash;
  }
  const n = s.levels.filter(Boolean).length,
    score =
      s.levels.reduce((a, b) => a + b, 0) +
      Number(s.pool) +
      Number(s.desk) +
      Number(s.concierge) +
      Number(s.cafe) +
      Number(s.cleaner) +
      Number(s.runner),
    stars = Math.min(
      5,
      Math.max(
        1,
        Math.ceil(
          (hotel.floors.reduce(
            (sum, f) => sum + f.state.levels.reduce((a, b) => a + b, 0),
            0,
          ) +
            Number(hotel.floors[0].state.pool) +
            Number(hotel.floors[0].state.cafe) +
            Number(hotel.floors[0].state.restaurant) * 2 +
            Number(!!hotel.floors[2]) * 6) /
            6,
        ),
      ),
    );
  $("#rooms").textContent = n + " / " + roomCount(s) + " rooms";
  const dirtyCount = s.dirty.filter(Boolean).length;
  $("#housekeeping").textContent =
    (dirtyCount
      ? dirtyCount + " room" + (dirtyCount === 1 ? "" : "s") + " to clean"
      : "Rooms looking lovely") +
    " · " +
    n +
    "/" +
    roomCount(s);
  $("#staff").textContent =
    [
      ["receptionist", "Reception"],
      ["cleaner", "Cleaning"],
      ["runner", "Cash"],
    ]
      .filter(([role]) => staffCount(s, role))
      .map(([role, name]) => name + " ×" + staffCount(s, role))
      .join(" · ") || "Build your first team";
  if (hotel.active === 2) {
    $("#rooms").textContent = "Rooftop retreat";
    $("#housekeeping").textContent = game.guests.length + " guests unwinding";
    $("#staff").textContent = s.attendants
      ? "Pool hosts ×" + s.attendants
      : "Collect poolside cash or hire a host";
  }
  $("#payroll").textContent = s.wagesDue
    ? "Staff on break · $" + s.wagesDue + " wages due"
    : "Wages $" +
      wageRate(s) +
      "/min" +
      (wageRate(s) ? " · in " + Math.ceil(60 - s.payrollClock) + "s" : "");
  $("#payroll").classList.toggle("overdue", !onDuty(s));
  $("#stars").textContent = "★".repeat(stars) + "☆".repeat(5 - stars);
  $("#rank").textContent = [
    "A fresh start",
    "Finding your rhythm",
    "A seaside favourite",
    "A little luxury",
    "The perfect escape",
  ][stars - 1];
  $("#satisfaction").textContent =
    "☺ " + Math.round(hotel.reputation) + "% happy";
  $("#satisfaction").title =
    "Guest satisfaction from wait times and completed stays";
  $("#floor-name").textContent = [
    "01 · Garden lobby",
    "02 · Sky suites",
    "03 · Sky Club",
  ][hotel.active];
  $("#travel").textContent = hotel.floors[1]
    ? "Find elevator"
    : hotel.floors[0].state.expanded
      ? "Elevator · $10k"
      : "Find reception";
  const cycle = hotel.clock % 240;
  $("#rush").textContent =
    cycle >= 180 && cycle < 220
      ? "Tour group · " +
        hotel.rushHandled +
        "/5 welcomed · " +
        Math.ceil(220 - cycle) +
        "s"
      : "Tour group in " +
        Math.ceil(cycle < 180 ? 180 - cycle : 420 - cycle) +
        "s";
  $("#profit").textContent =
    "Last 60s · +$" +
    hotel.income.toLocaleString() +
    " income / −$" +
    hotel.wages.toLocaleString() +
    " wages";
  let title,
    detail,
    head = "YOUR NEXT LITTLE STEP",
    icon = "✦",
    progress = 0;
  if (game.active < 0 && hotel.active === 2) {
    title = game.piles.length
      ? "Collect your rooftop earnings"
      : "Welcome to the Sky Club";
    detail = game.piles.length
      ? "Pick up the cash by the pool, or hire a pool host."
      : "Guests visit after their stay · $" + roofValue(s) + " per visit.";
    head = "ABOVE IT ALL";
    icon = "☀";
  } else if (game.active >= 0) {
    const i = game.active,
      c = price(s, i);
    title = label(s, i) + " · $" + Math.ceil(c - s.paid[i]) + " to go";
    detail = s.cash
      ? benefit(s, i)
      : "Part-payment saved. Collect more cash to finish.";
    head = "GROW YOUR HOTEL";
    progress = (s.paid[i] / c) * 100;
    icon = "↑";
  } else if (game.purchaseLatch >= 0) {
    title = "Upgrade complete";
    detail = "Step off this square, then return if you want another.";
    head = "ALL SET";
    icon = "✓";
  } else if (s.wagesDue) {
    title = "Your team is taking a break";
    detail =
      "Earn $" +
      Math.max(0, s.wagesDue - s.cash) +
      " more to pay wages. You can check in and clean yourself.";
    head = "WAGES DUE · $" + s.wagesDue;
    icon = "$";
  } else if (game.cleanRoom >= 0) {
    title = "A little sparkle goes a long way";
    detail = "Stay still to finish cleaning this room.";
    head = "HOUSEKEEPING";
    icon = "✧";
    progress = s.cleaning[game.cleanRoom] * 100;
  } else if (s.dirty.some(Boolean) && (!s.cleaner || !onDuty(s))) {
    const i = s.dirty.findIndex(Boolean);
    title = "Freshen up room 0" + (i + 1);
    detail =
      BUILD.openingDemo && !unlocked(s, 8)
        ? "Stand in the room’s amber circle to clean. Open four rooms to hire help."
        : "Stand in the room’s amber circle, or hire a cleaner in the lobby.";
    head = "MAKE ROOM FOR THE NEXT GUEST";
    icon = "✧";
  } else if (
    s.restaurant &&
    game.player.present !== false &&
    distance(game.player, RESTAURANT_SERVICE) < 1.5
  ) {
    title = "Dinner service";
    const waiting = game.guests.filter((v) => v.phase === "restaurant").length;
    detail = waiting
      ? `${waiting} waiting for service · stay here to help · $${45 + s.kitchen * 15} per meal.`
      : `Ready for diners · $${45 + s.kitchen * 15} per meal. Servers each handle one order.`;
    head = "PALM KITCHEN";
    icon = "♧";
  } else if (s.gym && game.player.x > 14 && game.player.z < -13) {
    const exercising = game.guests.filter((v) =>
      ["gym", "toGym"].includes(v.phase),
    ).length;
    title = `${exercising} / ${s.gymUpgrade ? 6 : 3} gym spaces in use`;
    detail = `$${s.gymUpgrade ? 65 : 40} per workout · collect earnings by the entrance.`;
    head = "PALM WELLNESS";
    icon = "✦";
  } else if (s.restaurant && game.player.x > 14) {
    const diners = game.guests.filter((v) =>
      ["restaurant", "toRestaurant", "restaurantEating"].includes(v.phase),
    ).length;
    const queue = game.guests.filter((v) =>
      ["restaurantQueue", "toRestaurantQueue"].includes(v.phase),
    ).length;
    title = `${diners} / ${s.diningExpansion ? 6 : 3} tables in use${queue ? ` · ${queue} waiting` : ""}`;
    detail =
      onDuty(s) && s.servers
        ? `${s.servers} servers · $${45 + s.kitchen * 15} per meal. Help at the mint serving circle.`
        : "Stand in the mint serving circle to serve, or hire a server.";
    head = "PALM KITCHEN";
    icon = "♧";
  } else if (game.piles.length) {
    title = "A little pile of possibility";
    const nearest = [...game.piles].sort(
      (a, b) => distance(a, game.player) - distance(b, game.player),
    )[0];
    detail = s.runner
      ? "Your cash runner is collecting. You can help too."
      : s.floor
        ? "Collect the tips left by happy guests outside their rooms."
        : nearest.source === "pool"
          ? "Collect the green tips beside the bar."
          : nearest.source === "cafe"
            ? "Collect breakfast tips beside the coffee bar."
            : nearest.source === "gym"
              ? "Collect workout earnings by the gym entrance."
              : nearest.source === "restaurant"
                ? "Collect meal earnings beside Palm Kitchen."
                : nearest.z < 3
                  ? "Collect minibar earnings inside the guest rooms."
                  : "Walk over the green cash beside reception.";
    head = "COLLECT YOUR EARNINGS";
    icon = "$";
  } else if (game.service > 0) {
    title = "Making someone feel at home";
    detail = "Keep standing here to finish checking them in.";
    head = "WELCOME TO PALM HOUSE";
    progress =
      (game.service /
        ((s.desk ? 0.65 : 1.3) /
          (s.concierge && onDuty(s)
            ? workRate(s) * (1 + 0.35 * (staffCount(s, "receptionist") - 1))
            : 1))) *
      100;
    icon = "⌂";
  } else if (
    n === 6 &&
    s.training === 3 &&
    s.shoes === 3 &&
    s.levels.every((v) => v === 2) &&
    s.pool &&
    s.desk &&
    s.concierge &&
    s.cafe &&
    s.cleaner &&
    s.runner
  ) {
    title = s.elevator
      ? "Your next chapter is upstairs"
      : "Build upwards · $10,000";
    detail = "The elevator by the entrance opens four new room projects.";
    head = "THE SKY SUITES";
    icon = "★";
  } else if (s.cash >= 100) {
    const next = [...PADS]
      .sort(
        (a, b) => price(s, a.i) - s.paid[a.i] - (price(s, b.i) - s.paid[b.i]),
      )
      .find(
        (p) =>
          unlocked(s, p.i) &&
          !complete(s, p.i) &&
          s.cash >= price(s, p.i) - s.paid[p.i],
      );
    title = next ? label(s, next.i) : "Save for your next upgrade";
    detail = next
      ? benefit(s, next.i)
      : "Stand on a gold floor square to spend your cash.";
    head = "MAKE ROOM FOR MORE";
    icon = "↑";
  } else {
    const full = s.levels.every(
      (v, i) =>
        !v ||
        s.dirty[i] ||
        game.guests.some((g) => g.room === i && g.phase !== "exit"),
    );
    title = s.floor
      ? "Ready for upstairs arrivals"
      : full
        ? "A full house. A happy hotel."
        : "Welcome " + (s.welcomed ? "your next guest" : "your first guest");
    detail = s.floor
      ? "Guests check in downstairs and arrive by elevator. Keep their rooms fresh."
      : full
        ? "Guests will check out soon. Explore your next upgrade."
        : s.concierge
          ? "Your concierge is welcoming guests for you."
          : "Stand in the mint circle behind reception.";
    head = full ? "ROOMS ARE RESTING" : "MAKE YOURSELF AT HOME";
    icon = "⌂";
  }
  const chapter = nextChapter(hotel);
  const ready = CHAPTERS.some(
    (c) => !hotel.claimed.includes(c.id) && c.value(hotel) >= c.goal,
  );
  $("#manage").classList.toggle("reward-ready", ready);
  $("#chapter-line").textContent = chapter
    ? chapter.title +
      " · " +
      Math.min(chapter.goal, chapter.value(hotel)) +
      "/" +
      chapter.goal
    : "Your seaside escape";
  if (BUILD.openingDemo) {
    const step = nextOpeningStep(hotel);
    $("#chapter-line").textContent = step
      ? step.title +
        " · " +
        Math.min(step.goal, step.value(hotel)) +
        "/" +
        step.goal
      : "Your opening chapter is complete · ✦";
    if (
      game.active < 0 &&
      game.cleanRoom < 0 &&
      !s.wagesDue &&
      !game.piles.length &&
      step
    ) {
      title = step.title;
      detail = step.detail;
      head = "MAKE THIS LITTLE HOTEL YOURS";
    }
  }
  $("#hint").textContent = title;
  $("#detail").textContent = detail;
  $("#objective-label").textContent = head;
  $("#objective-icon").textContent = icon;
  $("#objective-progress").style.width = progress + "%";
}
const pointers = new Map();
let pinch = null;
function release(e) {
  if (e) pointers.delete(e.pointerId);
  else pointers.clear();
  drag = null;
  pinch = null;
}
function position(e) {
  const r = canvas.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
canvas.addEventListener("pointerdown", (e) => {
  if (paused) return;
  e.preventDefault();
  canvas.focus();
  canvas.setPointerCapture(e.pointerId);
  const pos = position(e);
  pointers.set(e.pointerId, pos);
  if (pointers.size === 2) {
    const [a, b] = [...pointers.values()];
    pinch = {
      distance: Math.hypot(a.x - b.x, a.y - b.y),
      zoom: view.zoomFactor,
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
    };
    drag = null;
    view.manual = true;
    return;
  }
  if (pointers.size > 2) return;
  const actor = view.project(game.player.x, 1, game.player.z),
    hit =
      e.pointerType === "touch" ||
      canvas.clientWidth <= 600 ||
      Math.hypot(pos.x - actor.x, pos.y - actor.y) <
        Math.max(27, Math.min(46, canvas.clientHeight / 20));
  drag = {
    id: e.pointerId,
    x: pos.x,
    y: pos.y,
    lastX: pos.x,
    lastY: pos.y,
    dx: 0,
    dz: 0,
    mode: hit ? "move" : "pan",
    started: performance.now(),
  };
  if (!hit) view.manual = true;
  else view.followPlayer();
  if (audio?.state === "suspended") audio.resume();
});
canvas.addEventListener("pointermove", (e) => {
  if (!pointers.has(e.pointerId)) return;
  const pos = position(e);
  pointers.set(e.pointerId, pos);
  if (pinch && pointers.size >= 2) {
    const [a, b] = [...pointers.values()],
      cx = (a.x + b.x) / 2,
      cy = (a.y + b.y) / 2;
    view.setZoom(
      (pinch.zoom * Math.hypot(a.x - b.x, a.y - b.y)) /
        Math.max(1, pinch.distance),
    );
    view.pan(cx - pinch.cx, cy - pinch.cy);
    pinch.cx = cx;
    pinch.cy = cy;
    return;
  }
  if (!drag || drag.id !== e.pointerId) return;
  if (drag.mode === "pan") {
    view.pan(pos.x - drag.lastX, pos.y - drag.lastY);
  } else {
    let x = pos.x - drag.x,
      z = pos.y - drag.y,
      f = Math.max(1, Math.hypot(x, z) / 42);
    drag.dx = x / f / 42;
    drag.dz = z / f / 42;
  }
  drag.lastX = pos.x;
  drag.lastY = pos.y;
});
for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
  canvas.addEventListener(name, release);
canvas.addEventListener(
  "wheel",
  (e) => {
    e.preventDefault();
    view.setZoom(view.zoomFactor * Math.exp(-e.deltaY * 0.0015));
  },
  { passive: false },
);
$("#zoom-in").onclick = () => view.setZoom(view.zoomFactor * 1.2);
$("#zoom-out").onclick = () => view.setZoom(view.zoomFactor / 1.2);
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (
    [
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "w",
      "a",
      "s",
      "d",
    ].includes(k)
  ) {
    if (paused) return;
    keys[k] = true;
    view.followPlayer();
    e.preventDefault();
  }
  if (k === "escape") {
    if (!$("#demo-dialog").hidden) {
      $("#demo-continue").click();
      return;
    }
    if (!$("#lift-dialog").hidden) {
      closeLift();
      return;
    }
    if (!$("#management").hidden) $("#close-management").click();
    else pause(!paused);
  }
});
window.addEventListener("keyup", (e) => (keys[e.key.toLowerCase()] = false));
window.addEventListener("blur", () => {
  keys = {};
  release();
  save();
});
document.addEventListener("visibilitychange", () => {
  keys = {};
  release();
  save();
});
window.addEventListener("pagehide", () => {
  save();
  playtest.flush();
});
window.addEventListener("resize", () => view?.resize());
function frame(t) {
  const dt = Math.min((t - last) / 1000, 0.04);
  last = t;
  if (!paused && !saveConflict && !document.hidden) {
    const input =
      drag?.mode === "move"
        ? { x: drag.dx, z: drag.dz }
        : {
            x:
              Number(!!(keys.d || keys.arrowright)) -
              Number(!!(keys.a || keys.arrowleft)),
            z:
              Number(!!(keys.s || keys.arrowdown)) -
              Number(!!(keys.w || keys.arrowup)),
          };
    if (Math.hypot(input.x, input.z) > 0.05) view.followPlayer();
    updateHotel(hotel, dt, input);
    playtest.tick(dt);
    if (BUILD.openingDemo) {
      for (const c of CHAPTERS.filter((c) =>
        ["welcome", "rooms", "team", "flavour"].includes(c.id),
      )) {
        if (claimChapter(hotel, c.id)) {
          playtest.record("chapter", c.id);
          notify(
            c.title + " · $" + c.reward + " for your next little improvement",
          );
          sound("build");
        }
      }
      for (const step of OPENING_STEPS)
        if (step.value(hotel) >= step.goal)
          playtest.record("step", step.id, true);
      if (openingComplete(hotel) && !hotel.openingCelebrated) {
        hotel.openingCelebrated = true;
        playtest.record("opening-complete", "opening", true);
        showDemoEnd(true);
        save();
      }
    }
    if (game !== hotel.floors[hotel.active]) arriveOnFloor();
    if (hotel.liftChoice) openLift();
    for (const e of hotel.events) if (e.type === "notice") notify(e.text);
    if (Math.hypot(input.x, input.z) > 0.05)
      playtest.record("step", "move", true);
    for (const e of game.events) {
      if (e.type === "collect") playtest.record("step", "collect", true);
      if (e.type === "demoBoundary") {
        playtest.record("boundary", "garden");
        showDemoEnd(openingComplete(hotel));
      }
      if (e.type === "wages")
        notify(
          e.resumed
            ? "Wages paid · your team is back on duty."
            : "Team wages paid · $" + e.amount,
        );
      if (e.type === "wagesDue")
        notify("Staff on break · earn $" + e.amount + " to cover wages.");
      view.event(e);
      if (
        [
          "build",
          "collect",
          "checkin",
          "spend",
          "clean",
          "runnerCollect",
        ].includes(e.type)
      )
        sound(e.type);
      if (e.type === "clean" && game.cleanRoom === e.room)
        notify("Fresh sheets. Happy guests. Room ready!");
      if (e.type === "build") {
        playtest.record("purchase", hotel.active + ":" + e.i);
        const r = roomForPad(e.i);
        notify(
          e.i >= 28
            ? "A new chapter of your retreat is ready!"
            : e.i >= 25
              ? "Lobby income upgraded · more from each guest!"
              : e.i >= 15
                ? label(game.state, e.i) + " ready!"
                : r >= 0
                  ? game.state.levels[r] === 1
                    ? "A new room is ready!"
                    : "Suite upgraded · higher room payments."
                  : e.i === 10
                    ? "Garden wing open! Two furnished rooms are ready."
                    : e.i === 11
                      ? "Training complete · your team works faster."
                      : e.i === 12
                        ? "New shoes · a little more spring in your step."
                        : [6, 8, 9].includes(e.i)
                          ? "New teammate hired · wages now $" +
                            wageRate(game.state) +
                            "/min."
                          : e.i === 4
                            ? "Bar open · guests leave $20 after a drink."
                            : e.i === 7
                              ? "Breakfast open · guests leave $15 after coffee."
                              : "Reception upgraded · faster check-in.",
        );
        save();
      }
    }
    saveTime += dt;
    if (saveTime > 2) {
      save();
      playtest.flush();
      saveTime = 0;
    }
    toastTime -= dt;
    if (toastTime <= 0) $("#toast").classList.remove("show");
    hud();
    view.render(dt);
  }
  requestAnimationFrame(frame);
}
try {
  view =
    hotel.active === 2
      ? new RooftopView(canvas, game)
      : new HotelView(canvas, game);
  hud();
  view.render(0.016);
  $("#loading").hidden = true;
  if (recoveredSave) notify("Your backup restored your hotel safely.");
  else if (!saved) notify("Welcome to Palm House · $500 to make it yours.");
  if (BUILD.openingDemo && !saved) showWelcome();
  requestAnimationFrame(frame);
} catch (error) {
  console.error(error);
  $("#loading h2").textContent = "Your hotel needs WebGL";
  $("#loading p").textContent =
    "Try opening this link in Safari or a recent browser with graphics enabled.";
}
