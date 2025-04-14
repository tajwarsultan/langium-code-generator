"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText } from "lucide-react"
import CodeEditor from "@/components/code-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface ResultViewerProps {
  targetDirectory: FileSystemDirectoryHandle | null
  selectedFile: string | null
  onFileSelect: (file: string | null) => void
}

export default function ResultViewer({ targetDirectory, selectedFile, onFileSelect }: ResultViewerProps) {
  const [content, setContent] = useState<string>("")
  const [files, setFiles] = useState<string[]>([])

  useEffect(() => {
    const loadFiles = async () => {
      if (targetDirectory) {
        const fileList: string[] = []
        try {
          for await (const entry of targetDirectory.values()) {
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
  }, [targetDirectory, selectedFile, onFileSelect])

  useEffect(() => {
    const loadFileContent = async () => {
      if (targetDirectory && selectedFile) {
        try {
          const fileHandle = await targetDirectory.getFileHandle(selectedFile)
          const file = await fileHandle.getFile()
          const text = await file.text()
          setContent(text)
        } catch (error) {
          console.error("Error loading file content:", error)
        }
      } else {
        setContent("")
      }
    }

    loadFileContent()
  }, [targetDirectory, selectedFile])

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Result Viewer</CardTitle>
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
        <CodeEditor
          value={content}
          onChange={() => {}} // Read-only
          language="typescript"
          readOnly={true}
        />
      </CardContent>
    </Card>
  )
}
