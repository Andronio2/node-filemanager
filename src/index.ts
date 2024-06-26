import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import { Commands } from './enums/commands.enum.ts'
import { opendir, readdir, rename, writeFile, rm } from 'node:fs/promises'
import { createReadStream, createWriteStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'

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
      case Commands.RN: {
        await cmdRn(cmd[1], cmd[2])
        break
      }
      case Commands.CP: {
        await cmdCp(cmd[1], cmd[2])
        break
      }
      case Commands.MV: {
        await cmdMv(cmd[1], cmd[2])
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

  async function cmdRn(oldName: string, newName: string) {
    try {
      return rename(join(...currPath, oldName), join(...currPath, newName))
    } catch (error) {
      showError(`File ${oldName} can't be renamed`)
    }
  }

  async function cmdCp(oldName: string, newName: string) {
    try {
      const readStream = createReadStream(join(...currPath, oldName), { encoding: 'binary' })
      const writeStream = createWriteStream(join(...currPath, newName), { encoding: 'binary' })
      return pipeline(readStream, writeStream)
    } catch (error) {
      showError(`File ${oldName} can't be copied`)
    }
  }

  async function cmdMv(oldName: string, path: string) {
    try {
      const readStream = createReadStream(join(...currPath, oldName), { encoding: 'binary' })
      const writeStream = createWriteStream(join(...currPath, path, oldName), { encoding: 'binary' })
      await pipeline(readStream, writeStream)
      await rm(join(...currPath, oldName))
    } catch (error) {
      showError(`File ${oldName} can't be moved`)
    }
  }

  function showError(msg: string): void {
    console.log(msg, '\n')
  }
}

await fileManager()
