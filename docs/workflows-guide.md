# 🤖 GitHub Actions Workflows - Antigravity

> Automação completa do pipeline de produção audiovisual com Claude + GitHub.

## 📋 Workflows Disponíveis

### 1️⃣ Story Generation (`story-generation.yml`)

**Ativa quando:** Issue é criada com label `generate-story`

**O que faz:**
- 📝 Extrai o briefing da issue
- 📁 Cria estrutura de pastas do projeto
- 💾 Salva briefing em `scripts/stories/[projeto]/`
- 📤 Faz commit automático
- 💬 Comenta na issue com instruções

**Como usar:**
```
1. Crie nova Issue no GitHub
2. Preencha com seu briefing
3. Adicione label: generate-story
4. Workflow executa automaticamente ✨
```

**Saída:**
```
scripts/stories/[projeto]/
├── briefing.md (seu briefing)
└── [Instruções para próximos passos]

production/[projeto]/
├── renders/
├── exports/
├── drafts/
└── assets/
```

---

### 2️⃣ Organize Scenes (`organize-scenes.yml`)

**Ativa quando:** PR aberto com novo `roteiro.md`

**O que faz:**
- 🔍 Detecta novo roteiro
- 📊 Conta cenas automaticamente
- 📁 Cria pasta `cenas/`
- 📋 Gera README com instruções
- 💬 Comenta no PR com próximos passos

**Como usar:**
```
1. Crie PR com arquivo: scripts/stories/[projeto]/roteiro.md
2. Workflow detecta e processa
3. Recebe comentário com instruções para Trigger Mapping
```

**Saída:**
```
scripts/stories/[projeto]/cenas/
├── README.md (com contagem de cenas)
└── [Pronto para Scene Breakdowns]
```

---

### 3️⃣ Validate Scenes (`validate-scenes.yml`)

**Ativa quando:** PR aberto com `*breakdown.md` em `cenas/`

**O que faz:**
- ✅ Valida estrutura de Scene Breakdown
- 🔍 Verifica seções obrigatórias:
  - Duração
  - Descrição Visual
  - Efeitos
  - Triggers
  - Comandos (FFmpeg/Blender)
- 💬 Comenta com checklist de qualidade

**Como usar:**
```
1. Crie PR com: scripts/stories/[projeto]/cenas/cena-01-breakdown.md
2. Workflow valida automaticamente
3. Recebe feedback sobre o que está faltando
```

**Validações:**
- ✅ Todas as seções presentes
- ✅ Comandos técnicos inclusos
- ✅ Formato consistente

---

### 4️⃣ Generate Commands (`generate-commands.yml`)

**Ativa quando:** Executado manualmente via `workflow_dispatch`

**O que faz:**
- 🛠️ Gera scripts FFmpeg customizados
- 🎨 Gera scripts Blender Python
- 📝 Gera expressions After Effects
- 📋 Cria Production Log
- 📤 Faz commit automático

**Como usar:**
```
1. Vá em: GitHub → Actions → Generate Production Commands
2. Clique em "Run workflow"
3. Preencha:
   - Project: seu-projeto-001
   - Output Format: all (ou ffmpeg/blender/ae-expression)
4. Clique "Run"
5. Workflow gera todos os comandos ✨
```

**Saída:**
```
commands/ffmpeg/[projeto]-commands.sh
commands/blender/[projeto]-commands.py
commands/ae-expressions/[projeto]-expressions.jsx

production/[projeto]/PRODUCTION_LOG.md
```

---

## 🔄 Fluxo Completo Automatizado

```
┌─────────────────────────────┐
│ 1. Criar Issue com Briefing │
│ Label: generate-story       │
└──────────────┬──────────────┘
               │ Story Gen Workflow
               ▼
        ✅ Projeto criado
        📁 Pastas geradas
        💾 Briefing salvo
               │
┌──────────────┴──────────────┐
│ 2. Usar Claude               │
│ Prompt: story-generation.md │
└──────────────┬──────────────┘
               │ Cole resposta em
               │ scripts/stories/[projeto]/roteiro.md
               │
┌──────────────┴──────────────┐
│ 3. Criar PR com Roteiro      │
└──────────────┬──────────────┘
               │ Organize Scenes Workflow
               ▼
        ✅ Cenas contadas
        📁 Pasta cenas criada
        📋 README com instruções
               │
┌──────────────┴──────────────────────┐
│ 4. Usar Claude (Trigger + Scenes)   │
│ Prompts: trigger-mapping.md         │
│          scene-breakdown.md (×N)    │
└──────────────┬──────────────────────┘
               │ Cole Scene Breakdowns em:
               │ scripts/stories/[projeto]/cenas/cena-NN-breakdown.md
               │
┌──────────────┴──────────────┐
│ 5. Criar PR com Cenas        │
└──────────────┬──────────────┘
               │ Validate Scenes Workflow
               ▼
        ✅ Cenas validadas
        💬 Feedback de qualidade
        ✅ Pronto para produção
               │
┌──────────────┴──────────────┐
│ 6. Executar Generate Commands│
│ Manual: workflow_dispatch    │
└──────────────┬──────────────┘
               │
               ▼
        ✅ Scripts FFmpeg
        ✅ Scripts Blender
        ✅ Expressions AE
        ✅ Production Log
               │
┌──────────────┴──────────────┐
│ 7. Executar Produção         │
│ FFmpeg / Blender / AE        │
└──────────────┬──────────────┘
               │
               ▼
        ✅ Renderizado
        ✅ Exportado
        ✅ Publicado
```

