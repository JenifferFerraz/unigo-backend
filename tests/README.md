# Testes - UniGo Backend

Este diretório contém todos os testes para o projeto UniGo Backend, incluindo testes unitários e de integração.

## Estrutura de Testes

```
tests/
├── unit/                    # Testes unitários
│   ├── services/           # Testes dos serviços
│   └── controllers/        # Testes dos controladores
├── integration/            # Testes de integração
├── utils/                  # Utilitários para testes
├── setup.ts               # Configuração global dos testes
├── test.env               # Variáveis de ambiente para testes
└── README.md              # Este arquivo
```

## Tipos de Testes

### Testes Unitários
- **Localização**: `tests/unit/`
- **Objetivo**: Testar funções e métodos individuais isoladamente
- **Cobertura**: Serviços, controladores, utilitários
- **Mocks**: Simulam dependências externas (banco de dados, APIs)

### Testes de Integração
- **Localização**: `tests/integration/`
- **Objetivo**: Testar a integração entre diferentes componentes
- **Cobertura**: Rotas da API, fluxos completos
- **Mocks**: Apenas dependências externas (banco de dados)

## Executando os Testes

### Instalar Dependências
```bash
npm install
```

### Executar Todos os Testes
```bash
npm test
```

### Executar Testes Unitários
```bash
npm run test:unit
```

### Executar Testes de Integração
```bash
npm run test:integration
```

### Executar Testes com Watch Mode
```bash
npm run test:watch
```

### Executar Testes com Cobertura
```bash
npm run test:coverage
```

## Configuração

### Jest Configuration
O arquivo `jest.config.js` contém a configuração do Jest:
- **Preset**: `ts-jest` para suporte ao TypeScript
- **Environment**: `node` para testes de backend
- **Coverage**: Configurado para coletar cobertura de `src/`
- **Setup**: `tests/setup.ts` é executado antes dos testes

### Variáveis de Ambiente
O arquivo `tests/test.env` contém as variáveis de ambiente para testes:
- **Database**: Configuração do banco de teste
- **JWT**: Chaves secretas para testes
- **Email**: Configuração mock para envio de emails

## Estrutura dos Testes

### Testes Unitários

#### UserService.test.ts
- ✅ Validação de dados de usuário
- ✅ Criação de usuário com perfil de estudante
- ✅ Tratamento de erros (email duplicado, matrícula duplicada)
- ✅ Geração de tokens JWT

#### CourseService.test.ts
- ✅ Criação de curso individual
- ✅ Criação de cursos em massa
- ✅ Busca de todos os cursos
- ✅ Tratamento de erros de banco de dados

#### UserController.test.ts
- ✅ Criação de usuário via API
- ✅ Validação de dados de entrada
- ✅ Tratamento de erros de validação
- ✅ Respostas HTTP corretas

#### CourseController.test.ts
- ✅ Criação de curso via API
- ✅ Criação de cursos em massa via API
- ✅ Busca de cursos via API
- ✅ Tratamento de erros de serviço

### Testes de Integração

#### auth.integration.test.ts
- ✅ Login com credenciais válidas
- ✅ Login com credenciais inválidas
- ✅ Login com termos não aceitos
- ✅ Busca de perfil de usuário
- ✅ Solicitação de reset de senha
- ✅ Reset de senha
- ✅ Aceitação de termos

#### user.integration.test.ts
- ✅ Criação de usuário via API
- ✅ Validação de campos obrigatórios
- ✅ Tratamento de email duplicado
- ✅ Tratamento de matrícula duplicada
- ✅ Validação de perfil de estudante

#### course.integration.test.ts
- ✅ Criação de curso via API
- ✅ Criação de cursos em massa via API
- ✅ Busca de cursos via API
- ✅ Tratamento de erros de serviço

## Utilitários de Teste

### TestDataFactory
Classe para criar objetos mock padronizados:
- `createMockUser()` - Cria usuário mock
- `createMockStudentProfile()` - Cria perfil de estudante mock
- `createMockCourse()` - Cria curso mock
- `createMockCreateUserDTO()` - Cria DTO de criação de usuário
- `createMockCreateCourseDto()` - Cria DTO de criação de curso

### MockRepositoryFactory
Classe para criar repositórios mock:
- `createMockRepository()` - Cria repositório mock completo
- `createMockQueryBuilder()` - Cria query builder mock

### TestAssertions
Classe com helpers para asserções:
- `assertUserResponse()` - Valida resposta de usuário
- `assertCourseResponse()` - Valida resposta de curso
- `assertErrorResponse()` - Valida resposta de erro

### TestDatabaseHelpers
Classe com helpers para banco de dados:
- `mockSuccessfulTransaction()` - Mock de transação bem-sucedida
- `mockFailedTransaction()` - Mock de transação falhada

## Boas Práticas

### 1. Nomenclatura
- Use `describe()` para agrupar testes relacionados
- Use `it()` para casos de teste específicos
- Use nomes descritivos que expliquem o comportamento esperado

### 2. Estrutura AAA
- **Arrange**: Configure os dados e mocks necessários
- **Act**: Execute a função/método sendo testado
- **Assert**: Verifique se o resultado é o esperado

### 3. Mocks
- Mock apenas dependências externas
- Use `jest.clearAllMocks()` no `beforeEach()`
- Prefira mocks específicos a mocks genéricos

### 4. Cobertura
- Mantenha cobertura de código acima de 80%
- Foque em testar casos de sucesso e erro
- Teste edge cases e validações

### 5. Dados de Teste
- Use `TestDataFactory` para criar dados consistentes
- Evite dados hardcoded nos testes
- Use dados realistas mas não sensíveis

## Troubleshooting

### Erro: "Cannot find module"
- Verifique se as dependências estão instaladas
- Execute `npm install` novamente

### Erro: "Database connection failed"
- Verifique se o banco de dados está rodando
- Verifique as variáveis de ambiente em `tests/test.env`

### Erro: "Jest timeout"
- Aumente o timeout no `jest.config.js`
- Verifique se os mocks estão configurados corretamente

### Erro: "Module not found"
- Verifique se o caminho do import está correto
- Verifique se o arquivo existe no local esperado

## Contribuindo

Ao adicionar novos testes:
1. Siga a estrutura existente
2. Use os utilitários disponíveis
3. Mantenha a cobertura de código
4. Documente casos de teste complexos
5. Execute todos os testes antes de fazer commit
