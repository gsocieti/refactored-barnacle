-- Momiega: data menu asli. Jalankan SEKALI setelah schema.sql (aman dijalankan di DB yang sudah memakai data contoh).
alter table public.menu_items add column if not exists is_featured boolean not null default false;

delete from public.menu_items where name like '%(contoh)';
delete from public.categories where slug in ('mie', 'dimsum', 'minuman');

insert into public.categories (name, slug, sort_order) values
  ('Mie Ayam', 'mie-ayam', 1),
  ('Mie Yamin', 'mie-yamin', 2),
  ('Ramen', 'ramen', 3),
  ('Coffee', 'coffee', 4),
  ('Non Coffee', 'non-coffee', 5),
  ('Tea Series', 'tea-series', 6),
  ('Topping', 'topping', 7)
on conflict (slug) do update
set name = excluded.name,
    sort_order = excluded.sort_order;

insert into public.menu_items (name, description, price, is_featured, category_id)
select v.name, v.description, v.price, v.featured, c.id
from (values
  -- Mie Ayam
  ('Mie Ayam Lebar Original', 'Mie ayam lebar dengan topping ayam, sawi, daun bawang, kuah', 32000, false, 'mie-ayam'),
  ('Mie Ayam Lebar Baso', 'Mie ayam lebar dengan topping baso, sawi, daun bawang, kuah terpisah', 34500, false, 'mie-ayam'),
  ('Mie Ayam Lebar Pangsit Rebus', 'Mie ayam lebar dengan topping pangsit rebus', 34500, false, 'mie-ayam'),
  ('Mie Ayam Lebar Jamur', 'Mie ayam lebar dengan topping jamur, sawi, daun bawang, kuah terpisah', 34500, false, 'mie-ayam'),
  ('Mie Ayam Karet Original', 'Mie ayam karet dengan topping ayam, sawi, daun bawang, kuah terpisah', 32000, false, 'mie-ayam'),
  ('Mie Ayam Spesial Halus', 'Mie ayam + jamur, bakso 1, pangsit rebus 2, sawi, dan daun bawang', 34500, true, 'mie-ayam'),
  ('Mie Ayam Original Halus', 'Mie ayam + sawi, daun bawang, dan kuah terpisah', 25000, false, 'mie-ayam'),
  ('Mie Ayam Bakso Halus', 'Mie ayam + bakso 2, sawi, daun bawang, dan kuah terpisah', 26500, false, 'mie-ayam'),
  ('Mie Ayam Bakso Karet', 'Mie ayam + bakso 2, mie karet, sawi, daun bawang, dan kuah terpisah', 30500, false, 'mie-ayam'),
  ('Mie Ayam Pangsit Rebus Halus', 'Mie ayam + pangsit rebus 2, sawi, daun bawang, dan kuah terpisah', 27000, false, 'mie-ayam'),
  ('Mie Ayam Pangsit Rebus Karet', 'Mie ayam + pangsit rebus 2, mie karet, sawi, daun bawang, dan kuah terpisah', 31000, false, 'mie-ayam'),
  ('Mie Ayam Jamur Karet', 'Mie ayam + jamur, mie karet, sawi, daun bawang, dan kuah terpisah', 31000, false, 'mie-ayam'),
  ('Mie Ayam Katsu Halus', 'Mie ayam + katsu, sawi, daun bawang, dan kuah terpisah', 34500, false, 'mie-ayam'),
  ('Mie Ayam Katsu Karet', 'Mie ayam + katsu, mie karet, sawi, daun bawang, dan kuah terpisah', 36500, true, 'mie-ayam'),
  ('Mie Ayam Spesial Karet', 'Mie ayam + mie karet, jamur, bakso 1, pangsit rebus 2, sawi, dan daun bawang', 35000, true, 'mie-ayam'),
  ('Mie Ayam Jamur Halus', 'Mie ayam + jamur, sawi, daun bawang, dan kuah terpisah', 26500, false, 'mie-ayam'),
  -- Mie Yamin
  ('Yamin Original Halus', 'Mie yamin + sawi, daun bawang, dan kuah terpisah', 26000, false, 'mie-yamin'),
  ('Yamin Baso Halus', 'Mie yamin + baso, sawi, daun bawang, dan kuah terpisah', 28500, false, 'mie-yamin'),
  ('Yamin Pangsit Rebus Karet', 'Mie yamin + pangsit rebus 2, mie karet, sawi, daun bawang, dan kuah terpisah', 31500, false, 'mie-yamin'),
  ('Yamin Jamur Halus', 'Mie yamin + jamur, sawi, daun bawang, dan kuah terpisah', 27500, false, 'mie-yamin'),
  ('Yamin Original Karet', 'Mie yamin + mie karet, sawi, daun bawang, dan kuah terpisah', 28000, false, 'mie-yamin'),
  ('Yamin Original Lebar', 'Mie yamin + mie lebar, sawi, daun bawang, dan kuah terpisah', 28000, false, 'mie-yamin'),
  ('Yamin Bakso Lebar', 'Mie yamin + bakso, mie lebar, sawi, daun bawang, dan kuah terpisah', 31500, false, 'mie-yamin'),
  ('Yamin Bakso Karet', 'Mie yamin + bakso, mie karet, sawi, daun bawang, dan kuah terpisah', 31500, false, 'mie-yamin'),
  ('Yamin Pangsit Rebus Halus', 'Mie yamin + pangsit rebus 2, sawi, daun bawang, dan kuah terpisah', 26500, false, 'mie-yamin'),
  ('Yamin Pangsit Rebus Lebar', 'Mie yamin + pangsit rebus 2, mie lebar, sawi, daun bawang, dan kuah terpisah', 32500, false, 'mie-yamin'),
  ('Yamin Jamur Karet', 'Mie yamin + jamur, mie karet, sawi, daun bawang, dan kuah terpisah', 32500, false, 'mie-yamin'),
  ('Yamin Chicken Katsu Halus', 'Mie yamin + katsu, sawi, daun bawang, dan kuah terpisah', 34500, false, 'mie-yamin'),
  ('Yamin Chicken Katsu Karet', 'Mie yamin + katsu, mie karet, sawi, daun bawang, dan kuah terpisah', 35000, true, 'mie-yamin'),
  ('Yamin Chicken Katsu Lebar', 'Mie yamin + katsu, mie lebar, sawi, daun bawang, dan kuah terpisah', 35000, true, 'mie-yamin'),
  ('Yamin Spesial Halus', 'Mie yamin + jamur, bakso 1, pangsit rebus 2, sawi, daun bawang, dan kuah terpisah', 31000, false, 'mie-yamin'),
  ('Yamin Spesial Karet', 'Mie yamin + jamur, bakso 1, pangsit rebus 2, mie karet, sawi, daun bawang, dan kuah terpisah', 35000, true, 'mie-yamin'),
  ('Yamin Katsu Lebar', 'Mie yamin + jamur, bakso 1, pangsit rebus 2, mie lebar, sawi, daun bawang, dan kuah terpisah', 35000, true, 'mie-yamin'),
  ('Yamin Spesial Lebar', 'Yamin dengan mie lebar dengan topping pangsit rebus, baso, jamur, sawi, daun bawang dengan kuah terpisah', 35500, true, 'mie-yamin'),
  -- Ramen
  ('Ramen Original Miso', 'Ramen original kuah miso + telur, jamur kuping, daun bawang, dan nori', 26500, false, 'ramen'),
  ('Ramen Original Spicy', 'Ramen original kuah spicy + telur, jamur kuping, daun bawang, dan nori', 25000, false, 'ramen'),
  ('Ramen Chicken Katsu Miso', 'Ramen chicken katsu kuah miso + telur, jamur kuping, daun bawang, dan nori', 34500, false, 'ramen'),
  ('Ramen Chicken Chasiu Spicy', 'Ramen chicken chasiu kuah spicy + telur, jamur kuping, daun bawang, dan nori', 34500, false, 'ramen'),
  ('Ramen Chicken Chasiu Miso', 'Ramen chicken chasiu kuah miso + telur, jamur kuping, daun bawang, dan nori', 34000, false, 'ramen'),
  ('Ramen Katsu Spicy', 'Ramen katsu spicy dengan topping telur, jamur kuping, daun bawang', 34500, true, 'ramen'),
  -- Non Coffee
  ('Premium Chocolate', null, 16000, false, 'non-coffee'),
  ('Milo Susu', null, 13000, false, 'non-coffee'),
  ('Ovaltine Susu', null, 13500, false, 'non-coffee'),
  ('Matcha Latte', null, 15000, false, 'non-coffee'),
  ('Teh Tarik', null, 14500, false, 'non-coffee'),
  ('Susu Avocado', null, 15000, false, 'non-coffee'),
  ('Tjap Badak', null, 17000, false, 'non-coffee'),
  -- Tea Series
  ('Es Teh Manis', null, 7000, false, 'tea-series'),
  ('Lychee Tea', null, 15000, false, 'tea-series'),
  ('Oasis Mineral', null, 5000, false, 'tea-series'),
  ('Lemon Tea', null, 12000, false, 'tea-series'),
  -- Topping
  ('Jamur', 'Jamur merang tumis kecap', 4000, false, 'topping'),
  ('Baso 1pcs', 'Bakso sapi', 3000, true, 'topping'),
  ('Pangsit Rebus 1pcs', 'Pangsit rebus isi ayam cincang', 3000, false, 'topping'),
  ('Pangsit Goreng', null, 3000, false, 'topping'),
  ('Chicken Katsu', null, 15000, false, 'topping'),
  ('Telur Setengah Potong', 'Telur ayam rebus', 3000, false, 'topping'),
  ('Extra Chilli Oil', 'Penambahan chilli oil', 4500, false, 'topping')
) as v (name, description, price, featured, slug)
join public.categories c on c.slug = v.slug;

update public.menu_items
set image_url = '/yamin-spesial-karet.jpeg'
where name = 'Yamin Spesial Karet';
