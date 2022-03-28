import { h } from '../../lib/guide-mini-vue.esm.js'
export const App = {
  render() {
    return h(
      "div",
      {
        id: "root",
        class: ["red", "fz-16"]
      },
      // children -> string
      // "hi, mini-vue"
      // children -> array
      [
        h("p", { class: "fz-16" }, "hi"),
        h("p", { class: "blue" }, "blue")
      ]
    )
  },
  setup() {
    // Composition API
    return {
      msg: "mini-vue"
    }
  }
}