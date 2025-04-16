"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen } from "lucide-react"
import { useRef, useState } from "react"

interface DirectorySelectorProps {
  label: string
  onDirectoryChange: (directory: { name: string; files: File[]; values: () => AsyncIterable<{ kind: string; name: string; getFile: () => Promise<File> }>; getFileHandle: (name: string) => Promise<{ getFile: () => Promise<File>; createWritable: () => Promise<{ write: (content: string) => Promise<void>; close: () => Promise<void> }> }> } | null) => void
  checkBeforeChange?: () => boolean
}

export default function DirectorySelector({
  label,
  onDirectoryChange,
  checkBeforeChange = () => true,
}: DirectorySelectorProps) {
  const [directoryName, setDirectoryName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSelectDirectory = () => {
    if (!checkBeforeChange()) {
      return
    }

    fileInputRef.current?.click()
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Create a virtual directory object with the files
    interface FileWithRelativePath extends File {
      webkitRelativePath: string;
    }

    const directoryPath = (files[0] as FileWithRelativePath).webkitRelativePath.split("/")[0];
    setDirectoryName(directoryPath);

    const virtualDirectory = {
      name: directoryPath,
      files: Array.from(files) as FileWithRelativePath[],
      async *values() {
        for (const file of this.files) {
          const relativePath = file.webkitRelativePath;
          const fileName = relativePath.split("/").pop() || "unknown";
          yield {
            kind: "file",
            name: fileName,
            getFile: async () => file,
          };
        }
      },
      async getFileHandle(name: string) {
        const file = this.files.find((f) => {
          const relativePath = f.webkitRelativePath;
          const fileName = relativePath.split("/").pop();
          return fileName === name
        })

        if (!file) throw new Error(`File ${name} not found`)

        return {
          getFile: async () => file,
          createWritable: async () => {
            console.warn("Writing to files is not supported in this preview environment")
            return {
              write: async (content: string) => {
                console.log(`Writing to ${name}:`, content)
              },
              close: async () => {
                console.log(`Closed file ${name}`)
              },
            }
          },
        }
      },
    }

    onDirectoryChange(virtualDirectory)

    // Reset the file input so the same directory can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSelectDirectory} className="flex items-center gap-2">
            <FolderOpen className="h-4 w-4" />
            Select
          </Button>
          <span className="text-sm truncate">{directoryName || "No directory selected"}</span>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInputChange}
            {...{ webkitdirectory: "true", directory: "" } as React.InputHTMLAttributes<HTMLInputElement>}
            multiple
            className="hidden"
          />
        </div>
      </CardContent>
    </Card>
  )
}
