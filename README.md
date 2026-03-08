# PDF Viewer 📄✨

A modern, fast, and local-first PDF Viewer and Manager built with React, Vite, and IndexedDB.

## Features 🚀

- **Local Storage:** Keep your files private! All PDFs and collections are stored securely in your browser's IndexedDB using `idb`. No server required.
- **Collections & Organization:** Group your PDFs into collections for easy access.
- **Drag and Drop:** Intuitively reorder and organize your PDFs utilizing `react-dnd`.
- **Advanced PDF Operations:** Harness the power of `pdf-lib` and `pdfjs-dist` to parse and render PDFs smoothly.
- **State Management:** Blazing fast dynamic state management powered by `zustand`.

## Tech Stack 💻

- **Framework:** React 19 + DOM
- **Build Tool:** Vite
- **Storage:** IndexedDB (`idb`)
- **PDF Libraries:** Mozilla's `pdfjs-dist` and `pdf-lib`
- **Drag & Drop:** `react-dnd`
- **State Management:** `Zustand`

## Getting Started 🛠️

Follow these steps to run the project locally.

### Prerequisites

Ensure you have Node.js (v18+ recommended) and `npm` installed.

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/MonsterCrak/pdfviewer.git
   ```
2. Navigate into the project directory:
   ```bash
   cd pdfviewer
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts 📜

- `npm run dev`: Starts the development server.
- `npm run build`: Bundles the app for production.
- `npm run lint`: Runs ESLint to evaluate the code quality.
- `npm run preview`: Bootstraps a local server to preview the production build.

## Contributing 🤝

Contributions, issues, and feature requests are welcome!

## License 📝

This project is licensed under the MIT License.
