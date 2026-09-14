# AMG Distribuição — Android

Aplicativo Android em React + Capacitor. O catálogo é carregado da API pública
do projeto Next.js, portanto produtos e categorias continuam sendo cadastrados
uma única vez no painel atual.

## Desenvolvimento no navegador

Pré-requisitos: Node.js 20.19 ou mais recente e npm.

```bash
cd mobile
cp .env.example .env
npm install
npm run dev
```

No PowerShell, use `Copy-Item .env.example .env` no lugar de `cp`.

Para usar o backend local, troque `VITE_API_URL` por um endereço acessível pelo
celular/emulador. No emulador Android, o computador costuma ser `10.0.2.2`.

## Sincronizar e abrir no Android Studio

Instale também o Android Studio com o Android SDK 36 e JDK 21.

```bash
cd mobile
npm install
npm run sync
npm run android
```

O `npm run sync` sempre recompila a interface antes de copiar os arquivos para
o projeto Android. Ele também recria automaticamente os ícones e telas de
abertura a partir de `public/logo-old.png`. Use o Android Studio para executar
em um aparelho/emulador e para gerar APK ou AAB assinado.

## API usada pelo app

- `GET /api/mobile/catalog`
- `GET /api/mobile/produtos/:slug`

Antes de distribuir o APK, publique no Vercel as rotas acima e confira a URL em
`mobile/.env`.
