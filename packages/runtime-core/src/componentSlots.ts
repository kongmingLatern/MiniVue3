import { ShapeFlags } from '@mini-vue3/shared'

export function initSlots(instance, children) {
  const { vnode } = instance
  if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
    normalizeObjectSlots(children, instance.slots)
  }
}
function normalizeObjectSlots(children: any, slots: any) {
  // key -> header | footer
  for (const key in children) {
    const value = children[key]
    // slot
    slots[key] = props => normalizeSlotValue(value(props))
  }
}

function normalizeSlotValue(value) {
  return Array.isArray(value) ? value : [value]
}
