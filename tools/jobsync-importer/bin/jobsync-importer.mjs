#!/usr/bin/env node
import { withoutControlCharacters } from '../src/analyse.mjs'
import { run } from '../src/cli.mjs'

run(process.argv.slice(2)).then(
  (code) => {
    process.exitCode = code
  },
  (error) => {
    // An unexpected fault. The message is printed on one line with control characters
    // removed; nothing here ever holds a password or token.
    process.stderr.write(`Unexpected error: ${withoutControlCharacters(error?.message ?? error)}\n`)
    process.exitCode = 1
  },
)
