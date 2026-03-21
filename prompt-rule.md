You are a principal software architect, senior backend engineer, and senior frontend engineer.

Design a production-ready web platform for a multi-supplier digital goods / game top-up business.

Business goal:
Users can register, top up wallet, purchase digital products, and the system will automatically compare prices from multiple suppliers, choose the cheapest available supplier, then process the order asynchronously.

Architecture constraints:
- Frontend: React
- UI Library: MUI
- Theme: red, modern, premium, admin-friendly
- Database: PostgreSQL
- Cache / fast lookup / session / queue support: Redis
- Event-driven integration: Kafka
- Admin must be inside the web app, not a separate system
- Access control must be role-based
- System must support future microservice decomposition

Core modules:
- Authentication
- User profile
- Wallet
- Product catalog
- Supplier integration
- Price comparison engine
- Order processing
- Payment integration
- Payment webhook
- Admin panel
- Master data management
- API key management
- Request/response mapping
- Analytics dashboard
- Audit logging

Admin features:
- Role-based menu
- Master data menu
- Supplier menu
- API key menu
- Response mapping menu
- Product menu
- Promotion menu
- Order menu
- Payment menu
- Analytics menu
- Audit log menu
- System monitor menu

Please provide:
1. System architecture
2. Main modules and responsibilities
3. Database schema proposal
4. Redis usage plan
5. Kafka event/topic design
6. Queue/job processing flow
7. Role-permission model
8. Admin menu structure
9. Customer menu structure
10. API design suggestions
11. UI page structure in React + MUI
12. Example component tree
13. Example PostgreSQL entities
14. Example status flow for order/payment
15. Strategy for supplier request/response mapping
16. Security recommendations
17. Scalability recommendations
18. Sample React admin layout with sidebar and role-based menu
19. Sample MUI red theme tokens
20. Suggested project folder structure

Generate the answer in a way that a real development team can use as a blueprint.