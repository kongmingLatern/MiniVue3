import { createVNode, Fragment } from '../vnode';
export function renderSlots(slots, name, props) {
  const slot = slots[name]
  console.log(slot);

  if (slot) {
    // function
    if (typeof slot === "function") {
      // Flagment -> 只渲染 children
      // return createVNode("div", {}, slot(props))
      return createVNode(Fragment, {}, slot(props))
    }
  }
};
