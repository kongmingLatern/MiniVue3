import { h } from '../../lib/guide-mini-vue.esm.js'

/**
 * props 功能：
 * 1. props 能够显示
 * 2. 能够在 render 里面使用 this.props
 * 3. props 是一个 shallowReadonly
 */

export const Foo = {
  name: "Foo",
  setup(props) {
    console.log(props);
    props.count ++
  },
  render() {
    return h("div", {}, "foo, " + this.count)
  }
}