import { effect } from "./effect";

export function watch(obj, fn) {
  effect(
    () => {
      // fn()
      obj.foo
    },
    {
      scheduler() {
        fn()
      }
    }
  )
}