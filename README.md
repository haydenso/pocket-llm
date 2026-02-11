# pocket llm - WebGPU LLM Inference

A Next.js application that runs large language models directly in your browser using WebGPU acceleration powered by MLC.

## Features

- **Client-side ML inference**: All models run entirely in the browser using WebGPU
- **Multiple models**: Llama 3.2, Qwen 2.5, and SmolLM2
- **Streaming responses**: Real-time token streaming with performance metrics
- **Retro UI**: Classic Windows XP/98/7 themes powered by CSS frameworks
- **No backend required**: Everything runs locally in your browser

## Requirements

- **WebGPU-compatible browser**: Chrome/Edge 113+, or other browsers with WebGPU support
- **Modern hardware**: Recommended 8GB+ RAM for model download and inference

## Installation & Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   npm run dev
   ```

3. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. **Select a model** from the tabs (Llama3.2, Qwen, SmolLM2)
2. **Download the model** by clicking "Download Model"
   - First download may take several minutes depending on connection
   - Models are cached locally using IndexedDB and Cache API
3. **Start chatting** once the model loads
4. **Switch themes** using the theme selector (XP.css, 7.css, 98.css)
5. **Clear cache** if you need to free up space or reset models

## Verification Checklist

After running `npm run dev`, verify:

- [ ] Page renders with tabs and retro Windows UI
- [ ] Theme selector persists selection across reloads
- [ ] Download Model button appears for unloaded models
- [ ] Progress bar shows during model download
- [ ] Model loads successfully and inputs become enabled
- [ ] Sending a message shows streaming response
- [ ] Tokens/sec and token count update during generation
- [ ] Tab switching works and shows correct model state
- [ ] Delete Cache clears all models and shows confirmation
- [ ] No SSR errors or browser global access in build

## Project Structure

```
pocket-llm-nextjs/
├── app/
│   ├── components/        # React components
│   │   ├── CacheControls/ # Download, cache, theme controls
│   │   ├── ChatWindow/    # Message display
│   │   ├── InputBar/      # Text input with send
│   │   ├── ModelTabs/     # Tab navigation
│   │   ├── ProgressBar/   # Download progress
│   │   └── StatsBar/      # Token stats
│   ├── hooks/
│   │   └── useMlEngine.ts # ML engine lifecycle hook
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page
├── lib/
│   ├── mlc.ts             # MLC wrapper
│   ├── models.ts          # Model configs
│   ├── indexeddb.ts       # IndexedDB helpers
│   └── cacheHelpers.ts    # Cache/SW utilities
├── types/
│   ├── mlc.d.ts           # MLC type definitions
│   └── messages.ts        # App types
└── public/
    └── windows.png        # Favicon
```

## Technical Details

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **ML Engine**: @mlc-ai/web-llm (WebGPU)
- **Styling**: CSS + retro CSS frameworks
- **State Management**: React hooks
- **Streaming**: Optimized batched updates (100ms intervals)

## Build & Deploy

```bash
# Production build
npm run build

# Start production server
npm start
```

## Notes

- Models are large (500MB-1.7GB) and download on first use
- WebGPU is required - the app will not work in unsupported browsers
- All computation happens client-side; no data is sent to servers
- Cache management is manual via the "Delete Model Cache" button

## License

ISC

