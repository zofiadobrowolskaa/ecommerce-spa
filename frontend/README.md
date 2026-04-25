# AURA Jewellery - E-Commerce SPA

A modern, feature-rich Single Page Application for a luxury jewellery e-commerce platform. Built with React and Vite, featuring a complete customer storefront and admin management panel.

## Features

### Customer Features

- **Product Catalog**
  - Browse 18+ premium jewellery products across 4 categories (Rings, Necklaces, Earrings, Bracelets)
  - Advanced filtering by category, price range, rating, and search keywords
  - Product variants with color and size options
  - Detailed product pages
  - Related product recommendations
  - URL-synced filters and pagination for shareable links

- **Shopping Experience**
  - Intuitive shopping cart with variant and size tracking
  - Cart persistence using LocalStorage
  - Promo code system (use `AURA20` for 20% discount)
  - Real-time price calculations

- **Checkout Process**
  - Multi-step checkout wizard (4 steps)
  - Personal details collection with validation
  - Shipping method selection (Standard $5 / Express $15)
  - Payment information capture
  - Order summary and confirmation
  - Order history in user profile

- **User Authentication**
  - Registration and login system
  - User profile management
  - Order history tracking
  - Protected routes for authenticated users

### Admin Features

- **Analytics Dashboard**
  - Key metrics overview (total orders, revenue, active products)
  - Sales by category visualization (bar chart)
  - Revenue over time tracking
  - Order management with date range filtering
  - Order deletion capabilities

- **Product Management**
  - Full CRUD operations for products
  - Variant management (colors, sizes, images, price adjustments)
  - Complex product form with comprehensive validation
  - Pagination (10 products per page)
  - Factory reset to restore default data

- **Development Tools**
  - Role switcher for testing different user perspectives

## Tech Stack

### Frontend
- **React 18.3.1** - UI library
- **React Router DOM 7.1.1** - Client-side routing
- **Vite 6.0.5** - Build tool and development server
- **SASS** - CSS preprocessing

### Form Management & Validation
- **Formik 2.4.9** - Form state management
- **Yup 1.7.1** - Schema-based validation
- **React Hook Form 7.54.2** - Alternative form handling

### UI & Visualization
- **React Hot Toast 2.6.0** - Toast notifications
- **Lucide React 0.469.0** - Icon library
- **Recharts 3.7.0** - Data visualization for admin dashboard

### State Management
- **React Context API** - Global application state
- **LocalStorage** - Data persistence

## Project Structure

