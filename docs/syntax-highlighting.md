# Syntax Highlighting no Alexandria

## Configuração

O Alexandria usa `rehype-highlight` com `highlight.js` para fornecer syntax highlighting nos blocos de código Markdown.

### Dependências

- `highlight.js`: ^11.11.1 (dependência direta)
- `rehype-highlight`: ^7.0.2 (plugin para react-markdown)

### Tema

Utilizamos o tema `github.css` do highlight.js, que é limpo e se adapta bem ao estilo Y2K do Alexandria.

## Como Funciona

1. **Importação**: O CSS do highlight.js é importado no `MarkdownRenderer.tsx`
2. **Plugin**: O `rehype-highlight` processa os blocos de código
3. **Estilos**: CSS customizado sobrescreve cores para manter consistência com o tema Y2K

## Linguagens Suportadas

O highlight.js suporta mais de 190 linguagens, incluindo:

- JavaScript/TypeScript
- Python
- Java
- C/C++
- CSS/SCSS
- HTML
- JSON
- Bash/Shell
- SQL
- E muitas outras...

## Personalização

Os estilos são customizados no `MarkdownRenderer.css` para manter a consistência com o tema Y2K:

```css
.markdown-renderer .hljs {
  background: var(--background-color) !important;
  color: var(--text-color) !important;
  border: 1px solid var(--border-color);
}
```

## Verificação

Para verificar se o syntax highlighting está funcionando:

1. Acesse um arquivo Markdown com blocos de código
2. Verifique se palavras-chave, strings e comentários têm cores diferentes
3. Use o arquivo de teste: `/public/test-syntax.md`

## Troubleshooting

Se o syntax highlighting não estiver funcionando:

1. Verifique se `highlight.js` está instalado: `npm list highlight.js`
2. Verifique se o CSS está sendo importado corretamente
3. Verifique o console do navegador para erros
4. Execute `npm run verify-deps` para verificar dependências

## Build e Deploy

O GitHub Actions verifica automaticamente:

- Instalação do highlight.js
- Verificação de dependências
- Build bem-sucedido
- Geração correta dos assets CSS

Isso garante que o syntax highlighting funcione corretamente em produção.