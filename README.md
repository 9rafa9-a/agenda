# Medical Residency Digital Notebook

A modern, responsive Digital Notebook for medical residency, featuring a "Clean Girl" aesthetic and a structured 9-topic disease template.

## Features
- **9-Grid Disease Template**: Standardized layout for Definição, Epidemio, Quadro Clínico, etc.
- **Dashboard**: Grid view of all your study summaries.
- **Mobile Responsive**: Works on Desktop ("Binder" view) and Mobile (Drawer menu).
- **Clean Girl UI**: Pastel colors, rounded corners, Inter & Caveat fonts.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the development server**:
    ```bash
    npm run dev
    ```

3.  **Open in browser**:
    Usually `http://localhost:5173`.

## Configuration (Firebase)

To enable data persistence:

1.  Go to `src/lib/firebase.js`.
2.  Replace the `firebaseConfig` object with your actual Firebase project keys.
3.  Ensure your Firestore rules allow read/write for now (test mode) or authenticated users.

## Deployment (Render)

1.  Push this repository to GitHub/GitLab.
2.  Create a **Static Site** on Render.
3.  Connect your repo.
4.  **Build Command**: `npm run build`
5.  **Publish Directory**: `dist`
