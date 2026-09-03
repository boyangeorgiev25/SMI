import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data.json')
const EMPTY = '{"attempts":[],"bookings":[]}'

// tiny shared-storage API so every device sees the same bookings
function dataApi() {
  return {
    name: 'data-api',
    configureServer(server) {
      server.middlewares.use('/api/data', (req, res) => {
        res.setHeader('Content-Type', 'application/json')
        if (req.method === 'GET') {
          res.end(fs.existsSync(DATA_FILE) ? fs.readFileSync(DATA_FILE, 'utf8') : EMPTY)
        } else if (req.method === 'POST' || req.method === 'PUT') {
          let body = ''
          req.on('data', (c) => { body += c })
          req.on('end', () => {
            try {
              JSON.parse(body) // reject invalid payloads
              fs.writeFileSync(DATA_FILE, body)
              res.end('{"ok":true}')
            } catch {
              res.statusCode = 400
              res.end('{"ok":false}')
            }
          })
        } else {
          res.statusCode = 405
          res.end('{}')
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), dataApi()],
  server: {
    port: 5599,
    strictPort: true,
    host: true,
  },
})
