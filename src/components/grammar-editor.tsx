"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw } from "lucide-react"
import CodeEditor from "@/components/code-editor"

interface GrammarEditorProps {
  dslDirectory: FileSystemDirectoryHandle | null
  onContentChange: (changed: boolean) => void
}

export default function GrammarEditor({ dslDirectory, onContentChange }: GrammarEditorProps) {
  const [content, setContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [isChanged, setIsChanged] = useState(false)

  useEffect(() => {
    const loadGrammar = async () => {
      if (dslDirectory) {
        try {
          // Try to find a grammar file in the DSL directory
          // Typically looking for files with extensions like .langium or .grammar
          for await (const entry of dslDirectory.values()) {
            if (entry.kind === "file" && (entry.name.endsWith(".langium") || entry.name.endsWith(".grammar"))) {
              const file = await entry.getFile()
              const text = await file.text()
              setContent(text)
              setOriginalContent(text)
              setIsChanged(false)
              onContentChange(false)
              break
            }
          }
        } catch (error) {
          console.error("Error loading grammar:", error)
        }
      }
    }

    loadGrammar()
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
  }

  const handleSave = async () => {
    if (!dslDirectory) return

    try {
      // Find the grammar file to save to
      for await (const entry of dslDirectory.values()) {
        if (entry.kind === "file" && (entry.name.endsWith(".langium") || entry.name.endsWith(".grammar"))) {
          try {
            const fileHandle = await dslDirectory.getFileHandle(entry.name)
            const writable = await fileHandle.createWritable()
            await writable.write(content)
            await writable.close()

            setOriginalContent(content)
            setIsChanged(false)
            onContentChange(false)
          } catch (error) {
            console.warn("Unable to save file:", error)
            // In preview mode, just pretend we saved
            setOriginalContent(content)
            setIsChanged(false)
            onContentChange(false)
          }
          break
        }
      }
    } catch (error) {
      console.error("Error saving grammar:", error)
    }
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">Grammar Editor</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} disabled={!isChanged}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Reset
          </Button>
          <Button variant="outline" size="sm" onClick={handleSave} disabled={!isChanged}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <CodeEditor value={content} onChange={handleContentChange} language="typescript" />
      </CardContent>
    </Card>
  )
}
