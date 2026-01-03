# DeckHand - Smart Presentation Control 🎯

A modern web application that transforms your phone into a powerful remote control for presentations. Upload your slides (PDF/PPTX), scan a QR code, and control everything from your mobile device.

## ✅ Phase 1 & Phase 2 Complete

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
│   ├── page.tsx      # Homepage with unified player
│   └── globals.css   # Global styles
├── components/       # Reusable UI components
│   ├── ui/          # Shadcn components
│   ├── FileUpload.tsx
│   ├── PDFViewer.tsx
│   ├── PPTXViewer.tsx
│   └── UnifiedPlayer.tsx
├── hooks/           # Custom React hooks
│   ├── useFileUpload.ts
│   ├── usePDFParser.ts
│   └── usePPTXParser.ts
├── lib/             # Utilities and helpers
│   └── utils.ts
├── types/           # TypeScript definitions
│   ├── file.ts
│   ├── document.ts
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

#### 4. PDF Handler ✅
- ✅ Loads PDF from File/Blob using pdfjs-dist
- ✅ Extracts total page count
- ✅ Renders each page to canvas at high resolution (2x scale)
- ✅ Extracts text content from each page for search
- ✅ Attempts to extract comments/annotations metadata
- ✅ Returns array of: { pageNumber, canvas, textContent, notes }
- ✅ Error handling for corrupted PDFs
- ✅ React component with loading states

#### 5. PPTX Handler ✅
- ✅ Unzips .pptx file client-side using jszip
- ✅ Parses ppt/slides/*.xml for slide content
- ✅ Parses ppt/notesSlides/notesSlide*.xml for speaker notes
- ✅ Converts each slide to HTML with proper styling
- ✅ Maintains original fonts, colors, and layouts
- ✅ Returns array of: { slideNumber, htmlContent, speakerNotes }
- ✅ Handles embedded images and shapes
- ✅ Created as reusable React hook: usePPTXParser()

#### 6. Unified Player Component ✅
- ✅ Accepts file prop (PDF or PPTX)
- ✅ Auto-detects file type from extension/MIME
- ✅ Uses PDF handler for .pdf files
- ✅ Uses PPTX handler for .pptx files
- ✅ Displays slides/pages in full-screen container
- ✅ Shows current slide/page number and total count
- ✅ Keyboard navigation (arrow keys, space)
- ✅ Previous and Next buttons
- ✅ Maintains current slide state
- ✅ Real-time progress indicators

### Key Components & Hooks

#### Phase 1-2 Components

**`FileUpload.tsx`** - Full-featured file upload component with:
- Drag-and-drop support
- Click to browse functionality
- Real-time visual feedback
- Progress tracking
- Error handling
- File removal capability

**`usePDFParser.ts`** - PDF parsing hook:
- Loads PDF using pdfjs-dist
- High-resolution canvas rendering (2x scale)
- Text content extraction for search
- Annotation/comment extraction
- Loading states and error handling

**`usePPTXParser.ts`** - PPTX parsing hook:
- Unzips PPTX using jszip
- XML parsing with xml2js
- Slide content extraction
- Speaker notes extraction
- Progress tracking

**`PDFViewer.tsx`** - PDF display component:
- Canvas-based rendering
- Keyboard navigation
- Page number display
- Text content preview
- Notes display

**`PPTXViewer.tsx`** - PPTX display component:
- HTML content rendering
- Speaker notes display
- Keyboard navigation
- Slide number indicator

**`UnifiedPlayer.tsx`** - Auto-detecting player:
- Automatic file type detection
- Appropriate viewer selection
- Unified loading states
- Error handling
- Progress indicators

#### TypeScript Types

**`types/file.ts`**:
- `FileMetadata`: File information structure
- `UploadProgress`: Upload progress tracking
- `AcceptedFileType`: Allowed file extensions

**`types/document.ts`**:
- `PDFDocument`: Parsed PDF structure
- `PPTXDocument`: Parsed PPTX structure
- `PDFPage` / `PPTXSlide`: Individual page/slide data
- `DocumentParserError`: Error handling types

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
- **PDF Parsing**: pdfjs-dist 5.4.530
- **PPTX Parsing**: jszip 3.10.1, xml2js 0.6.2

## 🎯 Features in Action

### Upload & Parse Workflow
1. User uploads PDF or PPTX file via drag-and-drop or file picker
2. File is validated (type, size)
3. Appropriate parser is selected automatically
4. Document is parsed with real-time progress updates
5. Viewer displays the document with navigation controls
6. Text content and notes are extracted and displayed

### Keyboard Shortcuts
- **→ / Space**: Next slide/page
- **←**: Previous slide/page
- **F**: Fullscreen (coming soon)

## 🔜 Next Steps (Phase 3-8)

Upcoming features according to the project roadmap:
- **Phase 3**: ✅ COMPLETE - PDF/PPTX parsing and rendering
- **Phase 4**: Real-time sync with Socket.io and QR code rooms
- **Phase 5**: Annotation system with Fabric.js
- **Phase 6**: Teleprompter mode with auto-scroll
- **Phase 7**: Advanced keyboard shortcuts and polish
- **Phase 8**: Testing and production deployment

## 📄 License

This project is part of the Nesternity DeckHand initiative.
