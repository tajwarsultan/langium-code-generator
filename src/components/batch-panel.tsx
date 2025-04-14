"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Play } from "lucide-react"

interface BatchPanelProps {
  inputDirectory: FileSystemDirectoryHandle | null
  templatesDirectory: FileSystemDirectoryHandle | null
  targetDirectory: FileSystemDirectoryHandle | null
}

export default function BatchPanel({ inputDirectory, templatesDirectory, targetDirectory }: BatchPanelProps) {
  const [inputFiles, setInputFiles] = useState<string[]>([])
  const [templateFiles, setTemplateFiles] = useState<string[]>([])
  const [logOutput, setLogOutput] = useState<string>("")

  useEffect(() => {
    const loadInputFiles = async () => {
      if (inputDirectory) {
        const fileList: string[] = []
        try {
          for await (const entry of inputDirectory.values()) {
            if (entry.kind === "file") {
              fileList.push(entry.name)
            }
          }
          setInputFiles(fileList)
        } catch (error) {
          console.error("Error loading input files:", error)
        }
      } else {
        setInputFiles([])
      }
    }

    loadInputFiles()
  }, [inputDirectory])

  useEffect(() => {
    const loadTemplateFiles = async () => {
      if (templatesDirectory) {
        const fileList: string[] = []
        try {
          for await (const entry of templatesDirectory.values()) {
            if (entry.kind === "file") {
              fileList.push(entry.name)
            }
          }
          setTemplateFiles(fileList)
        } catch (error) {
          console.error("Error loading template files:", error)
        }
      } else {
        setTemplateFiles([])
      }
    }

    loadTemplateFiles()
  }, [templatesDirectory])

  const handleGenerateAll = () => {
    // This will be implemented in Package 4
    setLogOutput("Batch generation started...\n")

    if (!inputDirectory || !templatesDirectory || !targetDirectory) {
      setLogOutput((prev) => prev + "Error: Please select all required directories\n")
      return
    }

    if (inputFiles.length === 0) {
      setLogOutput((prev) => prev + "Error: No input files found\n")
      return
    }

    if (templateFiles.length === 0) {
      setLogOutput((prev) => prev + "Error: No template files found\n")
      return
    }

    setLogOutput((prev) => prev + `Found ${inputFiles.length} input files and ${templateFiles.length} templates\n`)
    setLogOutput((prev) => prev + "Batch generation not yet implemented\n")
  }

  return (
    <div className="grid grid-cols-1 gap-4 h-full">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Batch Generation</CardTitle>
            <Button
              variant="default"
              size="sm"
              onClick={handleGenerateAll}
              disabled={!inputDirectory || !templatesDirectory || !targetDirectory}
            >
              <Play className="h-4 w-4 mr-1" />
              Generate All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <h3 className="text-sm font-medium mb-2">Input Files ({inputFiles.length})</h3>
              <div className="border rounded-md p-2 h-40 overflow-y-auto">
                {inputFiles.length > 0 ? (
                  <ul className="text-sm">
                    {inputFiles.map((file) => (
                      <li key={file} className="py-1">
                        {file}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No input files found</p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Template Files ({templateFiles.length})</h3>
              <div className="border rounded-md p-2 h-40 overflow-y-auto">
                {templateFiles.length > 0 ? (
                  <ul className="text-sm">
                    {templateFiles.map((file) => (
                      <li key={file} className="py-1">
                        {file}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">No template files found</p>
                )}
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2">Log Output</h3>
            <div className="border rounded-md p-2 bg-black text-white font-mono text-sm h-60 overflow-y-auto">
              <pre>{logOutput || "Waiting for batch generation to start..."}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
