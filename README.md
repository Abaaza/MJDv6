# BOQ Pricer Pro

A comprehensive Construction Bill of Quantities (BOQ) pricing and quotation management system built with Next.js, MongoDB, and AI-powered price matching.

## 🚀 Features

### 📊 **Dashboard & Analytics**

- **Real-time Dashboard** - Live project statistics, revenue tracking, and system health
- **Advanced Analytics** - Project performance metrics, client insights, and pricing trends
- **Performance Monitoring** - System health monitoring with alerts and notifications
- **Custom Reports** - Generate detailed reports with date ranges and filters

### 💰 **Price Management**

- **Comprehensive Price List** - Manage 10,000+ construction items with categories
- **Multi-Currency Support** - 11 currencies (USD, EUR, GBP, CAD, AUD, JPY, CHF, CNY, INR, AED, SAR)
- **Bulk Import/Export** - CSV import/export with advanced mapping
- **Price History Tracking** - Track price changes over time
- **Advanced Search** - Full-text search with filters and sorting
- **Pagination** - View 20/50/100 items per page

### 🤖 **AI-Powered Price Matching**

- **Intelligent Matching** - AI-powered BOQ item matching using Cohere and OpenAI
- **Real-time Processing** - Server-Sent Events (SSE) for live progress updates
- **Batch Processing** - Handle large BOQ files efficiently
- **Manual Override** - Manual search and selection for unmatched items
- **Confidence Scoring** - AI confidence levels for each match
- **Export Results** - Download matched results as Excel files

### 👥 **Client Management**

- **Client Database** - Complete client information management
- **Project Association** - Link clients to multiple projects
- **Communication Log** - Track client interactions and history
- **Import/Export** - Bulk client data management
- **Advanced Search** - Find clients quickly with filters

### 📋 **Project Management**

- **Project Tracking** - Manage construction projects from start to finish
- **Document Management** - Upload and organize project documents
- **Quotation Generation** - Generate professional quotations
- **Project Templates** - Reusable project templates
- **Status Tracking** - Track project progress and milestones
- **Timeline Management** - Project scheduling and deadlines

### 🔐 **User Management & Security**

- **JWT Authentication** - Secure user authentication system
- **Role-Based Access** - Admin and user role management
- **User Verification** - Admin approval system for new users
- **Session Management** - Secure session handling
- **Password Security** - Encrypted password storage

### ⚙️ **System Administration**

- **Admin Dashboard** - Comprehensive system administration
- **User Management** - Approve, verify, and manage users
- **System Settings** - Configure application-wide settings
- **API Key Management** - Manage AI service API keys
- **Database Management** - MongoDB connection and statistics
- **Notification System** - Email, push, and webhook notifications

### 📱 **User Experience**

- **Responsive Design** - Works on desktop, tablet, and mobile
- **Dark/Light Mode** - Theme switching with system preference
- **Progressive Web App** - Install as mobile app
- **Real-time Updates** - Live data updates without refresh
- **Advanced UI Components** - Modern interface with shadcn/ui
- **Keyboard Shortcuts** - Efficient navigation and actions

### 🔧 **Technical Features**

- **Next.js 14** - Latest App Router with server components
- **MongoDB Integration** - Scalable NoSQL database
- **TypeScript** - Full type safety throughout
- **Server Actions** - Modern form handling
- **API Routes** - RESTful API endpoints
- **File Upload** - Secure file handling for BOQ and documents
- **Excel Processing** - Advanced Excel file parsing and generation
- **Real-time Streaming** - SSE for live updates

## 🛠️ Technology Stack

### **Frontend**

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Modern UI component library
- **Lucide React** - Beautiful icons
- **Recharts** - Data visualization and charts

### **Backend**

- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database with Mongoose ODM
- **JWT** - JSON Web Token authentication
- **Server-Sent Events** - Real-time data streaming
- **File Processing** - Excel and CSV handling

### **AI & Integrations**

- **Cohere API** - Advanced text understanding and matching
- **OpenAI API** - GPT-powered intelligent matching
- **Hybrid Matching** - Combined AI and rule-based matching
- **Batch Processing** - Efficient large-file handling

## 🚀 Getting Started

### **Prerequisites**

- Node.js 18+
- MongoDB Atlas account or local MongoDB
- npm/yarn/bun package manager

### **Installation**

