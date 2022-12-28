import { camelize, toHandlerKey } from '@mini-vue3/shared'

export function emit(instance, event: string) {
  // console.log("event", event); add
  // instance.props -> event
  const { props } = instance
  // console.log(props);  onAdd
  // 第一种 add -> onAdd
  // add -> Add
  // 第二种 add-foo -> addFoo

  const handler = props[toHandlerKey(camelize(event))]

  // 如果 handler 存在就调用
  handler && handler()
}
