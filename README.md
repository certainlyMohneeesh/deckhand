# DeckHand - Smart Presentation Control 🎯

A modern web application that transforms your phone into a powerful remote control for presentations. Upload your slides (PDF/PPTX), scan a QR code, and control everything from your mobile device.

## ✅ Phase 1 & 2 Complete

### Implemented Features

#### 1. Project Foundation ✅
- ✅ Next.js 16+ with App Router and TypeScript
- ✅ Tailwind CSS for styling
- ✅ Shadcn/UI integrated with components: button, card, progress, sonner (toast)
- ✅ Dark theme enabled by default
- ✅ Responsive design with mobile-first approach

#### 2. Folder Structure ✅
```
deckhand/
├── app/              # Next.js routes
│   ├── layout.tsx    # Root layout with dark theme
│   ├── page.tsx      # Homepage with file upload
│   └── globals.css   # Global styles
├── components/       # Reusable UI components
│   ├── ui/          # Shadcn components
│   └── FileUpload.tsx
├── hooks/           # Custom React hooks
│   └── useFileUpload.ts
├── lib/             # Utilities and helpers
│   └── utils.ts
├── types/           # TypeScript definitions
│   ├── file.ts
│   └── index.ts
└── public/          # Static assets
```

#### 3. File Upload System ✅
- ✅ Accepts both .pdf and .pptx files
- ✅ Drag-and-drop zone with visual feedback
- ✅ File type validation (PDF/PPTX only)
- ✅ File size validation (max 50MB)
- ✅ Upload progress indicator
- ✅ Stores files in browser memory (not localStorage)
- ✅ Returns file metadata (name, type, size, blob URL)
- ✅ Shadcn/UI consistent styling
- ✅ Toast notifications for user feedback

### Key Components

#### `FileUpload.tsx`
Full-featured file upload component with:
- Drag-and-drop support
- Click to browse functionality
- Real-time visual feedback
- Progress tracking
- Error handling
- File removal capability

#### `useFileUpload.ts`
Custom React hook handling:
- File validation logic
- Upload simulation with progress
- Blob URL management
- Error state management
- File metadata extraction

#### `types/file.ts`
TypeScript definitions for:
- `FileMetadata`: File information structure
- `UploadProgress`: Upload progress tracking
- `AcceptedFileType`: Allowed file extensions

## 🚀 Getting Started

## 🚀 Getting Started

### Installation
```bash
bun install
```

### Development
```bash
bun run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Adding Shadcn Components
```bash
bunx --bun shadcn@latest add <component-name>
```

## 🎨 Design Features

- **Dark Theme**: Enabled by default with OKLCH color space
- **Responsive**: Mobile-first design with Tailwind breakpoints
- **Accessible**: Proper ARIA labels and keyboard navigation
- **Modern UI**: Shadcn/UI components with consistent styling

## 📦 Tech Stack

- **Framework**: Next.js 16.1.1
- **Runtime**: Bun
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **UI Components**: Shadcn/UI
- **Icons**: Lucide React

## 🔜 Next Steps (Phase 3-8)

Upcoming features according to the project roadmap:
- **Phase 3**: PDF/PPTX parsing and rendering
- **Phase 4**: Real-time sync with Socket.io
- **Phase 5**: Annotation system with Fabric.js
- **Phase 6**: Teleprompter mode
- **Phase 7**: Keyboard shortcuts and polish
- **Phase 8**: Testing and deployment

## 📄 License

This project is part of the Nesternity DeckHand initiative.
