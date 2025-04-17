// "use client"

// import { useEffect, useState } from "react"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Play, AlertCircle, Loader2 } from "lucide-react"
// import { Alert, AlertDescription } from "@/components/ui/alert"
// import { Textarea } from "@/components/ui/textarea"
// import { CodeGenerator } from "@/lib/langium-service"

// interface BatchPanelProps {
//   inputDirectory: FileSystemDirectoryHandle | null
//   templatesDirectory: FileSystemDirectoryHandle | null
//   targetDirectory: FileSystemDirectoryHandle | null
//   grammarCompiled: boolean
// }

// export default function BatchPanel({
//   inputDirectory,
//   templatesDirectory,
//   targetDirectory,
//   grammarCompiled,
// }: BatchPanelProps) {
//   const [inputFiles, setInputFiles] = useState<string[]>([])
//   const [templateFiles, setTemplateFiles] = useState<string[]>([])
//   const [logOutput, setLogOutput] = useState<string>("")
//   const [isGenerating, setIsGenerating] = useState(false)
//   const [selector, setSelector] = useState<string>("")
//   const [batchStatus, setBatchStatus] = useState<{ success: boolean; message: string } | null>(null)
//   const codeGenerator = new CodeGenerator()

//   useEffect(() => {
//     const loadInputFiles = async () => {
//       if (inputDirectory) {
//         const fileList: string[] = []
//         try {
//           for await (const entry of inputDirectory.values()) {
//             if (entry.kind === "file") {
//               fileList.push(entry.name)
//             }
//           }
//           setInputFiles(fileList)
//         } catch (error) {
//           console.error("Error loading input files:", error)
//         }
//       } else {
//         setInputFiles([])
//       }
//     }

//     loadInputFiles()
//   }, [inputDirectory])

//   useEffect(() => {
//     const loadTemplateFiles = async () => {
//       if (templatesDirectory) {
//         const fileList: string[] = []
//         try {
//           for await (const entry of templatesDirectory.values()) {
//             if (entry.kind === "file") {
//               fileList.push(entry.name)
//             }
//           }
//           setTemplateFiles(fileList)
//         } catch (error) {
//           console.error("Error loading template files:", error)
//         }
//       } else {
//         setTemplateFiles([])
//       }
//     }

//     loadTemplateFiles()
//   }, [templatesDirectory])

//   const handleGenerateAll = async () => {
//     if (!inputDirectory || !templatesDirectory || !targetDirectory) {
//       setLogOutput("Error: Please select all required directories\n")
//       setBatchStatus({
//         success: false,
//         message: "Missing required directories",
//       })
//       return
//     }

//     if (!grammarCompiled) {
//       setLogOutput("Error: Grammar must be compiled successfully before generating code\n")
//       setBatchStatus({
//         success: false,
//         message: "Grammar must be compiled successfully before generating code",
//       })
//       return
//     }

//     if (inputFiles.length === 0) {
//       setLogOutput("Error: No input files found\n")
//       setBatchStatus({
//         success: false,
//         message: "No input files found",
//       })
//       return
//     }

//     if (templateFiles.length === 0) {
//       setLogOutput("Error: No template files found\n")
//       setBatchStatus({
//         success: false,
//         message: "No template files found",
//       })
//       return
//     }

//     setIsGenerating(true)
//     setLogOutput("Batch generation started...\n")
//     setBatchStatus(null)

//     try {
//       // Load all input files
//       const inputContents = new Map<string, string>()
//       for (const fileName of inputFiles) {
//         try {
//           const fileHandle = await inputDirectory.getFileHandle(fileName)
//           const file = await fileHandle.getFile()
//           const content = await file.text()
//           inputContents.set(fileName, content)
//           setLogOutput((prev) => prev + `Loaded input file: ${fileName}\n`)
//         } catch (error) {
//           setLogOutput((prev) => prev + `Error loading input file ${fileName}: ${error}\n`)
//         }
//       }

//       // Load all template files
//       const templateContents = new Map<string, string>()
//       for (const fileName of templateFiles) {
//         try {
//           const fileHandle = await templatesDirectory.getFileHandle(fileName)
//           const file = await fileHandle.getFile()
//           const content = await file.text()
//           templateContents.set(fileName, content)
//           setLogOutput((prev) => prev + `Loaded template file: ${fileName}\n`)
//         } catch (error) {
//           setLogOutput((prev) => prev + `Error loading template file ${fileName}: ${error}\n`)
//         }
//       }

