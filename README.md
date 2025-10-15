# 🎨 Image Editor Pro - Next.js 15 with Advanced Sharing

A comprehensive, production-ready image editing application built with Next.js 15, featuring advanced image processing capabilities and a sophisticated sharing system with security, analytics, and privacy controls.

## ✨ Key Features

### 🖼️ Advanced Image Editor
- **Professional Tools**: Brightness, contrast, saturation, hue, temperature, tint controls
- **Advanced Filters**: Low-pass/high-pass filters, emboss, edge detection, vintage, B&W, invert
- **Interactive Tools**: Crop, text overlay, drawing brushes, shape tools (rectangle, circle, line, triangle)
- **Real-time Preview**: Live brightness histogram and instant effect preview
- **Layer Support**: Multi-layer composition with opacity and blend modes
- **Transform Tools**: Rotate, flip, resize with aspect ratio preservation

### 🔒 Secure Sharing System
- **Multiple Share Modes**: Public, unlisted, and private sharing options
- **Advanced Security**: Password protection, encrypted tokens, access restrictions
- **Download Controls**: Allow/prevent downloads with permission management
- **Expiration Settings**: Auto-expire shares with customizable time limits
- **View Limits**: Restrict maximum number of views per share
- **Rate Limiting**: Protection against abuse (5 creates/min, 100 views/min, 10 downloads/min)

### 📊 Analytics & Monitoring
- **Access Statistics**: Track views, downloads, and geographic data
- **Source Analytics**: Monitor referral sources and user engagement
- **Real-time Tracking**: Live visitor analytics and behavior insights
- **Security Monitoring**: Bot detection and suspicious activity alerts

### 🌐 Social Integration
- **QR Code Generation**: Instant QR codes for mobile sharing
- **Social Media Sharing**: Optimized sharing for Facebook, Twitter, LinkedIn
- **Direct Link Sharing**: Clean, shareable URLs with custom tokens
- **Embed Support**: HTML embed codes for websites and blogs

## 🛠 Technology Stack

### Core Framework
- **Next.js 15** with App Router for optimal performance
- **TypeScript 5** for type safety and better DX
- **React 19** with modern hooks and concurrent features

### Frontend Technologies
- **Tailwind CSS 4** for utility-first styling
- **shadcn/ui** component library (New York style)
- **Lucide React** for beautiful, consistent icons
- **Framer Motion** for smooth animations
- **Zustand** for efficient state management

### Image Processing
- **Canvas API** for native browser image manipulation
- **Custom ImageProcessor** with advanced algorithms
- **Real-time Filters** with instant preview
- **WebGL-ready** architecture for future GPU acceleration

### Backend & Security
- **Next.js API Routes** for serverless backend
- **Prisma ORM** with SQLite for data persistence
- **Crypto-JS** for encryption and security
- **Rate Limiting** and bot protection
- **AI Integration** with z-ai-web-dev-sdk

## 🚀 Quick Start

### Prerequisites
- Node.js 18 or higher
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd image-editor-pro

# Install dependencies
npm install

# Set up the database
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## 📖 Usage Guide

### Basic Image Editing

1. **Upload Image**: 
   - Click "Upload Image" button
   - Or drag and drop an image file
   - Supports JPEG, PNG, WebP formats (max 10MB)

2. **Apply Adjustments**:
   - Use the adjustment panel on the right
   - Adjust brightness, contrast, saturation, etc.
   - See real-time preview with histogram

3. **Use Tools**:
   - Select tools from the left toolbar
   - Crop, add text, draw shapes, or paint
   - All changes are non-destructive

4. **Export**:
   - Click "Export" to save your edited image
   - Choose format and quality settings
   - Download to your device

### Advanced Features

#### Filters & Effects
- **Basic**: Brightness, contrast, saturation, hue, temperature, tint
- **Advanced**: Blur, sharpen, low-pass, high-pass, emboss, edge detection
- **Artistic**: Vintage, black & white, invert, sepia

