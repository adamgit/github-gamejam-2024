export function replaceTemplateVariables(
    text: string, 
    variables: Record<string, string>
  ): string {
    return text.replace(/\{\{(\w+)\}\}/g, (_, key) => 
      variables[key] || `{{MISSINGKEY in variables: ${key}}}`
    );
  }