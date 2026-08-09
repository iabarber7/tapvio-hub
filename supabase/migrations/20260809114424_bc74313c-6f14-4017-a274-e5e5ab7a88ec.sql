
-- ROLES
CREATE TYPE public.app_role AS ENUM ('user','business','admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_self_write" ON public.profiles FOR ALL TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "user_roles_self_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, name, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email,'@',1)), split_part(NEW.email,'@',1) || '_' || substr(NEW.id::text,1,4));
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- CATEGORIES
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text,
  color text
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);

-- BUSINESSES
CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  description text,
  address text,
  city text,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  google_review_url text,
  instagram text,
  facebook text,
  logo_url text,
  cover_url text,
  status text NOT NULL DEFAULT 'pending',
  avg_rating numeric(2,1) NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT SELECT ON public.businesses TO anon;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "businesses_public_read" ON public.businesses FOR SELECT USING (status = 'active' OR auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "businesses_owner_write" ON public.businesses FOR ALL TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.business_hours (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL,
  open_time time,
  close_time time,
  is_closed boolean NOT NULL DEFAULT false
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_hours TO authenticated;
GRANT SELECT ON public.business_hours TO anon;
GRANT ALL ON public.business_hours TO service_role;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours_public_read" ON public.business_hours FOR SELECT USING (true);
CREATE POLICY "hours_owner_write" ON public.business_hours FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

CREATE TABLE public.business_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  url text NOT NULL,
  "order" integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_photos TO authenticated;
GRANT SELECT ON public.business_photos TO anon;
GRANT ALL ON public.business_photos TO service_role;
ALTER TABLE public.business_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "photos_public_read" ON public.business_photos FOR SELECT USING (true);
CREATE POLICY "photos_owner_write" ON public.business_photos FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- DEVICES
CREATE TABLE public.devices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL,
  label text,
  type text NOT NULL DEFAULT 'sticker',
  status text NOT NULL DEFAULT 'unassigned',
  total_scans integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.devices TO authenticated;
GRANT SELECT ON public.devices TO anon;
GRANT ALL ON public.devices TO service_role;
ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "devices_public_read" ON public.devices FOR SELECT USING (true);
CREATE POLICY "devices_owner_write" ON public.devices FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))) OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE,
  source text NOT NULL DEFAULT 'direct',
  action text NOT NULL DEFAULT 'scan',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.interactions TO anon, authenticated;
GRANT SELECT ON public.interactions TO authenticated;
GRANT ALL ON public.interactions TO service_role;
ALTER TABLE public.interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interactions_anyone_insert" ON public.interactions FOR INSERT WITH CHECK (true);
CREATE POLICY "interactions_owner_read" ON public.interactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));

-- REVIEWS
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  device_id uuid REFERENCES public.devices(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name text,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment text,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT ON public.reviews TO anon;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_public_read" ON public.reviews FOR SELECT USING (status = 'published' OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews_anyone_insert" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "reviews_admin_write" ON public.reviews FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "reviews_admin_delete" ON public.reviews FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.review_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id uuid NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  url text NOT NULL
);
GRANT SELECT, INSERT ON public.review_photos TO anon, authenticated;
GRANT ALL ON public.review_photos TO service_role;
ALTER TABLE public.review_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "review_photos_public_read" ON public.review_photos FOR SELECT USING (true);
CREATE POLICY "review_photos_insert" ON public.review_photos FOR INSERT WITH CHECK (true);

-- FAVORITES
CREATE TABLE public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, business_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "favorites_own" ON public.favorites FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'starter',
  status text NOT NULL DEFAULT 'trial',
  trial_ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs_owner" ON public.subscriptions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- PROMOTIONS
