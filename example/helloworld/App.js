import { h } from '../../lib/guide-mini-vue.esm.js'
window.self = null
export const App = {
  name: "App",
  render() {
    window.self = this
    return h(
      "div",
      {
        id: "root",
        class: ["red", "fz-16"]
      },
      // children -> array
      [
        h("p", { class: "fz-16" }, "hi"),
        h("p", { class: "blue" }, "blue")
      ]
    )
    // // children -> string
    // "hi, mini-vue " + this.src

    // )
  },
  setup() {
    // Composition API

  }
}