import { h } from '../../lib/guide-mini-vue.esm.js'
window.self = null
export const App = {
  render() {
    window.self = this
    return h(
      "div",
      {
        id: "root",
        class: ["red", "fz-16"]
      },
      // children -> string
      "hi, mini-vue " + this.src
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