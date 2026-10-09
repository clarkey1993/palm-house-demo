export function feedbackURL(message, version) {
  const text = message.trim();
  if (!text) throw new Error("Write a message first.");
  if (text.length > 1000)
    throw new Error("Please keep your message under 1,000 characters.");
  const url = new URL(
    "https://github.com/clarkey1993/palm-house-demo/issues/new",
  );
  url.searchParams.set(
    "title",
    "Player feedback: " + text.split(/\r?\n/)[0].slice(0, 65),
  );
  url.searchParams.set(
    "body",
    `## Player feedback\n\n${text}\n\n---\nGame version: ${version}`,
  );
  return url.href;
}
export function mountFeedback(panel, version) {
  if (!panel) return;
  const section = document.createElement("section");
  section.className = "feedback-section";
  section.innerHTML = `<h3>Send us feedback</h3><p>Found a bug, got stuck or have an idea? Tell us below.</p><form><label for="player-feedback-message">Your message</label><textarea id="player-feedback-message" maxlength="1000" required placeholder="What happened, or what would you like improved?" aria-describedby="feedback-help"></textarea><p id="feedback-help">Opens GitHub for you to review and submit. A GitHub account is required. Feedback will be public, so leave out personal information. Only your message and game version are included.</p><button type="submit">Send feedback</button><p role="status" aria-live="polite"></p></form>`;
  panel.prepend(section);
  const form = section.querySelector("form"),
    input = section.querySelector("textarea"),
    status = section.querySelector('[role="status"]');
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    let url;
    try {
      url = feedbackURL(input.value, version);
    } catch (error) {
      status.textContent = error.message;
      input.focus();
      return;
    }
    // This is a navigation, not a confirmed submission. Preserve the draft.
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Continue to GitHub";
    status.replaceChildren(
      document.createTextNode(
        "Finish by selecting Submit new issue on GitHub. If it didn't open, ",
      ),
      link,
      document.createTextNode(
        ". Your message stays here until you leave the game.",
      ),
    );
    link.click();
  });
}
