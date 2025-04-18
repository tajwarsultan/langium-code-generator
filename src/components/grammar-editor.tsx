"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, Play, AlertCircle } from "lucide-react"
import CodeEditor from "@/components/code-editor"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { LangiumParser } from "@/lib/langium-service"

interface GrammarEditorProps {
  dslDirectory: FileSystemDirectoryHandle | null
  onContentChange: (changed: boolean) => void
  onGrammarCompiled: (success: boolean) => void
}

export default function GrammarEditor({ dslDirectory, onContentChange, onGrammarCompiled }: GrammarEditorProps) {
  const [content, setContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [isChanged, setIsChanged] = useState(false)
  const [compileStatus, setCompileStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [grammarFile, setGrammarFile] = useState<string | null>(null)
  const parser = useMemo(() => new LangiumParser(), [])

  useEffect(() => {
    let isMounted = true

    const loadGrammar = async () => {
      if (dslDirectory) {
        try {
          for await (const entry of dslDirectory.values()) {
            if (!isMounted) return

            if (entry.kind === "file" && (entry.name.endsWith(".langium") || entry.name.endsWith(".grammar"))) {
              const file = await (entry as FileSystemFileHandle).getFile()
              const text = await file.text()
              if (!isMounted) return
              setContent(text)
              setOriginalContent(text)
              setGrammarFile(entry.name)
              setIsChanged(false)
              onContentChange(false)

              // Try to compile the grammar
              compileGrammar(text)
              break
            }
          }
        } catch (error) {
          console.error("Error loading grammar:", error)
          if (!isMounted) return
          setCompileStatus({
            success: false,
            message: `Error loading grammar: ${error}`,
          })
        }
      } else {
        if (!isMounted) return
        setContent("")
        setOriginalContent("")
        setGrammarFile(null)
        setCompileStatus(null)
      }
    }

    loadGrammar()

    return () => {
      isMounted = false // Set flag to false when component unmounts
    }
  }, [dslDirectory, onContentChange])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    const changed = newContent !== originalContent
    setIsChanged(changed)
    onContentChange(changed)
  }

  const handleReset = () => {
    setContent(originalContent)
    setIsChanged(false)
    onContentChange(false)
    compileGrammar(originalContent)
  }

  const handleSave = async () => {
    if (!dslDirectory || !grammarFile) return

    try {
      const fileHandle = await dslDirectory.getFileHandle(grammarFile)
      const writable = await fileHandle.createWritable()
      await writable.write(content)
      await writable.close()

      setOriginalContent(content)
      setIsChanged(false)
      onContentChange(false)
    } catch (error) {
      console.warn("Unable to save file:", error)
      setOriginalContent(content)
      setIsChanged(false)
      onContentChange(false)
    }
  }

  const compileGrammar = useCallback((grammarText: string) => {
    try {
      const grammar = parser.parseGrammar(grammarText)
      if (grammar) {
        setCompileStatus({
          success: true,
          message: `Grammar '${grammar.name}' compiled successfully with ${grammar.rules.length} rules.`,
        })
        onGrammarCompiled(true)
      } else {
        setCompileStatus({
          success: false,
          message: "Failed to compile grammar: Unknown error",
        })
        onGrammarCompiled(false)
      }
    } catch (error) {
      console.error("Error compiling grammar:", error)
      setCompileStatus({
        success: false,
        message: `Failed to compile grammar: ${error}`,
      })
      onGrammarCompiled(false)
    }
  }, [onGrammarCompiled, parser])

  const handleCompile = () => {
    compileGrammar(content)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Grammar Editor {grammarFile ? `(${grammarFile})` : ""}</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!isChanged}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!isChanged}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button variant="default" size="sm" onClick={handleCompile}>
            <Play className="h-4 w-4 mr-1" />
            Compile
          </Button>
        </div>
      </CardHeader>
      {compileStatus && (
        <div className="px-4 pb-2">
          <Alert variant={compileStatus.success ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{compileStatus.message}</AlertDescription>
          </Alert>
        </div>
      )}
      <CardContent className="flex-1 p-0">
        <CodeEditor value={content} onChange={handleContentChange} language="langium" />
      </CardContent>
    </Card>
  )
}
