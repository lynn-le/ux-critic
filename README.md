# UX Critic

An AI-powered UX analysis tool that accepts app screenshots and returns structured design feedback — organized by usability heuristics, accessibility, and visual design severity.

Built with the [Anthropic Claude API](https://docs.anthropic.com/en/api/getting-started) and plain HTML/CSS/JS (no build step required).

![UX Critic screenshot](https://placeholder.com/screenshot)

---

## Features

- **Four audit modes** — Full audit, Accessibility (WCAG 2.1), Usability (Nielsen's heuristics), Visual design
- **Structured output** — Findings categorized by severity: `critical`, `major`, `minor`, `positive`
- **Analysis history** — All past audits saved to localStorage; view full reports on demand
- **Side-by-side comparison** — Compare any two past analyses with a severity breakdown delta chart
- **No build tooling** — Pure HTML, CSS, and vanilla JS; open `index.html` and go

---

## Getting started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ux-critic.git
cd ux-critic
```

### 2. Open in a browser

Because the app makes direct API requests from the browser, you need to serve it over HTTP (not `file://`). Use any static file server:

```bash
# Python
python3 -m http.server 8080

# Node.js (npx)
npx serve .

# VS Code
# Install the "Live Server" extension and click "Go Live"
```

Then open `http://localhost:8080` in your browser.

### 3. Add your Anthropic API key

Enter your `sk-ant-...` key in the API Key field on the Analyze tab. It is stored in `localStorage` only and never sent anywhere except the Anthropic API.

You can get a key at [console.anthropic.com](https://console.anthropic.com).

---

## Project structure

```
ux-critic/
├── index.html          # App shell and view templates
├── css/
│   └── style.css       # All styles (dark theme, layout, components)
└── js/
    ├── prompts.js      # Prompt templates for each audit mode
    ├── storage.js      # localStorage history management
    ├── results.js      # Renders structured API output into HTML
    ├── compare.js      # Side-by-side comparison rendering
    └── app.js          # Main controller — wires everything together
```

---

## How it works

1. User uploads a screenshot (drag-and-drop or file picker)
2. User selects an audit mode
3. On "Analyze", the image is base64-encoded and sent to `claude-sonnet-4-20250514` with a structured prompt
4. The model returns a JSON object with sections, findings, severities, and an overall score
5. The UI renders findings in collapsible sections, color-coded by severity
6. Results can be saved to history and compared side by side

### Prompt design

Each audit mode uses a carefully structured prompt that:
- Defines the evaluator persona (UX researcher, a11y specialist, etc.)
- Specifies the exact JSON schema to return
- Defines severity levels with clear criteria
- References the relevant framework (WCAG 2.1, Nielsen's heuristics)

See [`js/prompts.js`](js/prompts.js) for all prompt templates.

---

## Customization

### Adding a new audit mode

1. Add a prompt template to `js/prompts.js` under a new key
2. Add a mode card to `index.html` with `data-mode="your-mode"`
3. That's it — the rest is handled automatically

### Changing the model

Update the `model` field in `js/app.js` inside `runAnalysis()`:

```js
model: 'claude-opus-4-5',  // swap to any supported model
```

### Persisting history to a backend

`js/storage.js` is a drop-in module. Replace `localStorage` calls with your own API calls to add a real database.

---

## Limitations

- API key is stored in `localStorage` — do not deploy this publicly without a backend proxy
- History is browser-local — clearing localStorage or switching browsers loses it
- Image size: very large screenshots (>5MB) may hit API limits; resize before upload if needed

---

## License

MIT
