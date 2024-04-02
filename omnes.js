#!/usr/bin/env node

const fs = require("fs")
const { spawn } = require("child_process")

// Define the files to detect for each package manager
const packageManagerFiles = {
  bun: "bun.lockb",
  pnpm: "pnpm-lock.yaml",
  npm: "package-lock.json",
  yarn: "yarn.lock",
}

// Define the command formats for each package manager
const packageManagerCommands = {
  bun: "bun",
  pnpm: "pnpm",
  npm: "npm",
  yarn: "yarn",
}

// Function to run the command based on the detected package manager
function runCommand(packageManager, command) {
  const [packageManagerCommand, ...commandArgs] = command.split(" ")

  if (
    packageManager === "npm" &&
    !["run", "exec"].includes(packageManagerCommand)
  ) {
    command = `${packageManagerCommand} ${commandArgs.join(" ")}`
  }

  const child = spawn(
    packageManagerCommands[packageManager],
    command.split(" "),
    {
      stdio: "inherit",
      shell: true,
    }
  )

  child.on("close", (code) => {
    process.exit(code)
  })
}

// Function to detect the package manager based on the presence of specific files
function detectPackageManager() {
  for (const [packageManager, file] of Object.entries(packageManagerFiles)) {
    if (fs.existsSync(file)) {
      return packageManager
    }
  }
  return "npm" // Default to npm if no lockfile is found
}

// Main function
function main() {
  const command = process.argv.slice(2).join(" ")

  if (!command) {
    console.log("Please provide a command to run")
    return
  }

  const packageManager = detectPackageManager()
  console.log(`Detected package manager: ${packageManager}`)
  runCommand(packageManager, command)
}

main()
