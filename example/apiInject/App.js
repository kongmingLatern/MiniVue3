import { h, provide, inject } from '../../lib/guide-mini-vue.esm.js'

const Provider = {
  name: "Provider",
  setup() {
    provide("foo", "fooVal")
    provide("bar", "barVal")
  },
  render() {
    return h("div", {}, [
      h("p", {}, "Provider"),
      h(ProviderTwo)
    ])
  }
}
const ProviderTwo = {
  name: "ProvierTwo",
  setup() {
    provide("foo", "ProviderTwo----")
    const foo = inject("foo")
    return {
      foo
    }
  },
  render() {
    return h("div", {}, [
      h("p", {}, `ProviderTwo，调用了 inject 方法后取到的值为：${this.foo}`),
      h(Consumer)
    ])
  }
}
const Consumer = {
  name: "Consumer",
  setup() {
    const foo = inject("foo")
    const bar = inject("bar")
    const baz = inject("baz", "bazDefault")
    const bay = inject("bay", () => "Function")
    return {
      foo,
      bar,
      baz,
      bay
    }

  },
  render() {
    return h("div", {},
      `Consumer: --${this.foo} --- ${this.bar},我是baz，我的值为${this.baz}
       bay -> 函数值为: ${this.bay}
    `)
  }
}

export const App = {
  name: "App",
  setup() { },
  render() {
    return h("div", {}, [
      h("p", {}, "apiInject"),
      h(Provider)
    ])
  }
}