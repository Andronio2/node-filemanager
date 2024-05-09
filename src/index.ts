import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import { Commands } from './enums/commands.enum.ts'
import { opendir } from 'node:fs/promises'

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
    console.log('cmd', cmd)
    await commandParser(cmd)
    showCurrentPath()
  })
  // process.on('exit', sayGoodbye)
  process.on('SIGINT', sayGoodbye)

  function showCurrentPath() {
    console.log('You are currently in', join(...currPath))
  }

  async function commandParser(str: string) {
    const cmd = str.split(' ')
    switch (cmd[0]) {
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

  function showError(msg: string): void {
    console.log(msg, '\n')
  }
}

await fileManager()