//       // Generate code for each input/template combination
//       setLogOutput((prev) => prev + `\nGenerating code...\n`)
//       const results = codeGenerator.generateBatch(inputContents, templateContents, selector)

//       // Save generated files
//       let successCount = 0
//       let errorCount = 0

//       for (const [outputName, generatedCode] of results.entries()) {
//         try {
//           const fileHandle = await targetDirectory.getFileHandle(outputName, { create: true })
//           const writable = await fileHandle.createWritable()
//           await writable.write(generatedCode)
//           await writable.close()
//           setLogOutput((prev) => prev + `Generated: ${outputName}\n`)
//           successCount++
//         } catch (error) {
//           setLogOutput((prev) => prev + `Error saving ${outputName}: ${error}\n`)
//           errorCount++
//         }
//       }

//       setLogOutput((prev) => prev + `\nBatch generation completed.\n`)
//       setLogOutput((prev) => prev + `Successfully generated ${successCount} files.\n`)
//       if (errorCount > 0) {
//         setLogOutput((prev) => prev + `Failed to generate ${errorCount} files.\n`)
//       }

//       setBatchStatus({
//         success: true,
//         message: `Generated ${successCount} files with ${errorCount} errors`,
//       })
//     } catch (error) {
//       console.error("Error in batch generation:", error)
//       setLogOutput((prev) => prev + `\nBatch generation failed: ${error}\n`)
//       setBatchStatus({
//         success: false,
//         message: `Batch generation failed: ${error}`,
//       })
//     } finally {
//       setIsGenerating(false)
//     }
//   }

//   return (
//     <div className="grid grid-cols-1 gap-4 h-full">
//       <Card className="h-full flex flex-col">
//         <CardHeader className="pb-2">
//           <div className="flex items-center justify-between">
//             <CardTitle className="text-sm font-medium">Batch Generation</CardTitle>
//             <Button
//               variant="default"
//               size="sm"
//               onClick={handleGenerateAll}
//               disabled={!inputDirectory || !templatesDirectory || !targetDirectory || isGenerating || !grammarCompiled}
//             >
//               {isGenerating ? (
//                 <>
//                   <Loader2 className="h-4 w-4 mr-1 animate-spin" />
//                   Generating...
//                 </>
//               ) : (
//                 <>
//                   <Play className="h-4 w-4 mr-1" />
//                   Generate All
//                 </>
//               )}
//             </Button>
//           </div>
//         </CardHeader>
//         <CardContent className="flex-1">
//           <div className="grid grid-cols-2 gap-4 mb-4">
//             <div>
//               <h3 className="text-sm font-medium mb-2">Input Files ({inputFiles.length})</h3>
//               <div className="border rounded-md p-2 h-40 overflow-y-auto">
//                 {inputFiles.length > 0 ? (
//                   <ul className="text-sm">
//                     {inputFiles.map((file) => (
//                       <li key={file} className="py-1">
//                         {file}
//                       </li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <p className="text-sm text-muted-foreground">No input files found</p>
//                 )}
//               </div>
//             </div>
//             <div>
//               <h3 className="text-sm font-medium mb-2">Template Files ({templateFiles.length})</h3>
//               <div className="border rounded-md p-2 h-40 overflow-y-auto">
//                 {templateFiles.length > 0 ? (
//                   <ul className="text-sm">
//                     {templateFiles.map((file) => (
//                       <li key={file} className="py-1">
//                         {file}
//                       </li>
//                     ))}
//                   </ul>
//                 ) : (
//                   <p className="text-sm text-muted-foreground">No template files found</p>
//                 )}
//               </div>
//             </div>
//           </div>
//           <div className="mb-4">
//             <h3 className="text-sm font-medium mb-2">Selector Code (Optional)</h3>
//             <Textarea
//               placeholder="Enter selector code to transform the AST before applying templates"
//               value={selector}
//               onChange={(e) => setSelector(e.target.value)}
//               className="h-20 text-xs"
//             />
//           </div>
//           {batchStatus && (
//             <Alert variant={batchStatus.success ? "default" : "destructive"} className="mb-4">
//               <AlertCircle className="h-4 w-4" />
//               <AlertDescription>{batchStatus.message}</AlertDescription>
//             </Alert>
//           )}
//           <div>
//             <h3 className="text-sm font-medium mb-2">Log Output</h3>
//             <div className="border rounded-md p-2 bg-black text-white font-mono text-sm h-60 overflow-y-auto">
//               <pre>{logOutput || "Waiting for batch generation to start..."}</pre>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   )
// }
