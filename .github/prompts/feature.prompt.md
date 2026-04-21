# Automated Git Workflow with Semantic Commits and Pull Request

## Instruções
Execute as seguintes etapas na ordem especificada:
### 1. Análise das Mudanças
### 1. Análise das Mudanças
- Execute `git status` e `git diff` para analisar todas as mudanças não commitadas
- Identifique o tipo de mudanças realizadas:
    - **feature**: Nova funcionalidade ou recurso
    - **fix**: Correção de bug em produção
    - **hotfix**: Correção urgente em produção
    - **chore**: Mudanças em configurações, dependências, ou tarefas de manutenção
    - **docs**: Mudanças apenas em documentação
    - **refactor**: Refatoração de código sem mudança de funcionalidade
    - **test**: Adição ou modificação de testes
    - **style**: Formatação de código, sem mudança de lógica
    - **perf**: Melhorias de performance
- Analise o contexto e determine o tipo principal das mudanças

### 2. Criação da Branch
- Baseado no tipo de mudança identificado, crie uma branch seguindo o padrão:
    - `feature/descricao-curta-da-mudanca`
    - `fix/descricao-do-bug`
    - `hotfix/descricao-urgente`
    - `chore/descricao-da-tarefa`
- Use kebab-case (palavras em minúsculas separadas por hífen)
- Use kebab-case (palavras em minúsculas separadas por hífen)
- A descrição deve ser concisa mas informativa (máximo 50 caracteres)
- Execute: `git checkout -b [tipo]/[descricao]`
- 
### 3. Semantic Commits
- Separate changes into logical and cohesive commits
- Each commit should contain related changes that make sense together
- **IMPORTANT: Commits must ALWAYS be written in ENGLISH**
- Use the Conventional Commits format:
  ```
  type(scope): short description in English
  
  Detailed description of what was changed and why.
  
  BREAKING CHANGE: if applicable
  ```
- Allowed types: feat, fix, docs, style, refactor, test, chore, perf, ci, build
- Examples:
    - `feat(api): add user search endpoint`
    - `fix(service): fix CPF validation logic`
    - `chore(deps): update Spring Boot dependencies`
    - `refactor(controller): simplify validation logic`
- For each group of changes:
    1. Run `git add [related files]`
    2. Run `git commit -m "type(scope): description in English"`

### 4. Push Branch
- Run: `git push -u origin [branch-name]`

### 5. Pull Request Creation
- Use the GitHub CLI to create the PR
- Run: `gh pr create --fill`
- If necessary, specify the base branch: `gh pr create --base main --fill`

### 6. Pull Request Description in Markdown
- Create a temporary file `PR_DESCRIPTION.md` with the following format:

```markdown
## 📝 Description

[Detailed description of the changes made]

## 🎯 Motivation and Context

[Why are these changes necessary? What problem do they solve?]

## 🔄 Type of Change

**This PR is a:** [The agent should fill this in, e.g., ✨ New feature, 🐛 Bug fix, 🔧 Chore, etc.]

## 🧪 Tests Performed

[Describe the tests you ran to verify your changes. Please provide instructions so we can reproduce.]

## 📸 Screenshots (if applicable)

[Add screenshots to demonstrate visual changes or evidence of functionality.]

## 🔗 Related Issues

Closes #[issue-number]

## 📚 Additional Documentation

[Links to relevant documentation, if any]

```

## Complete Execution Example

```bash
# 1. Analyze changes
git status
git diff

# 2. Create branch
git checkout -b feature/add-cpf-validation

# 3. Semantic commits (always in English)
git add src/main/java/com/picpay/domain/service/ValidationService.java
git commit -m "feat(service): add CPF validation service"

git add src/test/java/com/picpay/ValidationServiceTest.java
git commit -m "test(service): add CPF validation tests"

git add README.md
git commit -m "docs: update documentation with validation examples"

# 4. Push
git push -u origin feature/add-cpf-validation

# 5. Create PR
gh pr create --fill

# 6. Create description and update PR
cat > PR_DESCRIPTION.md << 'EOF'
## 📝 Description
This PR implements CPF validation in the user service.

## 🎯 Motivation and Context
The goal is to ensure that all registered users have a valid CPF, improving data quality.

## 🔄 Type of Change
**This PR is a:** ✨ New feature

## 🧪 Tests Performed
- Unit tests were added for the validation service.
- Manual tests were performed by creating new users with valid and invalid CPFs.

## Important Notes
Closes #123
- ✅ **COMMITS ALWAYS IN ENGLISH:** Follow the guidelines in AGENTS.md
- ✅ Always check for conflicts before creating the PR
- ✅ Make sure you are on the correct branch before committing
- ✅ Review each commit before pushing
- ✅ Test locally before creating the PR
- ✅ Use clear and descriptive commit messages in English
- ✅ Keep commits small and focused
# 8. Clean up
```
- ✅ **COMMITS SEMPRE EM INGLÊS:** Siga as diretrizes do AGENTS.md
- ✅ Sempre verifique se há conflitos antes de criar o PR
- ✅ Certifique-se de estar na branch correta antes de commitar
- ✅ Revise cada commit antes de fazer push
- ✅ Teste localmente antes de criar o PR
- ✅ Use mensagens de commit claras e descritivas em inglês
- ✅ Mantenha commits pequenos e focados
# 6. Create description and update PR

## Description
Implements CPF validation in the user service...
Agora, execute todas as etapas acima automaticamente, analisando o contexto atual do repositório e tomando as decisões apropriadas baseado nas mudanças detectadas.