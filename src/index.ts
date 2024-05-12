import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import { Commands } from './enums/commands.enum.ts'
import { opendir, readdir, writeFile } from 'node:fs/promises'
import { createReadStream } from 'node:fs'

async function fileManager() {
  let currPath: string[] = []
  const username: string =
    process.argv
      .slice(2)
      .find(arg => arg.startsWith('--username'))
      ?.split('=')[1] ?? 'Unknown user'

  const sayGoodbye = () => {
    console.log(`Thank you for using File Manager, ${username}, goodbye!`)
    process.exit()
  }

  currPath = homedir().split(sep)

  console.log(`Welcome to the File Manager, ${username}!`)
  showCurrentPath()

  process.stdin.on('data', async data => {
    const cmd = data.toString().trim()
    await commandParser(cmd)
    showCurrentPath()
  })
  // process.on('exit', sayGoodbye)
  process.on('SIGINT', sayGoodbye)

  function showCurrentPath() {
    console.log('\nYou are currently in', join(...currPath))
  }

  async function commandParser(str: string) {
    const cmd = str.split(' ')
    switch (cmd[0].toLowerCase()) {
      case Commands.EXIT: {
        sayGoodbye()
        break
      }
      case Commands.UP: {
        cmdUp()
        break
      }
      case Commands.CD: {
        await cmdCd(cmd[1])
        break
      }
      case Commands.LS: {
        await cmdLs()
        break
      }
      case Commands.CAT: {
        await cmdCat(cmd[1])
        break
      }
      case Commands.ADD: {
        await cmdAdd(cmd[1])
        break
      }
      default:
    }
  }

  function cmdUp() {
    if (currPath.length > 1) {
      currPath.pop()
    }
  }

  async function cmdCd(path: string) {
    if (path) {
      try {
        await opendir(join(...currPath, path))
        currPath.push(path)
      } catch (err) {
        showError(`No such file or directory: ${path}`)
      }
    }
  }

  async function cmdLs() {
    try {
      const files = await readdir(join(...currPath), { withFileTypes: true })
      const dirList = files
        .filter(file => file.isDirectory())
        .map(file => file.name)
        .sort((a, b) => a.localeCompare(b))
        .map(file => ({ Name: file, Type: 'directory' }))
      const fileList = files
        .filter(file => !file.isDirectory())
        .map(file => file.name)
        .sort((a, b) => a.localeCompare(b))
        .map(file => ({ Name: file, Type: 'file' }))
      const list = dirList.concat(fileList)

      console.table(list)
    } catch {
      showError("Can't read directory")
    }
  }

  async function cmdCat(file: string) {
    try {
      return new Promise(resolve => {
        const readStream = createReadStream(join(...currPath, file), { encoding: 'utf8' })
        readStream.pipe(process.stdout)
        readStream.on('end', () => {
          resolve(0)
        })
      })
    } catch (error) {
      showError(`No such file: ${file}`)
    }
  }

  async function cmdAdd(file: string) {
    try {
      return writeFile(join(...currPath, file), '', { encoding: 'utf8' })
    } catch (error) {
      showError(`File ${file} can't be created`)
    }
  }

  function showError(msg: string): void {
    console.log(msg, '\n')
  }
}

await fileManager()
