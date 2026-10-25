
create type public.app_role as enum ('customer','seller','admin');
create type public.order_status as enum ('pending','confirmed','processing','shipped','delivered','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, phone text, address text, avatar_url text,
  created_at timestamptz not null default now()
);
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null, unique(user_id, role)
);
create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.user_roles where user_id=_user_id and role=_role) $$;

create table public.sellers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  store_name text not null, description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique, slug text not null unique, icon text,
  created_at timestamptz not null default now()
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.sellers(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null, description text,
  price numeric(12,2) not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  image_url text, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table public.carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique, created_at timestamptz not null default now()
);
create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.carts(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity int not null default 1 check (quantity > 0),
  unique(cart_id, product_id)
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  seller_id uuid references public.sellers(id) on delete set null,
  status order_status not null default 'pending',
  total numeric(12,2) not null default 0,
  shipping_address text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null, price numeric(12,2) not null, quantity int not null
);
create table public.order_status_history (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  status order_status not null, changed_by uuid, created_at timestamptz not null default now()
);
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(12,2) not null, method text not null default 'cash',
  status text not null default 'pending', created_at timestamptz not null default now()
);
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  user_id uuid not null, rating int not null check (rating between 1 and 5), comment text,
  created_at timestamptz not null default now(), unique(product_id, user_id)
);
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  product_id uuid not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(), unique(user_id, product_id)
);

-- helper
create or replace function public.my_seller_id() returns uuid language sql stable security definer set search_path=public
as $$ select id from public.sellers where user_id = auth.uid() $$;

-- grants
grant select on public.user_roles to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.sellers, public.categories, public.products, public.reviews to anon;
grant select, insert, update, delete on public.sellers, public.categories, public.products, public.reviews, public.carts, public.cart_items, public.wishlists to authenticated;
grant select, update on public.orders to authenticated;
grant select on public.order_items, public.payments, public.order_status_history to authenticated;
grant all on all tables in schema public to service_role;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.sellers enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.order_status_history enable row level security;
alter table public.payments enable row level security;
alter table public.reviews enable row level security;
alter table public.wishlists enable row level security;

create policy "own profile read" on public.profiles for select to authenticated using (id = auth.uid() or has_role(auth.uid(),'admin'));
create policy "own profile write" on public.profiles for update to authenticated using (id = auth.uid());
create policy "own profile insert" on public.profiles for insert to authenticated with check (id = auth.uid());

create policy "own roles" on public.user_roles for select to authenticated using (user_id = auth.uid() or has_role(auth.uid(),'admin'));

create policy "sellers public" on public.sellers for select using (true);
create policy "seller update own" on public.sellers for update to authenticated using (user_id = auth.uid() or has_role(auth.uid(),'admin'));
create policy "seller insert own" on public.sellers for insert to authenticated with check (user_id = auth.uid() and has_role(auth.uid(),'seller'));

create policy "cat public" on public.categories for select using (true);
create policy "cat admin" on public.categories for all to authenticated using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create policy "products public" on public.products for select using (is_active or seller_id = my_seller_id() or has_role(auth.uid(),'admin'));
create policy "products seller insert" on public.products for insert to authenticated with check (seller_id = my_seller_id());
create policy "products seller update" on public.products for update to authenticated using (seller_id = my_seller_id() or has_role(auth.uid(),'admin'));
create policy "products seller delete" on public.products for delete to authenticated using (seller_id = my_seller_id() or has_role(auth.uid(),'admin'));

create policy "own cart" on public.carts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own cart items" on public.cart_items for all to authenticated
  using (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()))
  with check (exists(select 1 from public.carts c where c.id = cart_id and c.user_id = auth.uid()));

create policy "orders read" on public.orders for select to authenticated using (user_id = auth.uid() or seller_id = my_seller_id() or has_role(auth.uid(),'admin'));
create policy "orders update" on public.orders for update to authenticated using (user_id = auth.uid() or seller_id = my_seller_id() or has_role(auth.uid(),'admin'));
create policy "order items read" on public.order_items for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id));
create policy "history read" on public.order_status_history for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id));
create policy "payments read" on public.payments for select to authenticated using (exists(select 1 from public.orders o where o.id = order_id));

