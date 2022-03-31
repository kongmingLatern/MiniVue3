import { h, renderSlots } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: "Foo",
  setup() {
    return {}
  },
  render() {
    const foo = h("p", {
      class: "foo"
    }, "foo")
    // Foo .vnode .children
    // console.log(this.$slots);
    // 如果 this.$slots 是一个数组，那么可以再次使用 h() 来处理
    // 具名插槽
    // 1.获取要渲染的元素
    // 2.获取渲染的位置
    // 作用域插槽
    const age = 10
    return h("div", {
      class: "foo-container"
    }, [
      renderSlots(this.$slots, "header", {
        age
      }),
      foo,
      renderSlots(this.$slots, "footer")
    ])
  }
}