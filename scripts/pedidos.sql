ALTER TABLE public.pedidos ADD nombre text NULL;
ALTER TABLE public.pedidos ADD observacion text NULL;

drop table menus_por_pedido;

CREATE TABLE public.menus_por_pedido
(
    id bigserial PRIMARY KEY,
    id_menu int NOT NULL,
    id_pedido bigint NOT NULL,
    observaciones text,
    CONSTRAINT menus_por_pedido_menus_id_fk FOREIGN KEY (id_menu) REFERENCES menus (id),
    CONSTRAINT menus_por_pedido_pedidos_id_fk FOREIGN KEY (id_pedido) REFERENCES pedidos (id)
);

drop table adicionales_menu_pedido;

CREATE TABLE public.adicionales_menu_pedido
(
    id bigserial PRIMARY KEY,
    id_menu_pedido bigint NOT NULL,
    id_producto bigint NOT NULL,
    CONSTRAINT adicionales_menu_pedido_menus_por_pedido_id_fk FOREIGN KEY (id_menu_pedido) REFERENCES menus_por_pedido (id),
    CONSTRAINT adicionales_menu_pedido_productos_id_fk FOREIGN KEY (id_producto) REFERENCES productos (id)
);