create policy "reviews public" on public.reviews for select using (true);
create policy "reviews own" on public.reviews for insert to authenticated with check (user_id = auth.uid());
create policy "reviews own del" on public.reviews for delete to authenticated using (user_id = auth.uid() or has_role(auth.uid(),'admin'));

create policy "own wishlist" on public.wishlists for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- signup trigger
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
declare r text := coalesce(new.raw_user_meta_data->>'role','customer');
begin
  insert into public.profiles(id, full_name) values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)));
  insert into public.user_roles(user_id, role) values (new.id, 'customer');
  if r = 'seller' then
    insert into public.user_roles(user_id, role) values (new.id, 'seller');
    insert into public.sellers(user_id, store_name) values (new.id, coalesce(new.raw_user_meta_data->>'store_name', 'My Store'));
  end if;
  insert into public.carts(user_id) values (new.id);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

-- order lifecycle rules
create or replace function public.validate_order_status() returns trigger language plpgsql security definer set search_path=public as $$
declare is_admin boolean := has_role(auth.uid(),'admin');
declare is_seller boolean := (new.seller_id is not null and new.seller_id = my_seller_id());
declare is_owner boolean := (new.user_id = auth.uid());
begin
  if new.user_id <> old.user_id or new.seller_id is distinct from old.seller_id or new.total <> old.total then
    raise exception 'Only status can be changed';
  end if;
  if new.status = old.status then return new; end if;
  if not (
    (old.status='pending' and new.status in ('confirmed','cancelled')) or
    (old.status='confirmed' and new.status in ('processing','cancelled')) or
    (old.status='processing' and new.status='shipped') or
    (old.status='shipped' and new.status='delivered')
  ) then
    raise exception 'Invalid transition: % -> %', old.status, new.status;
  end if;
  if new.status = 'cancelled' then
    if not (is_owner or is_seller or is_admin) then raise exception 'Not allowed'; end if;
  elsif not (is_seller or is_admin) then
    raise exception 'Only seller or admin can advance the order';
  end if;
  if new.status = 'cancelled' then
    update public.products p set stock = p.stock + oi.quantity from public.order_items oi where oi.order_id = new.id and oi.product_id = p.id;
    update public.payments set status='refunded' where order_id = new.id and status='paid';
    update public.payments set status='cancelled' where order_id = new.id and status='pending';
  end if;
  if new.status = 'delivered' then
    update public.payments set status='paid' where order_id = new.id and status='pending';
  end if;
  new.updated_at := now();
  insert into public.order_status_history(order_id, status, changed_by) values (new.id, new.status, auth.uid());
  return new;
end $$;
create trigger orders_status_rules before update on public.orders for each row execute function public.validate_order_status();

-- checkout: one order per seller
create or replace function public.place_order(_address text, _method text default 'cash') returns setof uuid
language plpgsql security definer set search_path=public as $$
declare _cart uuid; s record; _order uuid; _total numeric; bad record;
begin
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if coalesce(trim(_address),'') = '' then raise exception 'Address required'; end if;
  select id into _cart from carts where user_id = auth.uid();
  if not exists(select 1 from cart_items where cart_id=_cart) then raise exception 'Cart is empty'; end if;
  select p.name into bad from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=_cart and (p.stock < ci.quantity or not p.is_active) limit 1;
  if found then raise exception 'Not enough stock: %', bad.name; end if;
  for s in select distinct p.seller_id from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=_cart loop
    select sum(p.price*ci.quantity) into _total from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=_cart and p.seller_id is not distinct from s.seller_id;
    insert into orders(user_id, seller_id, total, shipping_address) values (auth.uid(), s.seller_id, _total, _address) returning id into _order;
    insert into order_items(order_id, product_id, product_name, price, quantity)
      select _order, p.id, p.name, p.price, ci.quantity from cart_items ci join products p on p.id=ci.product_id where ci.cart_id=_cart and p.seller_id is not distinct from s.seller_id;
    update products p set stock = p.stock - ci.quantity from cart_items ci where ci.cart_id=_cart and ci.product_id=p.id and p.seller_id is not distinct from s.seller_id;
    insert into payments(order_id, amount, method, status) values (_order, _total, coalesce(_method,'cash'), case when _method='card' then 'paid' else 'pending' end);
    insert into order_status_history(order_id, status, changed_by) values (_order, 'pending', auth.uid());
    return next _order;
  end loop;
  delete from cart_items where cart_id=_cart;
