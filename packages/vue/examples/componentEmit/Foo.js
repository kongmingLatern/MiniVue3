import { h } from '../../dist/lib/guide-mini-vue.esm.js'

/**
 * props 功能：
 * 1. props 能够显示
 * 2. 能够在 render 里面使用 this.props
 * 3. props 是一个 shallowReadonly
 */

export const Foo = {
  name: "Foo",
  setup(props, { emit }) {
    // console.log(props);
    // props.count ++
    const emitAdd = () => {
      console.log("触发Foo中的 Foo-emitAdd");
      emit("add")
    }

    const emitAddFoo = () => {
      console.log("触发Foo中的 addFoo");
      emit("add-foo")
    }

    return {
      emitAdd,
      emitAddFoo
    }
  },
  render() {
    console.log(this);

    const btn1 = h("button", {
      onClick: this.emitAdd
    }, "触发Foo中emitAdd方法")

    const btn2 = h("button", {
      onClick: this.emitAddFoo
    }, "触发Foo中emitAdd方法")

    const foo = h("p", {}, "foo")
    return h("div", {}, [foo, btn1, btn2])
  }
}