#### Drawing Tools
- **Brush**: Adjustable size and color with smooth strokes
- **Shapes**: Rectangle, circle, line, triangle with fill/stroke options
- **Text**: Multiple fonts, sizes, and colors with positioning
- **Eraser**: Precise erasing with size control

#### Transform Tools
- **Crop**: Preset ratios (1:1, 4:3, 16:9, freeform)
- **Rotate**: 360-degree rotation with angle input
- **Flip**: Horizontal and vertical flipping
- **Resize**: Maintain aspect ratio or custom dimensions

### Sharing Your Work

1. **Create Share**:
   - Click "Share" after editing your image
   - Choose share mode (public/unlisted/private)
   - Set permissions and restrictions

2. **Configure Options**:
   - Add password protection (optional)
   - Set view limits and expiration
   - Enable/disable downloads

3. **Share & Track**:
   - Copy the share link or QR code
   - Share on social media
   - Monitor access analytics

## 🏗 Project Architecture

```
src/
├── app/
│   ├── page.tsx                    # Main editor interface
│   ├── layout.tsx                  # Root layout with providers
│   └── api/
│       ├── shares/
│       │   ├── create/route.ts     # Create new share
│       │   ├── [token]/route.ts    # Access shared image
│       │   ├── [token]/track/route.ts # Analytics tracking
│       │   └── delete/[shareId]/route.ts # Delete share
│       └── images/generate/route.ts # AI image generation
├── components/
│   ├── ui/                         # shadcn/ui components
│   ├── image-editor/
│   │   ├── editor.tsx              # Main editor component
│   │   ├── toolbar.tsx             # Tool selection
│   │   ├── adjustment-panel.tsx    # Image adjustments
│   │   └── canvas.tsx              # Canvas rendering
│   ├── sharing/
│   │   ├── share-dialog.tsx        # Share creation dialog
│   │   ├── share-analytics.tsx     # Analytics dashboard
│   │   └── qr-code.tsx             # QR code generation
│   └── upload/
│       └── drag-drop-upload.tsx    # File upload component
├── lib/
│   ├── image-processor.ts          # Core image processing
│   ├── sharing-service.ts          # Sharing logic
│   ├── analytics-service.ts        # Analytics tracking
│   ├── security.ts                 # Security utilities
│   ├── db.ts                       # Database client
│   └── utils.ts                    # Helper functions
└── hooks/
    ├── use-image-editor.ts         # Editor state management
    ├── use-sharing.ts              # Sharing functionality
    └── use-analytics.ts            # Analytics data
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```env
# Database
DATABASE_URL="file:./dev.db"

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# AI Integration (optional)
ZAI_API_KEY="your-ai-api-key"

