import { h, createTextVNode } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: "App",
  render() {
    const app = h("div", {}, "App")
    // const foo = h(Foo, {}, h("p", {}, "123"))
    // const foo1 = h(Foo, {}, [h("p", {}, "123"), h("p", {}, "456")])
    // const foo2 = h(Foo, {}, {
    //   // 具名插槽
    //   header: ({ age }) => h("p", {}, "header" + age),
    //   footer: () => h("p", {}, "footer")
    // })
    const foo3 = h(Foo, {}, {
      // 具名插槽
      header: ({ age }) => [
        h("p", {}, "header" + age),
        createTextVNode("你好")
      ],
      footer: () => h("p", {}, "footer")
    })
    return h("div", {}, [app, foo3])
  },
  setup() {
    // Composition API
    return {}
  }
}