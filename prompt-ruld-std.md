Act as a senior full-stack solution architect and senior React developer.

Build a modern web application for a digital product / game top-up platform with multi-supplier integration.

Tech stack:
- Frontend: React + MUI
- Theme: modern professional red theme
- Backend-ready architecture
- Database: PostgreSQL
- Cache / session / temporary state: Redis
- Event streaming / async processing: Kafka
- API architecture should be scalable and modular
- Admin panel must be inside the same web application
- Use role-based access control (RBAC)

Main requirements:

1. Public / customer side
- User registration and login
- User profile
- Wallet top-up and wallet balance
- Product listing
- Product detail
- Purchase / top-up flow
- Order history
- Payment history

2. Admin side (web-based admin panel)
- Login with role-based permissions
- Dynamic menu visibility based on role
- Dashboard for revenue, profit, orders, queue status, supplier status
- User management
- Product management
- Pricing management
- Promotion management
- Supplier management
- Master data management
- API key management
- Request / response mapping management
- Payment transaction management
- Order management
- Retry failed jobs
- Audit log
- Analytics and reporting

3. Multi-supplier integration design
- Fetch product prices from multiple suppliers
- Compare prices
- Select the cheapest supplier automatically
- Submit the order to the selected supplier
- Support custom request mapping and response mapping per supplier
- Support status mapping and error code mapping
- Allow admin to configure endpoint, headers, credentials, API key, priority, timeout, retry policy

4. Payment integration
- PromptPay QR
- Slip verification
- Omise
- Webhook handling
- Duplicate payment protection
- Payment reconciliation design

5. Queue and async processing
- Do not call supplier API directly from frontend request lifecycle
- Create job and send it to queue
- Worker processes the job asynchronously
- Support retry, dead letter queue, job status tracking
- Use Redis and Kafka appropriately in the architecture

6. Security and system design
- JWT authentication
- RBAC authorization
- Audit log for admin actions
- Encrypt sensitive data such as API keys
- Input validation
- Rate limiting
- Secure webhook verification

7. UI/UX requirements
- Use MUI with clean red theme
- Responsive layout
- Separate customer layout and admin layout
- Professional dashboard cards, tables, filters, dialogs, forms
- Sidebar menu for admin
- Top navigation for customer
- Show role-aware menu items
- Good loading / empty / error states

8. Deliverables
Please generate:
- Recommended system architecture
- Folder structure for frontend
- Database schema design for PostgreSQL
- Suggested Kafka topics and Redis usage
- Role and permission design
- Page list for customer side and admin side
- Reusable React component structure
- Example MUI theme config in red
- Example sidebar menu by role
- Example pages for:
  - Admin dashboard
  - Supplier management
  - API key management
  - Response mapping management
  - Product management
  - Order management
- Example PostgreSQL table list
- Best practice notes for scalability and maintainability

Please make the output production-oriented, modular, and easy for a development team to continue implementation.