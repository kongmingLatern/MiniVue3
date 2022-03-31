import { h, createTextVNode } from '../../lib/guide-mini-vue.esm.js'
import { Foo } from './Foo.js'

export const App = {
  name: "App",
  render() {
    const app = h("div", {
      class: "app"
    }, "App")
    // const foo = h(Foo, {}, h("p", {}, "123"))
    // const foo1 = h(Foo, {}, [h("p", {}, "123"), h("p", {}, "456")])
    // const foo2 = h(Foo, {}, {
    //   // 具名插槽
    //   header: ({ age }) => h("p", {}, "header" + age),
    //   footer: () => h("p", {}, "footer")
    // })
    const foo3 = h(Foo, {}, {
      // 具名插槽 children [key] -> [value]
      header: ({ age }) => [
        h("p", {
          class: "header-container"
        }, "header 插槽 + 参数：age = " + age),
        // 对于普通的文本，需要特殊处理
        createTextVNode("普通文本"),
        h("div", {
          class: "common-text"
        }, "不带参数的 Element 类型")
      ],
      footer: () => h("p", {
        class: "footer-container"
      }, "footer 插槽")
    })
    return h("div", {
      class: "app-container"
    }, [app, foo3, createTextVNode("我是app-container")])
  },
  setup() {
    // Composition API
    return {}
  }
}