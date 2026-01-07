# Teste de Syntax Highlighting

Este arquivo testa se o syntax highlighting está funcionando corretamente.

## JavaScript

```javascript
function helloWorld() {
  console.log("Hello, World!");
  const message = "Alexandria is working!";
  return message;
}

// Comentário em JavaScript
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map(n => n * 2);
```

## Python

```python
def hello_world():
    """Função que imprime Hello World"""
    message = "Hello, World!"
    print(message)
    return message

# Comentário em Python
numbers = [1, 2, 3, 4, 5]
doubled = [n * 2 for n in numbers]
```

## TypeScript

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  getUser(id: number): User | undefined {
    return this.users.find(user => user.id === id);
  }
}

// Comentário em TypeScript
const userService = new UserService();
```

## CSS

```css
.markdown-renderer {
  font-family: Arial, sans-serif;
  line-height: 1.4;
  color: #000000;
}

/* Comentário em CSS */
.hljs {
  background: #ffffff !important;
  border: 1px solid #cccccc;
}
```

## JSON

```json
{
  "name": "alexandria",
  "version": "1.0.0",
  "dependencies": {
    "highlight.js": "^11.11.1",
    "react": "^19.2.3"
  }
}
```

## Bash

```bash
#!/bin/bash
echo "Installing dependencies..."
npm install
npm run build

# Comentário em Bash
if [ -f "package.json" ]; then
  echo "Package.json found!"
fi
```

Se você conseguir ver cores diferentes para palavras-chave, strings, comentários e outros elementos, o syntax highlighting está funcionando!