```
spa/
├── public/
│   └── img/                    # Product images and assets
├── src/
│   ├── auth/                   # Authentication service
│   ├── components/             # Reusable UI components
│   │   ├── admin/              # Admin-specific components
│   │   ├── checkout/           # Multi-step checkout components
│   │   └── layout/             # Layout wrappers
│   ├── context/                # Global state management (AppContext)
│   ├── data/                   # Static data (products.json)
│   ├── hooks/                  # Custom React hooks
│   │   ├── useLocalStorage.js
│   │   ├── usePagination.js
│   │   └── useProductFiltering.js
│   ├── pages/                  # Page-level components
│   ├── styles/                 # SCSS stylesheets
│   │   ├── components/         # Component-specific styles
│   │   └── pages/              # Page-specific styles
│   ├── utils/                  # Utility functions
│   ├── App.jsx                 # Root component
│   └── main.jsx                # Application entry point
├── index.html                  # HTML template
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite configuration
└── eslint.config.js            # ESLint configuration
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ecommerce-spa
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality checks

## Usage

### Customer Access

1. **Browse Products**: Navigate to `/products` to view the catalog
2. **Filter Products**: Use the sidebar to filter by category, price, rating
3. **View Details**: Click on any product to see detailed information
4. **Add to Cart**: Select variant, size (if applicable), and add to cart
5. **Checkout**: Complete the 4-step checkout process
6. **Create Account**: Register to track orders and save profile information
7. **Use Promo Code**: Enter `AURA20` at checkout for 20% discount

### Admin Access

**Admin Features:**
1. Navigate to `/admin/dashboard` for analytics overview
2. Go to `/admin/products` for product management
3. Create, edit, or delete products
4. View and manage orders
5. Use factory reset to restore default product data

### Development

**Role Switching:**
- Use the RoleSwitcher component (visible in development) to toggle between client and admin roles
- Role persists in LocalStorage

## Routing

### Client Routes
- `/` - Home page with hero section and categories
- `/products` - Product list with filtering
- `/products/:id/:variantId` - Product details
- `/cart` - Shopping cart
- `/checkout` - Multi-step checkout
- `/order-confirmation/:id` - Order success page
- `/account` - Login/Register/Profile

### Admin Routes
- `/admin` - Redirects to dashboard
- `/admin/dashboard` - Analytics dashboard
- `/admin/products` - Product management interface

## Data Models

### Product Structure
```javascript
{
  id: "p001",
  name: "Ocean Ring",
  category: "Rings",
  subCategory: "Ocean Collection",
  description: "...",
  price: 189.99,
  rating: 4.6,
  tags: ["ocean", "ring"],
  aboutMaterials: { ... },
  variants: [
    {
      id: "v001a",
      color: "Diamond",
      size: ["6", "7"],
      priceAdjustment: 0,
      imageUrl: "/img/..."
    }
  ]
}
```

### Order Structure
```javascript
{
  id: "ORD-1707276543210",
  date: "2025-02-07T...",
  items: [...],
  total: 189.99,
  status: "Completed",
  details: {
    name: "...",
    email: "...",
    address: "...",
    shippingMethod: "standard",
    paymentMethod: "card"
  }
}
```

## Custom Hooks

- **useLocalStorage** - Persistent state management with LocalStorage
- **usePagination** - URL-synced pagination logic
- **useProductFiltering** - URL-synced product filtering
- **useAppContext** - Access to global application state

## Architecture Patterns

- **Single Page Application (SPA)** - Client-side routing without page reloads
- **Component-Based Architecture** - Modular, reusable components
- **Context + Hooks Pattern** - Centralized state management
- **Layout Pattern** - Dual layouts (ClientLayout/AdminLayout) based on user role
- **Multi-Step Form Pattern** - Progressive data collection in checkout
- **URL State Management** - Filters and pagination synced with URL for shareable states

## Security Notes

**IMPORTANT:** This is a demonstration project with client-side mock authentication. The current implementation is **NOT suitable for production** use.

**Current Limitations:**
- Authentication is entirely client-side using LocalStorage
- Passwords are hashed with SHA256 (client-side only)
- Mock JWT tokens are generated without server validation
- No backend API for data persistence
- No secure payment processing

**For Production Deployment:**
- Implement proper backend API with secure authentication
- Use server-side session management or JWT with refresh tokens
- Integrate secure payment gateway (Stripe, PayPal, etc.)
- Add HTTPS and security headers
- Implement proper database with encrypted sensitive data
- Add rate limiting and CSRF protection
- Use environment variables for sensitive configuration

## Browser Compatibility

- Modern browsers with ES2020 support
- LocalStorage API required
- Tested on Chrome, Firefox, Safari, Edge

## Deployment

This is a static SPA that can be deployed to any static hosting service:

1. Build the production bundle:
```bash
npm run build
```

2. Deploy the `dist/` folder to:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3 + CloudFront
   - Any static web server

**Note:** Ensure your hosting service is configured to redirect all routes to `index.html` for proper client-side routing.

## Future Enhancements

- Backend API integration
- Real authentication and authorization
- Payment gateway integration
- Email notifications for orders
- Wishlist functionality
- Product reviews and ratings system
- Multi-currency support
- Inventory management
- Advanced search with autocomplete
- Mobile app (React Native)

## Credits & Disclaimer

This project is created strictly for **educational purposes** to demonstrate technical skills in React and SPA development. It is **not** intended for commercial use.

The visual identity, product imagery, and descriptions are sourced from and inspired by **[Steff Eleoff](https://steffeleoff.com)**. I do not claim ownership of these assets; all intellectual property rights belong to their respective owners.
