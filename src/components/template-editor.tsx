"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Save, RefreshCw, FileText, Play, AlertCircle } from "lucide-react"
import CodeEditor from "@/components/code-editor"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CodeGenerator } from "@/lib/langium-service"

interface TemplateEditorProps {
  templatesDirectory: FileSystemDirectoryHandle | null
  selectedFile: string | null
  onFileSelect: (file: string | null) => void
  onContentChange: (changed: boolean) => void
  inputContent: string
  targetDirectory: FileSystemDirectoryHandle | null
  grammarCompiled: boolean
}

export default function TemplateEditor({
  templatesDirectory,
  selectedFile,
  onFileSelect,
  onContentChange,
  inputContent,
  targetDirectory,
  grammarCompiled,
}: TemplateEditorProps) {
  const [content, setContent] = useState<string>("")
  const [originalContent, setOriginalContent] = useState<string>("")
  const [isChanged, setIsChanged] = useState(false)
  const [files, setFiles] = useState<string[]>([])
  const [selector, setSelector] = useState<string>("")
  const [generationStatus, setGenerationStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const codeGenerator = new CodeGenerator()

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

  const handleGenerate = async () => {
    if (!selectedFile || !inputContent || !targetDirectory) {
      setGenerationStatus({
        success: false,
        message: "Missing required inputs: template, input content, or target directory",
      })
      return
    }

    if (!grammarCompiled) {
      setGenerationStatus({
        success: false,
        message: "Grammar must be compiled successfully before generating code",
      })
      return
    }

    setIsGenerating(true)
    setGenerationStatus(null)

    try {
      // Generate the code
      const generatedCode = codeGenerator.generateCode(inputContent, content, selector)

      // Generate output filename
      const inputFileName = "input.txt" // Placeholder
      const outputFileName = codeGenerator.generateOutputName(inputFileName, selectedFile)

      // Save the generated code to the target directory
      try {
        const fileHandle = await targetDirectory.getFileHandle(outputFileName, { create: true })
        const writable = await fileHandle.createWritable()
        await writable.write(generatedCode)
        await writable.close()

        setGenerationStatus({
          success: true,
          message: `Code generated successfully and saved as ${outputFileName}`,
        })
      } catch (error) {
        console.warn("Unable to save generated file:", error)
        setGenerationStatus({
          success: true,
          message: `Code generated successfully but couldn't save to file: ${error}`,
        })
      }
    } catch (error) {
      console.error("Error generating code:", error)
      setGenerationStatus({
        success: false,
        message: `Failed to generate code: ${error}`,
      })
    } finally {
      setIsGenerating(false)
    }
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
          <Button
            variant="default"
            size="sm"
            onClick={handleGenerate}
            disabled={!selectedFile || !inputContent || !targetDirectory || isGenerating || !grammarCompiled}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <span className="animate-spin mr-1">⏳</span>
                Generating...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-1" />
                Generate
              </>
            )}
          </Button>
        </div>
        {generationStatus && (
          <div className="mt-2">
            <Alert variant={generationStatus.success ? "default" : "destructive"}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{generationStatus.message}</AlertDescription>
            </Alert>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0">
        <CodeEditor value={content} onChange={handleContentChange} language="template" />
      </CardContent>
    </Card>
  )
}
