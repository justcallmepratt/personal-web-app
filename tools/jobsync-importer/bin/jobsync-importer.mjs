#!/usr/bin/env node
import { run } from '../src/cli.mjs'

run(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code
  },
  (error) => {
    // An unexpected fault. The message is printed; nothing here ever holds a password or token.
    process.stderr.write(`Unexpected error: ${error?.message ?? error}\n`)
    process.exitCode = 1
  },
)
