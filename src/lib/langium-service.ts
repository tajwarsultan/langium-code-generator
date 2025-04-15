export interface AstNode {
  $type: string
  $container?: AstNode
  $containerProperty?: string
  [key: string]: any
}

export interface Grammar {
  name: string
  rules: Rule[]
}

export interface Rule {
  name: string
  type: string
  definition: any
}

export class LangiumParser {
  private grammar: Grammar | null = null

  parseGrammar(input: string): Grammar | null {
    try {
      // This is a very simplified parser for demonstration
      // In a real implementation, you would use the actual Langium parser
      const grammarName = input.match(/grammar\s+(\w+)/)?.[1] || "UnnamedGrammar"

      // Extract rules using regex (very simplified)
      const ruleRegex = /(\w+)\s*:\s*([^;]+);/g
      const rules: Rule[] = []
      let match

      while ((match = ruleRegex.exec(input)) !== null) {
        rules.push({
          name: match[1],
          type: "Rule",
          definition: match[2],
        })
      }

      this.grammar = { name: grammarName, rules }
      return this.grammar
    } catch (error) {
      console.error("Error parsing grammar:", error)
      return null
    }
  }

  parseInput(input: string): AstNode | null {
    if (!this.grammar) {
      console.error("No grammar loaded")
      return null
    }

    try {
      // This is a simplified AST builder for demonstration
      // In a real implementation, you would use the actual Langium parser
      const lines = input.split("\n")
      const rootNode: AstNode = { $type: this.grammar.name }

      // Very simplified parsing logic
      for (const rule of this.grammar.rules) {
        // Look for lines that might match this rule
        for (const line of lines) {
          if (line.trim().startsWith(rule.name)) {
            const value = line.split(":")[1]?.trim()
            if (value) {
              rootNode[rule.name] = value
            }
          }
        }
      }

      return rootNode
    } catch (error) {
      console.error("Error parsing input:", error)
      return null
    }
  }
}

export class TemplateEngine {
  private static templateCache = new Map<string, Function>()

  static compile(template: string): Function {
    if (this.templateCache.has(template)) {
      return this.templateCache.get(template)!
    }

    // Replace template tags with JavaScript
    let functionBody = "let result = '';\n"
    const code = template
      .replace(/<%=([\s\S]+?)%>/g, (_, code) => "${" + code.trim() + "}")
      .replace(/<%([\s\S]+?)%>/g, (_, code) => {
        return "`;\n" + code.trim() + "\nresult += `"
      })

    functionBody += "result += `" + code + "`;\n"
    functionBody += "return result;"

    try {
      const templateFunction = new Function("model", functionBody)
      this.templateCache.set(template, templateFunction)
      return templateFunction
    } catch (error) {
      console.error("Error compiling template:", error)
      return () => `Error: Could not compile template - ${error}`
    }
  }

  static render(template: string, model: any): string {
    try {
      const templateFunction = this.compile(template)
      return templateFunction(model)
    } catch (error) {
      console.error("Error rendering template:", error)
      return `Error: Could not render template - ${error}`
    }
  }
}

export class CodeGenerator {
  private parser: LangiumParser

  constructor() {
    this.parser = new LangiumParser()
  }

  loadGrammar(grammarText: string): boolean {
    const grammar = this.parser.parseGrammar(grammarText)
    return !!grammar
  }

  generateCode(inputText: string, templateText: string, selectorCode?: string): string {
    try {
      const ast = this.parser.parseInput(inputText)
      if (!ast) {
        return "Error: Failed to parse input"
      }

      // Apply selector if provided
      let model = ast
      if (selectorCode && selectorCode.trim()) {
        try {
          // Create a safe function to transform the AST
          const selectorFn = new Function(
            "ast",
            `
            try {
              ${selectorCode}
              return ast;
            } catch (error) {
              console.error("Error in selector:", error);
              return ast;
            }
          `,
          )
          model = selectorFn(ast)
        } catch (error) {
          console.error("Error creating selector function:", error)
        }
      }

      // Generate code using the template
      return TemplateEngine.render(templateText, model)
    } catch (error) {
      console.error("Error generating code:", error)
      return `Error: Code generation failed - ${error}`
    }
  }

  generateBatch(
    inputFiles: Map<string, string>,
    templateFiles: Map<string, string>,
    selectorCode?: string,
  ): Map<string, string> {
    const results = new Map<string, string>()

    for (const [inputName, inputContent] of inputFiles.entries()) {
      for (const [templateName, templateContent] of templateFiles.entries()) {
        try {
          const outputName = this.generateOutputName(inputName, templateName)
          const generatedCode = this.generateCode(inputContent, templateContent, selectorCode)
          results.set(outputName, generatedCode)
        } catch (error) {
          console.error(`Error generating code for ${inputName} with ${templateName}:`, error)
          results.set(`error_${inputName}_${templateName}.txt`, `Error generating code: ${error}`)
        }
      }
    }

    return results
  }

  generateOutputName(inputName: string, templateName: string): string {
    // Extract base name without extension
    const inputBase = inputName.replace(/\.[^/.]+$/, "")
    const templateBase = templateName.replace(/\.[^/.]+$/, "")

    // Get template extension or default to .txt
    const templateExt = templateName.match(/\.([^/.]+)$/)?.[1] || "txt"

    // Generate output name
    return `${inputBase}.${templateBase}.${templateExt}`
  }
}