end $$;
grant execute on function public.place_order(text, text) to authenticated;

-- admin helpers
create or replace function public.admin_set_role(_user uuid, _role app_role, _grant boolean) returns void language plpgsql security definer set search_path=public as $$
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  if _grant then insert into user_roles(user_id, role) values (_user,_role) on conflict do nothing;
    if _role='seller' then insert into sellers(user_id, store_name) values (_user,'New Store') on conflict (user_id) do nothing; end if;
  else delete from user_roles where user_id=_user and role=_role; end if;
end $$;
grant execute on function public.admin_set_role(uuid, app_role, boolean) to authenticated;

create or replace function public.admin_list_users() returns table(id uuid, email text, full_name text, created_at timestamptz, roles text[])
language plpgsql stable security definer set search_path=public as $$
begin
  if not has_role(auth.uid(),'admin') then raise exception 'Admins only'; end if;
  return query select u.id, u.email::text, p.full_name, u.created_at,
    coalesce(array_agg(r.role::text) filter (where r.role is not null), '{}')
  from auth.users u left join profiles p on p.id=u.id left join user_roles r on r.user_id=u.id
  group by u.id, u.email, p.full_name, u.created_at order by u.created_at desc;
end $$;
grant execute on function public.admin_list_users() to authenticated;

-- seed
insert into public.categories(name, slug, icon) values
 ('Electronics','electronics','Cpu'),('Fashion','fashion','Shirt'),('Home','home','Sofa'),
 ('Books','books','BookOpen'),('Sports','sports','Dumbbell'),('Beauty','beauty','Sparkles');

insert into public.products(category_id, name, description, price, stock, image_url)
select c.id, v.name, v.descr, v.price, v.stock, v.img from (values
 ('electronics','Wireless Headphones','Noise-cancelling over-ear headphones with 30h battery.',89.99,25,'https://picsum.photos/seed/headphones/600/600'),
 ('electronics','Smart Watch','Fitness tracking, heart-rate and notifications.',149.00,15,'https://picsum.photos/seed/watch/600/600'),
 ('electronics','Bluetooth Speaker','Portable waterproof speaker with deep bass.',49.50,40,'https://picsum.photos/seed/speaker/600/600'),
 ('fashion','Leather Jacket','Classic genuine leather biker jacket.',199.00,8,'https://picsum.photos/seed/jacket/600/600'),
 ('fashion','Running Sneakers','Lightweight breathable sneakers.',79.00,30,'https://picsum.photos/seed/sneakers/600/600'),
 ('home','Ceramic Vase','Handmade minimal ceramic vase.',34.00,20,'https://picsum.photos/seed/vase/600/600'),
 ('home','Desk Lamp','Adjustable LED desk lamp, warm light.',42.00,18,'https://picsum.photos/seed/lamp/600/600'),
 ('books','The Design Book','A visual history of everyday objects.',24.90,50,'https://picsum.photos/seed/book/600/600'),
 ('sports','Yoga Mat','Non-slip eco-friendly yoga mat.',29.00,35,'https://picsum.photos/seed/yoga/600/600'),
 ('beauty','Skincare Set','Cleanser, toner and moisturizer set.',59.00,22,'https://picsum.photos/seed/skincare/600/600')
) as v(cat,name,descr,price,stock,img) join public.categories c on c.slug=v.cat;