# Security
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
```

### Customization

#### Adding New Filters
```typescript
// src/lib/image-processor.ts
class ImageProcessor {
  applyCustomFilter(imageData: ImageData): ImageData {
    // Your custom filter logic
    return processedData;
  }
}
```

#### Custom Share Modes
```typescript
// src/lib/sharing-service.ts
export enum ShareMode {
  PUBLIC = 'public',
  UNLISTED = 'unlisted',
  PRIVATE = 'private',
  CUSTOM = 'custom' // Your custom mode
}
```

## 🔒 Security Features

### Access Control
- **Token-based Authentication**: Secure, unique tokens for each share
- **Password Protection**: Optional password for sensitive content
- **IP Tracking**: Monitor access patterns and detect abuse
- **Rate Limiting**: Prevent API abuse and spam

### Bot Detection
- **User Agent Analysis**: Detect and block suspicious bots
- **Behavior Pattern Recognition**: Identify automated access
- **CAPTCHA Integration**: Human verification for suspicious activity

### Data Protection
- **Encryption**: Sensitive data encrypted at rest
- **Secure Headers**: CSRF protection and secure cookies
- **Input Validation**: Comprehensive file and input validation
- **Privacy Controls**: GDPR-compliant data handling

## 📊 Analytics Dashboard

### Metrics Tracked
- **Views**: Total and unique views per share
- **Downloads**: Download count and user analysis
- **Geography**: Country and city-level location data
- **Referrers**: Traffic sources and campaign tracking
- **Devices**: Browser and device statistics
- **Time Analytics**: Peak access times and engagement patterns

### Real-time Features
- **Live Visitor Count**: Currently active viewers
- **Real-time Updates**: Instant notifications for new activity
- **Security Alerts**: Immediate warnings for suspicious access

## 🌐 API Endpoints

### Sharing API
```typescript
POST /api/shares/create          # Create new share
GET  /api/shares/[token]         # Access shared content
POST /api/shares/[token]/track   # Track analytics
DELETE /api/shares/delete/[id]   # Delete share
```

### Image Processing API
```typescript
POST /api/images/generate        # AI image generation
POST /api/images/process         # Server-side processing
GET  /api/images/presets         # Filter presets
```

## 🎨 Image Processing Capabilities

### Basic Operations
- **Color Adjustments**: RGB, HSL, HSV color space manipulation
- **Contrast Enhancement**: Adaptive histogram equalization
- **Noise Reduction**: Gaussian and median filtering
- **Sharpness Control**: Unsharp mask and laplacian sharpening

### Advanced Filters
- **Frequency Domain**: FFT-based filtering and analysis
- **Morphological Operations**: Erosion, dilation, opening, closing
- **Edge Detection**: Sobel, Canny, and custom convolution kernels
- **Artistic Effects**: Vintage, film grain, color grading

### Performance Optimizations
- **WebGL Acceleration**: GPU-accelerated processing (when available)
- **Web Workers**: Non-blocking image processing
- **Memory Management**: Efficient handling of large images
- **Progressive Loading**: Load previews before full resolution

## 📱 Browser Compatibility

### Supported Browsers
- **Chrome** 90+ (recommended)
- **Firefox** 88+
- **Safari** 14+
- **Edge** 90+

### Required Features
- Canvas API with 2D context
- File API for uploads
- Web Workers for processing
- ES2020 JavaScript features
- CSS Grid and Flexbox

## 🚀 Performance

### Optimization Features
- **Lazy Loading**: Components and images load as needed
- **Code Splitting**: Automatic bundle optimization
- **Caching Strategy**: Intelligent caching for shares and images
- **Compression**: Automatic image and asset compression

### Performance Metrics
- **First Contentful Paint**: < 1.5 seconds
- **Largest Contentful Paint**: < 2.5 seconds
- **Time to Interactive**: < 3 seconds
- **Share Creation**: < 3 seconds
- **Share Access**: < 1 second

## 🤝 Contributing

### Development Setup
```bash
# Fork and clone
git clone <your-fork>
cd image-editor-pro

# Install dependencies
npm install

# Start development
npm run dev

# Run tests
npm run test

# Lint code
npm run lint
```

### Contribution Guidelines
1. **Code Style**: Follow TypeScript and ESLint rules
2. **Components**: Use shadcn/ui patterns and conventions
3. **Testing**: Write tests for new features
4. **Documentation**: Update README and code comments
5. **Accessibility**: Ensure WCAG 2.1 AA compliance

### Feature Development
- **New Filters**: Add to `ImageProcessor` class
- **UI Components**: Extend shadcn/ui components
- **API Endpoints**: Follow Next.js API patterns
- **Database Changes**: Update Prisma schema and migrate

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Next.js Team** for the excellent framework
- **shadcn/ui** for beautiful components
- **Tailwind CSS** for utility-first styling
- **Lucide** for the icon set
- **Vercel** for hosting platform
- **Open Source Community** for inspiration and tools

## 📞 Support & Community

### Getting Help
- **Documentation**: Check this README and inline comments
- **Issues**: Report bugs on GitHub Issues
- **Features**: Request features via GitHub Discussions
- **Security**: Report security issues privately

### Community
- **GitHub Discussions**: Feature requests and general discussion
- **Twitter**: Follow for updates and tips
- **Discord**: Join our community server (coming soon)

---

**Image Editor Pro** - Professional image editing with secure sharing capabilities 🎨🔒

Built with ❤️ using Next.js 15, TypeScript, and modern web technologies.