import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
        {/* Favicon and icons - using SVG as primary */}
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/android-chrome-192x192.png" />
        <link rel="icon" type="image/png" sizes="512x512" href="/android-chrome-512x512.png" />

        <link rel="manifest" href="/site.webmanifest" />
        <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet" />
      </Head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            try {
              var path = (typeof location !== 'undefined' && location.pathname) ? location.pathname : '/';
              var isLanding = path === '/' || path === '/landing' || path.indexOf('/landing') === 0;
              
              if (isLanding) {
                try { document.documentElement.classList.remove('dark'); } catch(e){}
                return;
              }
              
              var raw = localStorage.getItem('up:settings');
              var parsed = raw ? JSON.parse(raw || '{}') : {};
              var theme = parsed.theme || 'system';
              
              if (theme === 'dark') document.documentElement.classList.add('dark');
              if (theme === 'system') {
                try { 
                  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) 
                    document.documentElement.classList.add('dark'); 
                } catch(e){}
              }
            } catch(e){}
          })();
        ` }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