CREATE TABLE public.promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  active boolean NOT NULL DEFAULT true
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.promotions TO authenticated;
GRANT SELECT ON public.promotions TO anon;
GRANT ALL ON public.promotions TO service_role;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "promos_public_read" ON public.promotions FOR SELECT USING (active = true);
CREATE POLICY "promos_owner_write" ON public.promotions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND (b.owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- RATING TRIGGER
CREATE OR REPLACE FUNCTION public.refresh_business_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE bid uuid;
BEGIN
  bid := COALESCE(NEW.business_id, OLD.business_id);
  UPDATE public.businesses b
  SET total_reviews = COALESCE(s.cnt,0), avg_rating = COALESCE(ROUND(s.avg_r,1),0)
  FROM (SELECT COUNT(*) cnt, AVG(rating) avg_r FROM public.reviews WHERE business_id = bid AND status = 'published') s
  WHERE b.id = bid;
  RETURN NULL;
END; $$;
CREATE TRIGGER reviews_rating_sync AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.refresh_business_rating();

-- SEED
INSERT INTO public.categories (name, slug, icon, color) VALUES
('Restaurantes','restaurantes','🍽️','#2563EB'),
('Cafeterías','cafeterias','☕','#06B6D4'),
('Peluquerías','peluquerias','✂️','#2563EB'),
('Belleza','belleza','💅','#06B6D4'),
('Hoteles','hoteles','🏨','#2563EB'),
('Gimnasios','gimnasios','💪','#06B6D4'),
('Tiendas','tiendas','🛍️','#2563EB'),
('Servicios','servicios','🔧','#06B6D4'),
('Ocio','ocio','🎮','#2563EB');

INSERT INTO public.businesses (name, slug, category_id, description, address, city, lat, lng, phone, website, google_review_url, instagram, status, cover_url, logo_url)
VALUES
('La Marea Atlántica','la-marea-atlantica',(SELECT id FROM public.categories WHERE slug='restaurantes'),'Cocina canaria de autor con producto local y vistas al mar. Especialidad en pescado fresco del día.','Calle Olof Palme 12','Las Palmas de Gran Canaria',28.1385,-15.4363,'+34 928 45 12 30','https://lamarea.es','https://g.page/r/lamarea/review','@lamarea_lpa','active','https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80','https://images.unsplash.com/photo-1552566626-52f8b828add9?w=200&q=80'),
('Café Triana 21','cafe-triana-21',(SELECT id FROM public.categories WHERE slug='cafeterias'),'Café de especialidad tostado en casa, brunch todo el día en pleno corazón de Triana.','Calle Triana 21','Las Palmas de Gran Canaria',28.1043,-15.4180,'+34 928 33 09 87','https://cafetriana21.es','https://g.page/r/cafetriana/review','@cafetriana21','active','https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&q=80','https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=200&q=80'),
('Hotel Bahía Confital','hotel-bahia-confital',(SELECT id FROM public.categories WHERE slug='hoteles'),'Hotel boutique a 50 metros de Las Canteras, con azotea, piscina y desayuno canario.','Paseo de Las Canteras 88','Las Palmas de Gran Canaria',28.1420,-15.4425,'+34 928 27 66 40','https://bahiaconfital.com','https://g.page/r/bahiaconfital/review','@bahiaconfital','active','https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=80','https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=200&q=80'),
('Atlas Fitness Club','atlas-fitness-club',(SELECT id FROM public.categories WHERE slug='gimnasios'),'Gimnasio 24h con sala de fuerza, cross training y clases dirigidas incluidas.','Avenida Mesa y López 45','Las Palmas de Gran Canaria',28.1290,-15.4340,'+34 928 22 15 03','https://atlasfitness.es','https://g.page/r/atlasfitness/review','@atlasfitness_lpa','active','https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80','https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=200&q=80'),
('Spa Alisios','spa-alisios',(SELECT id FROM public.categories WHERE slug='belleza'),'Circuito de aguas, masajes y tratamientos faciales con cosmética natural canaria.','Calle Perojo 7','Las Palmas de Gran Canaria',28.1075,-15.4200,'+34 928 36 44 12','https://spaalisios.es','https://g.page/r/spaalisios/review','@spaalisios','active','https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200&q=80','https://images.unsplash.com/photo-1600334129128-685c5582fd35?w=200&q=80'),
('Tasca El Guanche','tasca-el-guanche',(SELECT id FROM public.categories WHERE slug='restaurantes'),'Tapas tradicionales, papas arrugadas y vinos de la tierra en ambiente familiar.','Calle Mendizábal 15','Las Palmas de Gran Canaria',28.1010,-15.4155,'+34 928 31 22 88','https://tascaelguanche.es','https://g.page/r/elguanche/review','@tascaelguanche','active','https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80','https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=200&q=80');

INSERT INTO public.business_hours (business_id, day_of_week, open_time, close_time, is_closed)
SELECT b.id, d.dow, '09:00'::time, '22:00'::time, (d.dow = 0)
FROM public.businesses b CROSS JOIN (SELECT generate_series(0,6) AS dow) d;

INSERT INTO public.business_photos (business_id, url, "order")
SELECT b.id, u.url, u.ord FROM public.businesses b
CROSS JOIN (VALUES
 ('https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80',1),
 ('https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80',2),
 ('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',3)) AS u(url,ord);

INSERT INTO public.devices (code, business_id, label, type, status, total_scans) VALUES
('TAP-0001',(SELECT id FROM public.businesses WHERE slug='la-marea-atlantica'),'Mesa 1','table','active',148),
('TAP-0002',(SELECT id FROM public.businesses WHERE slug='la-marea-atlantica'),'Mesa 2','table','active',97),
('TAP-0003',(SELECT id FROM public.businesses WHERE slug='cafe-triana-21'),'Barra','wall','active',212),
('TAP-0004',(SELECT id FROM public.businesses WHERE slug='cafe-triana-21'),'Terraza','table','active',63),
('TAP-0005',(SELECT id FROM public.businesses WHERE slug='hotel-bahia-confital'),'Recepción','wall','active',330),
('TAP-0006',(SELECT id FROM public.businesses WHERE slug='hotel-bahia-confital'),'Habitación 101','sticker','active',44),
('TAP-0007',(SELECT id FROM public.businesses WHERE slug='atlas-fitness-club'),'Entrada','wall','active',188),
('TAP-0008',(SELECT id FROM public.businesses WHERE slug='atlas-fitness-club'),'Sala de peso','sticker','inactive',22),
('TAP-0009',(SELECT id FROM public.businesses WHERE slug='spa-alisios'),'Recepción spa','wall','active',131),
('TAP-0010',(SELECT id FROM public.businesses WHERE slug='tasca-el-guanche'),'Mesa terraza','table','active',76);

INSERT INTO public.reviews (business_id, author_name, rating, comment) VALUES
((SELECT id FROM public.businesses WHERE slug='la-marea-atlantica'),'Marta G.',5,'El pescado fresquísimo y el trato inmejorable. Repetiremos seguro.'),
((SELECT id FROM public.businesses WHERE slug='la-marea-atlantica'),'Javier R.',5,'Las vistas y la cocina de autor merecen mucho la pena. Muy recomendable.'),
((SELECT id FROM public.businesses WHERE slug='la-marea-atlantica'),'Nerea P.',4,'Muy buena experiencia, aunque tardaron un poco en servir el postre.'),
((SELECT id FROM public.businesses WHERE slug='cafe-triana-21'),'Alba M.',5,'El mejor café de especialidad de Las Palmas, y el brunch espectacular.'),
((SELECT id FROM public.businesses WHERE slug='cafe-triana-21'),'Dani S.',5,'Ambiente muy agradable para trabajar y personal encantador.'),
((SELECT id FROM public.businesses WHERE slug='cafe-triana-21'),'Lucía H.',4,'Buenísimo todo, aunque a mediodía hay que esperar mesa.'),
((SELECT id FROM public.businesses WHERE slug='hotel-bahia-confital'),'Carlos V.',5,'Habitaciones impecables y a un paso de Las Canteras. Desayuno top.'),
((SELECT id FROM public.businesses WHERE slug='hotel-bahia-confital'),'Isabel T.',4,'Muy buena ubicación y personal atentísimo. Volveremos.'),
((SELECT id FROM public.businesses WHERE slug='hotel-bahia-confital'),'Pedro L.',5,'La azotea con piscina al atardecer es una maravilla.'),
((SELECT id FROM public.businesses WHERE slug='atlas-fitness-club'),'Rubén A.',5,'Material nuevo, muy limpio y las clases dirigidas son geniales.'),
((SELECT id FROM public.businesses WHERE slug='atlas-fitness-club'),'Sara C.',4,'Buen gimnasio, a las 19h se llena bastante pero merece la pena.'),
((SELECT id FROM public.businesses WHERE slug='spa-alisios'),'Elena D.',5,'El circuito de aguas es una experiencia total. Salí como nueva.'),
((SELECT id FROM public.businesses WHERE slug='spa-alisios'),'Miguel F.',5,'Masaje descontracturante perfecto y trato muy profesional.'),
((SELECT id FROM public.businesses WHERE slug='tasca-el-guanche'),'Andrea N.',5,'Las papas arrugadas con mojo son de las mejores de la isla.'),
((SELECT id FROM public.businesses WHERE slug='tasca-el-guanche'),'Tomás B.',4,'Comida casera y precios muy honestos. Ambiente familiar.');

INSERT INTO public.subscriptions (business_id, plan, status, trial_ends_at) VALUES
((SELECT id FROM public.businesses WHERE slug='la-marea-atlantica'),'business','active',NULL),
((SELECT id FROM public.businesses WHERE slug='cafe-triana-21'),'starter','trial',now() + interval '12 days'),
((SELECT id FROM public.businesses WHERE slug='hotel-bahia-confital'),'multi','active',NULL),
((SELECT id FROM public.businesses WHERE slug='atlas-fitness-club'),'business','active',NULL),
((SELECT id FROM public.businesses WHERE slug='spa-alisios'),'starter','trial',now() + interval '5 days'),
((SELECT id FROM public.businesses WHERE slug='tasca-el-guanche'),'starter','active',NULL);

INSERT INTO public.promotions (business_id, title, description, active) VALUES
((SELECT id FROM public.businesses WHERE slug='cafe-triana-21'),'2x1 en café de especialidad','De lunes a jueves antes de las 11:00.',true),
((SELECT id FROM public.businesses WHERE slug='spa-alisios'),'-20% en circuito de aguas','Válido de lunes a miércoles presentando esta promoción.',true);
