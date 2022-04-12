# 只读属性 readonly

## 介绍

> 对于一些常量，我们可以定义 ``readonly`` 来进行约束，当用户对它进行赋值操作后，会提示该变量为只读属性，无法被修改

定义

~~~html
  <template>
    {{ tel }}
  </template>

  <script lang="ts">
    setup() {
      const tel = readonly<string>('156156100560')
      // tel = 1000  报错，无法修改
      return {
        tel
      }
    }
  </script>
~~~

用 ``jest`` 写个测试

~~~ts
  it('warn then call set', () => {
    // console.warn()
    // mock

    console.warn = jest.fn()

    const user = readonly({
      age: 10
    })
    user.age = 11

    // 是否调用了这个函数
    expect(console.warn).toBeCalled()
  });

~~~

使用 ``TypeScript`` 来实现逻辑

~~~ts
export function readonly(raw: any) {
  return new Proxy(raw, {
    get(target, key) {
      return Reflect.get(target, key)
    },
    set(target, key, value) {
      // 操作有误
      console.warn(`${target} 的值无法被修改，因为它是只读属性`, target)
    }
  })
}
~~~