1. **Clone the repository**
   \`\`\`bash
   git clone <your-repo-url>
   cd boq-pricer-pro
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   npm install

   # or

   yarn install

   # or

   bun install
   \`\`\`

3. **Environment Setup**
   Create `.env.local` file:
   \`\`\`env

   # MongoDB

   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   MONGODB_DB=construction_crm

   # Authentication

   JWT_SECRET=your-super-secret-jwt-key
   JWT_EXPIRES_IN=7d

   # App URLs

   NEXT_PUBLIC_APP_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:3000/api

   # AI APIs (Optional - can be set in Admin Settings)

   COHERE_API_KEY=your-cohere-api-key
   OPENAI_API_KEY=your-openai-api-key
   \`\`\`

4. **Run the development server**
   \`\`\`bash
   npm run dev

   # or

   yarn dev

   # or

   bun dev
   \`\`\`

5. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api
   - Database Test: http://localhost:3000/api/test-db

## 📖 Usage Guide

### **First Time Setup**

1. **Register an Account**

   - Go to `/register` and create your account
   - Wait for admin approval (or approve yourself via admin panel)

2. **Configure System Settings**

   - Go to `/admin/settings`
   - Set your company information and currency
   - Add your AI API keys (Cohere/OpenAI)

3. **Import Price List**

   - Go to `/price-list`
   - Click "Import" and upload your CSV price list
   - Map columns and import your data

4. **Add Clients**
   - Go to `/clients`
   - Add your client information
   - Import bulk clients via CSV if needed

### **Price Matching Workflow**

1. **Upload BOQ File**

   - Go to `/price-matcher`
   - Upload your Excel BOQ file
   - Select matching preferences

2. **AI Processing**

   - Watch real-time matching progress
   - Review AI confidence scores
   - Manually adjust unmatched items

3. **Export Results**
   - Download matched results as Excel
   - Generate quotations for clients
   - Save to project for future reference

### **Project Management**

1. **Create Projects**

   - Go to `/projects`
   - Create new project with client association
   - Upload project documents

2. **Generate Quotations**
   - Link matched BOQ to project
   - Generate professional quotations
   - Send to clients directly

## 🔧 API Documentation

### **Authentication**

\`\`\`bash
POST /api/auth/login # User login
POST /api/auth/register # User registration
GET /api/auth/me # Get current user
POST /api/auth/logout # User logout
\`\`\`

### **Price Management**

\`\`\`bash
GET /api/price-items # Get price items (paginated)
POST /api/price-items # Create price item
GET /api/price-items/[id] # Get specific price item
PUT /api/price-items/[id] # Update price item
DELETE /api/price-items/[id] # Delete price item
GET /api/price-items/export # Export price list as CSV
POST /api/price-items/import # Import price list from CSV
\`\`\`

### **Client Management**

\`\`\`bash
GET /api/clients # Get all clients
POST /api/clients # Create client
GET /api/clients/[id] # Get specific client
PUT /api/clients/[id] # Update client
DELETE /api/clients/[id] # Delete client
\`\`\`

### **Project Management**

\`\`\`bash
GET /api/projects # Get all projects
POST /api/projects # Create project
GET /api/projects/[id] # Get specific project
PUT /api/projects/[id] # Update project
DELETE /api/projects/[id] # Delete project
\`\`\`

### **AI Price Matching**

\`\`\`bash
POST /api/projects/[id]/match # Start price matching job
GET /api/projects/[id]/match/events # SSE stream for progress
GET /api/projects/[id]/match/status # Get job status
\`\`\`

### **Admin APIs**

\`\`\`bash
GET /api/admin/users # Get all users
POST /api/admin/users/[id]/verify # Verify user
GET /api/admin/settings # Get system settings
POST /api/admin/settings # Update system settings
GET /api/dashboard/stats # Get dashboard statistics
\`\`\`

## 🚀 Deployment

### **Vercel (Recommended)**

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### **Environment Variables for Production**

\`\`\`env
MONGODB_URI=your-production-mongodb-uri
JWT_SECRET=your-production-jwt-secret
COHERE_API_KEY=your-cohere-api-key
OPENAI_API_KEY=your-openai-api-key
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_API_URL=https://your-domain.com/api
\`\`\`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Create GitHub issues for bugs and feature requests
- **API Testing**: Use `/api/test-db` to verify database connectivity

## 🔮 Roadmap

- [ ] Advanced reporting with custom charts
- [ ] Mobile app with React Native
- [ ] Integration with accounting software
- [ ] Advanced AI matching with custom models
- [ ] Multi-language support
- [ ] Advanced project collaboration features
- [ ] Integration with construction management tools

---

**BOQ Pricer Pro** - Streamlining construction pricing with AI-powered intelligence.
