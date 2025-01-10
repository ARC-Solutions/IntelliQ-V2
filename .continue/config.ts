export function modifyConfig(config: Config): Config {
  config.slashCommands?.push({
    name: "ticket",
    description: "Generate a Jira ticket and git commit for current changes",
    run: async function* (sdk) {
      const diff = await sdk.ide.getDiff(true);

      // Generate structured ticket content
      const prompt = `
      Analyze the following code changes and generate a JIRA ticket. Consider both functional and design/UI changes.

      1. Ticket Title:
         - Should be concise (2-4 words)
         - Focus on architectural/system-level change or UI component changes
         - Highlight if there is a data flow or UI pattern change
         - Use prefixes like "feat:", "design:", or "refactor:"

      2. Description:
         Structure with these specific subsections:
         - **Current State/Problem**: 
           * Describe current architecture/data flow or UI/UX state
           * Identify any design inconsistencies or UX issues
           * Note performance or accessibility concerns

         - **Changes Made**:
           * List architectural or UI component changes
           * Detail new patterns or design system updates
           * Document accessibility improvements
           * Note animation or interaction updates

         - **File Locations**:
           * Group by feature area or component type
           * List affected UI components and styles
           * Note shared design tokens or utilities

         - **Technical Implementation Details**:
           * UI patterns and components used
           * Animation and interaction patterns
           * Accessibility considerations
           * Design system integration

      3. Definition of Done:
         Create specific checkpoints based on the changes:
         - For UI changes: visual consistency, responsive design, accessibility
         - For animations: performance, timing, user feedback
         - For components: reusability, documentation, storybook
         - For design system: token usage, theme compliance
         Each checkpoint must be:
         - Specific to the change
         - Testable/verifiable
         - Marked with ✅
         - Relevant to the implementation

      4. Story Points: 
         - 1-8 scale
         - Consider UI complexity
         - Factor in design system impact
         - Include testing overhead

      5. Git Commit:
         Format: IDA-###: type(scope) brief description
         Example: IDA-123: design(ui) update invite button animation

      6. Git Description:
         - List UI/UX improvements first
         - Detail animation changes
         - Note accessibility updates
         - Mention design system impacts

      Code changes:
      ${diff}

      Format in markdown with ### headers.
      Focus on both functional and design patterns.
      Emphasize UI/UX improvements when present.
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
