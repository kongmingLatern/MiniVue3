import { h } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'
window.self = null
export const App = {
  render() {
    name: "App"
    window.self = this
    return h(
      "div",
      {
        id: "root",
        class: ["red", "fz-16"]
      },
      [
        h("h1", {}, "hi, " + this.msg),
        h(Foo, {
          count: 1
        })
      ]
      // // children -> string
      // "hi, mini-vue " + this.src
      // children -> array
      // [
      //   h("p", { class: "fz-16" }, "hi"),
      //   h("p", { class: "blue" }, "blue")
      // ]
    )
  },
  setup() {
    // Composition API
    return {
      msg: "mini-vue",
      src: "http://www.baidu.com"
    }
  }
}