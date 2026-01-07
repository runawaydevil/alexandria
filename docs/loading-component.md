# Componente de Loading Personalizado - Alexandria

## Visão Geral

O Alexandria agora usa um componente de loading personalizado que exibe a logo do projeto com uma animação de texto "Loading" embaixo, mantendo a consistência visual com o tema Y2K.

## Componente LoadingSpinner

### Localização
- `src/components/LoadingSpinner/LoadingSpinner.tsx`
- `src/components/LoadingSpinner/LoadingSpinner.css`

### Características

#### Visual
- **Logo estática**: Exibe a logo do Alexandria (alexandria.png)
- **Texto animado**: "Loading" com pontos animados (...)
- **Centralizado**: Posicionado no centro da página
- **Tema Y2K**: Cores e estilos consistentes com o design geral

#### Funcionalidades
- **Responsivo**: Adapta-se a diferentes tamanhos de tela
- **Acessível**: Suporte a `prefers-reduced-motion` e `prefers-contrast`
- **Flexível**: Diferentes tamanhos (small, medium, large)
- **Mensagem customizável**: Texto pode ser personalizado

### Propriedades

```typescript
interface LoadingSpinnerProps {
  message?: string      // Padrão: "Loading"
  size?: 'small' | 'medium' | 'large'  // Padrão: "medium"
  className?: string    // Classes CSS adicionais
}
```

### Tamanhos

#### Small
- Logo: 80px (60px em mobile)
- Altura mínima: 120px
- Uso: Loading de componentes pequenos (ToC)

#### Medium
- Logo: 120px (100px em mobile)
- Altura mínima: 200px
- Uso: Loading de conteúdo (Reader)

#### Large
- Logo: 160px (120px em mobile)
- Altura mínima: 300px
- Uso: Loading inicial (Home)

## Implementação

### Home Page
```tsx
<LoadingSpinner 
  message="Loading Alexandria" 
  size="large"
/>
```

### Reader Page
```tsx
<LoadingSpinner 
  message="Loading content" 
  size="medium"
/>
```

### ToC Loading
```tsx
<LoadingSpinner 
  message="Loading navigation" 
  size="small"
/>
```

## Animação

### Pontos Animados
- **Duração**: 1.4s por ciclo
- **Efeito**: Fade in/out + scale
- **Sequência**: Os três pontos animam em sequência
- **Acessibilidade**: Desabilitado com `prefers-reduced-motion`

### CSS Keyframes
```css
@keyframes loading-dot {
  0%, 80%, 100% {
    opacity: 0.3;
    transform: scale(0.8);
  }
  40% {
    opacity: 1;
    transform: scale(1);
  }
}
```

## Detecção de Ambiente

O componente detecta automaticamente o ambiente para carregar a logo correta:

```typescript
const getLogoPath = () => {
  // Produção (GitHub Pages)
  if (window.location.hostname.includes('github.io')) {
    return '/alexandria/alexandria.png'
  } else {
    // Desenvolvimento
    return '/alexandria.png'
  }
}
```

## Acessibilidade

### Reduced Motion
- Usuários com `prefers-reduced-motion: reduce` veem pontos estáticos
- Mantém funcionalidade sem animação

### High Contrast
- Bordas mais espessas na logo
- Texto em negrito
- Cores de alto contraste

### Responsive Design
- Tamanhos adaptáveis para mobile
- Padding e espaçamento otimizados
- Logo redimensionada automaticamente

## Vantagens

### Antes
- ❌ Ícone genérico de loading (🔄)
- ❌ Texto simples sem identidade visual
- ❌ Inconsistente entre páginas

### Depois
- ✅ Logo do Alexandria como elemento central
- ✅ Animação suave e profissional
- ✅ Consistência visual em todo o app
- ✅ Diferentes tamanhos para diferentes contextos
- ✅ Totalmente acessível e responsivo

## Integração

O componente substitui todos os antigos elementos de loading:
- Home page: Loading inicial do README
- Reader page: Loading de conteúdo
- ToC: Loading de navegação
- Botões: Estados de loading em ações

Isso cria uma experiência de usuário mais coesa e profissional, mantendo a identidade visual do Alexandria em todos os momentos de carregamento.