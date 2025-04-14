"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import DirectorySelector from "@/components/directory-selector"
import GrammarEditor from "@/components/grammar-editor"
import InputEditor from "@/components/input-editor"
import TemplateEditor from "@/components/template-editor"
import ResultViewer from "@/components/result-viewer"
import BatchPanel from "@/components/batch-panel"

export default function Home() {
  const [dslDirectory, setDslDirectory] = useState<any | null>(null)
  const [inputDirectory, setInputDirectory] = useState<any | null>(null)
  const [templatesDirectory, setTemplatesDirectory] = useState<any | null>(null)
  const [targetDirectory, setTargetDirectory] = useState<any | null>(null)

  const [selectedInputFile, setSelectedInputFile] = useState<string | null>(null)
  const [selectedTemplateFile, setSelectedTemplateFile] = useState<string | null>(null)
  const [selectedTargetFile, setSelectedTargetFile] = useState<string | null>(null)

  const [grammarChanged, setGrammarChanged] = useState(false)
  const [inputChanged, setInputChanged] = useState(false)
  const [templateChanged, setTemplateChanged] = useState(false)

  return (
    <main className="container mx-auto p-4 h-screen flex flex-col">
      <h1 className="text-2xl font-bold mb-4">Langium Code Generator</h1>

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
        />
        <DirectorySelector
          label="Target Directory"
          directory={targetDirectory}
          onDirectoryChange={setTargetDirectory}
        />
      </div>

      <Tabs defaultValue="single" className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="single">Single</TabsTrigger>
          <TabsTrigger value="batch">Batch</TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-4 h-full">
            <div className="flex flex-col">
              <GrammarEditor dslDirectory={dslDirectory} onContentChange={(changed) => setGrammarChanged(changed)} />
            </div>
            <div className="flex flex-col">
              <InputEditor
                inputDirectory={inputDirectory}
                selectedFile={selectedInputFile}
                onFileSelect={setSelectedInputFile}
                onContentChange={(changed) => setInputChanged(changed)}
              />
            </div>
            <div className="flex flex-col">
              <TemplateEditor
                templatesDirectory={templatesDirectory}
                selectedFile={selectedTemplateFile}
                onFileSelect={setSelectedTemplateFile}
                onContentChange={(changed) => setTemplateChanged(changed)}
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

        <TabsContent value="batch" className="flex-1">
          <BatchPanel
            inputDirectory={inputDirectory}
            templatesDirectory={templatesDirectory}
            targetDirectory={targetDirectory}
          />
        </TabsContent>
      </Tabs>
    </main>
  )
}
