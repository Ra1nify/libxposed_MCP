import fs from "node:fs";
import path from "node:path";

const LIBXPOSED_ROOT = "C:\\R1p0\\libxposed";
const DATA_DIR = path.join("src", "data");

function readText(p) {
  return fs.readFileSync(p, "utf-8");
}

function parseJavaFile(filePath, relPath) {
  const content = readText(filePath);
  const lines = content.split("\n");

  let packageName = "";
  for (const line of lines) {
    const m = line.trim().match(/^package\s+([a-zA-Z0-9_.]+);?/);
    if (m) {
      packageName = m[1];
      break;
    }
  }

  if (relPath.endsWith("package-info.java")) {
    return [
      {
        name: `${packageName}.package-info`,
        simpleName: "package-info",
        type: "package-info",
        packageName,
        filePath: relPath,
        sinceApi: 101,
        summary: "Package-level documentation and module interface specification.",
        javadocUrl: `https://libxposed.github.io/api/${packageName.replace(/\./g, "/")}/package-summary.html`,
        methods: [],
        constants: []
      }
    ];
  }

  const parsedClasses = [];
  const classStack = []; // [{ cls, depth }]
  let braceDepth = 0;
  let currentDoc = [];
  let currentSinceApi = 101;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;

    // Collect Javadoc / comments
    if (trimmed.startsWith("/**") || trimmed.startsWith("*") || trimmed.startsWith("//")) {
      currentDoc.push(trimmed.replace(/^\/\*\*|\*\/|^\*|^\/\//g, "").trim());
      const apiMatch = trimmed.match(/@SinceApi\((\d+)\)/) || trimmed.match(/Since API (\d+)/i) || trimmed.match(/API level (\d+)/i);
      if (apiMatch) {
        currentSinceApi = parseInt(apiMatch[1], 10);
      }
      continue;
    }

    if (trimmed.startsWith("@SinceApi(")) {
      const apiMatch = trimmed.match(/@SinceApi\((\d+)\)/);
      if (apiMatch) {
        currentSinceApi = parseInt(apiMatch[1], 10);
      }
      continue;
    }

    // Check Class / Interface / Enum / Record / Annotation declaration
    const classMatch = trimmed.match(/(?:public|protected|private|static|final|sealed|abstract|\s)*(class|interface|enum|record|@interface)\s+([A-Za-z0-9_]+)/);
    if (classMatch && !trimmed.startsWith("return") && !trimmed.includes("permits") && !trimmed.startsWith("import") && !trimmed.startsWith("package")) {
      const type = classMatch[1];
      const name = classMatch[2];

      const parentFqn = classStack.length > 0 ? classStack[classStack.length - 1].cls.name : packageName;
      const fqn = parentFqn ? `${parentFqn}.${name}` : name;

      const newCls = {
        name: fqn,
        simpleName: name,
        type,
        packageName,
        filePath: relPath,
        sinceApi: currentSinceApi,
        summary: currentDoc.filter(d => d.length > 0).join(" ") || `${type} ${name}`,
        javadocUrl: `https://libxposed.github.io/api/${packageName.replace(/\./g, "/")}/${name}.html`,
        constants: [],
        methods: []
      };

      parsedClasses.push(newCls);
      classStack.push({ cls: newCls, depth: braceDepth + openBraces });
      braceDepth += openBraces - closeBraces;
      currentDoc = [];
      continue;
    }

    const currentClass = classStack.length > 0 ? classStack[classStack.length - 1].cls : null;

    if (currentClass) {
      // Constant field
      const constMatch = trimmed.match(/(?:public|protected|private|static|final|\s)*([A-Za-z0-9_<>?]+)\s+([A-Z0-9_]+)\s*=\s*(.+?);/);
      if (constMatch) {
        currentClass.constants.push({
          name: constMatch[2],
          type: constMatch[1],
          value: constMatch[3].trim(),
          doc: currentDoc.filter(d => d.length > 0).join(" ")
        });
        currentDoc = [];
        braceDepth += openBraces - closeBraces;
        continue;
      }

      // Method declaration
      const methodMatch = trimmed.match(/(?:@\w+(?:\([^)]*\))?\s+)*(?:public|protected|private|abstract|default|static|final|synchronized|native|\s)*(?:<[^>]+>\s+)?([A-Za-z0-9_<>?\[\],\s]+?)\s+([A-Za-z0-9_]+)\s*\(([^)]*)\)(?:\s+throws\s+[A-Za-z0-9_,\s]+)?;?/);
      if (methodMatch) {
        const rawReturnType = methodMatch[1].trim();
        const methodName = methodMatch[2];
        const rawParams = methodMatch[3].trim();

        if (methodName &&
            !["if", "for", "while", "switch", "catch", "class", "return", "new", "throw", "import", "package"].includes(methodName) &&
            !rawReturnType.startsWith("class") &&
            !rawReturnType.startsWith("interface") &&
            !rawReturnType.startsWith("enum")) {

          currentClass.methods.push({
            name: methodName,
            signature: `${rawReturnType} ${methodName}(${rawParams})`,
            returnType: rawReturnType,
            params: rawParams ? rawParams.split(",").map(p => p.trim()) : [],
            sinceApi: currentSinceApi,
            doc: currentDoc.filter(d => d.length > 0).join(" "),
            line: i + 1
          });
        }
        currentDoc = [];
        braceDepth += openBraces - closeBraces;
        continue;
      }
    }

    braceDepth += openBraces - closeBraces;

    // Pop class stack if braceDepth drops below class start depth
    while (classStack.length > 0 && braceDepth < classStack[classStack.length - 1].depth) {
      classStack.pop();
    }

    if (trimmed.endsWith(";") || trimmed === "") {
      currentDoc = [];
    }
  }

  return parsedClasses;
}

