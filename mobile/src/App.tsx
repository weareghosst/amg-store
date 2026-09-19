import { useEffect, useMemo, useState } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Browser } from "@capacitor/browser";
import { Capacitor } from "@capacitor/core";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Share } from "@capacitor/share";
import { StatusBar, Style } from "@capacitor/status-bar";
import {
  API_URL,
  clearStoredSession,
  getCachedCatalog,
  getCatalog,
  getStoredSession,
  login,
  logout,
  productImageUrl,
  refreshSession,
} from "./api";
import {
  ArrowLeftIcon,
  GridIcon,
  HeartIcon,
  HomeIcon,
  ImageIcon,
  LogOutIcon,
  RefreshIcon,
  SearchIcon,
  ShareIcon,
  UserIcon,
} from "./icons";
import type { AuthSession, CatalogResponse, Category, Product } from "./types";
import { useFavorites } from "./use-favorites";

type Tab = "inicio" | "catalogo" | "favoritos" | "conta";

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
  const priceOnRequest = product.priceCents <= 0;
  const unavailable = !priceOnRequest && product.stock <= 0;
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
          {!priceOnRequest && product.comparePriceCents && product.comparePriceCents > product.priceCents ? (
            <span className="old-price">{money(product.comparePriceCents)}</span>
          ) : null}
          <strong className={priceOnRequest ? "price-on-request" : undefined}>{priceOnRequest ? "Consulte pelo WhatsApp" : money(product.priceCents)}</strong>
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
  session,
}: {
  catalog: CatalogResponse | null;
  loading: boolean;
  favorites: string[];
  toggleFavorite: (id: string) => void;
  selectCategory: (slug: string) => void;
  session: AuthSession | null;
}) {
  return (
    <>
      <header className="topbar">
        <Logo />
        <button
          type="button"
          className="login-button"
          onClick={() => goTo("conta")}
        >
          {session ? session.user.name.split(" ")[0] : "Entrar"}
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

function AccountScreen({
  session,
  checking,
  onLogin,
  onLogout,
}: {
  session: AuthSession | null;
  checking: boolean;
  onLogin: (email: string, password: string) => Promise<void>;
  onLogout: () => Promise<void>;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await onLogin(email, password);
      setPassword("");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "Não foi possível entrar.");
    } finally {
      setSubmitting(false);
    }
  };

  const leave = async () => {
    setSubmitting(true);
    setMessage("");
    try {
      await onLogout();
    } catch {
      setMessage("Você saiu da conta neste aparelho.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <header className="topbar"><Logo /><span className="result-count">Minha conta</span></header>
      <main className="screen account-screen">
        {checking ? (
          <div className="account-loading"><div className="account-spinner" /><p>Verificando sua conta...</p></div>
        ) : session ? (
          <>
            <section className="profile-card">
              <div className="profile-avatar"><UserIcon /></div>
              <div><span>Olá,</span><h1>{session.user.name}</h1><p>{session.user.email}</p></div>
            </section>
            <section className="account-info">
              <h2>Dados da conta</h2>
              <div><span>Nome</span><strong>{session.user.name}</strong></div>
              <div><span>E-mail</span><strong>{session.user.email}</strong></div>
              {session.user.phone ? <div><span>Telefone</span><strong>{session.user.phone}</strong></div> : null}
            </section>
            <button className="logout-button" type="button" disabled={submitting} onClick={() => void leave()}>
              <LogOutIcon /> {submitting ? "Saindo..." : "Sair da conta"}
            </button>
            {message ? <p className="form-message" role="status">{message}</p> : null}
          </>
        ) : (
          <section className="login-panel">
            <div className="login-heading">
              <div className="login-symbol"><UserIcon /></div>
              <span className="eyebrow dark">Área do cliente</span>
              <h1>Entre na sua conta</h1>
              <p>Use o mesmo e-mail e senha cadastrados no site da AMG.</p>
            </div>
            <form className="login-form" onSubmit={(event) => void submit(event)}>
              <label>
                <span>E-mail</span>
                <input
                  type="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  autoComplete="email"
                  placeholder="seuemail@exemplo.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </label>
              <label>
                <span>Senha</span>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </label>
              {message ? <p className="form-error" role="alert">{message}</p> : null}
              <button className="submit-login" type="submit" disabled={submitting}>
                {submitting ? "Entrando..." : "Entrar"}
              </button>
            </form>
            <button className="forgot-link" type="button" onClick={() => void Browser.open({ url: `${API_URL}/recuperar-senha` })}>
              Esqueci minha senha
            </button>
          </section>
        )}
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
  const priceOnRequest = product.priceCents <= 0;
  const unavailable = !priceOnRequest && product.stock <= 0;
  const buy = async () => {
    const priceLine = priceOnRequest ? "" : `\nPreço anunciado: ${money(product.priceCents)}`;
    const message = `Olá! Vim pelo aplicativo da AMG e tenho interesse neste produto:\n\n${product.name}${product.sku ? ` (cód. ${product.sku})` : ""}${priceLine}\n${productUrl}\n\nPode me passar o preço e mais informações?`;
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
      <div className="detail-image"><ProductImage product={product}/>{unavailable && <span className="stock-badge">Esgotado</span>}</div>
      <div className="detail-content">
        {category && <span className="category-label">{category.name}</span>}
        {product.sku && <span className="sku">SKU {product.sku}</span>}
        <h1>{product.name}</h1>
        <div className="detail-price">{!priceOnRequest && product.comparePriceCents && product.comparePriceCents > product.priceCents ? <span>{money(product.comparePriceCents)}</span> : null}<strong className={priceOnRequest ? "price-on-request" : undefined}>{priceOnRequest ? "Consulte o preço pelo WhatsApp" : money(product.priceCents)}</strong></div>
        <button className="whatsapp-cta" type="button" disabled={!whatsappPhone || unavailable} onClick={() => void buy()}>{unavailable ? "Produto esgotado" : priceOnRequest ? "Consultar pelo WhatsApp" : "Comprar pelo WhatsApp"}</button>
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
    { id: "conta", label: "Conta", icon: UserIcon },
  ];
  return <nav className="bottom-nav">{items.map(({ id, label, icon: Icon }) => <button type="button" key={id} className={active === id ? "active" : ""} onClick={() => goTo(id)}><Icon fill={active === id && id === "favoritos" ? "currentColor" : "none"}/><span>{label}</span></button>)}</nav>;
}

export function App() {
  const [route, setRoute] = useState(currentRoute);
  const [catalog, setCatalog] = useState<CatalogResponse | null>(getCachedCatalog);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [session, setSession] = useState<AuthSession | null>(() => getStoredSession());
  const [checkingAuth, setCheckingAuth] = useState(() => Boolean(getStoredSession()));
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
    const storedSession = getStoredSession();
    if (storedSession) {
      refreshSession(storedSession)
        .then(setSession)
        .catch(() => {
          clearStoredSession();
          setSession(null);
        })
        .finally(() => setCheckingAuth(false));
    }
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
  const tab: Tab = route === "catalogo" || route === "favoritos" || route === "conta" ? route : "inicio";
  const selectCategory = (slug: string) => { setSelectedCategory(slug); goTo("catalogo"); };
  const handleLogin = async (email: string, password: string) => {
    const nextSession = await login(email, password);
    setSession(nextSession);
    void Haptics.impact({ style: ImpactStyle.Light }).catch(() => undefined);
  };
  const handleLogout = async () => {
    const activeSession = session;
    setSession(null);
    if (activeSession) await logout(activeSession);
  };

  if (product) {
    return <ProductScreen product={product} category={catalog?.categories.find((item) => item.id === product.categoryId) ?? null} whatsappPhone={catalog?.whatsappPhone ?? ""} favorite={favorites.includes(product.id)} toggleFavorite={() => toggle(product.id)}/>;
  }

  return (
    <div className="app-shell">
      {error && <div className="offline-banner"><span>{catalog ? "Mostrando o último catálogo salvo." : error}</span><button type="button" onClick={() => void load()}><RefreshIcon/> Tentar novamente</button></div>}
      {tab === "inicio" && <HomeScreen catalog={catalog} loading={loading} favorites={favorites} toggleFavorite={toggle} selectCategory={selectCategory} session={session}/>}
      {tab === "catalogo" && <CatalogScreen catalog={catalog} loading={loading} favorites={favorites} toggleFavorite={toggle} selectedCategory={selectedCategory} setSelectedCategory={setSelectedCategory}/>}
      {tab === "favoritos" && <FavoritesScreen catalog={catalog} favorites={favorites} toggleFavorite={toggle}/>}
      {tab === "conta" && <AccountScreen session={session} checking={checkingAuth} onLogin={handleLogin} onLogout={handleLogout}/>}
      <BottomNav active={tab}/>
    </div>
  );
}
