import { ref } from "../ref";
import { effect } from '../effect';

describe('ref', () => {
  it('happy path', () => {
    const a = ref(1)
    expect(a.value).toBe(1)
  });

  it('should be reactive', () => {
    const a = ref(1)
    let dummy: any
    let calls = 0
    effect(() => {
      calls++
      dummy = a.value
    })
    expect(calls).toBe(1)
    expect(dummy).toBe(1)
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
    // same value should not trigger
    a.value = 2
    expect(calls).toBe(2)
    expect(dummy).toBe(2)
  });

  it('should make nested properties reactive', () => {
    const a = ref({
      count: 1
    })
    let dummy
    effect(() => {
      dummy = a.value.count
    })

    expect(dummy).toBe(1)

    a.value.count++

    expect(dummy).toBe(2)

  });
});