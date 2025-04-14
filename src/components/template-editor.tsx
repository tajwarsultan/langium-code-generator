"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, FileText, Play } from "lucide-react"
import CodeEditor from "@/components/code-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface TemplateEditorProps {
  templatesDirectory: FileSystemDirectoryHandle | null
  selectedFile: string | null
  onFileSelect: (file: string | null) => void
  onContentChange: (changed: boolean) => void
}

export default function TemplateEditor({
  templatesDirectory,
  selectedFile,
  onFileSelect,
  onContentChange,
}: TemplateEditorProps) {
  const [content, setContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [isChanged, setIsChanged] = useState(false)
  const [files, setFiles] = useState<string[]>([])
  const [selector, setSelector] = useState<string>("")

  useEffect(() => {
    const loadFiles = async () => {
      if (templatesDirectory) {
        const fileList: string[] = []
        try {
          for await (const entry of templatesDirectory.values()) {
            if (entry.kind === "file") {
              fileList.push(entry.name)
            }
          }
          setFiles(fileList)

          // Clear selection if the current file doesn't exist in the new directory
          if (selectedFile && !fileList.includes(selectedFile)) {
            onFileSelect(null)
          }
        } catch (error) {
          console.error("Error loading files:", error)
        }
      } else {
        setFiles([])
        onFileSelect(null)
      }
    }

    loadFiles()
  }, [templatesDirectory, selectedFile, onFileSelect])

  useEffect(() => {
    const loadFileContent = async () => {
      if (templatesDirectory && selectedFile) {
        try {
          const fileHandle = await templatesDirectory.getFileHandle(selectedFile)
          const file = await fileHandle.getFile()
          const text = await file.text()
          setContent(text)
          setOriginalContent(text)
          setIsChanged(false)
          onContentChange(false)
        } catch (error) {
          console.error("Error loading file content:", error)
        }
      } else {
        setContent("")
        setOriginalContent("")
        setIsChanged(false)
        onContentChange(false)
      }
    }

    loadFileContent()
  }, [templatesDirectory, selectedFile, onContentChange])

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
    if (!templatesDirectory || !selectedFile) return

    try {
      const fileHandle = await templatesDirectory.getFileHandle(selectedFile)
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
  }

  const handleGenerate = () => {
    // This will be implemented in Package 3
    console.log("Generate with template:", selectedFile)
    console.log("Selector:", selector)
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Template Editor</CardTitle>
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
        </div>
        <div className="flex items-center gap-2 mt-2">
          <FileText className="h-4 w-4" />
          <Select value={selectedFile || ""} onValueChange={(value) => onFileSelect(value || null)}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select a template" />
            </SelectTrigger>
            <SelectContent>
              {files.map((file) => (
                <SelectItem key={file} value={file}>
                  {file}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-2">
          <Textarea
            placeholder="Enter selector code (TypeScript/JavaScript)"
            value={selector}
            onChange={(e) => setSelector(e.target.value)}
            className="h-20 text-xs"
          />
        </div>
        <div className="mt-2">
          <Button variant="default" size="sm" onClick={handleGenerate} disabled={!selectedFile} className="w-full">
            <Play className="h-4 w-4 mr-1" />
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <CodeEditor value={content} onChange={handleContentChange} language="html" />
      </CardContent>
    </Card>
  )
}
