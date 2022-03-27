export const App = {
  render() {
    return h("div", "hi," + this.msg)
  },
  setup() {
    // Composition API
    return {
      msg: "mini-vue"
    }
  }
}