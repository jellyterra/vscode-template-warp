# Template Warp for VSCode

## Commands

### New File from Template

ID: `template-warp.createFile`

You can also apply it in context menu in file explorer.

### Create Template

ID: `template-warp.createTemplate`

Create a template in global or project scope.

## Template

| Substitution | Description |
|--------------|-------------|
| `__NAME__`   | File name.  |

Store templates in `.vscode/templates` in workspace, or in the directory specified by `$template.storageLocation` in user settings.

#### Example: `.vscode/templates/SpinalHDL_Component.scala`

```scala
package core

import spinal.core._
import spinal.core.sim._

import scala.language.postfixOps

case class __NAME__(config: __NAME__.Config) extends Component {
  val io = __NAME__.IO(config)
}

object __NAME__ {
  case class Config()

  case class IO(config: Config) extends Bundle {
  }

  def main(args: Array[String]): Unit = {
    SimConfig.withWave.compile(__NAME__(Config())).doSim { dut =>
      dut.clockDomain.forkStimulus(10)
    }
  }
}
```
