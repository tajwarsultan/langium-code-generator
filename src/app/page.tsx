"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DirectorySelector from "@/components/directory-selector"
import GrammarEditor from "@/components/grammar-editor"
import InputEditor from "@/components/input-editor"
import TemplateEditor from "@/components/template-editor"
import ResultViewer from "@/components/result-viewer"
import BatchPanel from "@/components/batch-panel"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from 'lucide-react'

export default function Home() {
  const [dslDirectory, setDslDirectory] = useState<FileSystemDirectoryHandle | null>(null)
  const [inputDirectory, setInputDirectory] = useState<FileSystemDirectoryHandle | null>(null)
  const [templatesDirectory, setTemplatesDirectory] = useState<FileSystemDirectoryHandle | null>(null)
  const [targetDirectory, setTargetDirectory] = useState<FileSystemDirectoryHandle | null>(null)

  const [selectedInputFile, setSelectedInputFile] = useState<string | null>(null)
  const [selectedTemplateFile, setSelectedTemplateFile] = useState<string | null>(null)
  const [selectedTargetFile, setSelectedTargetFile] = useState<string | null>(null)

  const [grammarChanged, setGrammarChanged] = useState(false)
  const [inputChanged, setInputChanged] = useState(false)
  const [templateChanged, setTemplateChanged] = useState(false)
  const [grammarCompiled, setGrammarCompiled] = useState(false)
  const [currentInputContent, setCurrentInputContent] = useState("")

  return (
    <main className="container mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Langium Code Generator</h1>

      {/* Directory Selectors */}
      <div className="grid grid-cols-4 gap-4 mb-4">
        <DirectorySelector
          label="DSL Directory"
          directory={dslDirectory}
          onDirectoryChange={setDslDirectory}
          checkBeforeChange={() => {
            if (grammarChanged) {
              alert("Please reset or save Grammar first!")
              return false
            }
            return true
          }}
        />
        <DirectorySelector
          label="Input Directory"
          directory={inputDirectory}
          onDirectoryChange={setInputDirectory}
          checkBeforeChange={() => {
            if (inputChanged) {
              alert("Please reset or save Input file first!")
              return false
            }
            return true
          }}
        />
        <DirectorySelector
          label="Templates Directory"
          directory={templatesDirectory}
          onDirectoryChange={setTemplatesDirectory}
          checkBeforeChange={() => {
            if (templateChanged) {
              alert("Please reset or save Template file first!")
              return false
            }
            return true
          }}
        />
        <DirectorySelector
          label="Target Directory"
          directory={targetDirectory}
          onDirectoryChange={setTargetDirectory}
        />
      </div>

      {/* Alert for Missing DSL Directory */}
      {!dslDirectory && (
        <Alert className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please select a DSL directory containing your Langium grammar file (.langium or .grammar)
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs for Single and Batch Generation */}
      <Tabs defaultValue="single" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="single">Single File Generation</TabsTrigger>
          <TabsTrigger value="batch">Batch Generation</TabsTrigger>
        </TabsList>

        {/* Single File Generation */}
        <TabsContent value="single" className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col">
              <GrammarEditor 
                dslDirectory={dslDirectory} 
                onContentChange={setGrammarChanged}
                onGrammarCompiled={setGrammarCompiled}
              />
            </div>
            <div className="flex flex-col">
              <InputEditor
                inputDirectory={inputDirectory}
                selectedFile={selectedInputFile}
                onFileSelect={setSelectedInputFile}
                onContentChange={setInputChanged}
                onInputContentChange={setCurrentInputContent}
              />
            </div>
            <div className="flex flex-col">
              <TemplateEditor
                templatesDirectory={templatesDirectory as FileSystemDirectoryHandle | null}
                selectedFile={selectedTemplateFile}
                onFileSelect={setSelectedTemplateFile}
                onContentChange={setTemplateChanged}
                inputContent={currentInputContent}
                targetDirectory={targetDirectory}
                grammarCompiled={grammarCompiled}
              />
            </div>
            <div className="flex flex-col">
              <ResultViewer
                targetDirectory={targetDirectory}
                selectedFile={selectedTargetFile}
                onFileSelect={setSelectedTargetFile}
              />
            </div>
          </div>
        </TabsContent>

        {/* Batch Generation */}
        <TabsContent value="batch" className="flex-1">
          <BatchPanel
            inputDirectory={inputDirectory}
            templatesDirectory={templatesDirectory}
            targetDirectory={targetDirectory}
            grammarCompiled={grammarCompiled}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
