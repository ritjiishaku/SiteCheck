/* eslint-disable */
const fs = require('fs');
const path = require('path');

const COLOUR_TOKENS_PATH = path.join(__dirname, 'token-colour.json');
const TYPOGRAPHY_TOKENS_PATH = path.join(__dirname, 'token-typography.json');
const OUTPUT_CSS_PATH = path.join(__dirname, 'tokens.css');

function resolveReference(ref, tokens) {
  const path = ref.replace(/[{}]/g, '').split('.');
  let current = tokens;
  for (const segment of path) {
    if (current[segment] === undefined) {
      console.warn(`Warning: Reference ${ref} could not be resolved at segment ${segment}`);
      return ref;
    }
    current = current[segment];
  }
  return current;
}

function convertTokens() {
  const colourTokens = JSON.parse(fs.readFileSync(COLOUR_TOKENS_PATH, 'utf8'));
  const typographyTokens = JSON.parse(fs.readFileSync(TYPOGRAPHY_TOKENS_PATH, 'utf8'));

  let cssOutput = ':root {\n';

  // --- COLOURS ---
  // The UI only uses roles. We'll generate light roles in :root and dark roles in a dark theme block.
  const lightRoles = colourTokens.color.role.light;
  const darkRoles = colourTokens.color.role.dark;

  cssOutput += '  /* Color Roles - Light */\n';
  Object.entries(lightRoles).forEach(([roleName, value]) => {
    let resolvedValue = value;
    if (typeof value === 'string' && value.startsWith('{')) {
      resolvedValue = resolveReference(value, colourTokens);
    }
    // Convert camelCase to kebab-case
    const kebabName = roleName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    cssOutput += `  --color-${kebabName}: ${resolvedValue};\n`;
  });

  // --- TYPOGRAPHY ---
  cssOutput += '\n  /* Typography */\n';
  const fonts = typographyTokens.font;
  Object.entries(fonts).forEach(([fontName, fontData]) => {
    const sanitizedFontName = fontName.replace(/\s+/g, '-');
    const values = fontData.value;
    
    Object.entries(values).forEach(([prop, val]) => {
      let cssVal = val;
      // Add units for dimension properties
      if (typeof val === 'number') {
        if (['fontSize', 'lineHeight', 'letterSpacing', 'paragraphIndent', 'paragraphSpacing'].includes(prop)) {
          cssVal = `${val}px`;
        }
      }
      
      const kebabProp = prop.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
      cssOutput += `  --font-${sanitizedFontName}-${kebabProp}: ${cssVal};\n`;
    });
  });

  cssOutput += '}\n\n';

  // --- DARK THEME ---
  cssOutput += '/* Color Roles - Dark */\n';
  cssOutput += '.dark-theme, [data-theme="dark"] {\n';
  Object.entries(darkRoles).forEach(([roleName, value]) => {
    let resolvedValue = value;
    if (typeof value === 'string' && value.startsWith('{')) {
      resolvedValue = resolveReference(value, colourTokens);
    }
    const kebabName = roleName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    cssOutput += `  --color-${kebabName}: ${resolvedValue};\n`;
  });
  cssOutput += '}\n';

  // Media query preference for dark mode too
  cssOutput += '\n@media (prefers-color-scheme: dark) {\n';
  cssOutput += '  :root:not([data-theme="light"]) {\n';
  Object.entries(darkRoles).forEach(([roleName, value]) => {
    let resolvedValue = value;
    if (typeof value === 'string' && value.startsWith('{')) {
      resolvedValue = resolveReference(value, colourTokens);
    }
    const kebabName = roleName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
    cssOutput += `    --color-${kebabName}: ${resolvedValue};\n`;
  });
  cssOutput += '  }\n';
  cssOutput += '}\n';

  fs.writeFileSync(OUTPUT_CSS_PATH, cssOutput);
  console.log(`Successfully generated ${OUTPUT_CSS_PATH}`);
}

convertTokens();
