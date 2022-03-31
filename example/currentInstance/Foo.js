import { h, getCurrentInstance } from '../../lib/guide-mini-vue.esm.js'

export const Foo = {
  name: "Foo",
  render() {
    return h("div", {}, "我是 Foo")
  },
  setup() {
    const instance = getCurrentInstance()
    // console.log("setup", instance); //可以通过 type 的 name 属性来判断当前组件
    return {}
  }
}