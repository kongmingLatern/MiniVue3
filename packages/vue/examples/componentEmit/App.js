import { h } from '../../dist/lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'
window.self = null
export const App = {
  name: "App",
  render() {
    window.self = this
    return h("div", {}, [h("div", {}, "App"), h(Foo, {
      onAdd() {
        console.log("触发了App中的 onAdd");
      },
      onAddFoo() {
        console.log("触发了App中的 onAddFoo");
      }
    })])
  },
  setup() {
    // Composition API
    return {
      msg: "mini-vue",
      src: "http://www.baidu.com"
    }
  }
}