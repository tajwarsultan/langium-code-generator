"use client"

import type React from "react"
import { useEffect, useRef } from "react"

interface MonacoEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly: boolean
  height: string
}

const MonacoEditor: React.FC<MonacoEditorProps> = ({ value, onChange, language, readOnly, height }) => {
  const editorRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<any>(null)

  useEffect(() => {
    const loadMonaco = async () => {
      if ((window as any).monaco) {
        monacoRef.current = (window as any).monaco
        initEditor()
        return
      }

      const monaco = await import("monaco-editor")
      monacoRef.current = monaco
      ;(window as any).monaco = monaco
      initEditor()
    }

    const initEditor = () => {
      if (!editorRef.current || !monacoRef.current) {
        return
      }

      const editor = monacoRef.current.editor.create(editorRef.current, {
        value: value,
        language: language,
        readOnly: readOnly,
        theme: "vs-light",
        automaticLayout: true,
      })

      editor.onDidChangeModelContent(() => {
        onChange(editor.getValue())
      })

      // Cleanup when the component unmounts
      return () => {
        editor.dispose()
      }
    }

    loadMonaco()
  }, [language, readOnly, value, onChange])

  return <div ref={editorRef} style={{ height: height }}></div>
}

export default MonacoEditor
