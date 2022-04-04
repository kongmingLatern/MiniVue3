// 测试 nextTick 逻辑
import {
  h,
  ref,
  getCurrentInstance,
  nextTick
} from "../../lib/guide-mini-vue.esm.js";

// 如果 for 循环改变 count 的值 100 次的话
// 会同时触发 100 次的 update 页面逻辑
// 这里可以把 update 页面的逻辑放到微任务中执行
// 避免更改了响应式对象就会执行 update 的逻辑
// 因为只有最后一次调用 update 才是有价值的
window.count = ref(1);

// 如果一个响应式变量同时触发了两个组件的 update
// 会发生什么有趣的事呢？
const Child1 = {
  name: "NextTickerChild1",
  setup() { },
  render() {
    return h("div", {}, `child1 count: ${window.count.value}`);
  },
};

const Child2 = {
  name: "NextTickerChild2",
  setup() { },
  render() {
    return h("div", {}, `child2 count: ${window.count.value}`);
  },
};

export default {
  name: "NextTicker",
  setup() {
    const value = ref(0)
    const instance = getCurrentInstance()
    function onClick() {
      for (let i = 0; i < 100; i++) {
        // 不使用 nextTick 的话，每次赋值都会去重新渲染页面数据，造成资源浪费
        count.value = i
        value.value = i
      }
    }
    console.log('nextTick前', instance);
    nextTick(() => {
      console.log('nextTick后', instance);
    })

    return {
      onClick
    }
  },
  render() {
    return h(
      "div",
      { tId: "nextTicker" },
      [
        h(Child1),
        h(Child2),
        h("button", {
          onClick: this.onClick
        }, "updateCountAndValue")
      ]
      //   `for nextTick: count: ${window.count.value}`
    );
  },
};
