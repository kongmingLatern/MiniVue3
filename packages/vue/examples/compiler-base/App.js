import { ref, h } from '../../dist/lib/guide-mini-vue.esm.js'
export const App = {
  name: "App",
  // template: `<div>bye,{{message}}  {{count}}</div>`,
  setup() {
    const count = ref(1)

    const changeCount = () => {
      console.log('触发changeCount');
      count.value++
    }

    return {
      message: "mini-vue",
      count,
      changeCount
    }
  },
  render() {
    return h("div", {}, [
      h("div", {}, "App" + this.count),
      h("button", {
        onClick: this.changeCount
      }, "按钮")])
  },
}