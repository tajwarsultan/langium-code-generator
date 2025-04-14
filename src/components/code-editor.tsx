"use client"

import { useEffect, useRef } from "react"

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  readOnly?: boolean
}

export default function CodeEditor({ value, onChange, language = "javascript", readOnly = false }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)
  const editorInstanceRef = useRef<any>(null)

  useEffect(() => {
    // This is a placeholder for Monaco Editor integration
    // In a real implementation, we would load Monaco Editor here
    // For now, we'll use a simple textarea as a fallback

    // The actual implementation would look something like:
    // import * as monaco from 'monaco-editor';
    // monacoRef.current = monaco;
    // editorInstanceRef.current = monaco.editor.create(editorRef.current!, {
    //   value,
    //   language,
    //   theme: 'vs-dark',
    //   automaticLayout: true,
    //   readOnly
    // });

    // For the Langium playground integration, we would need to:
    // 1. Import the Langium Monaco integration
    // 2. Register the Langium language with Monaco
    // 3. Set up the editor with Langium-specific configurations

    // For now, we'll just use a textarea as a placeholder
    const textarea = document.createElement("textarea")
    textarea.value = value
    textarea.readOnly = readOnly
    textarea.style.width = "100%"
    textarea.style.height = "100%"
    textarea.style.resize = "none"
    textarea.style.fontFamily = "monospace"
    textarea.style.padding = "8px"
    textarea.style.border = "none"
    textarea.style.outline = "none"

    if (!readOnly) {
      textarea.addEventListener("input", () => {
        onChange(textarea.value)
      })
    }

    if (editorRef.current) {
      editorRef.current.innerHTML = ""
      editorRef.current.appendChild(textarea)
    }

    return () => {
      // Cleanup
      if (editorRef.current) {
        editorRef.current.innerHTML = ""
      }
    }
  }, [language, readOnly])

  // Update the editor value when the value prop changes
  useEffect(() => {
    if (editorRef.current) {
      const textarea = editorRef.current.querySelector("textarea")
      if (textarea && textarea.value !== value) {
        textarea.value = value
      }
    }
  }, [value])

  return <div ref={editorRef} className="w-full h-full border" />
}
