"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, FileText, Plus } from "lucide-react"
import CodeEditor from "@/components/code-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface InputEditorProps {
  inputDirectory: FileSystemDirectoryHandle | null
  selectedFile: string | null
  onFileSelect: (file: string | null) => void
  onContentChange: (changed: boolean) => void
  onInputContentChange: (content: string) => void
}

export default function InputEditor({
  inputDirectory,
  selectedFile,
  onFileSelect,
  onContentChange,
  onInputContentChange,
}: InputEditorProps) {
  const [content, setContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [isChanged, setIsChanged] = useState(false)
  const [files, setFiles] = useState<string[]>([])
  const [isNewFileDialogOpen, setIsNewFileDialogOpen] = useState(false)
  const [newFileName, setNewFileName] = useState("")

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
          onInputContentChange(text)
        } catch (error) {
          console.error("Error loading file content:", error)
        }
      } else {
        setContent("")
        setOriginalContent("")
        setIsChanged(false)
        onContentChange(false)
        onInputContentChange("")
      }
    }

    loadFileContent()
  }, [inputDirectory, selectedFile, onContentChange, onInputContentChange])

  const handleContentChange = (newContent: string) => {
    setContent(newContent)
    const changed = newContent !== originalContent
    setIsChanged(changed)
    onContentChange(changed)
    onInputContentChange(newContent)
  }

  const handleReset = () => {
    setContent(originalContent)
    setIsChanged(false)
    onContentChange(false)
    onInputContentChange(originalContent)
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

  const handleCreateNewFile = async () => {
    if (!inputDirectory || !newFileName) return

    try {
      const fileHandle = await inputDirectory.getFileHandle(newFileName, { create: true })
      const writable = await fileHandle.createWritable()
      await writable.write("")
      await writable.close()

      // Refresh file list
      const fileList: string[] = []
      for await (const entry of inputDirectory.values()) {
        if (entry.kind === "file") {
          fileList.push(entry.name)
        }
      }
      setFiles(fileList)

      // Select the new file
      onFileSelect(newFileName)

      // Close the dialog
      setIsNewFileDialogOpen(false)
      setNewFileName("")
    } catch (error) {
      console.error("Error creating new file:", error)
      alert(`Failed to create file: ${error}`)
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
          <Button variant="outline" size="icon" onClick={() => setIsNewFileDialogOpen(true)} disabled={!inputDirectory}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <CodeEditor value={content} onChange={handleContentChange} language="typescript" />
      </CardContent>

      <Dialog open={isNewFileDialogOpen} onOpenChange={setIsNewFileDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Input File</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                File Name
              </Label>
              <Input
                id="name"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="col-span-3"
                placeholder="example.dsl"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleCreateNewFile} disabled={!newFileName}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
