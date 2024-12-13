#!/usr/bin/env node

import nunjucks from 'nunjucks';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { TOOLS } from '../src/tools.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generate() {
  try {
    // Configure nunjucks
    const env = new nunjucks.Environment(
      new nunjucks.FileSystemLoader(path.join(__dirname, '..')),
      { autoescape: false }
    );

    // Read the template
    const templatePath = path.join(__dirname, '..', 'README.md.j2');
    const template = await fs.readFile(templatePath, 'utf-8');

    // Define template variables
    const templateVars = {
      tools: TOOLS.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };

    // Render the template
    const output = env.renderString(template, templateVars);

    // Write the output to README.md
    const readmePath = path.join(__dirname, '..', 'README.md');
    await fs.writeFile(readmePath, output);

    console.log('README.md generated successfully');
  } catch (error) {
    console.error('Error generating README:', error);
    process.exit(1);
  }
}

generate().catch(console.error);
