import { isReadonly, shalldowReadonly } from '../reactive';
describe('shalldowReadonly', () => {
  test('should not make non-reactive properties reactive', () => {
    const props = shalldowReadonly({
      n: {
        foo: 1
      }
    })
    expect(isReadonly(props)).toBe(true)
    expect(isReadonly(props.n)).toBe(false)
  });

  it('should call console.warn when set', () => {
    console.warn = jest.fn()
    const user = shalldowReadonly({
      age: 10
    })
    user.age++

    expect(console.warn).toHaveBeenCalled()

  });

});