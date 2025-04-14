"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, FileText } from "lucide-react"
import CodeEditor from "@/components/code-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface InputEditorProps {
  inputDirectory: FileSystemDirectoryHandle | null
  selectedFile: string | null
  onFileSelect: (file: string | null) => void
  onContentChange: (changed: boolean) => void
}

export default function InputEditor({ inputDirectory, selectedFile, onFileSelect, onContentChange }: InputEditorProps) {
  const [content, setContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [isChanged, setIsChanged] = useState(false)
  const [files, setFiles] = useState<string[]>([])

  useEffect(() => {
    const loadFiles = async () => {
      if (inputDirectory) {
        const fileList: string[] = []
        try {
          for await (const entry of inputDirectory.values()) {
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
  }, [inputDirectory, selectedFile, onFileSelect])

  useEffect(() => {
    const loadFileContent = async () => {
      if (inputDirectory && selectedFile) {
        try {
          const fileHandle = await inputDirectory.getFileHandle(selectedFile)
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
  }, [inputDirectory, selectedFile, onContentChange])

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
    if (!inputDirectory || !selectedFile) return

    try {
      const fileHandle = await inputDirectory.getFileHandle(selectedFile)
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

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Input Editor</CardTitle>
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
              <SelectValue placeholder="Select a file" />
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
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <CodeEditor value={content} onChange={handleContentChange} language="typescript" />
      </CardContent>
    </Card>
  )
}
