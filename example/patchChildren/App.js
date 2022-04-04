import { h } from '../../lib/guide-mini-vue.esm.js'
import ArrayToText from './ArrayToText.js'
import TextToText from './TextToText.js'
import TextToArray from './TextToArray.js'
import ArrayToArray from './ArrayToArray.js'
export const App = {
  name: "App",
  render() {
    return h("div", { tId: 1 }, [
      h("p", {}, "主页"),
      // 老的是 array，新的是 text
      // h(ArrayToText),
      // h(TextToText),
      // h(TextToArray),
      h(ArrayToArray)
    ])

  },
  setup() { }
}