"use client"

import { useEffect, useRef, useState } from "react"
import * as monaco from "monaco-editor"

interface WindowWithMonaco extends Window {
  monaco?: typeof monaco
}

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
  const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

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

    if (editorRef.current.firstChild) {
      editorRef.current.removeChild(editorRef.current.firstChild)
    }
      if ((window as WindowWithMonaco).monaco) {
    editorRef.current.appendChild(textarea)

    if (typeof window !== "undefined") {
      if ((window as WindowWithMonaco).monaco) {
        initMonaco()
      } else {
        const script = document.createElement("script")
        script.src = "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs/loader.js"
        script.async = true
        script.onload = () => {
          const require = ((window as unknown) as WindowWithMonaco & { require: { config: (options: { paths: { [key: string]: string } }) => void; (modules: string[], callback: () => void): void } }).require
          require.config({
            paths: { vs: "https://cdn.jsdelivr.net/npm/monaco-editor@0.43.0/min/vs" },
          })
          require(["vs/editor/editor.main"], initMonaco)
        }
        document.body.appendChild(script)
      }
    }

    }

    return () => {
      if (editor) {
        editor.dispose()
      }
    }
  }, [])

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

    if (editorRef.current.firstChild) {
      editorRef.current.removeChild(editorRef.current.firstChild)
    }

    const monaco = (window as WindowWithMonaco).monaco

    if (language === "langium" && monaco?.languages && !monaco.languages.getLanguages().some((lang: monaco.languages.ILanguageExtensionPoint) => lang.id === "langium")) {
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

    if (language === "template" && monaco?.languages && !monaco.languages.getLanguages().some((lang: monaco.languages.ILanguageExtensionPoint) => lang.id === "template")) {
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

    if (!monaco) {
      console.error("Monaco editor is not loaded.")
      return
    }

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
  }

  return <div ref={editorRef} className="w-full h-full border" style={{ height }} />
}
