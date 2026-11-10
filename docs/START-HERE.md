# Start Canopy

1. Install Node.js 22 or newer from https://nodejs.org/ if it is not already installed.
2. Extract the ZIP. Open a terminal inside the `canopy` folder (the one containing `server.mjs`).
3. Run `node server.mjs`.
4. Open http://127.0.0.1:4435 in Chrome.
5. Press Ctrl+C in the terminal to stop.

No `npm install` is needed to use the app. The bundled scenarios are synthetic. Nothing connects to a wearable or uploads your sensor data. Changes are not autosaved: use **Save capsule** to keep an experiment. That file includes the recording you opened and your analysis settings.

Try **Shared environmental event**, remove a witness, then try **All sensors drift together**. The second case shows why agreement cannot prove the cause. Use the **Field guide** for the method and limitations.

This is a research prototype, not a health assessment or safety alert system. See the README for the CLI/API, data format, and validation plan.
