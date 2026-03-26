# eskiz

A whiteboard app built with **Skia CanvasKit**.

**Try it now:** [eskiz.io](https://eskiz.io)

---

## What is eskiz?

eskiz is a whiteboard app that runs in your browser. You can draw shapes, write text, sketch with a pen, add sticky notes, drop images, connect things with lines. Basically, everything you'd expect from a modern whiteboard tool.

It started as a backend project (yes, really) and slowly evolved into a whiteboard application. The whole story is a journey of curiosity, and I'm honestly pretty happy with how it turned out. If you want to learn more about the story, I wrote a blog post about it: [read the story](https://umitde.com/blog/i-built-a-whiteboard-accidentally)

## Features

- **Shapes** - Rectangle, Ellipse, Triangle, Sticky Notes
- **Freehand Drawing** - Natural pen tool thanks to [perfect-freehand](https://github.com/steveruizok/perfect-freehand)
- **Rich Text** - Full rich text editing with [Quill](https://quilljs.com/), including text inside shapes
- **Lines & Connectors** - Attachable lines with head/tail binding to shapes
- **Images** - Upload and place images on the canvas
- **Real-time Collaboration** - See other people's cursors, edits, and changes live via WebSocket - Not in standalone mode
- **Selection & Manipulation** - Select, move, resize, rotate, lock, duplicate, and delete widgets
- **Sub-toolbar** - Context-aware toolbar for modifying colors, borders, text styles, etc.
- **Undo / Redo** - Full history support
- **Standalone Mode** - No backend needed! Uses browser's IndexedDB for local storage

## Getting Started

If you want to try the app you can visit [eskiz.io](https://eskiz.io).

If you want to run this project locally, you can use the following commands:

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [pnpm](https://pnpm.io/)

### Installation

```bash
# Clone the repo
git clone https://github.com/umtdemr/eskiz.git
cd eskiz

# Create .env file
cp .env.example .env

# Install dependencies
pnpm install

# Start the dev server
pnpm dev
```

The app will be available at `http://localhost:5173`.

## License

This project is currently under **All rights reserved**. This may change in the future as I haven't decided on a permanent license yet.
