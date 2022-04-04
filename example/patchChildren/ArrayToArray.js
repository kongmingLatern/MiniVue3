import { h, ref } from '../../lib/guide-mini-vue.esm.js'

// 1.左侧对比
// (a b) c
// (a b) d e
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
// ]
// const nextChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "E" }, "E"),
// ]

// 2.右侧对比
// a (b c)
// d e(b c)
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
// ]
// const nextChildren = [
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "E" }, "E"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
// ]

// 3.新的比老的长 --> 创建新的
// 左侧
// (a b)
// (a b) c
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B")
// ]
// const nextChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "D" }, "D"),
// ]

// 右侧
// (a b)
// d c (a b)
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B")
// ]
// const nextChildren = [
//   h("p", { key: "D" }, "D"),
//   h("p", { key: "C" }, "C"),
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
// ]

// 4.老的比新的长 --> 删除老的
// 左侧
// (a b) c
// (a b)
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C")
// ]
// const nextChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
// ]

// 右侧
// a (b c)
// (b c)
// const prevChildren = [
//   h("p", { key: "A" }, "A"),
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C")
// ]
// const nextChildren = [
//   h("p", { key: "B" }, "B"),
//   h("p", { key: "C" }, "C"),
// ]

// 5.对比中间的部分
// 删除老的（老的里面存在，新的里面不存在）
// 5.1
// a, b, (c, d), f, g
// a, b, (e, c), f, g
// D 节点在新的里面是没有的-- 需要删除掉
// C 节点 props 也发生了变化
const prevChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "C", id: "c-prev" }, "C"),
  h("p", { key: "D" }, "D"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G")
]
const nextChildren = [
  h("p", { key: "A" }, "A"),
  h("p", { key: "B" }, "B"),
  h("p", { key: "E" }, "E"),
  h("p", { key: "C", id: "c-next" }, "C"),
  h("p", { key: "F" }, "F"),
  h("p", { key: "G" }, "G")
]

export default {
  name: "ArrayToArray",
  setup() {
    const isChange = ref(false)
    window.isChange = isChange

    return {
      isChange
    }
  },
  render() {
    const self = this
    return self.isChange === true
      ? h("div", {}, nextChildren)
      : h("div", {}, prevChildren)
  }
};
