ALTER TABLE public.adicionales_menu_pedido DROP CONSTRAINT adicionales_menu_pedido_menus_por_pedido_id_fk;
ALTER TABLE public.adicionales_menu_pedido
ADD CONSTRAINT adicionales_menu_pedido_menus_por_pedido_id_fk
FOREIGN KEY (id_menu_pedido) REFERENCES menus_por_pedido (id) ON DELETE CASCADE;

ALTER TABLE public.menus_por_pedido DROP CONSTRAINT menus_por_pedido_pedidos_id_fk;
ALTER TABLE public.menus_por_pedido
ADD CONSTRAINT menus_por_pedido_pedidos_id_fk
FOREIGN KEY (id_pedido) REFERENCES pedidos (id) ON DELETE CASCADE;

ALTER TABLE public.estados_por_pedido DROP CONSTRAINT estados_por_pedido_pedidos_id_fk;
ALTER TABLE public.estados_por_pedido
ADD CONSTRAINT estados_por_pedido_pedidos_id_fk
FOREIGN KEY (id_pedido) REFERENCES pedidos (id) ON DELETE CASCADE;