"use client"

import { useEffect, useRef, useState } from "react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  readOnly?: boolean
  height?: string
}

export default function CodeEditor({
  value,
  onChange,
  language = "javascript",
  readOnly = false,
  height = "100%",
}: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [editor, setEditor] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simple fallback if Monaco can't be loaded
    if (!editorRef.current) return

    // Create a textarea as fallback
    const textarea = document.createElement("textarea")
    textarea.value = value
    textarea.readOnly = readOnly
    textarea.style.width = "100%"
    textarea.style.height = height
    textarea.style.resize = "none"
    textarea.style.fontFamily = "monospace"
    textarea.style.padding = "8px"
    textarea.style.border = "none"
    textarea.style.outline = "none"
    textarea.style.backgroundColor = "#f5f5f5"

    if (!readOnly) {
      textarea.addEventListener("input", () => {
        onChange(textarea.value)
      })
    }

    // Clear previous content
    if (editorRef.current.firstChild) {
      editorRef.current.removeChild(editorRef.current.firstChild)
    }

    editorRef.current.appendChild(textarea)
    setIsLoading(false)

    // Try to load Monaco if available
    if (typeof window !== "undefined") {
      // Check if Monaco is already loaded
      if ((window as any).monaco) {
        initMonaco()
      } else {
        // Load Monaco dynamically
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/loader.js"
        script.async = true
        script.onload = () => {
          const require = (window as any).require
          require.config({
            paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs" },
          })
          require(["vs/editor/editor.main"], initMonaco)
        }
        document.body.appendChild(script)
      }
    }

    return () => {
      if (editor) {
        editor.dispose()
      }
    }
  }, [])

  // Update the editor value when the value prop changes
  useEffect(() => {
    if (editor && value !== editor.getValue()) {
      editor.setValue(value)
    } else if (!editor && editorRef.current) {
      const textarea = editorRef.current.querySelector("textarea")
      if (textarea && textarea.value !== value) {
        textarea.value = value
      }
    }
  }, [value, editor])

  const initMonaco = () => {
    if (!editorRef.current) return

    // Clear the fallback textarea
    if (editorRef.current.firstChild) {
      editorRef.current.removeChild(editorRef.current.firstChild)
    }

    const monaco = (window as any).monaco

    // Register custom languages if needed
    if (language === "langium" && !monaco.languages.getLanguages().some((lang: any) => lang.id === "langium")) {
      monaco.languages.register({ id: "langium" })
      monaco.languages.setMonarchTokensProvider("langium", {
        tokenizer: {
          root: [
            [/grammar\s+\w+/, "keyword"],
            [/\/\/.*/, "comment"],
            [/\/\*/, "comment", "@comment"],
            [/\b(terminal|hidden|fragment|entry|interface|type|returns|infers|with|extends)\b/, "keyword"],
            [/[a-zA-Z_]\w*/, "identifier"],
            [/"[^"]*"/, "string"],
            [/'[^']*'/, "string"],
          ],
          comment: [
            [/[^/*]+/, "comment"],
            [/\*\//, "comment", "@pop"],
            [/[/*]/, "comment"],
          ],
        },
      })
    }

    if (language === "template" && !monaco.languages.getLanguages().some((lang: any) => lang.id === "template")) {
      monaco.languages.register({ id: "template" })
      monaco.languages.setMonarchTokensProvider("template", {
        tokenizer: {
          root: [
            [/<%=/, { token: "delimiter.template", next: "@templateExpr" }],
            [/<%/, { token: "delimiter.template", next: "@templateCode" }],
            [/./, "content"],
          ],
          templateExpr: [
            [/%>/, { token: "delimiter.template", next: "@root" }],
            [/[^%>]+/, "expression"],
          ],
          templateCode: [
            [/%>/, { token: "delimiter.template", next: "@root" }],
            [/[^%>]+/, "code"],
          ],
        },
      })
    }

    // Create editor
    const editorInstance = monaco.editor.create(editorRef.current, {
      value,
      language: language === "langium" ? "langium" : language === "template" ? "template" : language,
      theme: "vs-dark",
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      readOnly,
      fontSize: 14,
      lineNumbers: "on",
    })

    editorInstance.onDidChangeModelContent(() => {
      const newValue = editorInstance.getValue()
      onChange(newValue)
    })

    setEditor(editorInstance)
    setIsLoading(false)
  }

  return <div ref={editorRef} className="w-full h-full border" style={{ height }} />
}
