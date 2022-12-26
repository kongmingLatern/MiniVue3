import { isReadonly, shalldowReadonly } from '../reactive';
describe('shalldowReadonly', () => {
  test('should not make non-reactive properties reactive', () => {
    const props = shalldowReadonly({
      n: {
        foo: 1
      },
      m: 1
    })
    expect(isReadonly(props)).toBe(true)
    // 不可以修改第一层
    props.m = 2
    expect(props.m).toBe(1)
    // 第二层开始才可以修改值
    props.n.foo = 2
    expect(props.n.foo).toBe(2)
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