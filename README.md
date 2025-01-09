# Production Previews

[App](https://app.intelliq.dev)

[Landing Page](https://main.d35vbuyg2g068i.amplifyapp.com/)

[Presentation Page](https://presentation.intelliq.dev)

## Development Setup

### Required Extensions

This project uses [Continue](https://marketplace.cursorapi.com/items?itemName=Continue.continue) for AI-assisted development.

When you open this project in VS Code, you should see a prompt to install the recommended extensions. If not:

1. Open VS Code Command Palette (`Cmd/Ctrl + Shift + P`)
2. Type "Show Recommended Extensions"
3. Install "Continue" extension

### Configuration

After installing the Continue extension:

1. Copy the template config:

   ```bash
   cp .continue/config.template.json .continue/config.json
   ```

2. Add your API key in `.continue/config.json`:
   ```json
   {
     "models": [
       {
         "title": "GPT-4o",
         "provider": "openai",
         "model": "gpt-4o",
         "apiKey": "YOUR_API_KEY_HERE"
       }
     ]
     ...
   }
   ```

## Repo Activity

<img width="100%" src="https://repobeats.axiom.co/api/embed/b85707db61c7a6308357ed279c9f8fded88e1efa.svg" />
