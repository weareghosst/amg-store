import { useEffect, useMemo, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";
import { API_URL, getCachedCatalog, getCatalog, productImageUrl } from "./api";
import {
  ArrowLeftIcon,
  GridIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  RefreshIcon,
  SearchIcon,
  ShareIcon,
} from "./icons";
import type { CatalogResponse, Category, Product } from "./types";
import { useFavorites } from "./use-favorites";

type Tab = "inicio" | "catalogo" | "favoritos";

function money(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function currentRoute() {
  return window.location.hash.replace(/^#\/?/, "") || "inicio";
}

function goTo(path: string) {
  window.location.hash = `/${path}`;
}

function Logo() {
  return (
    <img
      className="brand-logo"
      src="/logo-header.png"
      alt="AMG — Produtos de Limpeza e Variedades"
    />
  );
}

function ProductImage({ product }: { product: Product }) {
  const src = productImageUrl(product.imageUrl);
  return src ? (
    <img src={src} alt={product.name} loading="lazy" />
  ) : (
    <div className="image-placeholder"><ImageIcon /></div>
  );
}

function FavoriteButton({
  active,
  onClick,
  label = "Favoritar",
}: {
  active: boolean;
  onClick: () => void;
  label?: string;
}) {
  return (
    <button
      className={`favorite-button ${active ? "is-active" : ""}`}
      type="button"
      aria-label={active ? "Remover dos favoritos" : label}
      onClick={(event) => {
        event.stopPropagation();
        void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
        onClick();
      }}
    >
      <HeartIcon fill={active ? "currentColor" : "none"} />
    </button>
  );
}

function ProductCard({
  product,
  favorite,
  onToggleFavorite,
}: {
  product: Product;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const unavailable = product.stock <= 0;
  return (
    <article
      className="product-card"
      role="button"
      tabIndex={0}
      onClick={() => goTo(`produto/${product.slug}`)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") goTo(`produto/${product.slug}`);
      }}
    >
      <div className="product-card-image">
        <ProductImage product={product} />
        <FavoriteButton active={favorite} onClick={onToggleFavorite} />
        {unavailable && <span className="stock-badge">Esgotado</span>}
      </div>
      <div className="product-card-body">
        <h3>{product.name}</h3>
        <div className="price-row">
          {product.comparePriceCents && product.comparePriceCents > product.priceCents ? (
            <span className="old-price">{money(product.comparePriceCents)}</span>
          ) : null}
          <strong>{money(product.priceCents)}</strong>
        </div>
      </div>
    </article>
  );
}

function ProductGrid({
  products,
  favorites,
  toggleFavorite,
  emptyMessage = "Nenhum produto encontrado.",
}: {
  products: Product[];
  favorites: string[];
  toggleFavorite: (id: string) => void;
  emptyMessage?: string;
}) {
  if (!products.length) {
    return <div className="empty-state"><span>🧼</span><p>{emptyMessage}</p></div>;
  }
  return (
    <div className="product-grid">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          favorite={favorites.includes(product.id)}
          onToggleFavorite={() => toggleFavorite(product.id)}
        />
      ))}
    </div>
  );
}

function LoadingCards() {
  return <div className="product-grid" aria-label="Carregando produtos">{[1, 2, 3, 4].map((item) => <div className="product-card skeleton-card" key={item}><div className="skeleton image"/><div className="skeleton line"/><div className="skeleton short-line"/></div>)}</div>;
}

