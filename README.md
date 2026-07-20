# Site Mipri Gráfica Express

Site estático (HTML, CSS e JS puro) pronto para hospedagem compartilhada na GoDaddy.

## Estrutura

```
index.html          Home
sobre.html
servicos.html        Página-índice de serviços
servicos/             9 subpáginas de serviço
clientes.html
contato.html
css/style.css
js/main.js
img/logo.png
img/favicon-16.png, img/favicon-32.png, img/apple-touch-icon.png, img/favicon-512.png  Favicon (gerado a partir de LOGOFAVICON.jpg)
video/backgroundhero.webm  Vídeo de fundo da Hero (Home)
robots.txt
sitemap.xml
```

Ícones (WhatsApp, Instagram, localização, e-mail, check, seta para topo) usam um sprite `<svg>` embutido no início do `<body>` de cada página (não é arquivo externo — `<use href="../img/icons.svg#...">` não funciona ao abrir o HTML direto pelo `file://`, então o sprite fica inline em cada `.html`).

## Antes de publicar

1. **Domínio**: todas as páginas usam `https://www.miprigrafica.com/` como URL canônica (tags `canonical`, Open Graph e Schema.org). Confirme se este é o domínio real e ajuste em todas as páginas caso contrário (busca e substitui em todos os `.html`).
2. **Google Tag Manager / Analytics**: cada página tem um snippet de GTM com o ID de exemplo `GTM-XXXXXXX` (no `<head>` e logo após `<body>`). Substitua pelo ID real do seu contêiner em todos os arquivos `.html`. O GA4 pode ser conectado dentro do próprio GTM (não precisa de outro snippet).
3. **Formulário de contato**: por padrão, o formulário abre um e-mail (`mailto:`) pronto para `mipri@miprigrafica.com`. Para enviar direto para uma planilha Google:
   - Crie um Google Apps Script publicado como Web App que grava os dados em uma planilha.
   - Cole a URL do Web App na constante `FORM_ENDPOINT` em [js/main.js](js/main.js).
4. **CNPJ**: já preenchido no rodapé de todas as páginas (`34.840.394/0001-08`). Se mudar, atualize em todos os `.html`.
5. **Clientes (logos)**: a estrutura de carrossel infinito já está pronta em `index.html` e `clientes.html` (`.logos-track`). Para ativar, adicione tags `<img src="img/clientes/nome.png" alt="Nome do Cliente">` dentro de `#logosTrack`, duplicando a lista completa uma segunda vez na mesma div para o loop ficar contínuo.
6. **Cases de sucesso**: bloco placeholder pronto na Home — substitua o `.placeholder-block` por conteúdo real quando disponível.
7. **Depoimentos**: atualmente estáticos (editáveis direto no HTML). Não há integração automática com o Google Meu Negócio.
8. **Vídeo da Hero**: `video/backgroundhero.webm` toca em loop, mudo, atrás dos 3 slides de texto que continuam revezando por cima. Ele é desativado automaticamente em telas ≤640px e para quem tem `prefers-reduced-motion` ativado — nesses casos fica só o fundo teal + overlay escuro. Como `.webm` não toca no Safari, considere gerar também um `.mp4` (H.264) e adicionar `<source src="video/backgroundhero.mp4" type="video/mp4">` como segunda fonte dentro da tag `<video>` em `index.html` para cobrir esses navegadores.
9. **Favicon**: gerado a partir de `LOGOFAVICON.jpg` (recorte quadrado central + redimensionamento para 16/32/180/512px). O arquivo original de 1.2MB continua na raiz do projeto só como fonte — não é usado pelo site e pode ser apagado se não precisar mais dele.
10. **Paleta de cores**: `--teal` (`#016559`) e as demais variáveis de verde em `css/style.css` seguem o arquivo mestre no CorelDraw (a cor extraída do JPG do logo saiu errada por causa da exportação/compressão, não use ela como referência).
11. **Página de manutenção**: `manutencao.html` é uma página avulsa (não linkada em nenhum menu, tem `<meta name="robots" content="noindex, nofollow">`) pra deixar no ar enquanto o site principal não estiver pronto. Pra ativar: renomeie `index.html` para outro nome (ex: `index-dev.html`) e renomeie `manutencao.html` para `index.html` no `public_html` da hospedagem. Pra voltar ao site normal, é só desfazer a troca.

## Publicando na GoDaddy

1. Aponte o domínio da Nuvemshop para a GoDaddy (altere os nameservers/DNS no painel onde o domínio foi registrado para apontar para a hospedagem GoDaddy).
2. Envie todos os arquivos desta pasta para a raiz `public_html` (ou equivalente) via gerenciador de arquivos ou FTP da hospedagem GoDaddy.
3. Não é necessário Node.js, build ou banco de dados — é só HTML/CSS/JS estático.

## Contatos usados no site

- WhatsApp: (11) 94981-0102
- E-mail geral: mipri@miprigrafica.com
- E-mail técnico (plotagem): plotagem@miprigrafica.com
- Endereço: Av. Bosque da Saúde, 1911 - Vila da Saúde, São Paulo - SP, 04142-092
- Instagram: @graficamipri
