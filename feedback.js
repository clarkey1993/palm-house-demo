export const FEEDBACK_ENDPOINT =
  "https://palm-house-feedback.serialcoder93.chatgpt.site/api/feedback";
export function feedbackPayload(message, version, id) {
  const text = message.trim();
  if (!text) throw new Error("Write a message first.");
  if (text.length > 1000)
    throw new Error("Please keep your message under 1,000 characters.");
  return { message: text, version, id };
}
export async function sendFeedback(payload, fetcher = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetcher(FEEDBACK_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
    const data = await response.json();
    if (!response.ok || !data.ok || data.id !== payload.id)
      throw new Error(
        data.error ||
          "Could not confirm your message was saved. Please try again.",
      );
    return data;
  } finally {
    clearTimeout(timeout);
  }
}
export function mountFeedback(panel, version) {
  if (!panel) return;
  const section = document.createElement("section");
  section.className = "feedback-section";
  section.innerHTML = `<h3>Send us feedback</h3><p>Found a bug, got stuck or have an idea? Tell us below.</p><form><label for="player-feedback-message">Your message</label><textarea id="player-feedback-message" maxlength="1000" required placeholder="What happened, or what would you like improved?" aria-describedby="feedback-help"></textarea><p id="feedback-help">No account needed. Your message and game version are saved privately for the developer. Please leave out personal information.</p><button type="submit">Send feedback</button><p role="status" aria-live="polite"></p></form>`;
  panel.prepend(section);
  const form = section.querySelector("form"),
    input = section.querySelector("textarea"),
    button = section.querySelector("button"),
    status = section.querySelector('[role="status"]');
  let pending = null,
    busy = false;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy) return;
    let payload;
    try {
      payload = feedbackPayload(
        input.value,
        version,
        pending?.message === input.value.trim()
          ? pending.id
          : crypto.randomUUID(),
      );
    } catch (error) {
      status.textContent = error.message;
      input.focus();
      return;
    }
    pending = payload;
    busy = true;
    button.disabled = true;
    input.readOnly = true;
    button.textContent = "Sending…";
    status.textContent = "Saving your message…";
    try {
      await sendFeedback(payload);
      input.value = "";
      pending = null;
      status.textContent = "Thank you! Your feedback has been saved.";
    } catch (error) {
      status.textContent =
        error.name === "AbortError"
          ? "The connection timed out. Your message is still here—please try again."
          : error.message === "Failed to fetch"
            ? "Could not connect. Your message is still here—check your connection and try again."
            : error.message;
    } finally {
      busy = false;
      button.disabled = false;
      input.readOnly = false;
      button.textContent = "Send feedback";
    }
  });
}