function HomeScreen({
  catalog,
  loading,
  favorites,
  toggleFavorite,
  selectCategory,
}: {
  catalog: CatalogResponse | null;
  loading: boolean;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  selectCategory: (slug: string) => void;
}) {
  return (
    <>
      <header className="topbar">
        <Logo />
        <button
          type="button"
          className="login-button"
          onClick={() => void Browser.open({ url: `${API_URL}/entrar` })}
        >
          Entrar
        </button>
      </header>
      <div className="info-strip">
        <span>Vendas em atacado e varejo</span>
        <span>Entregas em São Paulo</span>
      </div>
      <main className="screen home-screen">
        <section className="hero">
          <div className="hero-overlay" />
          <img
            className="hero-logo"
            src="/logo-old.png"
            alt="AMG — Centro de Distribuição"
          />
          <div className="hero-copy">
            <div className="sales-badge"><span>Atacado</span><span>Varejo</span></div>
            <h1>Produtos de limpeza e variedades <strong>para sua casa e sua empresa</strong></h1>
            <p>Mais praticidade, mais economia, mais qualidade pra você! Entrega própria em São Paulo e retirada na loja.</p>
            <button type="button" className="catalog-button" onClick={() => goTo("catalogo")}>Ver produtos</button>
          </div>
          <button type="button" className="search-shortcut" onClick={() => goTo("catalogo")}>
            <SearchIcon /> <span>Buscar produtos...</span>
          </button>
        </section>

        <section className="section-block">
          <div className="section-title"><div><span className="eyebrow dark">Explore</span><h2>Categorias</h2></div><button type="button" onClick={() => goTo("catalogo")}>Ver todas</button></div>
          <div className="category-scroll">
            {(catalog?.categories ?? []).map((category) => (
              <button type="button" className="category-card" key={category.id} onClick={() => selectCategory(category.slug)}>
                {category.name}
              </button>
            ))}
            {!loading && !catalog?.categories.length ? <p className="muted">As categorias aparecerão aqui.</p> : null}
          </div>
        </section>

        <section className="section-block">
          <div className="section-title"><div><span className="eyebrow dark">Recém-chegados</span><h2>Novidades</h2></div><button type="button" onClick={() => goTo("catalogo")}>Ver todos</button></div>
          {loading && !catalog ? <LoadingCards /> : <ProductGrid products={(catalog?.products ?? []).slice(0, 8)} favorites={favorites} toggleFavorite={toggleFavorite} emptyMessage="Nenhum produto cadastrado ainda." />}
        </section>
      </main>
    </>
  );
}

function CatalogScreen({
  catalog,
  loading,
  favorites,
  toggleFavorite,
  selectedCategory,
  setSelectedCategory,
}: {
  catalog: CatalogResponse | null;
  loading: boolean;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  selectedCategory: string;
  setSelectedCategory: (slug: string) => void;
}) {
  const [query, setQuery] = useState("");
  const products = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return (catalog?.products ?? []).filter((product) => {
      const inCategory = !selectedCategory || product.categoryId === catalog?.categories.find((category) => category.slug === selectedCategory)?.id;
      const searchable = `${product.name} ${product.description} ${product.sku ?? ""}`.toLocaleLowerCase("pt-BR");
      return inCategory && (!normalized || searchable.includes(normalized));
    });
  }, [catalog, query, selectedCategory]);

  return (
    <>
      <header className="topbar"><Logo /><span className="result-count">{products.length} produtos</span></header>
      <main className="screen catalog-screen">
        <h1>Todos os produtos</h1>
        <label className="search-field"><SearchIcon/><input value={query} onChange={(event) => setQuery(event.target.value)} type="search" placeholder="Buscar por nome ou código..." autoFocus={false}/>{query && <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">×</button>}</label>
        <div className="filter-scroll">
          <button type="button" className={!selectedCategory ? "active" : ""} onClick={() => setSelectedCategory("")}>Todos</button>
          {(catalog?.categories ?? []).map((category) => <button type="button" className={selectedCategory === category.slug ? "active" : ""} onClick={() => setSelectedCategory(category.slug)} key={category.id}>{category.name}</button>)}
        </div>
        {loading && !catalog ? <LoadingCards /> : <ProductGrid products={products} favorites={favorites} toggleFavorite={toggleFavorite} />}
      </main>
    </>
  );
}

function FavoritesScreen({ catalog, favorites, toggleFavorite }: { catalog: CatalogResponse | null; favorites: string[]; toggleFavorite: (id: string) => void }) {
  const products = (catalog?.products ?? []).filter((product) => favorites.includes(product.id));
  return (
    <>
      <header className="topbar"><Logo /></header>
      <main className="screen favorites-screen">
        <h1>Meus favoritos</h1>
        <p className="page-intro">Guarde aqui os produtos que você quer encontrar mais rápido.</p>
        <ProductGrid products={products} favorites={favorites} toggleFavorite={toggleFavorite} emptyMessage="Você ainda não favoritou nenhum produto." />
      </main>
    </>
  );
}

