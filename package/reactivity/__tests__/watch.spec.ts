import { reactive } from "../reactive";
import { watch } from "../watch";

describe('watch', () => {
  it('happy path', () => {
    const obj = reactive({
      foo: 1
    })
    let dummy
    watch(obj, () => {
      dummy = obj.foo
    })
    obj.foo++
    expect(dummy).toBe(2)
  });
});