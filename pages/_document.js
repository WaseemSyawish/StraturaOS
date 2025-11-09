import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html>
      <Head>
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