console.log("Parsing full LibXposed source code...");

const allParsed = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".git" || entry.name === "build" || entry.name === ".gradle") continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith(".java") || entry.name.endsWith(".kt") || entry.name.endsWith(".aidl"))) {
      const relPath = path.relative(LIBXPOSED_ROOT, fullPath).replace(/\\/g, "/");
      const classes = parseJavaFile(fullPath, relPath);
      allParsed.push(...classes);
    }
  }
}

scanDir(LIBXPOSED_ROOT);

console.log(`Parsed ${allParsed.length} total classes/interfaces/annotations across all subprojects.`);

const apiClasses = allParsed.filter(c => c.filePath.startsWith("api/"));
const helperClasses = allParsed.filter(c => c.filePath.startsWith("helper/"));
const serviceClasses = allParsed.filter(c => c.filePath.startsWith("service/"));
const lintClasses = allParsed.filter(c => c.filePath.startsWith("lint/"));
const exampleClasses = allParsed.filter(c => c.filePath.startsWith("example/"));

// Save enriched JSON files
const existingApi = JSON.parse(readText(path.join(DATA_DIR, "api.json")));
existingApi.classes = apiClasses;
fs.writeFileSync(path.join(DATA_DIR, "api.json"), JSON.stringify(existingApi, null, 2), "utf-8");

const existingHelper = JSON.parse(readText(path.join(DATA_DIR, "helper.json")));
existingHelper.classes = helperClasses;
existingHelper.components = helperClasses;
fs.writeFileSync(path.join(DATA_DIR, "helper.json"), JSON.stringify(existingHelper, null, 2), "utf-8");

const existingService = JSON.parse(readText(path.join(DATA_DIR, "service.json")));
existingService.classes = serviceClasses;
fs.writeFileSync(path.join(DATA_DIR, "service.json"), JSON.stringify(existingService, null, 2), "utf-8");

const existingLint = JSON.parse(readText(path.join(DATA_DIR, "lint.json")));
existingLint.classes = lintClasses;
fs.writeFileSync(path.join(DATA_DIR, "lint.json"), JSON.stringify(existingLint, null, 2), "utf-8");

const existingExample = JSON.parse(readText(path.join(DATA_DIR, "example.json")));
existingExample.classes = exampleClasses;
fs.writeFileSync(path.join(DATA_DIR, "example.json"), JSON.stringify(existingExample, null, 2), "utf-8");

console.log("Enrichment summary:");
console.log(`- API: ${apiClasses.length} classes, total methods: ${apiClasses.reduce((acc, c) => acc + c.methods.length, 0)}`);
console.log(`- Helper: ${helperClasses.length} classes, total methods: ${helperClasses.reduce((acc, c) => acc + c.methods.length, 0)}`);
console.log(`- Service: ${serviceClasses.length} classes, total methods: ${serviceClasses.reduce((acc, c) => acc + c.methods.length, 0)}`);
console.log(`- Lint: ${lintClasses.length} classes, total methods: ${lintClasses.reduce((acc, c) => acc + c.methods.length, 0)}`);
