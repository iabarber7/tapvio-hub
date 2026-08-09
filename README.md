# Tap & Connect

---

                                                                                                                                                                                                                                                 

  Build a full-stack SaaS platform called TAPVIO using React, Tailwind CSS and Supabase.

                                                                                                                                                                                                                                                 

  TAPVIO connects physical businesses with customers through NFC and QR technology.

  Tagline: "Conecta. Fideliza. Crece."                                                                                                                                                                                                           

                                                                                                                                                                                                                                                 

  ---

                                                                                                                                                                                                                                                 

  DESIGN                                  

  - Modern, premium, tech startup look

  - Colors: dark navy (#0F1C3F), blue (#2563EB), turquoise (#06B6D4), white, soft greys                                                                                                                                                          

  - Mobile-first (most users arrive via NFC tap on phone)                                                                                                                                                                                        

  - Clean, minimal, professional — similar to Notion or Linear style                                                                                                                                                                             

  - Font: Inter                                                                                                                                                                                                                                  

                                                                                                                                                                                                                                                 

  ---                                     



  DATABASE (create all tables in Supabase)                                                                                                                                                                                                       

   

  categories: id, name, slug, icon, color                                                                                                                                                                                                        

  users: id (auth), name, username, avatar_url, role (user/business/admin)

  businesses: id, owner_id, name, slug, category_id, description, address, city, lat, lng, phone, website, google_review_url, instagram, facebook, logo_url, cover_url, status (active/suspended/pending), avg_rating, total_reviews             

  business_hours: id, business_id, day_of_week (0-6), open_time, close_time, is_closed                                                                                                                                                           

  business_photos: id, business_id, url, order                                                                                                                                                                                                   

  devices: id, code (unique, e.g. TAP-0001), business_id, label, type (table/wall/sticker), status (active/inactive/unassigned), total_scans                                                                                                     

  interactions: id, device_id, business_id, source (nfc/qr/direct), action (scan/view/review_started/review_completed/google_click), created_at                                                                                                  

  reviews: id, business_id, device_id, user_id (nullable), author_name, rating (1-5), comment, status (published/reported/removed)                                                                                                               

  review_photos: id, review_id, url                                                                                                                                                                                                              

  favorites: id, user_id, business_id                                                                                                                                                                                                            

  subscriptions: id, business_id, plan (starter/business/multi), status (trial/active/past_due/suspended/cancelled), trial_ends_at                                                                                                               

  promotions: id, business_id, title, description, starts_at, ends_at, active                                                                                                                                                                    

                                                                                                                                                                                                                                                 

  Add a trigger that auto-updates avg_rating and total_reviews in businesses when a review is inserted or deleted.                                                                                                                               

                                                                                                                                                                                                                                                 

  ---                                                                                                                                                                                                                                            

                                          

  SEED DATA (insert on startup)

  - 9 categories: Restaurantes 🍽️ , Cafeterías ☕, Peluquerías ✂️ , Belleza 💅, Hoteles 🏨, Gimnasios 💪, Tiendas 🛍️ , Servicios 🔧, Ocio 🎮

  - 6 demo businesses in Las Palmas de Gran Canaria (restaurants, cafes, hotels, gym, spa) with realistic data, avg_rating between 4.3-4.9, status active                                                                                        

  - 10 demo devices (TAP-0001 to TAP-0010) assigned to demo businesses                                                                                                                                                                           

  - 15 demo reviews with realistic Spanish comments and ratings 4-5 stars                                                                                                                                                                        

  - 6 demo subscriptions (mix of trial and active)                                                                                                                                                                                               

                                                                                                                                                                                                                                                 

  ---                                                                                                                                                                                                                                            

                                          

  PAGES TO BUILD (MVP)                                                                                                                                                                                                                           

   

  1. PUBLIC HOMEPAGE (/)                                                                                                                                                                                                                         

  - Header: logo TAPVIO + nav links (Explorar, Soy un negocio, Login)

  - Hero: "Descubre. Valora. Conecta." + subtitle + search bar + location selector                                                                                                                                                               

  - Category grid (9 categories with icons)                                                                                                                                                                                                      

  - Section: Negocios destacados (cards grid)                                                                                                                                                                                                    

  - Section: Los mejor valorados                                                                                                                                                                                                                 

  - Section: Descubre TAPVIO (how it works: NFC tap → rate → discover)

  - Footer                                                                                                                                                                                                                                       

  - Mobile: bottom nav bar (🏠 Inicio, 🔎 Explorar, ⭐ Valorar, ❤️  Favoritos, 👤 Perfil)

                                                                                                                                                                                                                                                 

  2. EXPLORE PAGE (/explorar)             

  - Search bar + filters: category, city, rating, sort (popular/new/rating)                                                                                                                                                                      

  - Business cards grid showing: cover photo, logo, name, category, city, avg_rating (stars), total_reviews, open/closed status

  - Responsive grid                                                                                                                                                                                                                              

   

  3. BUSINESS PUBLIC PROFILE (/negocio/:slug)                                                                                                                                                                                                    

  - Cover photo + logo                    

  - Name, category badge, rating stars, total reviews count                                                                                                                                                                                      

  - Description, address, phone, website, social links

  - Opening hours (open/closed indicator)                                                                                                                                                                                                        

  - Photo gallery

  - All published reviews with stars, comment, date, author                                                                                                                                                                                      

  - Active promotions                                                                                                                                                                                                                            

  - Button: "Valorar este negocio" (opens review modal)

  - Button after review: "¿Compartir también en Google?" → opens google_review_url                                                                                                                                                               

  - Button: "Guardar en favoritos" (if logged in)                                                                                                                                                                                                

                                                                                                                                                                                                                                                 

  4. NFC/QR LANDING (/t/:deviceCode)                                                                                                                                                                                                             

  - Load device → find business → register interaction (source: nfc or qr)                                                                                                                                                                       

  - Show business profile directly                                                                                                                                                                                                               

  - Big CTA: "Valora tu experiencia"                                                                                                                                                                                                             

  - After reviewing: "Comparte también en Google" + "Descubre más negocios"                                                                                                                                                                      

                                                                                                                                                                                                                                                 

  5. REVIEW MODAL (accessible from business profile and /t/ page)

  - Star selector (1-5, tap to select)                                                                                                                                                                                                           

  - Name field (if not logged in)                                                                                                                                                                                                                

  - Comment textarea

  - Optional photo upload                                                                                                                                                                                                                        

  - Submit button                         

  - No mandatory registration before reviewing

  - After submit: show thank you + Google CTA + discover more                                                                                                                                                                                    

                                                                                                                                                                                                                                                 

  6. AUTH PAGES (/login, /registro)                                                                                                                                                                                                              

  - Email/password login and register                                                                                                                                                                                                            

  - After login: redirect back to previous page

  - Google OAuth if possible

                                                                                                                                                                                                                                                 

  7. USER PROFILE (/perfil)

  - Avatar, name, username                                                                                                                                                                                                                       

  - My reviews list                       

  - My favorites list

  - Edit profile button

  8. BUSINESS DASHBOARD (/business)

  Protected route — only for users with role=business or admin                                                                                                                                                                                   

                                                              

  - Summary cards: total interactions, NFC scans, QR scans, total reviews, avg rating, Google clicks                                                                                                                                             

  - Recent reviews list                                                                                                                                                                                                                          

  - My devices list (code, label, status, total_scans)

  - Quick actions: View public profile, Manage devices, Edit business info                                                                                                                                                                       

                                                                                                                                                                                                                                                 

  9. DEVICE MANAGEMENT (/business/dispositivos)                                                                                                                                                                                                  

  - List all devices for the business                                                                                                                                                                                                            

  - Each device: code, label, type, status badge, total_scans, QR code display                                                                                                                                                                   

  - Add device button (enter code like TAP-0001, assign label)                

  - Activate/deactivate toggle                                

  - Copy NFC URL button: tapvio.es/t/TAP-0001                                                                                                                                                                                                    

                                             

  10. BUSINESS SETTINGS (/business/configuracion)                                                                                                                                                                                                

  - Edit: name, description, address, phone, website, google_review_url, instagram, facebook

  - Upload logo and cover photo                                                                                                                                                                                                                  

  - Manage opening hours (each day of week)                                                                                                                                                                                                      

  - Upload/delete business photos          

                                                                                                                                                                                                                                                 

  11. ADMIN PANEL (/admin)                

  Protected — only role=admin                                                                                                                                                                                                                    

                             

  - Stats dashboard: total businesses, users, devices, reviews, interactions                                                                                                                                                                     

  - Businesses table: list all with status, plan, actions (activate/suspend/edit)

  - Devices table: list all, assign to business, activate/deactivate             

  - Reviews table: list all, moderate (remove/restore)                                                                                                                                                                                           

  - Users table: list all with role                   

                                                                                                                                                                                                                                                 

  12. SUBSCRIPTION PAGE (/business/suscripcion)

  - Show current plan and status                                                                                                                                                                                                                 

  - Plan cards:                           

    STARTER — 9,90€/mes — 1 device, basic stats                                                                                                                                                                                                  

    BUSINESS — 19,90€/mes — up to 10 devices, full stats, Google link

    MULTI — 39,90€/mes — up to 30 devices, advanced stats                                                                                                                                                                                        

  - Upgrade button (no real payment needed in MVP, just UI ready for Stripe)

                                                                                                                                                                                                                                                 

  ---                                                                                                                                                                                                                                            

                                                                                                                                                                                                                                                 

  ROUTING LOGIC                                                                                                                                                                                                                                  

  - / → homepage                          

  - /explorar → explore

  - /negocio/:slug → business profile

  - /t/:deviceCode → NFC landing (register interaction + show business)

  - /login → login                                                     

  - /registro → register                                                                                                                                                                                                                         

  - /perfil → user profile (protected)

  - /business → business dashboard (protected, role=business)                                                                                                                                                                                    

  - /business/dispositivos → device management               

  - /business/configuracion → business settings

  - /admin → admin panel (protected, role=admin)                                                                                                                                                                                                 

                                                

  ---                                                                                                                                                                                                                                            

                                          

  KEY BEHAVIORS

  - /t/:deviceCode: query devices table by code, get business_id, insert interaction row (action=scan), redirect to business profile with ?source=nfc

  - After submitting review: insert into reviews table, trigger updates avg_rating automatically                                                     

  - Favorites: insert/delete from favorites table                                                                                                                                                                                                

  - Admin can set user role to 'admin' or 'business' from the users table

  - Business dashboard only shows data for businesses where owner_id = current user                                                                                                                                                              

                                                                                   

  ---                                                                                                                                                                                                                                            

                                          

  Start by building the homepage and the business public profile page. Make them look polished and production-ready. Use realistic demo data from Supabase.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/60e05cc7-f1fb-48f4-92bd-39605fe6908e).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
