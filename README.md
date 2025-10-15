# Mini Adobe - Advanced Image Editor

A powerful, feature-rich image editing application built with Next.js 15, TypeScript, and Tailwind CSS. Inspired by Adobe Photoshop, this web-based editor provides professional-grade image manipulation capabilities right in your browser.

## 🚀 Features

### Core Image Editing
- **Upload & Import**: Drag-and-drop or click-to-upload image files
- **Canvas Management**: Dynamic canvas sizing with preset dimensions
- **Layer System**: Full layer support with visibility, opacity, and blend modes
- **History Management**: Complete undo/redo functionality with edit history tracking

### Drawing & Painting Tools
- **Brush Tool**: Adjustable brush size and color with smooth strokes
- **Eraser Tool**: Precise erasing with size control
- **Shape Tools**: Rectangle, circle, triangle, and line drawing
- **Text Tool**: Advanced text editing with multiple fonts, sizes, and styling options
- **Selection Tool**: Area selection for targeted edits

### Image Adjustments
- **Basic Adjustments**: Brightness, contrast, saturation, hue control
- **Color Filters**: Grayscale, sepia, invert, and color transformations
- **Blur & Sharpen**: Gaussian blur and sharpening effects
- **Advanced Filters**: Edge detection, morphological operations

### Transform Tools
- **Rotate**: 360-degree image rotation with precise angle control
- **Flip**: Horizontal and vertical image flipping
- **Crop**: Advanced cropping with aspect ratio presets (3:4, 16:9, 1:1, etc.)
- **Resize**: Image resizing with maintained aspect ratio

### Professional Features
- **Frequency Domain Processing**: FFT-based filters and frequency analysis
- **Morphological Operations**: Erosion, dilation, opening, closing
- **Enhancement Filters**: Histogram equalization, noise reduction
- **Segmentation Tools**: Basic image segmentation capabilities

### User Experience
- **Keyboard Shortcuts**: Productivity shortcuts (Ctrl+Z, Ctrl+S, B, E, C, S)
- **Real-time Preview**: Live preview of all adjustments
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Built-in theme support
- **Toast Notifications**: User-friendly feedback system

## 🛠 Technology Stack

### Core Framework
- **Next.js 15** with App Router
- **TypeScript 5** for type safety
- **React 19** with modern hooks

### Styling & UI
- **Tailwind CSS 4** for utility-first styling
- **shadcn/ui** component library (New York style)
- **Lucide React** for beautiful icons
- **Framer Motion** for smooth animations

### Image Processing
- **Canvas API** for native image manipulation
- **Custom ImageProcessor** class with advanced algorithms
- **WebGL-ready architecture** for future GPU acceleration

### State Management
- **Zustand** for client-side state management
- **React Query** for server state
- **Local Storage** for project persistence

### Development Tools
- **ESLint** for code quality
- **Prisma ORM** with SQLite database
- **Socket.io** for real-time features
- **AI Integration** with z-ai-web-dev-sdk

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Setup
```bash
# Clone the repository
git clone <repository-url>
cd mini-adobe

# Install dependencies
npm install

# Set up the database
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎯 Usage

### Getting Started
1. **Upload an Image**: Click "Upload" or drag-and-drop an image file
2. **Select Tools**: Choose from the toolbar on the left
3. **Apply Adjustments**: Use the adjustment panels on the right
4. **Export**: Save your work using the "Export" button

### Keyboard Shortcuts
- `Ctrl+Z` - Undo
- `Ctrl+S` - Export Image
- `B` - Brush Tool
- `E` - Eraser Tool
- `C` - Crop Tool
- `S` - Shape Tool

### Layer Management
- Create multiple layers for complex compositions
- Adjust layer opacity and blend modes
- Toggle layer visibility
- Lock layers to prevent accidental edits

### Advanced Features
- **Frequency Domain Filters**: Access via the "Frequency" tab for advanced signal processing
- **Morphological Operations**: Use for noise reduction and shape analysis
- **AI Enhancement**: Integrated AI tools for intelligent image processing

## 🏗 Project Structure

```
src/
├── app/
│   ├── page.tsx              # Main editor interface
│   ├── upload/page.tsx       # Image upload page
│   ├── layout.tsx            # Root layout
│   └── api/                  # API routes
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── drag-drop-upload.tsx  # File upload component
│   ├── crop-controls.tsx     # Cropping interface
│   └── save-dialog.tsx       # Save/export dialog
├── lib/
│   ├── image-processor.ts    # Core image processing engine
│   ├── db.ts                 # Database client
│   ├── utils.ts              # Utility functions
│   └── socket.ts             # WebSocket handling
└── hooks/
    ├── use-toast.ts          # Toast notifications
    └── use-mobile.ts         # Mobile detection
```

## 🔧 Configuration

### Environment Variables
Create a `.env.local` file for environment-specific settings:

```env
# Database
DATABASE_URL="file:./dev.db"

# AI Integration (optional)
ZAI_API_KEY="your-api-key"

# Custom Settings
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### Customization
- **Themes**: Modify `tailwind.config.ts` for custom themes
- **Filters**: Add new filters to `src/lib/image-processor.ts`
- **Components**: Extend UI components in `src/components/ui/`

## 🚀 Development

### Available Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
npm run db:push  # Push database schema
```

### Adding New Features
1. **New Filters**: Add to `ImageProcessor` class
2. **UI Components**: Use shadcn/ui patterns
3. **Tools**: Implement in main editor component
4. **API Endpoints**: Add to `src/app/api/`

### Code Style
- Follow TypeScript strict mode
- Use ESLint configuration
- Maintain component composition patterns
- Write self-documenting code

## 🎨 Image Processing Capabilities

### Basic Operations
- Color space conversions
- Pixel-level manipulation
- Convolution operations
- Geometric transformations

### Advanced Algorithms
- **Fast Fourier Transform**: Frequency domain analysis
- **Morphological Operations**: Mathematical morphology
- **Edge Detection**: Sobel, Canny, and custom kernels
- **Histogram Processing**: Equalization and matching

### Performance Optimizations
- Efficient memory management
- Optimized convolution algorithms
- Lazy loading for large images
- Web Workers ready architecture

## 🔌 API Integration

### AI-Powered Features
```typescript
import ZAI from 'z-ai-web-dev-sdk'

// Example AI enhancement
const zai = await ZAI.create()
const result = await zai.chat.completions.create({
  messages: [{ role: 'user', content: 'Enhance this image' }]
})
```

### WebSocket Support
Real-time collaboration features using Socket.io:
```typescript
// Real-time layer updates
socket.emit('layer:update', { layerId, data })
socket.on('layer:updated', handleLayerUpdate)
```

## 📱 Browser Support

- **Chrome** 90+
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Required Features
- Canvas API support
- ES2020 JavaScript features
- CSS Grid and Flexbox
- File API for uploads

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Write tests for new features
- Follow existing code patterns
- Update documentation
- Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Adobe Photoshop** - Inspiration for features and UI
- **shadcn/ui** - Beautiful component library
- **Next.js Team** - Excellent framework
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide** - Beautiful icon set

## 📞 Support

For support, feature requests, or bug reports:
- Create an issue on GitHub
- Check the documentation
- Join our community discussions

---

**Mini Adobe** - Professional image editing in your browser 🎨✨