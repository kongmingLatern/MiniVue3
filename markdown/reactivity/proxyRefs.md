# proxyRefs

## 介绍

+ 在我们 vue3 中，使用 ``template`` 标签包裹的内容里如果需要渲染 ``ref`` 类型的数据，如果不用 ``proxyRefs`` 方法，那么将在渲染的时候需要加上``.value``，会影响用户体验，因此这个方法我觉得是方便用户渲染结果，增加用户体验
+ 举例： 看如下代码

  ~~~html
    <template>
      <h1>{{ title }}</h1> // 这里渲染的时候就不需要 .value 了
    </template>

    <script lang="ts">
      setup() {
        const title = ref<string>("标题")
        // 在 setup 内部访问的时候，需要 .value
        // console.log(title.value) // 标题
        return {
          title
        }
      }      
    </script>
    ~~~

那我们已经明确了需求，所以我们来实现一下他。
看如下``jest`` 测试代码

~~~js
 it('proxyRefs', () => {
    const user = {
      age: ref(10),
      name: "小红"
    }
    const proxyUser = proxyRefs(user)
    // 触发 get -> 如果是一个 ref -> .value 否则 -> 本身
    expect(user.age.value).toBe(10)
    expect(proxyUser.age).toBe(10)
    expect(proxyUser.name).toBe("小红")

    // 触发 set -> 如果 target[key] 是一个 ref && newVal 不是 -> 修改 target[key].value = newVal
    proxyUser.age = 20
    expect(proxyUser.age).toBe(20)
    expect(user.age.value).toBe(20)

    // 触发 set -> 如果 target[key] 是一个ref && newVal 也是 -> 直接修改
    proxyUser.age = ref(30)
    expect(proxyUser.age).toBe(30)
    expect(user.age.value).toBe(30)

  });

~~~

使用 ``TypeScript`` 来实现

~~~ts
export function isRef(raw: any) {
  return !!raw.__v_isRef
}

export function unRef(raw: any) {
  return isRef(raw) ? raw.value : raw
}

export function proxyRefs(ObjectWithRef: any) {
  // ObjectWithRef: user
  return new Proxy(ObjectWithRef, {
    get(target, key) {
      // 因为当我们去获取 target[key] 的时候有可能获取到时一个 ref 对象，所以这里需要去判断
      return unRef(Reflect.get(target, key))
    },
    set(target, key, newVal) {
      // 注意：这里有多种情况
      // 情况1：当 target[key] 是一个 ref，并且 newVal 也是一个 ref，那就正常赋值
      // 情况2：当 target[key] 不是一个 ref，而且 newVal 也不是一个 ref，那就正常赋值
      // 情况3：当 target[key] 是一个 ref，但是 newVal 不是一个 ref，那就需要转换
      // 情况4：当 target[key] 不是一个 ref，但是 newVal 是一个 ref，那就需要转换

      if(isRef(target[key]) && !isRef(newVal)) {
        // target[key].value = newVal
        return Reflect.set(target[key],value, newVal) 
      } else {
        Reflect.set(target, key, newVal)
      }
    }
  })
}

~~~
