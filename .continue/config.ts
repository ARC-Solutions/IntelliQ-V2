export function modifyConfig(config: Config): Config {
  config.slashCommands?.push({
    name: "ticket",
    description: "Generate a Jira ticket and git commit for current changes",
    run: async function* (sdk) {
      const diff = await sdk.ide.getDiff(true);
      
      // Generate structured ticket content
      const prompt = `
      Analyze the following code changes and generate a JIRA ticket. Pay special attention to data flow patterns and architectural decisions.

      1. Ticket Title:
         - Should be concise (2-4 words)
         - Focus on architectural/system-level change
         - Highlight data flow direction (Client→Server, Server→Client)
         - Avoid generic terms like "Refactor" or "Update" alone

      2. Description:
         Structure with these specific subsections:
         - **Current State/Problem**: 
           * Describe current architecture/data flow
           * Identify any anti-patterns (e.g., client-side DB operations)
           * Note security or performance concerns

         - **Changes Made**:
           * List architectural changes (e.g., client→server migrations)
           * Detail new API endpoints or server actions
           * Document security improvements
           * Note state management updates

         - **File Locations**:
           * Group by client/server location
           * List affected components and routes
           * Note new middleware or utilities

         - **Technical Implementation Details**:
           * Data flow patterns used
           * Authentication/authorization changes
           * Error handling approach
           * State management solutions

      3. Definition of Done:
         Create specific, relevant checkpoints based on the actual changes:
         - For UI changes: include visual testing, responsive design, accessibility
         - For API changes: include endpoint testing, error cases, documentation
         - For state management: include sync testing, error recovery
         - For security changes: include penetration testing, auth verification
         - For performance changes: include load testing, metrics verification
         Each checkpoint must be:
         - Specific to the change
         - Testable/verifiable
         - Marked with ✅
         - Relevant to the implementation

      4. Story Points: 
         - 1-8 scale
         - Consider complexity of data flow changes
         - Factor in security implications
         - Include testing overhead

      5. Git Commit:
         Format: IDA-###: action(scope) brief description
         Example: IDA-123: feat(api) migrate room updates to server actions

      6. Git Description:
         - List architectural changes first
         - Detail security improvements
         - Note testing additions
         - Mention performance impacts

      Code changes:
      ${diff}

      Format in markdown with ### headers.
      Focus on architectural patterns and data security.
      Emphasize client→server migrations when present.
      Generate a markdown.
      Note: Replace ### in commit title with actual ticket number.
      `;

      for await (const content of sdk.llm.streamComplete(
        prompt,
        new AbortController().signal,
        {
          temperature: 0.7,
          maxTokens: 500,
        }
      )) {
        yield content;
      }
    },
  });

  return config;
}