function ProductScreen({ product, category, whatsappPhone, favorite, toggleFavorite }: { product: Product; category: Category | null; whatsappPhone: string; favorite: boolean; toggleFavorite: () => void }) {
  const productUrl = `${API_URL}/produtos/${product.slug}`;
  const buy = async () => {
    const message = `Olá! Vim pelo aplicativo da AMG e tenho interesse neste produto:\n\n${product.name}${product.sku ? ` (cód. ${product.sku})` : ""}\nPreço anunciado: ${money(product.priceCents)}\n${productUrl}\n\nPode me passar mais informações?`;
    const phone = whatsappPhone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    await Browser.open({ url });
  };
  const share = async () => {
    await Share.share({ title: product.name, text: `Veja este produto na AMG: ${product.name}`, url: productUrl, dialogTitle: "Compartilhar produto" });
  };
  return (
    <main className="product-screen">
      <div className="detail-actions"><button type="button" onClick={() => history.back()} aria-label="Voltar"><ArrowLeftIcon/></button><div><button type="button" onClick={() => void share()} aria-label="Compartilhar"><ShareIcon/></button><FavoriteButton active={favorite} onClick={toggleFavorite}/></div></div>
      <div className="detail-image"><ProductImage product={product}/>{product.stock <= 0 && <span className="stock-badge">Esgotado</span>}</div>
      <div className="detail-content">
        {category && <span className="category-label">{category.name}</span>}
        {product.sku && <span className="sku">SKU {product.sku}</span>}
        <h1>{product.name}</h1>
        <div className="detail-price">{product.comparePriceCents && product.comparePriceCents > product.priceCents ? <span>{money(product.comparePriceCents)}</span> : null}<strong>{money(product.priceCents)}</strong></div>
        <button className="whatsapp-cta" type="button" disabled={!whatsappPhone || product.stock <= 0} onClick={() => void buy()}>{product.stock <= 0 ? "Produto esgotado" : "Comprar pelo WhatsApp"}</button>
        <div className="delivery-card"><span>🚚</span><div><strong>Entrega e retirada</strong><p>Entrega própria em São Paulo ou retirada na loja. Outros estados sob consulta.</p></div></div>
        {product.description && <section className="description"><h2>Sobre o produto</h2><p>{product.description}</p></section>}
      </div>
    </main>
  );
}

function BottomNav({ active }: { active: Tab }) {
  const items: { id: Tab; label: string; icon: typeof HomeIcon }[] = [
    { id: "inicio", label: "Início", icon: HomeIcon },
    { id: "catalogo", label: "Produtos", icon: GridIcon },
    { id: "favoritos", label: "Favoritos", icon: HeartIcon },
  ];
  return <nav className="bottom-nav">{items.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={active === id ? "active" : ""} onClick={() => goTo(id)}><Icon fill={active === id && id === "favoritos" ? "currentColor" : "none"}/><span>{label}</span></button>)}</nav>;
}

export function App() {
  const [route, setRoute] = useState(currentRoute);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(getCachedCatalog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const { favorites, toggle } = useFavorites();

  const load = async () => {
    setLoading(true); setError("");
    try { setCatalog(await getCatalog()); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Erro ao carregar o catálogo."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!window.location.hash) history.replaceState(null, "", "#/inicio");
    const onHashChange = () => setRoute(currentRoute());
    window.addEventListener("hashchange", onHashChange);
    const controller = new AbortController();
    getCatalog(controller.signal)
      .then((nextCatalog) => setCatalog(nextCatalog))
      .catch((reason: unknown) => {
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Erro ao carregar o catálogo.");
      })
      .finally(() => setLoading(false));
    if (Capacitor.isNativePlatform()) void StatusBar.setStyle({ style: Style.Light });
    const backListener = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      const activeRoute = currentRoute();
      if (activeRoute.startsWith("produto/")) history.back();
      else if (activeRoute !== "inicio") goTo("inicio");
      else if (!canGoBack) void CapacitorApp.exitApp();
    });
    return () => { controller.abort(); window.removeEventListener("hashchange", onHashChange); void backListener.then((handle) => handle.remove()); };
  }, []);

  const productSlug = route.startsWith("produto/") ? decodeURIComponent(route.slice("produto/".length)) : "";
  const product = productSlug ? catalog?.products.find((item) => item.slug === productSlug) : undefined;
  const tab: Tab = route === "catalogo" || route === "favoritos" ? route : "inicio";
  const selectCategory = (slug: string) => { setSelectedCategory(slug); goTo("catalogo"); };

  if (product) {
    return <ProductScreen product={product} category={catalog?.categories.find((item) => item.id === product.categoryId) ?? null} whatsappPhone={catalog?.whatsappPhone ?? ""} favorite={favorites.includes(product.id)} toggleFavorite={() => toggle(product.id)}/>;
  }

  return (
    <div className="app-shell">
      {error && <div className="offline-banner"><span>{catalog ? "Mostrando o último catálogo salvo." : error}</span><button type="button" onClick={() => void load()}><RefreshIcon/> Tentar novamente</button></div>}
      {tab === "inicio" && <HomeScreen catalog={catalog} loading={loading} favorites={favorites} toggleFavorite={toggle} selectCategory={selectCategory}/>} 
      {tab === "catalogo" && <CatalogScreen catalog={catalog} loading={loading} favorites={favorites} toggleFavorite={toggle} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}/>} 
      {tab === "favoritos" && <FavoritesScreen catalog={catalog} favorites={favorites} toggleFavorite={toggle}/>} 
      <BottomNav active={tab}/>
    </div>
  );
}
