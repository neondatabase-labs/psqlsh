const prepareNameForTemplate = (name: string) =>
  name.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();

export const generateBranchName = (template: string) =>
  `template/${prepareNameForTemplate(template)}`;
