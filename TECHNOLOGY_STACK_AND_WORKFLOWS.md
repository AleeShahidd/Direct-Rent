# Direct-Rent UK - Technology Stack & Workflows Documentation

## 📋 Table of Contents

1. [Technology Stack Overview](#technology-stack-overview)
2. [Frontend Technologies](#frontend-technologies)
3. [Backend & API Technologies](#backend--api-technologies)
4. [Database & Storage](#database--storage)
5. [Authentication & Security](#authentication--security)
6. [Machine Learning & AI](#machine-learning--ai)
7. [Development Workflows](#development-workflows)
8. [Deployment & DevOps](#deployment--devops)
9. [Data Management](#data-management)
10. [Security & Fraud Detection](#security--fraud-detection)

## 🚀 Technology Stack Overview

Direct-Rent UK is a modern, full-stack rental platform built with cutting-edge technologies for scalability, security, and user experience.

### Architecture Pattern
- **Full-Stack Next.js Application** with API routes
- **Microservices Architecture** for ML services
- **Real-time Database** with Row Level Security
- **Progressive Web App** capabilities

## 🎨 Frontend Technologies

### Core Framework
- **Next.js 15.3.4** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript 5** - Type-safe development

### UI & Styling
- **Tailwind CSS 3.4.15** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
  - Dialog, Checkbox, Label, Progress, Radio Group
  - Scroll Area, Separator, Slider, Switch, Tabs, Toast
- **Headless UI** - Unstyled, accessible UI components
- **Heroicons** - Beautiful SVG icons
- **Lucide React** - Modern icon library
- **Framer Motion** - Animation library

### Form Handling & Validation
- **React Hook Form** - Performant forms with minimal re-renders
- **Zod** - TypeScript-first schema validation
- **Hookform Resolvers** - Integration between React Hook Form and Zod

### State Management & Data Fetching
- **TanStack React Query** - Server state management
- **React Context** - Local state management
- **Custom Hooks** - Reusable logic encapsulation

### Maps & Geospatial
- **Google Maps JavaScript API** - Interactive maps
- **@turf/turf** - Geospatial analysis library
- **Marker Clustering** - Efficient map markers

## ⚙️ Backend & API Technologies

### Server Framework
- **Next.js API Routes** - Serverless API endpoints
- **Node.js** - JavaScript runtime

### Data Processing
- **Axios** - HTTP client for API calls
- **PapaParse** - CSV parsing and processing
- **Compromise** - Natural language processing
- **Date-fns** - Date utility library

### Security & Cryptography
- **Crypto-js** - Cryptographic algorithms
- **UUID** - Unique identifier generation

### Image Processing
- **Image-hash** - Perceptual image hashing for duplicate detection

## 🗄️ Database & Storage

### Primary Database
- **Supabase** - Open-source Firebase alternative
- **PostgreSQL** - Advanced open-source database
- **Row Level Security (RLS)** - Data access control

### Database Schema
```sql
-- Core Tables
- users (authentication & profiles)
- properties (rental listings)
- bookings (viewing appointments)
- messages (communication)
- reviews (user feedback)
- areas (geographic data)

-- ML Integration Tables
- fraud_scores (fraud detection)
- price_predictions (ML price estimates)
- user_preferences (recommendation engine)
- ml_models (model metadata)
```

### Storage
- **Supabase Storage** - File uploads and management
- **Image optimization** - Automatic resizing and compression
- **CDN integration** - Global content delivery

## 🔐 Authentication & Security

### Authentication System
- **Supabase Auth** - Complete authentication solution
- **Email/Password** - Traditional authentication
- **Email verification** - Account confirmation
- **Password reset** - Secure recovery process
- **Role-based access** - Tenant, Landlord, Admin

### Security Features
- **Row Level Security (RLS)** - Database-level access control
- **JWT tokens** - Secure session management
- **CSRF protection** - Cross-site request forgery prevention
- **Input validation** - Zod schema validation
- **SQL injection prevention** - Parameterized queries

### User Roles & Permissions
```typescript
enum UserRole {
  TENANT = 'tenant',
  LANDLORD = 'landlord',
  ADMIN = 'admin'
}

// Permission matrix
const permissions = {
  tenant: ['view_properties', 'create_bookings', 'write_reviews'],
  landlord: ['manage_properties', 'view_bookings', 'respond_messages'],
  admin: ['all_permissions', 'user_management', 'system_config']
}
```

## 🤖 Machine Learning & AI

### ML Models
- **Fraud Detection Model** - Random Forest classifier
- **Price Prediction Model** - Regression analysis
- **Recommendation Engine** - Matrix factorization

### ML Technologies
- **TensorFlow.js** - Browser-based ML
- **ML Libraries**:
  - `ml-random-forest` - Random Forest implementation
  - `ml-matrix` - Matrix operations
  - `ml-distance` - Distance calculations
  - `matrix-factorization` - Recommendation algorithms
- **Natural** - Natural language processing

### ML API Endpoints
```typescript
// Fraud Detection
POST /api/ml/detectFraud
POST /api/ml/fraud-check

// Price Prediction
POST /api/ml/predictPrice
POST /api/ml/price-estimate

// Recommendations
POST /api/ml/getRecommendations
POST /api/ml/recommendations

// Health Check
GET /api/ml/health
```

### Training Scripts
```bash
npm run train:price      # Train price prediction model
npm run train:fraud      # Train fraud detection model
npm run train:recommendation  # Train recommendation engine
npm run train:all        # Train all models
```

## 📊 Data Management

### Datasets
- **UK Housing Rentals** - Primary dataset (8.6MB CSV)
- **Property attributes** - Location, size, amenities
- **User behavior data** - Search patterns, preferences
- **Market data** - Historical prices, trends

### Data Processing Pipeline
1. **Data Import** - CSV processing with PapaParse
2. **Data Cleaning** - Validation and normalization
3. **Feature Engineering** - ML-ready features
4. **Model Training** - Automated training scripts
5. **Model Evaluation** - Performance metrics
6. **Model Deployment** - API integration

### Data Import Scripts
```bash
npm run import-data      # Import CSV data
npm run db:seed         # Seed database
npm run check-env       # Environment validation
npm run inspect-schema  # Schema inspection
```

## 🔒 Security & Fraud Detection

### Fraud Detection System
- **Multi-factor Analysis**:
  - User behavior patterns
  - Property listing anomalies
  - Payment irregularities
  - Geographic inconsistencies

### Fraud Detection Features
- **Perceptual Image Hashing** - Duplicate image detection
- **Behavioral Analysis** - User interaction patterns
- **Geographic Validation** - Location verification
- **Document Verification** - ID and proof validation

### Security Measures
- **Input Sanitization** - XSS prevention
- **Rate Limiting** - API abuse prevention
- **Audit Logging** - Security event tracking
- **Encryption** - Data at rest and in transit

## 🛠️ Development Workflows

### Development Environment
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Code quality
npm run lint
npm run type-check
```

### Testing Strategy
- **Unit Tests** - Component and function testing
- **Integration Tests** - API endpoint testing
- **E2E Tests** - User workflow testing
- **Performance Tests** - Load and stress testing

### Code Quality
- **ESLint** - Code linting and formatting
- **TypeScript** - Static type checking
- **Prettier** - Code formatting
- **Git Hooks** - Pre-commit validation

## 🚀 Deployment & DevOps

### Containerization
- **Docker** - Application containerization
- **Docker Compose** - Multi-service orchestration
- **Nginx** - Reverse proxy and load balancer

### Deployment Options
1. **Vercel** - Frontend deployment
2. **Railway/Render** - ML API services
3. **Docker** - Self-hosted deployment
4. **Supabase** - Managed database

### Environment Configuration
```bash
# Required Environment Variables
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_ML_API_URL=
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

### CI/CD Pipeline
- **GitHub Actions** - Automated testing and deployment
- **Vercel Integration** - Automatic deployments
- **Database Migrations** - Schema versioning

## 📱 User Experience Features

### Responsive Design
- **Mobile-first approach** - Progressive enhancement
- **Tailwind breakpoints** - Responsive utilities
- **Touch-friendly interfaces** - Mobile optimization

### Performance Optimization
- **Next.js Image optimization** - Automatic image optimization
- **Code splitting** - Lazy loading of components
- **Caching strategies** - React Query caching
- **CDN integration** - Global content delivery

### Accessibility
- **WCAG 2.1 compliance** - Accessibility standards
- **Keyboard navigation** - Full keyboard support
- **Screen reader support** - ARIA labels and roles
- **Color contrast** - Visual accessibility

## 🔮 Future Enhancements

### Planned Features
- **Real-time messaging** - WebSocket integration
- **Video calling** - Virtual property viewings
- **Advanced analytics** - Property performance metrics
- **Mobile app** - React Native application
- **AI chatbot** - Customer support automation

### Technology Upgrades
- **Next.js 16** - Latest framework features
- **React 20** - Concurrent features
- **Edge Runtime** - Serverless edge functions
- **GraphQL** - Flexible data querying

## 📚 Additional Resources

### Documentation Files
- `README.md` - Project overview and setup
- `DATABASE.md` - Database schema and policies
- `PROJECT_STATUS.md` - Development progress
- `TESTING.md` - Testing strategies
- `GOOGLE_MAPS.md` - Maps integration guide

### Scripts Directory
- `scripts/` - Database and ML automation
- `ml/` - Machine learning models
- `dataset/` - Training data and datasets

### Configuration Files
- `next.config.js` - Next.js configuration
- `tailwind.config.js` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `docker-compose.yml` - Docker orchestration

---

*This documentation is maintained as part of the Direct-Rent UK project. For questions or contributions, please refer to the project repository.*