---

## ⚡ Exemplos de Uso

### Exemplo 1: Comercial 15s

```bash
# 1. Criar Issue no GitHub com:
"""
## Briefing: Comercial Tech 15s

- Duração: 15 segundos
- Formato: Motion Graphics
- Público: Tech-savvy
- Tom: Dinâmico, inovador
- Objetivo: Apresentar novo produto
"""

# 2. Labels: generate-story
# Workflow cria estrutura

# 3. Use Claude + story-generation.md
# Cole resposta em: scripts/stories/001-commercial-tech/roteiro.md

# 4. Crie PR
# Workflow conta cenas

# 5. Use Claude + trigger-mapping.md
# Salve em: scripts/stories/001-commercial-tech/trigger-mapping.md

# 6. Use Claude + scene-breakdown.md (×3-5 cenas)
# Salve em: scripts/stories/001-commercial-tech/cenas/cena-01-breakdown.md

# 7. Crie PR com cenas
# Workflow valida

# 8. Dispare Generate Commands workflow
# Projeto: 001-commercial-tech
# Format: all

# 9. Execute scripts:
bash commands/ffmpeg/001-commercial-tech-commands.sh

# 10. Render → Export → Publicar
```

---

## 🔧 Configuração

### GitHub Personal Access Token (PAT)

Se workflows precisam de permissões elevadas:

1. GitHub Settings → Developer Settings → PAT
2. Gere novo token com scopes:
   - ✅ `repo` (full control)
   - ✅ `workflow` (Actions)
3. Adicione em: Repo Settings → Secrets → `GITHUB_TOKEN`

### Variáveis de Ambiente

Crie em: Repository Settings → Variables

```
CLAUDE_API_KEY=sk-xxx
BLENDER_PATH=/path/to/blender
FFMPEG_PRESET=medium
```

---

## 📊 Matriz de Workflows por Fase

| Fase | Workflow | Trigger | Ação |
|------|----------|---------|------|
| 1. Briefing | Story Generation | Issue + label | Cria estrutura |
| 2. Roteiro | Organize Scenes | PR com roteiro | Organiza cenas |
| 3. Cenas | Validate Scenes | PR com breakdown | Valida estrutura |
| 4. Produção | Generate Commands | Manual | Gera scripts |
| 5. Render | Manual | CLI | Executa FFmpeg/Blender |
| 6. Entrega | Manual | CLI | Commit + Push |

---

## ✅ Checklist de Ativação

Para usar todos os workflows:

- [ ] Clonar repositório (com pastas `.github/workflows/`)
- [ ] Verificar que `.github/workflows/` contém 4 arquivos `.yml`
- [ ] GitHub Actions habilitado no repositório (Configurações)
- [ ] Push dos workflows para branch principal
- [ ] Testar com Issue de teste (label `generate-story`)
- [ ] Verificar que comentário automático aparece

---

## 🐛 Troubleshooting

**Problema:** Workflow não dispara
**Solução:**
- Verifique se `.github/workflows/` está no repositório
- Confira branch (workflows rodam na branch padrão)
- Verifique labels/triggers (ex: `generate-story`)

**Problema:** Erro ao fazer commit
**Solução:**
- Workflow já usa `git config` automaticamente
- Se falhar, adicione token: `GITHUB_TOKEN` em secrets

**Problema:** Scripts gerados têm paths errados
**Solução:**
- Edite templates nos workflows
- Customize caminhos para sua estrutura

---

## 🚀 Próximas Adições

- [ ] Workflow para Render Monitoring (checker de progresso)
- [ ] Workflow para Quality Assurance (validar exports)
- [ ] Workflow para Publish (fazer upload automático)
- [ ] Workflow para Notifications (slack/discord alerts)
- [ ] Workflow para Analytics (rastrear tempos/custos)

---

**Status:** ✅ 4 Workflows funcionais  
**Última Atualização:** 2026-05-22  
**Próximos Passos:** [Comece seu primeiro projeto!](../docs/setup-guide.md)
